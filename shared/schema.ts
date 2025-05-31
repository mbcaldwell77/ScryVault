import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  isbn: text("isbn").notNull(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  publisher: text("publisher"),
  year: text("year"),
  imageUrl: text("image_url"),
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }).notNull(),
  condition: text("condition").notNull(),
  location: text("location"),
  type: text("type").notNull(), // "COGS" or "Expense"
  dateAdded: timestamp("date_added").notNull().defaultNow(),
});

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
  dateAdded: true,
});

export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;
