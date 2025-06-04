import { books, type Book, type InsertBook } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getBook(id: number, userId?: number): Promise<Book | undefined>;
  getBookByIsbn(isbn: string, userId?: number): Promise<Book | undefined>;
  getAllBooks(): Promise<Book[]>;
  getAllBooksForUser(userId: number): Promise<Book[]>;
  createBook(book: InsertBook): Promise<Book>;
  createBookForUser(userId: number, book: InsertBook): Promise<Book>;
  updateBook(id: number, book: InsertBook, userId?: number): Promise<Book | undefined>;
  deleteBook(id: number, userId?: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getBook(id: number, userId?: number): Promise<Book | undefined> {
    const conditions = userId 
      ? and(eq(books.id, id), eq(books.userId, userId))
      : eq(books.id, id);
    
    const [book] = await db.select().from(books).where(conditions);
    return book || undefined;
  }

  async getBookByIsbn(isbn: string, userId?: number): Promise<Book | undefined> {
    const conditions = userId 
      ? and(eq(books.isbn, isbn), eq(books.userId, userId))
      : eq(books.isbn, isbn);
    
    const [book] = await db.select().from(books).where(conditions);
    return book || undefined;
  }

  async getAllBooks(): Promise<Book[]> {
    return await db.select().from(books).orderBy(books.dateAdded);
  }

  async getAllBooksForUser(userId: number): Promise<Book[]> {
    return await db.select().from(books)
      .where(eq(books.userId, userId))
      .orderBy(books.dateAdded);
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    throw new Error("Use createBookForUser instead - user authentication required");
  }

  async createBookForUser(userId: number, insertBook: InsertBook): Promise<Book> {
    // Generate unique SKU based on ISBN and timestamp
    const timestamp = Date.now().toString().slice(-6);
    const isbnSuffix = insertBook.isbn.slice(-4);
    const sku = `${isbnSuffix}-${timestamp}`;
    
    const bookWithUserAndSku = {
      ...insertBook,
      userId,
      sku
    };
    
    const [book] = await db
      .insert(books)
      .values(bookWithUserAndSku)
      .returning();
    return book;
  }

  async updateBook(id: number, book: InsertBook): Promise<Book | undefined> {
    const [updatedBook] = await db
      .update(books)
      .set(book)
      .where(eq(books.id, id))
      .returning();
    return updatedBook || undefined;
  }

  async deleteBook(id: number): Promise<boolean> {
    const result = await db.delete(books).where(eq(books.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
