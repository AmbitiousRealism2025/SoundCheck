import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5, // reduced for serverless environments (Neon recommended: 5-10)
  idleTimeoutMillis: 30000, // how long a connection can remain idle before being closed
  connectionTimeoutMillis: 2000, // how long to wait for a connection to be established
  // Note: allowExitOnIdle removed - not supported by Neon
  // Explicit cleanup via gracefulShutdown() should be called in serverless handlers
});
export const db = drizzle({ client: pool, schema });

// Database health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    // Database connection successful
    return true;
  } catch (error) {
    // Log critical database errors for production debugging
    if (process.env.NODE_ENV === 'production') {
      console.error('Database connection failed:', error instanceof Error ? error.message : 'Unknown error');
    }
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Graceful shutdown function - MUST be called in serverless handlers
// For serverless/edge functions, call this at the end of request handling
// Example: ctx.waitUntil(gracefulShutdown()) or finally { await gracefulShutdown() }
export async function gracefulShutdown(): Promise<void> {
  try {
    await pool.end();
    // Database pool closed gracefully
  } catch (error) {
    // Log critical shutdown errors for production debugging
    if (process.env.NODE_ENV === 'production') {
      console.error('Error closing database pool:', error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

// Helper for serverless request handlers - ensures pool cleanup
export async function withPoolCleanup<T>(handler: () => Promise<T>): Promise<T> {
  try {
    return await handler();
  } finally {
    await gracefulShutdown();
  }
}
