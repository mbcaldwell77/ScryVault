import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL || "";

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL env variable is required. Run the script with DATABASE_URL=\u003cconnection-string\u003e"
  );
}

const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle({ client: pool, schema });

async function main() {
  try {
    console.log("\uD83D\uDD03 Running migrations...");
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("\u2705 Migrations complete.");
  } catch (error) {
    console.error("\u274C Migration failed:", error);
    process.exit(1);
  }
}

main();
