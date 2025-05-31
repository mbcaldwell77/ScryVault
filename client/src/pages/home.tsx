import { Button } from "@/components/ui/button";
import { Camera, List, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const [, setLocation] = useLocation();
  
  const { data: books = [] } = useQuery({
    queryKey: ["/api/books"],
  });

  const totalBooks = books.length;
  const totalValue = books.reduce((sum: number, book: any) => sum + parseFloat(book.purchasePrice || 0), 0);

  return (
    <div className="flex-1 flex flex-col pb-24 min-h-screen">
      {/* Header */}
      <div className="bg-primary text-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">ScryVault</h1>
        <p className="text-blue-100 text-sm">ISBN Scanner for Book Resellers</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <BarChart3 className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Start Scanning</h2>
          <p className="text-slate-600 text-center max-w-sm">
            Scan ISBN barcodes to quickly add books to your inventory and track your purchases.
          </p>
        </div>

        <div className="space-y-4 w-full max-w-sm">
          <Button 
            onClick={() => setLocation("/scanner")} 
            className="w-full bg-primary text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:bg-blue-700 transition-colors"
            size="lg"
          >
            <Camera className="w-6 h-6 mr-2" />
            Scan Book
          </Button>
          
          <Button 
            onClick={() => setLocation("/inventory")} 
            variant="outline"
            className="w-full border-2 border-slate-200 text-slate-700 py-3 px-6 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            size="lg"
          >
            <List className="w-5 h-5 mr-2" />
            View Inventory
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 bg-slate-50 border-t">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-slate-900">{totalBooks}</div>
            <div className="text-sm text-slate-600">Books Scanned</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">${totalValue.toFixed(2)}</div>
            <div className="text-sm text-slate-600">Total Investment</div>
          </div>
        </div>
      </div>
    </div>
  );
}
