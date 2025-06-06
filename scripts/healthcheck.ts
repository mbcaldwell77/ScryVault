import { db } from "../server/db";
import { users, books, userSessions, pricingCache } from "@shared/schema";

async function runHealthcheck() {
  try {
    console.log("\u2705 Database connection is live.");

    const [userCount] = await db.select({ count: db.fn.count() }).from(users);
    const [bookCount] = await db.select({ count: db.fn.count() }).from(books);
    const [sessionCount] = await db
      .select({ count: db.fn.count() })
      .from(userSessions);

    console.log(`\uD83D\uDC64 Users: ${userCount.count}`);
    console.log(`\uD83D\uDCDA Books: ${bookCount.count}`);
    console.log(`\uD83D\uDD10 Sessions: ${sessionCount.count}`);

    const recentPriceEntry = await db
      .select()
      .from(pricingCache)
      .orderBy(pricingCache.updatedAt)
      .limit(1);

    if (recentPriceEntry.length) {
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
