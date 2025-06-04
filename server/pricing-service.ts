import { z } from "zod";
import { db } from "./db";
import { pricingCache, userSettings } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";

// eBay API response types
interface EbayItem {
  title: string[];
  sellingStatus: [{
    convertedCurrentPrice: [{
      __value__: string;
    }];
  }];
  condition: [{
    conditionDisplayName: string[];
  }];
  listingInfo: [{
    endTime: string[];
  }];
}

interface EbayResponse {
  findCompletedItemsResponse: [{
    searchResult: [{
      item?: EbayItem[];
      '@count': string;
    }];
  }];
}

// Pricing analysis types
export interface PricingData {
  averagePrice: number;
  conditionPricing: {
    [condition: string]: {
      averagePrice: number;
      count: number;
      priceRange: { min: number; max: number };
    };
  };
  confidence: 'high' | 'medium' | 'low';
  confidenceScore: number;
  totalSales: number;
  dateRange: { from: string; to: string };
  lastUpdated: string;
  // Enhanced market intelligence
  marketVelocity: {
    salesPerWeek: number;
    timeToSell: number; // average days
    demandLevel: 'high' | 'medium' | 'low';
  };
  profitAnalysis: {
    recommendedListingPrice: number;
    expectedProfit: number;
    profitMargin: number;
    roi: number; // return on investment percentage
  };
  trends: {
    priceDirection: 'rising' | 'falling' | 'stable';
    weeklyChange: number; // percentage change
    seasonality: string;
  };
}

export interface PricingServiceConfig {
  appId: string;
  userToken?: string;
  cacheDurationMs: number;
  maxRetries: number;
  timeoutMs: number;
  defaultCacheDays: number;
  enableDatabaseCache: boolean;
}

export class EbayPricingService {
  private config: PricingServiceConfig;
  private cache = new Map<string, { data: PricingData; expires: number; accessCount: number; lastAccessed: number }>();
  private requestCount = 0;
  private errorCount = 0;
  private accessStats = new Map<string, { count: number; lastAccessed: number }>();
  private lastRateLimitError = 0;
  private rateLimitBackoffMs = 0;

  constructor(config: PricingServiceConfig) {
    this.config = config;
  }

  async getPricingData(isbn: string, userId?: number): Promise<PricingData | null> {
    const startTime = Date.now();
    
    try {
      // Check database cache first if enabled
      if (this.config.enableDatabaseCache) {
        const dbCached = await this.getDatabaseCachedData(isbn, userId);
        if (dbCached) {
          // Also update memory cache for faster subsequent access
          this.cache.set(isbn, {
            data: dbCached,
            expires: Date.now() + (60 * 60 * 1000), // 1 hour memory cache
            accessCount: 1,
            lastAccessed: Date.now()
          });
          this.logRequest(isbn, 'db_cache_hit', Date.now() - startTime);
          return dbCached;
        }
      }

      // Check memory cache
      const cached = this.getCachedData(isbn);
      if (cached) {
        this.logRequest(isbn, 'memory_cache_hit', Date.now() - startTime);
        return cached;
      }

      // Only fetch from eBay API if we haven't hit rate limits recently
      if (this.shouldSkipAPICall()) {
        this.logRequest(isbn, 'rate_limit_skip', Date.now() - startTime);
        return null;
      }

      // Fetch from eBay API
      const pricingData = await this.fetchFromEbay(isbn);
      
      if (pricingData) {
        // Store in both memory and database cache
        await this.setCachedData(isbn, pricingData, userId);
        this.logRequest(isbn, 'api_success', Date.now() - startTime);
      } else {
        this.logRequest(isbn, 'no_data', Date.now() - startTime);
      }

      return pricingData;
    } catch (error) {
      this.errorCount++;
      
      // Check if this is a rate limit error
      if (error instanceof Error && error.message.includes('rate limit')) {
        this.logRequest(isbn, 'rate_limit_error', Date.now() - startTime, error);
        // Try to return any cached data even if expired
        const expiredCached = await this.getExpiredCachedData(isbn);
        if (expiredCached) {
          console.log(`[EbayPricing] Returning expired cache data for ${isbn} due to rate limit`);
          return expiredCached;
        }
      }
      
      this.logRequest(isbn, 'error', Date.now() - startTime, error);
      return null;
    }
  }

