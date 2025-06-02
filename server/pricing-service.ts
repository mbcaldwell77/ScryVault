import { z } from "zod";

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
}

export interface PricingServiceConfig {
  appId: string;
  cacheDurationMs: number;
  maxRetries: number;
  timeoutMs: number;
}

export class EbayPricingService {
  private config: PricingServiceConfig;
  private cache = new Map<string, { data: PricingData; expires: number }>();
  private requestCount = 0;
  private errorCount = 0;

  constructor(config: PricingServiceConfig) {
    this.config = config;
  }

  async getPricingData(isbn: string): Promise<PricingData | null> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cached = this.getCachedData(isbn);
      if (cached) {
        this.logRequest(isbn, 'cache_hit', Date.now() - startTime);
        return cached;
      }

      // Fetch from eBay API
      const pricingData = await this.fetchFromEbay(isbn);
      
      if (pricingData) {
        this.setCachedData(isbn, pricingData);
        this.logRequest(isbn, 'api_success', Date.now() - startTime);
      } else {
        this.logRequest(isbn, 'no_data', Date.now() - startTime);
      }

      return pricingData;
    } catch (error) {
      this.errorCount++;
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
      
      const response = await fetch(url, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`eBay API error: ${response.status}`);
      }

      const data: EbayResponse = await response.json();
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

    return {
      averagePrice: Math.round(averagePrice * 100) / 100,
      conditionPricing,
      confidence,
      confidenceScore,
      totalSales: sales.length,
      dateRange,
      lastUpdated: new Date().toISOString()
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
      return cached.data;
    }
    if (cached) {
      this.cache.delete(isbn);
    }
    return null;
  }

  private setCachedData(isbn: string, data: PricingData): void {
    this.cache.set(isbn, {
      data,
      expires: Date.now() + this.config.cacheDurationMs
    });
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