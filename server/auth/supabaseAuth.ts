import { createClient } from '@supabase/supabase-js';
import { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { storage } from '../storage';

// Extend session type to include currentUser and isAdmin
declare module 'express-session' {
  interface SessionData {
    currentUser?: string;
    isAdmin?: boolean;
  }
}

// Create Supabase client for server-side operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

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
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: any) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Auth routes
  app.post("/api/auth/signin", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(401).json({ message: error.message });
      }

      if (data.user) {
        // Check if this is an admin user
        const adminEmails = [
          'trexia.olaya@pdax.ph',
          'mariatrexiaolaya@gmail.com', 
          'trexiaamable@gmail.com'
        ];
        
        const isAdmin = adminEmails.includes(email);
        
        // Set session
        if (req.session) {
          req.session.currentUser = email;
          req.session.isAdmin = isAdmin;
        }

        // Create or update user in our database
        try {
          let existingUser = await storage.getUserByEmail(email);
          if (!existingUser) {
            // Create new user
            await storage.upsertUser({
              id: data.user.id,
              email: email,
              firstName: email.split('@')[0],
              lastName: "",
              profileImageUrl: null,
            });
          }
        } catch (userError) {
          console.log('Error checking/creating user:', userError);
        }

        res.json({ 
          user: data.user, 
          isAdmin,
          message: "Authentication successful" 
        });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error('Signin error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      if (data.user) {
        // Create user in our database
        try {
          await storage.upsertUser({
            id: data.user.id,
            email: email,
            firstName: email.split('@')[0],
            lastName: "",
            profileImageUrl: null,
          });
        } catch (userError) {
          console.log('Error creating user:', userError);
        }

        res.json({ 
          user: data.user, 
          message: "User created successfully. Please check your email for verification." 
        });
      } else {
        res.status(400).json({ message: "Failed to create user" });
      }
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/signout", async (req: Request, res: Response) => {
    try {
      // Clear session
      if (req.session) {
        req.session.destroy(() => {});
      }
      
      res.json({ message: "Signed out successfully" });
    } catch (error) {
      console.error('Signout error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/user", async (req: Request, res: Response) => {
    try {
      // Check session first
      if (req.session?.currentUser) {
        const user = await storage.getUserByEmail(req.session.currentUser);
        if (user) {
          return res.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isAdmin: req.session.isAdmin || false,
            isSupport: user.isSupport || false,
          });
        }
      }

      // If no session, check for JWT token
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        try {
          const { data: { user }, error } = await supabase.auth.getUser(token);
          
          if (error || !user) {
            return res.status(401).json({ message: "Invalid token" });
          }

          // Get user from our database
          const dbUser = await storage.getUserByEmail(user.email || '');
          if (dbUser) {
            const adminEmails = [
              'trexia.olaya@pdax.ph',
              'mariatrexiaolaya@gmail.com', 
              'trexiaamable@gmail.com'
            ];
            
            const isAdmin = adminEmails.includes(user.email || '');
            
            return res.json({
              id: dbUser.id,
              email: dbUser.email,
              firstName: dbUser.firstName,
              lastName: dbUser.lastName,
              isAdmin: isAdmin,
              isSupport: dbUser.isSupport || false,
            });
          }
        } catch (tokenError) {
          console.error('Token validation error:', tokenError);
        }
      }

      res.status(401).json({ message: "Not authenticated" });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check session first
    if (req.session?.currentUser) {
      const user = await storage.getUserByEmail(req.session.currentUser);
      if (user) {
        req.user = {
          sub: user.id,
          email: user.email,
          isAdmin: req.session.isAdmin || false,
        };
        return next();
      }
    }

    // Check JWT token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
          return res.status(401).json({ message: "Invalid token" });
        }

        // Get user from our database
        const dbUser = await storage.getUserByEmail(user.email || '');
        if (dbUser) {
          const adminEmails = [
            'trexia.olaya@pdax.ph',
            'mariatrexia.olaya@gmail.com', 
            'trexiaamable@gmail.com'
          ];
          
          const isAdmin = adminEmails.includes(user.email || '');
          
          req.user = {
            sub: dbUser.id,
            email: dbUser.email,
            isAdmin: isAdmin,
          };
          
          return next();
        }
      } catch (tokenError) {
        console.error('Token validation error:', tokenError);
      }
    }

    return res.status(401).json({ message: "Please login to continue" });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
