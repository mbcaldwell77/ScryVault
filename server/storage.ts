import { books, type Book, type InsertBook } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getBook(id: number): Promise<Book | undefined>;
  getBookByIsbn(isbn: string): Promise<Book | undefined>;
  getAllBooks(): Promise<Book[]>;
  createBook(book: InsertBook): Promise<Book>;
  deleteBook(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getBook(id: number): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    return book || undefined;
  }

  async getBookByIsbn(isbn: string): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.isbn, isbn));
    return book || undefined;
  }

  async getAllBooks(): Promise<Book[]> {
    return await db.select().from(books).orderBy(books.dateAdded);
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    // Generate unique SKU based on ISBN and timestamp
    const timestamp = Date.now().toString().slice(-6);
    const isbnSuffix = insertBook.isbn.slice(-4);
    const sku = `${isbnSuffix}-${timestamp}`;
    
    const bookWithSku = {
      ...insertBook,
      sku
    };
    
    const [book] = await db
      .insert(books)
      .values(bookWithSku)
      .returning();
    return book;
  }

  async deleteBook(id: number): Promise<boolean> {
    const result = await db.delete(books).where(eq(books.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
