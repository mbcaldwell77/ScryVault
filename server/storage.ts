import { books, type Book, type InsertBook } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getBook(id: number): Promise<Book | undefined>;
  getBookByIsbn(isbn: string): Promise<Book | undefined>;
  getAllBooks(): Promise<Book[]>;
  createBook(book: InsertBook): Promise<Book>;
  deleteBook(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private books: Map<number, Book>;
  currentId: number;

  constructor() {
    this.books = new Map();
    this.currentId = 1;
  }

  async getBook(id: number): Promise<Book | undefined> {
    return this.books.get(id);
  }

  async getBookByIsbn(isbn: string): Promise<Book | undefined> {
    return Array.from(this.books.values()).find(
      (book) => book.isbn === isbn,
    );
  }

  async getAllBooks(): Promise<Book[]> {
    return Array.from(this.books.values()).sort(
      (a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
    );
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const id = this.currentId++;
    const book: Book = { 
      ...insertBook, 
      id,
      dateAdded: new Date()
    };
    this.books.set(id, book);
    return book;
  }

  async deleteBook(id: number): Promise<boolean> {
    return this.books.delete(id);
  }
}

export const storage = new MemStorage();
