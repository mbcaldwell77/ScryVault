import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "../server/db";

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
