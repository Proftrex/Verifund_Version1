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
    passport.authenticate(`replitauth:${req.hostname}`, async (err: any, user: any) => {
      if (err) {
        console.error('Authentication error:', err);
        return res.redirect("/api/login");
      }
      
      if (!user) {
        console.error('No user returned from authentication');
        return res.redirect("/api/login");
      }
      
      // Check if the authenticated user is authorized (admin only)
      const userEmail = user.email || user.claims?.email;
      console.log('Authenticated user email:', userEmail);
      
      // Allow these authorized admin email addresses
      const authorizedEmails = [
        'trexia.olaya@pdax.ph',
        'mariatrexiaolaya@gmail.com', 
        'trexiaamable@gmail.com'
      ];
      
      if (!authorizedEmails.includes(userEmail)) {
        console.log('Unauthorized user attempted login:', userEmail);
        return res.status(403).send(`
          <html>
            <head><title>Access Denied</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1>Access Denied</h1>
              <p>Only authorized admin users can access this platform.</p>
              <p>Your email: ${userEmail}</p>
              <p>Authorized emails: ${authorizedEmails.join(', ')}</p>
              <a href="/">Return to Homepage</a>
            </body>
          </html>
        `);
      }
      
      // Set up session for authorized user
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error('Login error:', loginErr);
          return res.redirect("/api/login");
        }
        
        // Store user email in session for development mode
        if (req.session) {
          req.session.currentUser = userEmail;
        }
        
        // Redirect to admin dashboard for authorized admin (normalize to primary admin email)
        return res.redirect(`/?testUser=${encodeURIComponent('trexia.olaya@pdax.ph')}`);
      });
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
  // PRODUCTION MODE: Use Passport session
  if (process.env.NODE_ENV === 'production') {
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ message: "Please login to continue" });
  }
  
  // DEVELOPMENT MODE: Check for testUser parameter and session state
  // Check if a test user email is specified in query params
  const testUserEmail = req.query.testUser as string;
  
  // Check if user is authenticated via Passport (Replit auth)
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    const userEmail = (req.user as any).email || (req.user as any).claims?.email;
    
    // Allow these authorized admin email addresses
    const authorizedEmails = [
      'trexia.olaya@pdax.ph',
      'mariatrexiaolaya@gmail.com', 
      'trexiaamable@gmail.com'
    ];
    
    if (authorizedEmails.includes(userEmail)) {
      // Store primary admin email in session for consistency
      if (req.session) {
        req.session.currentUser = 'trexia.olaya@pdax.ph';
      }
      
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
      
      return next();
    }
  }
  
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
  
  return next();
};
