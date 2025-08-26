import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

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
  // DEVELOPMENT MODE: Bypass authentication for testing
  if (process.env.NODE_ENV !== 'production') {
    // Create a mock admin user for development
    req.user = {
      sub: 'dev-admin-user',
      email: 'admin@test.com',
      claims: {
        sub: 'dev-admin-user',
        email: 'admin@test.com',
        first_name: 'Admin',
        last_name: 'User',
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours from now
      },
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    };
    
    // Ensure the admin user exists in storage
    try {
      await storage.upsertUser({
        id: 'dev-admin-user',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        profileImageUrl: null,
        isAdmin: true,
        isSupport: true,
        kycStatus: 'verified',
        pusoBalance: '1000',
        tipBalance: '0',
        birthday: '1990-01-01',
        contactNumber: '+1234567890',
        address: 'Test Address',
        education: 'Computer Science',
        middleInitial: 'T',
        isSuspended: false,
        isFlagged: false,
        createdAt: new Date(),
        lastLoginAt: new Date()
      });
    } catch (error) {
      console.log('Admin user already exists or error creating:', error);
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
