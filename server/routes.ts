import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookSchema } from "@shared/schema";
import { z } from "zod";
import { EbayPricingService, type PricingServiceConfig } from "./pricing-service";
import crypto from 'crypto';
import { authenticateToken, optionalAuth, AuthenticatedRequest } from './auth-middleware';
import authRoutes from './auth-routes';

// ISBN normalization functions
function convertISBN10to13(isbn10: string): string {
  const cleanISBN = isbn10.replace(/[-\s]/g, '');
  if (cleanISBN.length !== 10) return isbn10;
  
  const prefix = '978' + cleanISBN.substr(0, 9);
  let checksum = 0;
  
  for (let i = 0; i < 12; i++) {
    checksum += parseInt(prefix[i]) * (i % 2 === 0 ? 1 : 3);
  }
  
  const checkDigit = (10 - (checksum % 10)) % 10;
  return prefix + checkDigit;
}

function normalizeISBN(isbn: string): string {
  const cleanISBN = isbn.replace(/[-\s]/g, '');
  
  if (cleanISBN.length === 10) {
    return convertISBN10to13(cleanISBN);
  } else if (cleanISBN.length === 13) {
    return cleanISBN;
  }
  
  return isbn;
}

// Initialize eBay pricing service
let pricingService: EbayPricingService | null = null;