  private async fetchFromEbay(isbn: string): Promise<PricingData | null> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const params = new URLSearchParams({
      'OPERATION-NAME': 'findCompletedItems',
      'SERVICE-VERSION': '1.0.0',
      'SECURITY-APPNAME': this.config.appId,
      'RESPONSE-DATA-FORMAT': 'JSON',
      'GLOBAL-ID': 'EBAY-US',
      'REST-PAYLOAD': '',
      'keywords': isbn,
      'categoryId': '267', // Books category
      'itemFilter(0).name': 'EndTimeFrom',
      'itemFilter(0).value': thirtyDaysAgo.toISOString(),
      'itemFilter(1).name': 'EndTimeTo', 
      'itemFilter(1).value': now.toISOString(),
      'itemFilter(2).name': 'SoldItemsOnly',
      'itemFilter(2).value': 'true',
      'paginationInput.entriesPerPage': '100',
      'sortOrder': 'EndTimeSoonest'
    });

    const url = `https://svcs.ebay.com/services/search/FindingService/v1?${params.toString()}`;
    
    console.log('[EbayPricing] Making API request for ISBN:', isbn);
    console.log('[EbayPricing] API URL:', url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      this.requestCount++;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add user token authentication if available
      if (this.config.userToken) {
        headers['X-EBAY-SOA-SECURITY-TOKEN'] = this.config.userToken;
        console.log('[EbayPricing] Using authenticated user token for enhanced data access');
      } else {
        console.log('[EbayPricing] Using App ID only - consider adding user token for better data access');
      }
      
      const response = await fetch(url, {
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[EbayPricing] API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText
        });
        
        // Check for rate limit error
        if (response.status === 500 && errorText.includes('rate limit')) {
          this.lastRateLimitError = Date.now();
          this.rateLimitBackoffMs = Math.min(this.rateLimitBackoffMs * 2 || 5 * 60 * 1000, 2 * 60 * 60 * 1000); // 5min to 2hr
          throw new Error(`eBay API rate limit exceeded - backing off for ${this.rateLimitBackoffMs / (60 * 1000)} minutes`);
        }
        
        throw new Error(`eBay API error: ${response.status} - ${response.statusText}`);
      }

      const data: EbayResponse = await response.json();
      
      // Enhanced API response logging
      console.log('[EbayPricing] API Response Status:', response.status);
      console.log('[EbayPricing] Raw API Response:', JSON.stringify(data, null, 2));
      
      const searchResult = data.findCompletedItemsResponse?.[0]?.searchResult?.[0];
      const itemCount = searchResult?.['@count'] || '0';
      console.log('[EbayPricing] Items found:', itemCount);
      
      if (searchResult?.item) {
        console.log('[EbayPricing] Sample items:', searchResult.item.slice(0, 3).map(item => ({
          title: item.title?.[0],
          price: item.sellingStatus?.[0]?.convertedCurrentPrice?.[0]?.__value__,
          condition: item.condition?.[0]?.conditionDisplayName?.[0],
          endTime: item.listingInfo?.[0]?.endTime?.[0]
        })));
      }
      
