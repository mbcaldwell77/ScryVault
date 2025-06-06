import { db } from "./db";
import { books } from "@shared/schema";
import { environmentLockdown } from "./environment-lockdown";

// Development seed data - comprehensive dummy dataset
const developmentBooks = [
  {
    sku: "9780-123456",
    isbn: "9780451524935",
    title: "1984",
    author: "George Orwell",
    publisher: "Signet Classics",
    year: "1949",
    imageUrl: "https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg",
    purchasePrice: "8.99",
    estimatedPrice: "15.50",
    condition: "Very Good",
    format: "Trade Paperback",
    location: "Shelf A-1",
    type: "COGS" as const,
    status: "available" as const,
    purchaseDate: "2024-01-15"
  },
  {
    sku: "9780-123457",
    isbn: "9780451524935",
    title: "1984",
    author: "George Orwell",
    publisher: "Signet Classics",
    year: "1949",
    imageUrl: "https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg",
    purchasePrice: "12.50",
    estimatedPrice: "18.00",
    condition: "Like New",
    format: "Hardcover",
    location: "Shelf A-1",
    type: "COGS" as const,
    status: "available" as const,
    purchaseDate: "2024-02-10"
  },
  {
    sku: "9781-789012",
    isbn: "9781984822178",
    title: "Educated",
    author: "Tara Westover",
    publisher: "Random House",
    year: "2018",
    imageUrl: "https://covers.openlibrary.org/b/isbn/9781984822178-M.jpg",
    purchasePrice: "14.99",
    estimatedPrice: "22.00",
    condition: "Very Good",
    format: "Trade Paperback",
    location: "Shelf B-3",
    type: "COGS" as const,
    status: "available" as const,
    purchaseDate: "2024-01-20"
  },
  {
    sku: "9780-345678",
    isbn: "9780062316097",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    publisher: "Harper",
    year: "2014",
    imageUrl: "https://covers.openlibrary.org/b/isbn/9780062316097-M.jpg",
    purchasePrice: "16.99",
    estimatedPrice: "25.00",
    condition: "Good",
    format: "Hardcover",
    location: "Shelf C-2",
    type: "COGS" as const,
    status: "available" as const,
    purchaseDate: "2024-02-05"
  },
  {
    sku: "9780-456789",
    isbn: "9780593230572",
    title: "The Seven Husbands of Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    publisher: "Atria Books",
    year: "2017",
    imageUrl: "https://covers.openlibrary.org/b/isbn/9780593230572-M.jpg",
    purchasePrice: "11.50",
    estimatedPrice: "19.99",
    condition: "Like New",
    format: "Trade Paperback",
    location: "Shelf D-1",
    type: "COGS" as const,
    status: "available" as const,
    purchaseDate: "2024-02-15"
  },
  {
    sku: "9781-567890",
    isbn: "9780735211292",
    title: "Atomic Habits",
    author: "James Clear",
    publisher: "Avery",
    year: "2018",
    imageUrl: "https://covers.openlibrary.org/b/isbn/9780735211292-M.jpg",
    purchasePrice: "13.99",
    estimatedPrice: "21.50",
    condition: "Very Good",
    format: "Hardcover",
    location: "Shelf E-4",
    type: "COGS" as const,
    status: "available" as const,
    purchaseDate: "2024-03-01"
  },
  {
    sku: "9780-678901",
    isbn: "9780525559474",
    title: "Becoming",
    author: "Michelle Obama",
    publisher: "Crown",
    year: "2018",
    imageUrl: "https://covers.openlibrary.org/b/isbn/9780525559474-M.jpg",
    purchasePrice: "18.00",
    estimatedPrice: "28.99",
    condition: "Like New",
    format: "Hardcover",
    location: "Shelf F-2",
    type: "COGS" as const,
    status: "available" as const,
    purchaseDate: "2024-03-10"
  },
  {
    sku: "9781-789123",
    isbn: "9780525521143",
    title: "The Silent Patient",
    author: "Alex Michaelides",
    publisher: "Celadon Books",
    year: "2019",
    imageUrl: "https://covers.openlibrary.org/b/isbn/9780525521143-M.jpg",
    purchasePrice: "9.99",
    estimatedPrice: "16.00",
    condition: "Good",
    format: "Trade Paperback",
    location: "Shelf G-1",
    type: "COGS" as const,
    status: "available" as const,
    purchaseDate: "2024-03-15"
  },
  {
    sku: "9780-890234",
    isbn: "9780062457714",
    title: "The Alchemist",
    author: "Paulo Coelho",
    publisher: "HarperOne",
    year: "1988",
    imageUrl: "https://covers.openlibrary.org/b/isbn/9780062457714-M.jpg",
    purchasePrice: "7.50",
    estimatedPrice: "14.99",
    condition: "Acceptable",
    format: "Mass Market Paperback",
    location: "Shelf H-3",
    type: "COGS" as const,
    status: "available" as const,
    purchaseDate: "2024-03-20"
  },
  {
    sku: "9781-901345",
    isbn: "9780525436287",
    title: "Where the Crawdads Sing",
    author: "Delia Owens",
    publisher: "G.P. Putnam's Sons",
    year: "2018",
    imageUrl: "https://covers.openlibrary.org/b/isbn/9780525436287-M.jpg",
    purchasePrice: "15.99",
    estimatedPrice: "24.00",
    condition: "Very Good",
    format: "Trade Paperback",
    location: "Shelf I-2",
    type: "COGS" as const,
    status: "available" as const,
    purchaseDate: "2024-04-01"
  }
];

export async function seedDevelopmentData() {
  try {
    console.log("[SEED] Starting development data seeding...");
    
    // CRITICAL: Validate environment safety
    environmentLockdown.validateSeedOperation();
    await environmentLockdown.validateDatabaseConnection();
    environmentLockdown.requireExplicitConfirmation("SEED_DEVELOPMENT_DATA", developmentBooks.length);
    
    // Clear existing data in development
    await db.delete(books);
    console.log("[SEED] Cleared existing books");
    
    // Insert development seed data with proper SKU generation
    const booksWithSkus = developmentBooks.map((book, index) => ({
      ...book,
      sku: `DEV-${Date.now()}-${index.toString().padStart(3, "0")}`
    }));
    
    const insertedBooks = await db.insert(books).values(booksWithSkus as any[]).returning();
    console.log(`[SEED] Inserted ${insertedBooks.length} development books`);
    
    console.log("[SEED] Development data seeding completed successfully");
    return insertedBooks;
  } catch (error) {
    console.error("[SEED] Error seeding development data:", error);
    throw error;
  }
}

export async function clearDevelopmentData() {
  try {
    console.log("[SEED] Clearing development data...");
    
    // CRITICAL: Validate environment safety
    environmentLockdown.validateClearOperation();
    const validation = await environmentLockdown.validateDatabaseConnection();
    environmentLockdown.requireExplicitConfirmation("CLEAR_ALL_DATA", validation.bookCount);
    
    const result = await db.delete(books);
    console.log("[SEED] Development data cleared");
    return result;
  } catch (error) {
    console.error("[SEED] Error clearing development data:", error);
    throw error;
  }
}