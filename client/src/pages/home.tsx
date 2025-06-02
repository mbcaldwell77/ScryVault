import { Button } from "@/components/ui/button";
import { Camera, Package, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const [, setLocation] = useLocation();
  
  const { data: books = [] } = useQuery({
    queryKey: ["/api/books"],
  });

  const totalBooks = (books as any[]).length;
  const totalInvestment = (books as any[]).reduce((sum: number, book: any) => sum + parseFloat(book.purchasePrice || 0), 0);
  const totalEstimatedValue = (books as any[]).reduce((sum: number, book: any) => sum + parseFloat(book.estimatedPrice || book.purchasePrice || 0), 0);
  const potentialProfit = totalEstimatedValue - totalInvestment;
  const profitMargin = totalInvestment > 0 ? (potentialProfit / totalInvestment) * 100 : 0;

  return (
    <div className="flex-1 flex flex-col pb-24 min-h-screen" style={{ backgroundColor: 'var(--dark-background)' }}>
      {/* Premium Header */}
      <div 
        className="p-8 relative overflow-hidden"
        style={{ 
          background: 'linear-gradient(135deg, #284139 0%, #556B2F 50%, #808F57 100%)',
          boxShadow: '0 8px 32px rgba(40, 65, 57, 0.4)'
        }}
      >
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.3) 0%, transparent 50%)`
          }}
        />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2">ScryVault</h1>
          <p className="text-white/90 text-lg">Professional Book Inventory Management</p>
          <div className="mt-4 flex items-center space-x-2">
            <div className="w-12 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full" />
            <div className="w-8 h-1 bg-gradient-to-r from-yellow-600 to-yellow-800 rounded-full" />
            <div className="w-4 h-1 bg-yellow-800 rounded-full" />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6" style={{ backgroundColor: 'var(--dark-background)' }}>
        {/* Premium Dashboard - Only show when books exist */}
        {totalBooks > 0 && (
          <div className="premium-dashboard">
            {/* 3-Column Stats Grid */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="mystical-number text-white">{totalBooks}</div>
                <div className="mystical-label mt-1">Collection</div>
              </div>
              <div className="text-center">
                <div className="mystical-number" style={{ color: '#e8eaed' }}>
                  ${totalInvestment.toFixed(0)}
                </div>
                <div className="mystical-label mt-1" style={{ color: '#9aa0a6' }}>Invested</div>
              </div>
              <div className="text-center">
                <div className="mystical-number" style={{ color: 'var(--emerald-primary)' }}>
                  ${totalEstimatedValue.toFixed(0)}
                </div>
                <div className="mystical-label mt-1" style={{ color: '#9aa0a6' }}>Est. Value</div>
              </div>
            </div>

            {/* Profit Row */}
            <div 
              className="pt-4 border-t text-center"
              style={{ borderColor: 'rgba(154, 160, 166, 0.3)' }}
            >
              <div className="flex items-center justify-center space-x-4">
                <TrendingUp className="w-5 h-5" style={{ color: '#9aa0a6' }} />
                <span className="text-lg font-bold" style={{ 
                  color: potentialProfit >= 0 ? 'var(--emerald-primary)' : '#FF6B6B' 
                }}>
                  ${potentialProfit.toFixed(2)} Profit ({profitMargin.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Premium Action Buttons */}
        <div className="grid grid-cols-1 gap-4">
          <Button 
            onClick={() => setLocation("/scanner")}
            className="mystical-button h-16 text-white text-lg font-semibold rounded-xl"
          >
            <Camera className="w-6 h-6 mr-3" />
            Scan Book
          </Button>
          
          <Button 
            onClick={() => setLocation("/inventory")}
            className="h-16 text-lg font-semibold rounded-xl border-2 transition-all duration-300 hover:scale-102"
            style={{
              background: 'linear-gradient(135deg, #2a2d30 0%, #1e2124 100%)',
              borderColor: '#9aa0a6',
              color: '#9aa0a6'
            }}
          >
            <Package className="w-6 h-6 mr-3" />
            View Inventory
          </Button>
        </div>

        {/* Mystical Empty State */}
        {totalBooks === 0 && (
          <div className="text-center py-16">
            <div className="mystical-orb mx-auto mb-8"></div>
            
            <h2 className="text-2xl font-bold text-white mb-4">
              Begin Your Mystical Journey
            </h2>
            
            <p className="text-lg mb-8 max-w-md mx-auto leading-relaxed" style={{ color: '#9aa0a6' }}>
              Unlock the hidden value within your books. Each scan reveals market insights 
              and profit potential through our intelligence platform.
            </p>

            <div className="space-y-3 text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--emerald-primary)' }}></div>
                <span>Real-time market analysis</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--emerald-primary)' }}></div>
                <span>Profit optimization insights</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--emerald-primary)' }}></div>
                <span>Professional inventory tracking</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}