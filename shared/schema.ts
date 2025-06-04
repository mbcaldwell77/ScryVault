import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  subscriptionTier: text("subscription_tier").notNull().default("free"), // "free", "basic", "pro", "business", "enterprise"
  isActive: boolean("is_active").notNull().default(true),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  refreshToken: text("refresh_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sku: text("sku").notNull().unique(),
  isbn: text("isbn").notNull(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  publisher: text("publisher"),
  year: text("year"),
  imageUrl: text("image_url"),
  purchasePrice: text("purchase_price").notNull(),
  estimatedPrice: text("estimated_price"),
  condition: text("condition").notNull(),
  format: text("format").notNull().default("Other"), // "Hardcover", "Mass Market Paperback", "Trade Paperback", "Oversize", "Other"
  location: text("location"),
  storageLocation: text("storage_location"),
  notes: text("notes"),
  type: text("type").notNull(), // "COGS" or "Expense"
  status: text("status").notNull().default("available"), // "available", "sold", "listed"
  purchaseDate: text("purchase_date").notNull(),
  dateAdded: timestamp("date_added").notNull().defaultNow(),
});

export const pricingCache = pgTable("pricing_cache", {
  id: serial("id").primaryKey(),
  isbn: text("isbn").notNull().unique(),
  pricingData: text("pricing_data").notNull(), // JSON string of PricingData
  confidence: text("confidence").notNull(), // "high", "medium", "low"
  totalSales: integer("total_sales").notNull(),
  averagePrice: decimal("average_price", { precision: 10, scale: 2 }).notNull(),
  fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  accessCount: integer("access_count").notNull().default(0),
  lastAccessedAt: timestamp("last_accessed_at").notNull().defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  pricingCacheDays: integer("pricing_cache_days").notNull().default(90), // How long to keep pricing data
  enablePricingCache: boolean("enable_pricing_cache").notNull().default(true),
  autoRefreshPricing: boolean("auto_refresh_pricing").notNull().default(true),
  pricingConfidenceThreshold: text("pricing_confidence_threshold").notNull().default("medium"), // "low", "medium", "high"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
  userId: true,
  sku: true,
  dateAdded: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;
export type User = typeof users.$inferSelect;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type PricingCacheEntry = typeof pricingCache.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
