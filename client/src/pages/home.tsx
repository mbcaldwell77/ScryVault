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
    <div className="flex-1 flex flex-col pb-24 min-h-screen">
      {/* Premium Header */}
      <div className="p-6" style={{ background: 'linear-gradient(135deg, var(--emerald-primary) 0%, var(--forest-secondary) 100%)' }}>
        <h1 className="text-2xl font-semibold text-white">ScryVault</h1>
        <p className="text-white/80">Professional Book Inventory Management</p>
      </div>

      {/* Dashboard */}
      <div className="p-6 space-y-6" style={{ backgroundColor: 'var(--pure-white)' }}>
        {/* Premium Stats */}
        {totalBooks > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="premium-card">
              <div className="text-2xl font-bold text-emerald-primary">{totalBooks}</div>
              <div className="text-sm text-sage-accent">Books</div>
            </div>
            <div className="premium-card">
              <div className="text-2xl font-bold value-highlight">${totalInvestment.toFixed(2)}</div>
              <div className="text-sm text-sage-accent">Investment</div>
            </div>
          </div>
        )}

        {/* Premium Profit Overview */}
        {totalBooks > 0 && totalEstimatedValue > totalInvestment && (
          <div className="premium-card">
            <h3 className="font-semibold mb-3 text-emerald-primary">Profit Overview</h3>
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="font-semibold text-charcoal">${totalInvestment.toFixed(2)}</div>
                <div className="text-sage-accent">Invested</div>
              </div>
              <div>
                <div className="font-semibold text-forest-secondary">${totalEstimatedValue.toFixed(2)}</div>
                <div className="text-sage-accent">Est. Value</div>
              </div>
              <div>
                <div className="font-semibold profit-positive">+${potentialProfit.toFixed(2)}</div>
                <div className="text-sage-accent">{profitMargin.toFixed(1)}% Profit</div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Actions */}
        <div className="space-y-3">
          <Button 
            onClick={() => setLocation("/scanner")} 
            className="btn-primary w-full h-14 text-lg"
            size="lg"
          >
            <Camera className="w-5 h-5 mr-2" />
            Scan Book
          </Button>
          
          <Button 
            onClick={() => setLocation("/inventory")} 
            className="btn-secondary w-full h-14 text-lg"
            variant="outline"
            size="lg"
          >
            <Package className="w-5 h-5 mr-2" />
            View Inventory ({totalBooks})
          </Button>
        </div>

        {/* Premium Empty State */}
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
