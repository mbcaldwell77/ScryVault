import { Button } from "@/components/ui/button";
import { Camera, Package, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const [, setLocation] = useLocation();
  
  const { data: books = [] } = useQuery({
    queryKey: ["/api/books"],
  });

  const totalBooks = books.length;
  const totalInvestment = books.reduce((sum: number, book: any) => sum + parseFloat(book.purchasePrice || 0), 0);
  const totalEstimatedValue = books.reduce((sum: number, book: any) => sum + parseFloat(book.estimatedPrice || book.purchasePrice || 0), 0);
  const potentialProfit = totalEstimatedValue - totalInvestment;
  const profitMargin = totalInvestment > 0 ? (potentialProfit / totalInvestment) * 100 : 0;

  return (
    <div className="flex-1 flex flex-col pb-24 min-h-screen" style={{ backgroundColor: 'var(--dark-background)' }}>
      {/* New Premium Header */}
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

      {/* Dashboard */}
      <div className="p-6 space-y-6" style={{ backgroundColor: 'var(--dark-background)' }}>
        {/* Premium Stats */}
        {totalBooks > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="premium-card">
              <div className="text-2xl font-bold" style={{ color: 'var(--emerald-accent)' }}>{totalBooks}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Books</div>
            </div>
            <div className="premium-card">
              <div className="text-2xl font-bold" style={{ color: 'var(--gold-accent)' }}>${totalInvestment.toFixed(2)}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Investment</div>
            </div>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            onClick={() => setLocation("/scanner")}
            className="aspect-square flex flex-col items-center justify-center space-y-3 bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white border-0 rounded-xl h-auto py-6"
          >
            <Camera className="w-8 h-8" />
            <span className="text-sm font-medium">Scan Book</span>
          </Button>
          
          <Button 
            onClick={() => setLocation("/inventory")}
            className="aspect-square flex flex-col items-center justify-center space-y-3 bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white border-0 rounded-xl h-auto py-6"
          >
            <Package className="w-8 h-8" />
            <span className="text-sm font-medium">View Inventory</span>
          </Button>
        </div>

        {/* Business Metrics */}
        {totalBooks > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-light)' }}>Business Overview</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="premium-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Collection Value</div>
                    <div className="text-xl font-bold" style={{ color: 'var(--emerald-accent)' }}>
                      ${totalEstimatedValue.toFixed(2)}
                    </div>
                  </div>
                  <TrendingUp className="w-6 h-6" style={{ color: 'var(--emerald-accent)' }} />
                </div>
                
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--dark-border)' }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>Potential Profit:</span>
                    <span style={{ color: potentialProfit >= 0 ? 'var(--emerald-accent)' : 'var(--muted-coral)' }}>
                      ${potentialProfit.toFixed(2)} ({profitMargin.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {totalBooks === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--platinum-silver)' }}>
              <Camera className="w-8 h-8 text-sage-accent" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-emerald-primary">Start Your Inventory</h3>
            <p className="text-sage-accent mb-6 max-w-sm mx-auto">
              Scan your first book to begin tracking your collection and profits.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}