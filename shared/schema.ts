import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  isbn: text("isbn").notNull(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  publisher: text("publisher"),
  year: text("year"),
  imageUrl: text("image_url"),
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }).notNull(),
  estimatedPrice: decimal("estimated_price", { precision: 10, scale: 2 }),
  condition: text("condition").notNull(),
  format: text("format").notNull().default("Other"), // "Hardcover", "Mass Market Paperback", "Trade Paperback", "Oversize", "Other"
  location: text("location"),
  type: text("type").notNull(), // "COGS" or "Expense"
  status: text("status").notNull().default("available"), // "available", "sold", "listed"
  purchaseDate: timestamp("purchase_date").notNull().defaultNow(),
  dateAdded: timestamp("date_added").notNull().defaultNow(),
});

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
  sku: true,
  dateAdded: true,
});

export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;
