import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Extend session type to include currentUser and isAdmin
declare module 'express-session' {
  interface SessionData {
    currentUser?: string;
    isAdmin?: boolean;
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
  isAdmin: boolean = false
) {
  // For admin users, use existing database record
  if (isAdmin && claims["email"] === 'trexia.olaya@pdax.ph') {
    // Don't upsert admin - they already exist in database
    return;
  }
  
  // For regular users, create new user record
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"] || claims["email"].split('@')[0],
    lastName: claims["last_name"] || "",
    profileImageUrl: claims["profile_image_url"] || null,
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
    
    const claims = tokens.claims();
    const userEmail = claims["email"];
    
    // Check if this is an admin user
    const adminEmails = [
      'trexia.olaya@pdax.ph',
      'mariatrexiaolaya@gmail.com', 
      'trexiaamable@gmail.com'
    ];
    
    const isAdmin = adminEmails.includes(userEmail);
    await upsertUser(claims, isAdmin);
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
    passport.authenticate(`replitauth:${req.hostname}`, async (err: any, user: any) => {
      if (err) {
        console.error('Authentication error:', err);
        return res.redirect("/api/login");
      }
      
      if (!user) {
        console.error('No user returned from authentication');
        return res.redirect("/api/login");
      }
      
      // Check if the authenticated user exists and process accordingly
      const userEmail = user.email || user.claims?.email;
      console.log('Authenticated user email:', userEmail);
      
      if (!userEmail) {
        console.log('No email found in user claims');
        return res.redirect("/api/login");
      }
      
      // Check if this is an admin user
      const adminEmails = [
        'trexia.olaya@pdax.ph',
        'mariatrexiaolaya@gmail.com', 
        'trexiaamable@gmail.com'
      ];
      
      const isAdmin = adminEmails.includes(userEmail);
      
      // Set up session for authorized user
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error('Login error:', loginErr);
          return res.redirect("/api/login");
        }
        
        // Store user email in session for development mode
        if (req.session) {
          req.session.currentUser = userEmail;
          req.session.isAdmin = isAdmin;
        }
        
        // Redirect based on user type
        // Redirect to home page - authentication is handled by Passport session
        return res.redirect('/');
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      // Clear session
      if (req.session) {
        req.session.destroy(() => {});
      }
      // Redirect to Replit's logout URL
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}/login`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // PRODUCTION MODE: Use only Passport session (Replit OAuth)
  if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Please login to continue" });
  }

  // User is authenticated via Replit OAuth - process their session
  const userEmail = (req.user as any).email || (req.user as any).claims?.email;
  
  if (!userEmail) {
    return res.status(401).json({ message: "Invalid user session" });
  }

  // Check if this is an admin user
  const adminEmails = [
    'trexia.olaya@pdax.ph',
    'mariatrexiaolaya@gmail.com', 
    'trexiaamable@gmail.com'
  ];
  
  const isAdmin = adminEmails.includes(userEmail);
  
  // Store user info in session
  if (req.session) {
    req.session.currentUser = userEmail;
    req.session.isAdmin = isAdmin;
  }
  
  if (isAdmin) {
    // Use admin user data (normalize to primary admin identity)
    req.user = {
      sub: '46673897',
      email: 'trexia.olaya@pdax.ph',
      claims: {
        sub: '46673897',
        email: 'trexia.olaya@pdax.ph',
        first_name: 'Ma. Trexia',
        last_name: 'Olaya',
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
      },
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    };
  } else {
    // Regular user - create a user profile for them
    const userFirstName = (req.user as any).claims?.first_name || userEmail.split('@')[0];
    const userLastName = (req.user as any).claims?.last_name || '';
    
    req.user = {
      sub: userEmail, // Use email as unique identifier for regular users
      email: userEmail,
      claims: {
        sub: userEmail,
        email: userEmail,
        first_name: userFirstName,
        last_name: userLastName,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
      },
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    };

    // Create user record if it doesn't exist
    try {
      const existingUser = await storage.getUser(userEmail);
      if (!existingUser) {
        console.log('Creating new user record for:', userEmail);
        await storage.upsertUser({
          id: userEmail,
          email: userEmail,
          firstName: userFirstName,
          lastName: userLastName,
          profileImageUrl: (req.user as any).claims?.profile_image_url || null,
        });
      }
    } catch (error) {
      console.log('Error checking/creating user:', error);
      // Continue anyway - user creation is not critical for authentication
    }
  }
  
  return next();
};
