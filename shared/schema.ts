import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  subscriptionTier: varchar("subscription_tier", { length: 20 }).default("free"),
  createdAt: timestamp("created_at").defaultNow(),
});


// Sessions
export const userSessions = pgTable("user_sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
});


// Books
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  isbn: text("isbn").notNull(),
  title: text("title"),
  author: text("author"),
  publisher: text("publisher"),
  year: varchar("year", { length: 4 }),
  condition: text("condition"),
  purchasePrice: integer("purchase_price"),
  estimatedPrice: integer("estimated_price"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pricing Cache
export const pricingCache = pgTable("pricing_cache", {
  id: serial("id").primaryKey(),
  isbn: text("isbn").notNull(),
  data: text("data").notNull(),
  condition: text("condition"),
  confidence: integer("confidence"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  cacheDurationDays: integer("cache_duration_days").default(90),
});

// Zod Schemas
export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = loginSchema.extend({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// Type Exports
export type Book = InferSelectModel<typeof books>;
export type InsertBook = InferInsertModel<typeof books>;
export type User = InferSelectModel<typeof users>;
export type UserSession = InferSelectModel<typeof userSessions>;
export type PricingCacheEntry = InferSelectModel<typeof pricingCache>;
export type UserSettings = InferSelectModel<typeof userSettings>;
