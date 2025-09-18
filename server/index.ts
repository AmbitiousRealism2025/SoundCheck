import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import rateLimit from "express-rate-limit";
import cors from "cors";
import compression from "compression";
import { AppError } from "./types";
import { gracefulShutdown } from "./db";

const app = express();

// After `const app = express();`
app.set('trust proxy', 1);

// Security middleware configuration
app.use(compression());

// CORS configuration with environment-aware origins
const prodOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const defaultDevOrigins = ['http://localhost:5000', 'http://localhost:5173', 'http://127.0.0.1:5173'];
const devOrigins = (process.env.DEV_CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const corsOrigins = app.get('env') === 'development' ? (devOrigins.length ? devOrigins : defaultDevOrigins) : prodOrigins;
const corsOptions = { origin: corsOrigins, credentials: true, optionsSuccessStatus: 200 };
app.use(cors(corsOptions));

// Rate limiting configuration specifically for API endpoints
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many requests from this IP, please try again later.',
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  },
  skip: (req) => req.method === 'OPTIONS' || req.method === 'HEAD',
});

// Apply rate limiting only to API routes, except in test environment
if (process.env.NODE_ENV !== 'test') {
  app.use('/api', apiRateLimit);
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: AppError, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const timestamp = new Date().toISOString();
    
    // Guard against headers already sent
    if (res.headersSent) return _next(err);
    
    // Structured error logging with request context
    const errorLog = {
      level: 'error',
      status,
      message,
      path: req.path,
      method: req.method,
      timestamp,
      stack: err.stack
    };
    
    console.error(JSON.stringify(errorLog));

    // For 5xx errors, send a generic message to avoid exposing internal details
    const clientMessage = status >= 500 ? "Internal Server Error" : message;
    
    res.status(status).json({
      message: clientMessage,
      timestamp,
      path: req.path
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  const httpServer = server.listen(port, () => {
    log(`serving on port ${port}`);
  });

  // Graceful shutdown handlers for serverless environments
  const shutdown = async (signal: string) => {
    log(`Received ${signal}, starting graceful shutdown...`);

    // Stop accepting new connections
    httpServer.close(async (err) => {
      if (err) {
        console.error('Error during server close:', err);
      }

      // Close database pool connections
      await gracefulShutdown();

      log('Graceful shutdown completed');
      process.exit(err ? 1 : 0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  // Register shutdown handlers
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', async (error) => {
    console.error('Uncaught Exception:', error);
    await gracefulShutdown();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    await gracefulShutdown();
    process.exit(1);
  });
})();
