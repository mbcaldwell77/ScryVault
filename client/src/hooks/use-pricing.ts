import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { InventoryBook } from "@/types";

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
    timeToSell: number;
    demandLevel: 'high' | 'medium' | 'low';
  };
  profitAnalysis: {
    recommendedListingPrice: number;
    expectedProfit: number;
    profitMargin: number;
    roi: number;
  };
  trends: {
    priceDirection: 'rising' | 'falling' | 'stable';
    weeklyChange: number;
    seasonality: string;
  };
}

export function usePricingData(isbn: string, enabled = true) {
  return useQuery<PricingData>({
    queryKey: [`/api/book-pricing/${isbn}`],
    enabled: enabled && !!isbn,
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export interface UpdatePricingResponse {
  book: InventoryBook;
  pricingData: PricingData;
}

export function useUpdateBookPricing() {
  const queryClient = useQueryClient();

  return useMutation<UpdatePricingResponse | null, Error, number>({
    mutationFn: async (bookId: number) => {
      return await apiRequest<UpdatePricingResponse>(`/api/books/${bookId}/pricing`, {
        method: "PUT",
      });
    },
    onSuccess: (data, bookId) => {
      if (!data) return;
      // Invalidate and refetch book data
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      queryClient.invalidateQueries({ queryKey: ['/api/books', bookId] });
      
      // Update pricing cache with new data
      if (data.pricingData && data.book) {
        queryClient.setQueryData(
          ['/api/book-pricing', data.book.isbn], 
          data.pricingData
        );
      }
    },
  });
}

export function usePricingMetrics() {
  return useQuery({
    queryKey: ['/api/pricing/metrics'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

// Helper function to get confidence color and icon
export function getConfidenceDisplay(confidence: PricingData['confidence']) {
  switch (confidence) {
    case 'high':
      return { 
        color: 'text-green-600', 
        bgColor: 'bg-green-100', 
        label: 'High Confidence',
        description: 'Based on many recent sales'
      };
    case 'medium':
      return { 
        color: 'text-yellow-600', 
        bgColor: 'bg-yellow-100', 
        label: 'Medium Confidence',
        description: 'Limited recent sales data'
      };
    case 'low':
      return { 
        color: 'text-red-600', 
        bgColor: 'bg-red-100', 
        label: 'Low Confidence',
        description: 'Very few sales found'
      };
  }
}

// Helper function to format price range
export function formatPriceRange(min: number, max: number): string {
  if (min === max) {
    return `$${min.toFixed(2)}`;
  }
  return `$${min.toFixed(2)} - $${max.toFixed(2)}`;
}

// Helper function to get the best condition pricing match
export function getBestConditionMatch(
  pricingData: PricingData, 
  userCondition: string
): { price: number; confidence: string } | null {
  const conditionHierarchy = ['New', 'Like New', 'Very Good', 'Good', 'Acceptable'];
  const userConditionIndex = conditionHierarchy.indexOf(userCondition);
  
  // Try to find exact match first
  if (pricingData.conditionPricing[userCondition]) {
    return {
      price: pricingData.conditionPricing[userCondition].averagePrice,
      confidence: 'exact match'
    };
  }
  
  // Find closest condition with data
  for (let i = 0; i < conditionHierarchy.length; i++) {
    const condition = conditionHierarchy[i];
    if (pricingData.conditionPricing[condition]) {
      const difference = Math.abs(i - userConditionIndex);
      let confidence = 'approximate';
      
      if (difference <= 1) confidence = 'close match';
      else if (difference >= 3) confidence = 'rough estimate';
      
      return {
        price: pricingData.conditionPricing[condition].averagePrice,
        confidence
      };
    }
  }
  
  // Fallback to average price
  return {
    price: pricingData.averagePrice,
    confidence: 'general average'
  };
}