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
      
      // Try ISBNdb API first (provides format data)
      let bookData = await fetchFromISBNdb(isbn);
      
      // Fallback to OpenLibrary API
      if (!bookData) {
        bookData = await fetchFromOpenLibrary(isbn);
      }
      
      // Final fallback to Google Books API
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

  // eBay webhook endpoint for marketplace compliance
  app.post("/api/ebay/webhook", async (req, res) => {
    try {
      const { challengeCode, verificationToken, notificationId, eventDate, publishDate, notificationType } = req.body;
      
      // Handle verification challenge
      if (challengeCode) {
        console.log('[eBay Webhook] Verification challenge received');
        
        // Verify the token matches our configured token
        const expectedToken = 'scryvaul_webhook_verification_2025';
        if (verificationToken === expectedToken) {
          return res.status(200).json({ challengeResponse: challengeCode });
        } else {
          console.error('[eBay Webhook] Invalid verification token');
          return res.status(401).json({ error: 'Invalid verification token' });
        }
      }
      
      // Handle marketplace account deletion notifications
      if (notificationType === 'MARKETPLACE_ACCOUNT_DELETION') {
        console.log('[eBay Webhook] Account deletion notification received:', {
          notificationId,
          eventDate,
          publishDate
        });
        
        // TODO: Implement user account cleanup when we add user management
        // For now, just log the notification for compliance
        
        return res.status(200).json({ status: 'received' });
      }
      
      // Handle other notification types
      console.log('[eBay Webhook] Notification received:', {
        notificationType,
        notificationId,
        eventDate
      });
      
      res.status(200).json({ status: 'received' });
    } catch (error) {
      console.error('[eBay Webhook] Error processing notification:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function fetchFromISBNdb(isbn: string) {
  try {
    const apiKey = process.env.ISBNDB_API_KEY;
    if (!apiKey) {
      console.log("ISBNdb API key not available, skipping...");
      return null;
    }

    const response = await fetch(`https://api2.isbndb.com/book/${isbn}`, {
      headers: {
        'Authorization': apiKey
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const book = data.book;
    
    if (!book) return null;

    // ISBNdb provides binding information which maps to format
    let format = null;
    if (book.binding) {
      const binding = book.binding.toLowerCase();
      if (binding.includes('hardcover') || binding.includes('hardback')) {
        format = 'Hardcover';
      } else if (binding.includes('mass market')) {
        format = 'Mass Market Paperback';
      } else if (binding.includes('paperback') || binding.includes('trade')) {
        format = 'Trade Paperback';
      } else {
        format = 'Other';
      }
    }

    return {
      title: book.title || "Unknown Title",
      author: book.authors?.[0] || "Unknown Author",
      publisher: book.publisher || "Unknown Publisher", 
      year: book.date_published?.split('-')[0] || "Unknown",
      imageUrl: book.image || "",
      format: format, // ISBNdb provides reliable format data
      estimatedPrice: null
    };
  } catch (error) {
    console.error("ISBNdb API error:", error);
    return null;
  }
}

async function fetchFromOpenLibrary(isbn: string) {
  try {
    const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
    const data = await response.json();
    
    const bookKey = `ISBN:${isbn}`;
    const book = data[bookKey];
    
    if (!book) return null;
    
    // Try to determine format from title or other metadata
    const title = book.title || "Unknown Title";
    let format = null;
    
    if (title.toLowerCase().includes('hardcover') || title.toLowerCase().includes('hardback')) {
      format = 'Hardcover';
    } else if (title.toLowerCase().includes('paperback')) {
      if (title.toLowerCase().includes('mass market')) {
        format = 'Mass Market Paperback';
      } else {
        format = 'Trade Paperback';
      }
    }

    return {
      title: title,
      author: book.authors?.[0]?.name || "Unknown Author",
      publisher: book.publishers?.[0]?.name || "Unknown Publisher",
      year: book.publish_date || "Unknown",
      imageUrl: book.cover?.large || book.cover?.medium || book.cover?.small || "",
      format: format, // Include format when detectable
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
    
    // Try to determine format from title or other metadata
    const title = book.title || "Unknown Title";
    let format = null;
    
    if (title.toLowerCase().includes('hardcover') || title.toLowerCase().includes('hardback')) {
      format = 'Hardcover';
    } else if (title.toLowerCase().includes('paperback')) {
      if (title.toLowerCase().includes('mass market')) {
        format = 'Mass Market Paperback';
      } else {
        format = 'Trade Paperback';
      }
    }

    return {
      title: title,
      author: book.authors?.[0] || "Unknown Author",
      publisher: book.publisher || "Unknown Publisher",
      year: book.publishedDate?.split('-')[0] || "Unknown",
      imageUrl: book.imageLinks?.thumbnail?.replace('http:', 'https:') || "",
      format: format, // Include format when detectable
      estimatedPrice: null // Price data not available from Google Books API
    };
  } catch (error) {
    console.error("Google Books API error:", error);
    return null;
  }
}
