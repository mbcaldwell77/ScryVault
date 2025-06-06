import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Environment-based database configuration with safety logging
const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development";

// Use environment-specific URLs if available, fallback to main URL
const databaseUrl = isProduction 
  ? (process.env.DATABASE_URL_PRODUCTION || process.env.DATABASE_URL)
  : isDevelopment 
    ? (process.env.DATABASE_URL_DEV || process.env.DATABASE_URL)
    : process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Critical: Log database environment for safety verification
console.log(`[DATABASE] Environment: ${process.env.NODE_ENV || "development"}`);
console.log(`[DATABASE] Using ${isProduction ? "PRODUCTION" : "DEVELOPMENT"} database`);
if (!isProduction && !isDevelopment) {
  console.warn("[DATABASE] WARNING: NODE_ENV not set, defaulting to development mode");
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });