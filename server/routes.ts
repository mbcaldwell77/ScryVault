import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookSchema } from "@shared/schema";
import { z } from "zod";
import { EbayPricingService, type PricingServiceConfig } from "./pricing-service";

// Initialize eBay pricing service
let pricingService: EbayPricingService | null = null;

if (process.env.EBAY_APP_ID) {
  const config: PricingServiceConfig = {
    appId: process.env.EBAY_APP_ID,
    cacheDurationMs: 60 * 60 * 1000, // 1 hour cache
    maxRetries: 3,
    timeoutMs: 10000 // 10 second timeout
  };
  pricingService = new EbayPricingService(config);
  console.log('[PricingService] eBay integration initialized');
} else {
  console.warn('[PricingService] EBAY_APP_ID not found - pricing features disabled');
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all books in inventory
  app.get("/api/books", async (req, res) => {
    try {
      const books = await storage.getAllBooks();
      res.json(books);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch books" });
    }
  });

  // Get book by ID
  app.get("/api/books/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const book = await storage.getBook(id);
      
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }
      
      res.json(book);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch book" });
    }
  });

  // Add book to inventory
  app.post("/api/books", async (req, res) => {
    try {
      const validatedData = insertBookSchema.parse(req.body);
      const book = await storage.createBook(validatedData);
      res.status(201).json(book);
    } catch (error) {
      console.error("Database error creating book:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to create book" });
    }
  });

  // Update book in inventory
  app.put("/api/books/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid book ID" });
      }

      const validatedData = insertBookSchema.parse(req.body);
      const updatedBook = await storage.updateBook(id, validatedData);
      
      if (!updatedBook) {
        return res.status(404).json({ error: "Book not found" });
      }
      
      res.json(updatedBook);
    } catch (error) {
      console.error("Database error updating book:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to update book" });
    }
  });

  // Delete book from inventory
  app.delete("/api/books/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBook(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Book not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete book" });
    }
  });

  // Fetch book information from external APIs
  app.get("/api/book-lookup/:isbn", async (req, res) => {
    try {
      const { isbn } = req.params;
      
      // Try OpenLibrary API first
      let bookData = await fetchFromOpenLibrary(isbn);
      
      // Fallback to Google Books API if OpenLibrary fails
      if (!bookData) {
        bookData = await fetchFromGoogleBooks(isbn);
      }
      
      if (!bookData) {
        return res.status(404).json({ error: "Book not found in any database" });
      }
      
      res.json(bookData);
    } catch (error) {
      res.status(500).json({ error: "Failed to lookup book" });
    }
  });

  // Get market pricing data for a book
  app.get("/api/book-pricing/:isbn", async (req, res) => {
    try {
      const { isbn } = req.params;
      
      if (!pricingService) {
        return res.status(503).json({ 
          error: "Pricing service not available",
          message: "eBay API integration not configured" 
        });
      }
      
      const pricingData = await pricingService.getPricingData(isbn);
      
      if (!pricingData) {
        return res.status(404).json({ 
          error: "No pricing data found",
          message: "No recent sales found for this ISBN" 
        });
      }
      
      res.json(pricingData);
    } catch (error) {
      console.error("Pricing API error:", error);
      res.status(500).json({ error: "Failed to fetch pricing data" });
    }
  });

  // Update pricing data for a specific book in inventory
  app.put("/api/books/:id/pricing", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid book ID" });
      }

      const book = await storage.getBook(id);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }

      if (!pricingService) {
        return res.status(503).json({ 
          error: "Pricing service not available",
          message: "eBay API integration not configured" 
        });
      }

      const pricingData = await pricingService.getPricingData(book.isbn);
      
      if (pricingData) {
        // Update the book's estimated price with market data
        const updatedBook = await storage.updateBook(id, {
          ...book,
          estimatedPrice: pricingData.averagePrice.toString()
        });
        
        res.json({
          book: updatedBook,
          pricingData
        });
      } else {
        res.status(404).json({ 
          error: "No pricing data found",
          message: "No recent sales found for this ISBN" 
        });
      }
    } catch (error) {
      console.error("Update pricing error:", error);
      res.status(500).json({ error: "Failed to update pricing data" });
    }
  });

  // Get pricing service metrics (for monitoring)
  app.get("/api/pricing/metrics", async (req, res) => {
    try {
      if (!pricingService) {
        return res.status(503).json({ 
          error: "Pricing service not available" 
        });
      }
      
      const metrics = pricingService.getMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to get metrics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function fetchFromOpenLibrary(isbn: string) {
  try {
    const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
    const data = await response.json();
    
    const bookKey = `ISBN:${isbn}`;
    const book = data[bookKey];
    
    if (!book) return null;
    
    return {
      title: book.title || "Unknown Title",
      author: book.authors?.[0]?.name || "Unknown Author",
      publisher: book.publishers?.[0]?.name || "Unknown Publisher",
      year: book.publish_date || "Unknown",
      imageUrl: book.cover?.large || book.cover?.medium || book.cover?.small || "",
      estimatedPrice: null // Price data not available from OpenLibrary
    };
  } catch (error) {
    console.error("OpenLibrary API error:", error);
    return null;
  }
}

async function fetchFromGoogleBooks(isbn: string) {
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) return null;
    
    const book = data.items[0].volumeInfo;
    
    return {
      title: book.title || "Unknown Title",
      author: book.authors?.[0] || "Unknown Author",
      publisher: book.publisher || "Unknown Publisher",
      year: book.publishedDate?.split('-')[0] || "Unknown",
      imageUrl: book.imageLinks?.thumbnail?.replace('http:', 'https:') || "",
      estimatedPrice: null // Price data not available from Google Books API
    };
  } catch (error) {
    console.error("Google Books API error:", error);
    return null;
  }
}
