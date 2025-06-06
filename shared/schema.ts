import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  varchar,
  numeric,
  boolean,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  subscriptionTier: varchar("subscription_tier", { length: 20 }).default(
    "free",
  ),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSessions = pgTable("user_sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  isbn: varchar("isbn", { length: 20 }).notNull(),
  title: text("title"),
  author: text("author"),
  publisher: text("publisher"),
  year: varchar("year", { length: 8 }),
  purchasePrice: numeric("purchase_price", { precision: 10, scale: 2 }),
  condition: text("condition"),
  conditionNotes: text("condition_notes"),
  sku: varchar("sku", { length: 32 }),
  tags: text("tags"),
  listed: boolean("listed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pricingCache = pgTable("pricing_cache", {
  id: serial("id").primaryKey(),
  isbn: varchar("isbn", { length: 20 }).notNull(),
  source: varchar("source", { length: 32 }).notNull(),
  low: numeric("low", { precision: 10, scale: 2 }),
  high: numeric("high", { precision: 10, scale: 2 }),
  average: numeric("average", { precision: 10, scale: 2 }),
  confidence: integer("confidence"),
  lastChecked: timestamp("last_checked").defaultNow(),
});

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id")
    .references(() => books.id)
    .notNull(),
  platform: varchar("platform", { length: 32 }),
  soldPrice: numeric("sold_price", { precision: 10, scale: 2 }),
  fees: numeric("fees", { precision: 10, scale: 2 }),
  soldDate: timestamp("sold_date"),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  platform: varchar("platform", { length: 32 }),
  titleTemplate: text("title_template"),
  descriptionTemplate: text("description_template"),
  category: varchar("category", { length: 64 }),
  conditionMapping: text("condition_mapping"),
});

export const receipts = pgTable("receipts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  imageUrl: text("image_url"),
  ocrText: text("ocr_text"),
  vendor: text("vendor"),
  amount: numeric("amount", { precision: 10, scale: 2 }),
  category: varchar("category", { length: 32 }),
  date: timestamp("date").defaultNow(),
});
