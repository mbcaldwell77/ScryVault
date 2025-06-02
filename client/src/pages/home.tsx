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
     <div className="grid grid-cols-2 gap-4">
              <div 
                className="relative overflow-hidden rounded-xl p-6 border-2 transform transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #2d4a3f 100%)',
                  border: '2px solid #D4AF37',
                  boxShadow: '0 8px 32px rgba(212, 175, 55, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
              >
                <div className="text-4xl font-black mb-2 text-white">{totalBooks}</div>
                <div className="text-sm font-semibold tracking-wide" style={{ color: '#D4AF37' }}>RARE BOOKS</div>
                <div className="absolute top-2 right-2 w-12 h-12 rounded-full opacity-20" style={{ backgroundColor: '#D4AF37' }} />
              </div>
              <div 
                className="relative overflow-hidden rounded-xl p-6 border-2 transform transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #2d4a3f 100%)',
                  border: '2px solid #D4AF37',
                  boxShadow: '0 8px 32px rgba(212, 175, 55, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
              >
                <div className="text-4xl font-black mb-2" style={{ color: '#D4AF37' }}>${totalInvestment.toFixed(2)}</div>
                <div className="text-sm font-semibold tracking-wide" style={{ color: '#D4AF37' }}>INVESTED CAPITAL</div>
                <div className="absolute top-2 right-2 w-12 h-12 rounded-full opacity-20" style={{ backgroundColor: '#284139' }} />
              </div>
            </div>
        )}

        {/* Premium Profit Overview */}
        {totalBooks > 0 && totalEstimatedValue > totalInvestment && (
          <div className="premium-card">
            <h3 className="font-semibold mb-3" style={{ color: 'var(--emerald-accent)' }}>Profit Overview</h3>
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="font-semibold" style={{ color: 'var(--text-light)' }}>${totalInvestment.toFixed(2)}</div>
                <div style={{ color: 'var(--text-secondary)' }}>Invested</div>
              </div>
              <div>
                <div className="font-semibold" style={{ color: 'var(--gold-accent)' }}>${totalEstimatedValue.toFixed(2)}</div>
                <div style={{ color: 'var(--text-secondary)' }}>Est. Value</div>
              </div>
              <div>
                <div className="font-semibold" style={{ color: 'var(--emerald-accent)' }}>+${potentialProfit.toFixed(2)}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{profitMargin.toFixed(1)}% Profit</div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Actions */}
        <div className="space-y-3">
          <Button 
            onClick={() => setLocation("/scanner")} 
            className="w-full h-14 text-lg border-2"
            style={{ backgroundColor: '#10B981', borderColor: '#10B981', color: '#FFFFFF', fontWeight: '700', boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}
            size="lg"
            title="Start scanning books with your camera"
          >
            <Camera className="w-5 h-5 mr-2" />
            Scan Book
          </Button>
          
          <Button 
            onClick={() => setLocation("/inventory")} 
            className="w-full h-14 text-lg"
            style={{ backgroundColor: 'var(--dark-card)', borderColor: 'var(--dark-border)', color: 'var(--text-light)' }}
            variant="outline"
            size="lg"
            title={`View your collection of ${totalBooks} books`}
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
