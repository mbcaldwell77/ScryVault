import { TrendingUp, Clock, AlertCircle } from "lucide-react";
import { usePricingData, getConfidenceDisplay, getBestConditionMatch } from "@/hooks/use-pricing";
import { Skeleton } from "@/components/ui/skeleton";

interface LivePricingDisplayProps {
  isbn: string;
  condition: string;
  purchasePrice: string;
  compact?: boolean;
}

export default function LivePricingDisplay({ 
  isbn, 
  condition, 
  purchasePrice, 
  compact = false 
}: LivePricingDisplayProps) {
  const { data: pricingData, isLoading, error } = usePricingData(isbn);
  
  if (isLoading && !compact) {
    return (
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  if (error || !pricingData) {
    if (compact) return null;
    
    return (
      <div className="flex items-center space-x-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <AlertCircle className="w-3 h-3" />
        <span>Market data unavailable</span>
      </div>
    );
  }

  // Type guard to ensure pricingData has required properties
  if (!pricingData || typeof pricingData !== 'object' || !('averagePrice' in pricingData)) {
    if (compact) return null;
    return (
      <div className="flex items-center space-x-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <AlertCircle className="w-3 h-3" />
        <span>Invalid pricing data</span>
      </div>
    );
  }

  const bestMatch = getBestConditionMatch(pricingData, condition);
  const marketPrice = bestMatch?.price || pricingData.averagePrice;
  const purchasePriceNum = parseFloat(purchasePrice || '0');
  const potentialProfit = marketPrice - purchasePriceNum;
  const confidenceInfo = getConfidenceDisplay(pricingData.confidence);

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <TrendingUp className="w-3 h-3 text-green-600" />
          <span className="text-sm font-medium text-green-600">
            ${marketPrice.toFixed(2)}
          </span>
        </div>
        {potentialProfit > 0 && (
          <span className="text-xs text-green-600">
            (+${potentialProfit.toFixed(2)})
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium" style={{ color: 'var(--text-light)' }}>
            Market Value: ${marketPrice.toFixed(2)}
          </span>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs ${confidenceInfo.bgColor} ${confidenceInfo.color}`}>
          {confidenceInfo.label}
        </div>
      </div>
      
      {bestMatch && bestMatch.confidence !== 'exact match' && (
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Based on {bestMatch.confidence} condition pricing
        </div>
      )}
      
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: 'var(--text-secondary)' }}>
          {pricingData.totalSales} sales found
        </span>
        <div className="flex items-center space-x-1" style={{ color: 'var(--text-secondary)' }}>
          <Clock className="w-3 h-3" />
          <span>Updated {new Date(pricingData.lastUpdated).toLocaleDateString()}</span>
        </div>
      </div>
      
      {potentialProfit !== 0 && (
        <div className={`text-sm font-medium ${potentialProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {potentialProfit > 0 ? 'Potential Profit' : 'Potential Loss'}: 
          ${Math.abs(potentialProfit).toFixed(2)}
        </div>
      )}
    </div>
  );
}