      return this.analyzePricingData(data, isbn);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private analyzePricingData(data: EbayResponse, isbn: string): PricingData | null {
    const searchResult = data.findCompletedItemsResponse?.[0]?.searchResult?.[0];
    const items = searchResult?.item;
    const totalCount = parseInt(searchResult?.['@count'] || '0');

    if (!items || items.length === 0) {
      return null;
    }

    const sales: Array<{ price: number; condition: string; date: string }> = [];
    const conditionMap = new Map<string, number[]>();

    // Process each sale
    for (const item of items) {
      try {
        const price = parseFloat(item.sellingStatus[0].convertedCurrentPrice[0].__value__);
        const condition = this.normalizeCondition(
          item.condition?.[0]?.conditionDisplayName?.[0] || 'Unknown'
        );
        const endTime = item.listingInfo[0].endTime[0];

        if (price > 0) {
          sales.push({ price, condition, date: endTime });
          
          if (!conditionMap.has(condition)) {
            conditionMap.set(condition, []);
          }
          conditionMap.get(condition)!.push(price);
        }
      } catch (error) {
        // Skip malformed items
        continue;
      }
    }

    if (sales.length === 0) {
      return null;
    }

    // Calculate overall metrics
    const prices = sales.map(s => s.price);
    const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    // Calculate condition-specific pricing
    const conditionPricing: PricingData['conditionPricing'] = {};
    Array.from(conditionMap.entries()).forEach(([condition, conditionPrices]) => {
      if (conditionPrices.length > 0) {
        conditionPricing[condition] = {
          averagePrice: conditionPrices.reduce((a: number, b: number) => a + b, 0) / conditionPrices.length,
          count: conditionPrices.length,
          priceRange: {
            min: Math.min(...conditionPrices),
            max: Math.max(...conditionPrices)
          }
        };
      }
    });

    // Calculate confidence score
    const { confidence, confidenceScore } = this.calculateConfidence(sales.length, sales);

    // Date range
    const dates = sales.map(s => new Date(s.date).getTime()).sort((a, b) => a - b);
    const dateRange = {
      from: new Date(dates[0]).toISOString(),
      to: new Date(dates[dates.length - 1]).toISOString()
    };

    // Calculate market velocity
    const daySpan = (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24);
    const salesPerWeek = daySpan > 0 ? (sales.length / daySpan) * 7 : 0;
    const timeToSell = daySpan > 0 ? daySpan / sales.length : 0;
    
    const marketVelocity = {
      salesPerWeek: Math.round(salesPerWeek * 100) / 100,
      timeToSell: Math.round(timeToSell * 100) / 100,
      demandLevel: salesPerWeek > 2 ? 'high' : salesPerWeek > 0.5 ? 'medium' : 'low' as 'high' | 'medium' | 'low'
    };

    // Calculate profit analysis
    const recommendedListingPrice = Math.round(averagePrice * 1.15 * 100) / 100;
    const profitAnalysis = {
      recommendedListingPrice,
      expectedProfit: 0, // Will be calculated when purchase price is provided
      profitMargin: 0,
      roi: 0
    };

    // Calculate trends
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const recentSales = sales.filter(s => new Date(s.date).getTime() > oneWeekAgo);
    const olderSales = sales.filter(s => new Date(s.date).getTime() <= oneWeekAgo);
    
    let priceDirection: 'rising' | 'falling' | 'stable' = 'stable';
    let weeklyChange = 0;
    
    if (recentSales.length > 0 && olderSales.length > 0) {
      const recentAvg = recentSales.reduce((sum, s) => sum + s.price, 0) / recentSales.length;
      const olderAvg = olderSales.reduce((sum, s) => sum + s.price, 0) / olderSales.length;
      weeklyChange = Math.round(((recentAvg - olderAvg) / olderAvg) * 100 * 100) / 100;
      
      if (weeklyChange > 5) priceDirection = 'rising';
      else if (weeklyChange < -5) priceDirection = 'falling';
    }

    const trends = {
      priceDirection,
      weeklyChange,
      seasonality: 'stable'
    };

    return {
      averagePrice: Math.round(averagePrice * 100) / 100,
      conditionPricing,
      confidence,
      confidenceScore,
      totalSales: sales.length,
      dateRange,
      lastUpdated: new Date().toISOString(),
      marketVelocity,
      profitAnalysis,
      trends
    };
  }

  private normalizeCondition(condition: string): string {
    const normalized = condition.toLowerCase();
    
    if (normalized.includes('new') || normalized.includes('brand new')) return 'New';
    if (normalized.includes('like new')) return 'Like New';
    if (normalized.includes('very good')) return 'Very Good';
    if (normalized.includes('good')) return 'Good';
    if (normalized.includes('acceptable') || normalized.includes('fair')) return 'Acceptable';
    
    return 'Unknown';
  }

