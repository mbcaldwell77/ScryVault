import { TrendingUp, Clock, AlertCircle, TrendingDown, Minus, Activity, DollarSign } from "lucide-react";
import { usePricingData, getConfidenceDisplay, getBestConditionMatch, PricingData } from "@/hooks/use-pricing";
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
  if (!pricingData || typeof pricingData !== 'object' || !('averagePrice' in pricingData) || !('confidence' in pricingData)) {
    if (compact) return null;
    return (
      <div className="flex items-center space-x-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <AlertCircle className="w-3 h-3" />
        <span>Invalid pricing data</span>
      </div>
    );
  }

  // Cast to PricingData type after validation
  const typedPricingData = pricingData as PricingData;

  const bestMatch = getBestConditionMatch(typedPricingData, condition);
  const marketPrice = bestMatch?.price || typedPricingData.averagePrice;
  const purchasePriceNum = parseFloat(purchasePrice || '0');
  const potentialProfit = marketPrice - purchasePriceNum;
  const confidenceInfo = getConfidenceDisplay(typedPricingData.confidence);

  // Enhanced profit analysis with purchase price
  const roi = purchasePriceNum > 0 ? ((potentialProfit / purchasePriceNum) * 100) : 0;
  const profitMargin = marketPrice > 0 ? ((potentialProfit / marketPrice) * 100) : 0;

  // Trend icon and color
  const getTrendIcon = () => {
    if (!typedPricingData.trends) return <Minus className="w-3 h-3" />;
    switch (typedPricingData.trends.priceDirection) {
      case 'rising': return <TrendingUp className="w-3 h-3 text-green-600" />;
      case 'falling': return <TrendingDown className="w-3 h-3 text-red-600" />;
      default: return <Minus className="w-3 h-3 text-gray-500" />;
    }
  };

  const getDemandColor = () => {
    if (!typedPricingData.marketVelocity) return 'text-gray-500';
    switch (typedPricingData.marketVelocity.demandLevel) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-red-600';
    }
  };

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
          {typedPricingData.totalSales} sales found
        </span>
        <div className="flex items-center space-x-1" style={{ color: 'var(--text-secondary)' }}>
          <Clock className="w-3 h-3" />
          <span>Updated {new Date(typedPricingData.lastUpdated).toLocaleDateString()}</span>
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