if (process.env.EBAY_APP_ID) {
  const config: PricingServiceConfig = {
    appId: process.env.EBAY_APP_ID,
    userToken: process.env.EBAY_USER_TOKEN,
    cacheDurationMs: 60 * 60 * 1000, // 1 hour cache
    maxRetries: 3,
    timeoutMs: 10000 // 10 second timeout
  };
  pricingService = new EbayPricingService(config);
  
  if (process.env.EBAY_USER_TOKEN) {
    console.log('[PricingService] eBay integration initialized with user token authentication');
  } else {
    console.log('[PricingService] eBay integration initialized with App ID only');
    console.warn('[PricingService] Consider adding EBAY_USER_TOKEN for enhanced data access');
  }
} else {
  console.warn('[PricingService] EBAY_APP_ID not found - pricing features disabled');
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Add authentication routes
  app.use('/api/auth', authRoutes);

  // Test route to verify deployment (no auth required)
  app.get("/api/test", (req, res) => {
    res.json({ message: "API is working", timestamp: new Date().toISOString() });
  });

  // Get all books in inventory (requires authentication)
  app.get("/api/books", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const books = await storage.getAllBooksForUser(req.user!.id);
      res.json(books);
    } catch (error) {
      console.error('[API] Get books error:', error);
      res.status(500).json({ error: "Failed to fetch books" });
    }
  });

  // Get book by ID (requires authentication)
  app.get("/api/books/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      const book = await storage.getBook(id, req.user.id);
      
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }
      
      res.json(book);
    } catch (error) {
      console.error('[API] Get book error:', error);
      res.status(500).json({ error: "Failed to fetch book" });
    }
  });

  // Add book to inventory (requires authentication)
  app.post("/api/books", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const validatedData = insertBookSchema.parse(req.body);
      const book = await storage.createBookForUser(req.user.id, validatedData);
      res.status(201).json(book);
    } catch (error) {
      console.error('[API] Create book error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to create book" });
    }
  });

  // Update book in inventory (requires authentication)
  app.put("/api/books/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid book ID" });
      }

      const validatedData = insertBookSchema.parse(req.body);
      const updatedBook = await storage.updateBook(id, validatedData, req.user.id);
      
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

  // Delete book from inventory (requires authentication)
  app.delete("/api/books/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBook(id, req.user.id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Book not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('[API] Delete book error:', error);
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

  // Catch-all logger for eBay webhook requests
  app.use("/api/ebay/webhook", (req, res, next) => {
    console.log(`[eBay Webhook] === ${req.method} REQUEST INTERCEPTED ===`);
    console.log('[eBay Webhook] Method:', req.method);
    console.log('[eBay Webhook] URL:', req.url);
    console.log('[eBay Webhook] Query:', JSON.stringify(req.query, null, 2));
    console.log('[eBay Webhook] Headers:', JSON.stringify(req.headers, null, 2));
    if (req.method === 'POST' || req.method === 'PUT') {
      console.log('[eBay Webhook] Body:', JSON.stringify(req.body, null, 2));
    }
    next();
  });

  // GET endpoint for eBay verification challenge
  app.get("/api/ebay/webhook", async (req, res) => {
    try {
      console.log('[eBay Webhook] === VERIFICATION GET REQUEST ===');
      console.log('[eBay Webhook] Query params:', JSON.stringify(req.query, null, 2));
      
      const { challenge_code } = req.query;
      
      if (challenge_code) {
        const challengeCode = challenge_code as string;
        const verificationToken = process.env.EBAY_WEBHOOK_TOKEN || 'ldernTom-ScryVaul-PRD-0f0240608-25d29f7a';
        const endpoint = 'https://scryvault.replit.app/api/ebay/webhook';
        
        console.log('[eBay Webhook] Challenge code:', challengeCode);
        console.log('[eBay Webhook] Verification token:', verificationToken);
        console.log('[eBay Webhook] Endpoint:', endpoint);
        
        // Hash in the order: challengeCode + verificationToken + endpoint
        const hash = crypto.createHash('sha256');
        hash.update(challengeCode);
        hash.update(verificationToken);
        hash.update(endpoint);
        const challengeResponse = hash.digest('hex');
        
        console.log('[eBay Webhook] Computed challenge response:', challengeResponse);
        
        return res.status(200)
          .set('Content-Type', 'application/json')
          .json({ challengeResponse });
      }
      
      // If no challenge_code, return status info
      res.json({ 
        status: "eBay webhook endpoint is active", 
        timestamp: new Date().toISOString() 
      });
      
    } catch (error) {
      console.error('[eBay Webhook] GET error:', error);
      res.status(500).json({ 
        error: 'Webhook verification failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  // POST endpoint for actual notifications
  app.post("/api/ebay/webhook", async (req, res) => {
    try {
      console.log('[eBay Webhook] === INCOMING POST REQUEST ===');
      console.log('[eBay Webhook] Timestamp:', new Date().toISOString());
      console.log('[eBay Webhook] Headers:', JSON.stringify(req.headers, null, 2));
      console.log('[eBay Webhook] Raw Body:', JSON.stringify(req.body, null, 2));
      console.log('[eBay Webhook] Body type:', typeof req.body);
      console.log('[eBay Webhook] Body keys:', Object.keys(req.body || {}));
      
      // Handle marketplace account deletion notifications
      const { metadata, notification } = req.body;
      
      if (metadata?.topic === 'MARKETPLACE_ACCOUNT_DELETION') {
        console.log('[eBay Webhook] Account deletion notification:', {
          notificationId: notification?.notificationId,
          eventDate: notification?.eventDate,
          publishDate: notification?.publishDate,
          username: notification?.data?.username,
          userId: notification?.data?.userId
        });
        
        // Process deletion request - log and acknowledge
        // In production, this would trigger user data deletion
        
        return res.status(200).json({ 
          message: 'Account deletion notification processed successfully', 
          notificationId: notification?.notificationId,
          processedAt: new Date().toISOString()
        });
      }
      
      // Handle other notification types
      console.log('[eBay Webhook] Other notification received:', req.body);
      res.status(200).json({ 
        message: 'Notification received and processed', 
        timestamp: new Date().toISOString() 
      });
      
    } catch (error) {
      console.error('[eBay Webhook] POST error:', error);
      res.status(500).json({ 
        error: 'Webhook processing failed',
        timestamp: new Date().toISOString()
      });
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