  private calculateConfidence(salesCount: number, sales: Array<{ price: number; condition: string; date: string }>): { confidence: 'high' | 'medium' | 'low'; confidenceScore: number } {
    let score = 0;

    // Sales volume factor (0-40 points)
    if (salesCount >= 20) score += 40;
    else if (salesCount >= 10) score += 30;
    else if (salesCount >= 5) score += 20;
    else if (salesCount >= 2) score += 10;

    // Recency factor (0-30 points)
    const recent = sales.filter(s => 
      new Date(s.date).getTime() > Date.now() - 14 * 24 * 60 * 60 * 1000
    ).length;
    if (recent >= salesCount * 0.5) score += 30;
    else if (recent >= salesCount * 0.25) score += 20;
    else if (recent > 0) score += 10;

    // Price consistency factor (0-30 points)
    const prices = sales.map(s => s.price);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / prices.length;
    const coefficient = Math.sqrt(variance) / avg;
    
    if (coefficient < 0.3) score += 30;
    else if (coefficient < 0.5) score += 20;
    else if (coefficient < 0.8) score += 10;

    // Determine confidence level
    let confidence: 'high' | 'medium' | 'low';
    if (score >= 70) confidence = 'high';
    else if (score >= 40) confidence = 'medium';
    else confidence = 'low';

    return { confidence, confidenceScore: score };
  }

  private getCachedData(isbn: string): PricingData | null {
    const cached = this.cache.get(isbn);
    if (cached && cached.expires > Date.now()) {
      // Update access statistics
      cached.accessCount++;
      cached.lastAccessed = Date.now();
      this.updateAccessStats(isbn);
      return cached.data;
    }
    if (cached) {
      this.cache.delete(isbn);
    }
    return null;
  }

  private async setCachedData(isbn: string, data: PricingData, userId?: number): Promise<void> {
    const now = Date.now();
    const accessStats = this.accessStats.get(isbn);
    
    // Intelligent cache duration based on access frequency
    let cacheDuration = this.config.cacheDurationMs; // Default 1 hour for memory
    
    if (accessStats) {
      const accessCount = accessStats.count;
      const recentAccess = (now - accessStats.lastAccessed) < 24 * 60 * 60 * 1000; // Within 24 hours
      
      if (accessCount >= 10 && recentAccess) {
        cacheDuration = 60 * 60 * 1000; // 1 hour
      } else if (accessCount >= 3 && recentAccess) {
        cacheDuration = 6 * 60 * 60 * 1000; // 6 hours
      } else {
        cacheDuration = 24 * 60 * 60 * 1000; // 24 hours
      }
    }
    
    // Set memory cache
    this.cache.set(isbn, {
      data,
      expires: now + cacheDuration,
      accessCount: 1,
      lastAccessed: now
    });
    
    // Set database cache with configurable duration
    if (this.config.enableDatabaseCache) {
      await this.setDatabaseCachedData(isbn, data, userId);
    }
    
    console.log(`[EbayPricing] Cached data for ${isbn} with ${cacheDuration / (60 * 60 * 1000)}h memory expiration`);
  }

  private async getDatabaseCachedData(isbn: string, userId?: number): Promise<PricingData | null> {
    try {
      // Get user's cache settings
      const cacheDays = await this.getUserCacheDays(userId);
      const cutoffDate = new Date(Date.now() - (cacheDays * 24 * 60 * 60 * 1000));
      
      const cached = await db.select()
        .from(pricingCache)
        .where(and(
          eq(pricingCache.isbn, isbn),
          gt(pricingCache.expiresAt, new Date())
        ))
        .limit(1);
      
      if (cached.length > 0) {
        const entry = cached[0];
        
        // Update access count
        await db.update(pricingCache)
          .set({ 
            accessCount: entry.accessCount + 1,
            lastAccessedAt: new Date()
          })
          .where(eq(pricingCache.isbn, isbn));
        
        console.log(`[EbayPricing] Database cache hit for ${isbn}, age: ${Math.round((Date.now() - entry.fetchedAt.getTime()) / (24 * 60 * 60 * 1000))} days`);
        
        return JSON.parse(entry.pricingData) as PricingData;
      }
      
      return null;
    } catch (error) {
      console.error('[EbayPricing] Database cache error:', error);
      return null;
    }
  }

