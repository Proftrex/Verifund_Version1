import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Extend session type to include currentUser
declare module 'express-session' {
  interface SessionData {
    currentUser?: string;
  }
}

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "EUfBLEUx4nnNAFnfxlz3Wwk5y4mxiEhut2yuR07RKwo=",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  const claims = tokens.claims();
  user.sub = claims?.sub;
  user.email = claims?.email;
  user.claims = claims;
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Split domains and add localhost for development
  const domains = process.env.REPLIT_DOMAINS!.split(",");
  const allDomains = [...domains, "localhost"];
  
  for (const domain of allDomains) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: domain === "localhost" 
          ? `http://${domain}:5000/api/callback`
          : `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // DEVELOPMENT MODE: Check for testUser parameter and session state
  if (process.env.NODE_ENV !== 'production') {
    // Check if a test user email is specified in query params
    const testUserEmail = req.query.testUser as string;
    
    if (!testUserEmail) {
      // No testUser parameter - user needs to login explicitly
      return res.status(401).json({ message: "Please login to continue" });
    }
    
    // Check if this is the same user from the current session
    if (req.session && req.session.currentUser && req.session.currentUser !== testUserEmail) {
      // Different user - clear session and require fresh login
      req.session.destroy(() => {});
      return res.status(401).json({ message: "Session mismatch - please login again" });
    }
    
    let userId: string;
    let email: string;
    let firstName: string;
    let lastName: string;
    
    if (testUserEmail === 'trexia.olaya@pdax.ph') {
      // Only allow this specific admin account
      userId = '46673897';
      email = 'trexia.olaya@pdax.ph';
      firstName = 'Ma. Trexia';
      lastName = 'Olaya';
    } else {
      // Block all other users - return 401
      return res.status(401).json({ message: "Access restricted to authorized admin only" });
    }
    
    // Store current user in session
    if (req.session) {
      req.session.currentUser = email;
    }
    
    req.user = {
      sub: userId,
      email: email,
      claims: {
        sub: userId,
        email: email,
        first_name: firstName,
        last_name: lastName,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours from now
      },
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    };
    
    // Admin user already exists in database - no need to create
    try {
      const existingUser = await storage.getUser('46673897');
      if (!existingUser) {
        console.log('Admin user not found in database - this should not happen');
        return res.status(401).json({ message: "Admin user not found" });
      }
      // Admin user exists and is verified
    } catch (error) {
      console.log('Error with admin user:', error);
      return res.status(401).json({ message: "Database error" });
    }
    
    return next();
  }

  // PRODUCTION MODE: Use normal authentication
  const user = req.user as any;

  if (!req.isAuthenticated() || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Handle both old and new session formats
  const userId = user.sub || user.claims?.sub;
  const expiresAt = user.expires_at || user.claims?.exp;
  const refreshToken = user.refresh_token;
  
  if (!userId || !expiresAt) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Store userId on user object for easy access in routes
  if (!user.sub && user.claims?.sub) {
    user.sub = user.claims.sub;
    user.email = user.claims.email;
    user.expires_at = user.claims.exp;
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= expiresAt) {
    return next();
  }

  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
