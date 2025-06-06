import { db } from "../server/db";
import { users, books, userSessions, pricingCache } from "@shared/schema";
import { count } from "drizzle-orm";

async function runHealthcheck() {
  try {
    console.log("\u2705 Database connection is live.");

    const userCountRes = await db.select({ count: count() }).from(users);
    const bookCountRes = await db.select({ count: count() }).from(books);
    const sessionCountRes = await db
      .select({ count: count() })
      .from(userSessions);

    const userCount = userCountRes?.[0];
    const bookCount = bookCountRes?.[0];
    const sessionCount = sessionCountRes?.[0];

    console.log(`\uD83D\uDC64 Users: ${userCount?.count ?? 0}`);
    console.log(`\uD83D\uDCDA Books: ${bookCount?.count ?? 0}`);
    console.log(`\uD83D\uDD10 Sessions: ${sessionCount?.count ?? 0}`);

    const recentPriceEntry = await db
      .select()
      .from(pricingCache)
      .orderBy(pricingCache.updatedAt)
      .limit(1);

    if (recentPriceEntry?.length) {
      console.log("\uD83D\uDCB5 Pricing cache is populated.");
    } else {
      console.log("\u26A0\uFE0F  Pricing cache is empty.");
    }

    console.log("\uD83E\uDE7A Healthcheck complete.");
  } catch (error) {
    console.error("\u274C Healthcheck failed:", error);
    process.exit(1);
  }
}

runHealthcheck();
