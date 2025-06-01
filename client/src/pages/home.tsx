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
      {/* Clean Header */}
      <div className="bg-primary text-primary-foreground p-6">
        <h1 className="text-2xl font-semibold">ScryVault</h1>
        <p className="text-primary-foreground/80">Book Inventory Management</p>
      </div>

      {/* Dashboard */}
      <div className="p-6 space-y-6">
        {/* Stats */}
        {totalBooks > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border rounded-lg p-4">
              <div className="text-2xl font-bold">{totalBooks}</div>
              <div className="text-sm text-muted-foreground">Books</div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">${totalInvestment.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Investment</div>
            </div>
          </div>
        )}

        {/* Profit Overview */}
        {totalBooks > 0 && totalEstimatedValue > totalInvestment && (
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Profit Overview</h3>
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="font-semibold">${totalInvestment.toFixed(2)}</div>
                <div className="text-muted-foreground">Invested</div>
              </div>
              <div>
                <div className="font-semibold text-blue-600">${totalEstimatedValue.toFixed(2)}</div>
                <div className="text-muted-foreground">Est. Value</div>
              </div>
              <div>
                <div className="font-semibold text-green-600">+${potentialProfit.toFixed(2)}</div>
                <div className="text-muted-foreground">{profitMargin.toFixed(1)}% Profit</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            onClick={() => setLocation("/scanner")} 
            className="w-full h-14 text-lg"
            size="lg"
          >
            <Camera className="w-5 h-5 mr-2" />
            Scan Book
          </Button>
          
          <Button 
            onClick={() => setLocation("/inventory")} 
            variant="outline"
            className="w-full h-14 text-lg"
            size="lg"
          >
            <Package className="w-5 h-5 mr-2" />
            View Inventory ({totalBooks})
          </Button>
        </div>

        {/* Empty State */}
        {totalBooks === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Start Your Inventory</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Scan your first book to begin tracking your collection and profits.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
