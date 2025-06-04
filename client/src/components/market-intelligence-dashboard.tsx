import { TrendingUp, TrendingDown, Minus, Activity, DollarSign, Clock, Target, BarChart3 } from "lucide-react";
import { PricingData } from "@/hooks/use-pricing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MarketIntelligenceDashboardProps {
  pricingData: PricingData;
  purchasePrice?: number;
}

export default function MarketIntelligenceDashboard({ 
  pricingData, 
  purchasePrice = 0 
}: MarketIntelligenceDashboardProps) {
  const potentialProfit = pricingData.averagePrice - purchasePrice;
  const roi = purchasePrice > 0 ? ((potentialProfit / purchasePrice) * 100) : 0;

  const getTrendIcon = () => {
    switch (pricingData.trends.priceDirection) {
      case 'rising': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'falling': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getDemandColor = () => {
    switch (pricingData.marketVelocity.demandLevel) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-red-600 bg-red-50';
    }
  };

  const getConfidenceColor = () => {
    switch (pricingData.confidence) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-red-600 bg-red-50';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {/* Market Overview Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Market Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Average Price</span>
            <span className="font-semibold">${pricingData.averagePrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Sales</span>
            <span className="font-medium">{pricingData.totalSales}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Confidence</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor()}`}>
              {pricingData.confidence.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Score</span>
            <span className="font-medium">{pricingData.confidenceScore}/100</span>
          </div>
        </CardContent>
      </Card>

      {/* Market Velocity Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Market Velocity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Demand Level</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDemandColor()}`}>
              {pricingData.marketVelocity.demandLevel.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Sales/Week</span>
            <span className="font-medium">{pricingData.marketVelocity.salesPerWeek.toFixed(1)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Avg Time to Sell</span>
            <span className="font-medium">{pricingData.marketVelocity.timeToSell.toFixed(0)} days</span>
          </div>
        </CardContent>
      </Card>

      {/* Price Trends Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getTrendIcon()}
            Price Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Direction</span>
            <span className="font-medium">{pricingData.trends.priceDirection.toUpperCase()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Weekly Change</span>
            <span className={`font-medium ${pricingData.trends.weeklyChange > 0 ? 'text-green-600' : pricingData.trends.weeklyChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {pricingData.trends.weeklyChange > 0 ? '+' : ''}{pricingData.trends.weeklyChange.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Seasonality</span>
            <span className="font-medium capitalize">{pricingData.trends.seasonality}</span>
          </div>
        </CardContent>
      </Card>

      {/* Profit Analysis Card */}
      {purchasePrice > 0 && (
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Profit Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">Purchase Price</div>
                <div className="font-semibold">${purchasePrice.toFixed(2)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">Market Value</div>
                <div className="font-semibold">${pricingData.averagePrice.toFixed(2)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">Potential Profit</div>
                <div className={`font-semibold ${potentialProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${potentialProfit.toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">ROI</div>
                <div className={`font-semibold ${roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {roi.toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Recommended Listing Price</span>
                <span className="font-semibold text-blue-600">
                  ${pricingData.profitAnalysis.recommendedListingPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Condition Breakdown Card */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="w-4 h-4" />
            Condition-Based Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(pricingData.conditionPricing).map(([condition, data]) => (
              <div key={condition} className="border rounded-lg p-3">
                <div className="font-medium text-sm mb-2">{condition}</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Price:</span>
                    <span className="font-medium">${data.averagePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sales:</span>
                    <span className="font-medium">{data.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Range:</span>
                    <span className="font-medium">${data.priceRange.min.toFixed(2)} - ${data.priceRange.max.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Quality Card */}
      <Card className="md:col-span-1 lg:col-span-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Data Quality & Freshness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-600 mb-1">Date Range</div>
              <div className="font-medium text-xs">
                {new Date(pricingData.dateRange.from).toLocaleDateString()} - {new Date(pricingData.dateRange.to).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Last Updated</div>
              <div className="font-medium text-xs">
                {new Date(pricingData.lastUpdated).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Confidence Score</div>
              <div className="font-medium">{pricingData.confidenceScore}/100</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Data Source</div>
              <div className="font-medium text-xs">eBay Completed Listings</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}