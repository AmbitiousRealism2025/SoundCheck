import * as openidClient from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Validate required environment variables at startup
function validateEnvironment() {
  const required = ['REPLIT_DOMAINS', 'REPL_ID', 'SESSION_SECRET', 'DATABASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log(`Auth configured for domains: ${process.env.REPLIT_DOMAINS}`);
}

validateEnvironment();

// Define TokenSet interface for v6.x compatibility
interface TokenSet {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  expires_at?: number;
  claims(): any;
}

const getConfig = memoize(
  async () => {
    return await openidClient.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!,
      undefined // no client secret for public client
    );
  },
  { maxAge: 3600 * 1000 }
);

// Create a client-like object for backward compatibility
const getClient = memoize(
  async () => {
    const config = await getConfig();
    return {
      config,
      // Add methods that were expected in the original code
      endSessionUrl: (params: any) => openidClient.buildEndSessionUrl(config, params),
      refresh: (refreshToken: string) => openidClient.refreshTokenGrant(config, refreshToken),
    };
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
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(user: any, tokenSet: TokenSet) {
  user.claims = tokenSet.claims();
  user.access_token = tokenSet.access_token;
  user.refresh_token = tokenSet.refresh_token;
  user.id_token = tokenSet.id_token;
  user.expires_at = tokenSet.expires_at;
}

async function upsertUser(claims: any) {
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

  const config = await getConfig();

  for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
    // Create strategy with proper redirect_uri in params
    const redirectUri = `https://${domain}/api/callback`;
    const strategy = new Strategy(
      {
        config,
        params: {
          redirect_uri: redirectUri,
          scope: 'openid email profile offline_access',
        },
      },
      (tokenSet: any, done: any) => {
        // Simplified verify function with just 2 parameters
        Promise.resolve().then(async () => {
          try {
            const claims = tokenSet.claims();
            await upsertUser(claims);
            const user = {
              claims,
              access_token: tokenSet.access_token,
              refresh_token: tokenSet.refresh_token,
              id_token: tokenSet.id_token,
              expires_at: tokenSet.expires_at,
            };
            done(null, user);
          } catch (error) {
            done(error);
          }
        });
      }
    );
    passport.use(`replitauth:${domain}`, strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`)(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", async (req: any, res) => {
    try {
      const client = await getClient();
      
      // Use X-Forwarded headers for proxy compatibility
      const protocol = req.get('X-Forwarded-Proto') || req.protocol;
      const host = req.get('X-Forwarded-Host') || req.hostname;
      
      const logoutUrl = client.endSessionUrl({
        id_token_hint: req.user?.id_token,
        post_logout_redirect_uri: `${protocol}://${host}`,
      });
      req.logout(() => {
        res.redirect(logoutUrl.toString());
      });
    } catch (error) {
      console.error("Logout error:", error);
      req.logout(() => {
        res.redirect("/");
      });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const client = await getClient();
    const tokenSet = await client.refresh(refreshToken);
    updateUserSession(user, tokenSet as TokenSet);
    
    // Persist refreshed tokens to session
    req.login(user, (err) => {
      if (err) {
        console.error("Session persistence error:", err);
        return res.status(401).json({ message: "Unauthorized" });
      }
      return next();
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};