  private async setDatabaseCachedData(isbn: string, data: PricingData, userId?: number): Promise<void> {
    try {
      const cacheDays = await this.getUserCacheDays(userId);
      const expiresAt = new Date(Date.now() + (cacheDays * 24 * 60 * 60 * 1000));
      
      await db.insert(pricingCache)
        .values({
          isbn,
          pricingData: JSON.stringify(data),
          confidence: data.confidence,
          totalSales: data.totalSales,
          averagePrice: data.averagePrice.toString(),
          expiresAt,
          accessCount: 1,
          lastAccessedAt: new Date()
        })
        .onConflictDoUpdate({
          target: pricingCache.isbn,
          set: {
            pricingData: JSON.stringify(data),
            confidence: data.confidence,
            totalSales: data.totalSales,
            averagePrice: data.averagePrice.toString(),
            fetchedAt: new Date(),
            expiresAt,
            accessCount: 1,
            lastAccessedAt: new Date()
          }
        });
      
      console.log(`[EbayPricing] Stored in database cache for ${isbn}, expires in ${cacheDays} days`);
    } catch (error) {
      console.error('[EbayPricing] Database cache store error:', error);
    }
  }

  private async getUserCacheDays(userId?: number): Promise<number> {
    if (!userId) return this.config.defaultCacheDays;
    
    try {
      const settings = await db.select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);
      
      return settings.length > 0 ? settings[0].pricingCacheDays : this.config.defaultCacheDays;
    } catch (error) {
      console.error('[EbayPricing] Error getting user cache days:', error);
      return this.config.defaultCacheDays;
    }
  }

  private async getExpiredCachedData(isbn: string): Promise<PricingData | null> {
    try {
      // Get any cached data, even expired
      const cached = await db.select()
        .from(pricingCache)
        .where(eq(pricingCache.isbn, isbn))
        .limit(1);
      
      if (cached.length > 0) {
        console.log(`[EbayPricing] Using expired cache data for ${isbn} due to rate limit`);
        return JSON.parse(cached[0].pricingData) as PricingData;
      }
      
      return null;
    } catch (error) {
      console.error('[EbayPricing] Error getting expired cache:', error);
      return null;
    }
  }

  private shouldSkipAPICall(): boolean {
    const now = Date.now();
    
    // If we had a rate limit error recently, implement exponential backoff
    if (this.lastRateLimitError > 0) {
      const timeSinceError = now - this.lastRateLimitError;
      
      // Start with 5 minute backoff, double each time, max 2 hours
      if (timeSinceError < this.rateLimitBackoffMs) {
        return true;
      }
      
      // Reset if enough time has passed
      if (timeSinceError > 2 * 60 * 60 * 1000) { // 2 hours
        this.lastRateLimitError = 0;
        this.rateLimitBackoffMs = 0;
      }
    }
    
    // Skip if error rate is too high
    const errorRate = this.requestCount > 0 ? this.errorCount / this.requestCount : 0;
    if (errorRate > 0.8 && this.requestCount > 5) {
      console.log('[EbayPricing] Skipping API call due to high error rate');
      return true;
    }
    
    return false;
  }

  private updateAccessStats(isbn: string): void {
    const existing = this.accessStats.get(isbn);
    if (existing) {
      existing.count++;
      existing.lastAccessed = Date.now();
    } else {
      this.accessStats.set(isbn, { count: 1, lastAccessed: Date.now() });
    }
  }

  private logRequest(isbn: string, status: string, duration: number, error?: any): void {
    const logData = {
      timestamp: new Date().toISOString(),
      isbn,
      status,
      duration,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount * 100).toFixed(2) + '%' : '0%'
    };

    if (error) {
      console.error('[EbayPricingService]', logData, error.message);
    } else {
      console.log('[EbayPricingService]', logData);
    }
  }

  // Monitoring and health check methods
  getMetrics() {
    return {
      totalRequests: this.requestCount,
      totalErrors: this.errorCount,
      errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
      cacheSize: this.cache.size
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}