import { Button } from "@/components/ui/button";
import { Camera, Package, Eye, Sparkles, TrendingUp } from "lucide-react";
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
    <div className="flex-1 flex flex-col pb-24 min-h-screen bg-background">
      {/* Premium Header with Emerald Gradient */}
      <div className="relative overflow-hidden">
        <div 
          className="bg-gradient-to-br from-primary via-secondary to-primary text-primary-foreground p-6 pb-8"
          style={{ background: 'linear-gradient(135deg, var(--emerald-primary) 0%, var(--forest-secondary) 50%, var(--emerald-primary) 100%)' }}
        >
          {/* Gold shimmer overlay */}
          <div className="absolute inset-0 gold-shimmer opacity-20"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="w-8 h-8 emerald-pulse" />
              <h1 className="text-3xl font-bold tracking-wide premium-heading text-white">ScryVault</h1>
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <p className="text-white/90 text-lg font-medium">Professional Inventory Oracle</p>
          </div>
        </div>
      </div>

      {/* Premium Dashboard Cards */}
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="premium-card rounded-lg p-4 premium-fade-in">
            <div className="text-3xl font-bold premium-heading">{totalBooks}</div>
            <div className="premium-caption">Tomes Collected</div>
            <Package className="w-5 h-5 text-muted-foreground mt-2" />
          </div>
          <div className="premium-card rounded-lg p-4 premium-fade-in">
            <div className="text-3xl font-bold gold-accent">${totalInvestment.toFixed(2)}</div>
            <div className="premium-caption">Investment</div>
            <TrendingUp className="w-5 h-5 text-accent mt-2" />
          </div>
        </div>

        {/* Profit Overview Card */}
        {totalBooks > 0 && (
          <div className="premium-card rounded-lg p-6 premium-fade-in">
            <h3 className="premium-subheading text-lg mb-4">Portfolio Overview</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold premium-body">${totalInvestment.toFixed(2)}</div>
                <div className="premium-caption text-xs">Invested</div>
              </div>
              <div>
                <div className="text-xl font-bold gold-accent">${totalEstimatedValue.toFixed(2)}</div>
                <div className="premium-caption text-xs">Est. Value</div>
              </div>
              <div>
                <div className={`text-xl font-bold ${potentialProfit >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                  ${potentialProfit.toFixed(2)}
                </div>
                <div className="premium-caption text-xs">{profitMargin.toFixed(1)}% Profit</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button 
            onClick={() => setLocation("/scanner")} 
            className="w-full h-16 text-lg emerald-button rounded-lg font-semibold shadow-lg"
            size="lg"
          >
            <Eye className="w-6 h-6 mr-3" />
            <div className="text-left">
              <div>Scry New Tome</div>
              <div className="text-sm opacity-90 font-normal">Reveal hidden knowledge</div>
            </div>
          </Button>
          
          <Button 
            onClick={() => setLocation("/inventory")} 
            variant="outline"
            className="w-full h-16 text-lg border-2 border-border hover:border-primary hover:bg-muted rounded-lg font-semibold"
            size="lg"
          >
            <Package className="w-6 h-6 mr-3 text-primary" />
            <div className="text-left">
              <div className="premium-subheading">Collection Archive</div>
              <div className="premium-caption font-normal">Browse your tomes</div>
            </div>
          </Button>
        </div>

        {/* Welcome Message for Empty State */}
        {totalBooks === 0 && (
          <div className="premium-card rounded-lg p-8 text-center premium-fade-in">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-primary" />
            </div>
            <h3 className="premium-subheading text-xl mb-2">Welcome to ScryVault</h3>
            <p className="premium-body mb-6 max-w-sm mx-auto">
              Begin your mystical journey by scanning your first tome. 
              The oracle awaits to reveal the hidden value within your collection.
            </p>
            <Button 
              onClick={() => setLocation("/scanner")} 
              className="emerald-button px-6 py-3 rounded-lg font-semibold"
            >
              <Eye className="w-5 h-5 mr-2" />
              Begin Scrying
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
