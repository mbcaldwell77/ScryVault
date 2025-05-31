import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Package } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function Inventory() {
  const [, setLocation] = useLocation();
  
  const { data: books = [], isLoading } = useQuery({
    queryKey: ["/api/books"],
  });

  const totalBooks = books.length;
  const totalCOGS = books
    .filter((book: any) => book.type === "COGS")
    .reduce((sum: number, book: any) => sum + parseFloat(book.purchasePrice || 0), 0);
  const totalExpense = books
    .filter((book: any) => book.type === "Expense")
    .reduce((sum: number, book: any) => sum + parseFloat(book.purchasePrice || 0), 0);
  const avgPrice = totalBooks > 0 ? (totalCOGS + totalExpense) / totalBooks : 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col pb-20">
        {/* Header */}
        <div className="bg-primary text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/")}
              className="text-white hover:bg-blue-600"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-semibold">Inventory</h1>
          </div>
          <Skeleton className="h-6 w-8 bg-blue-400" />
        </div>

        {/* Loading Skeletons */}
        <div className="p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (totalBooks === 0) {
    return (
      <div className="flex-1 flex flex-col pb-20">
        {/* Header */}
        <div className="bg-primary text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/")}
              className="text-white hover:bg-blue-600"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-semibold">Inventory</h1>
          </div>
          <span className="bg-blue-400 text-white px-3 py-1 rounded-full text-sm font-medium">0</span>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">No books yet</h3>
              <p className="text-slate-600 text-sm">Start scanning to build your inventory</p>
            </div>
            <Button 
              onClick={() => setLocation("/scanner")} 
              className="bg-primary text-white"
            >
              <Camera className="w-4 h-4 mr-2" />
              Scan First Book
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-20">
      {/* Header */}
      <div className="bg-primary text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation("/")}
            className="text-white hover:bg-blue-600"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-semibold">Inventory</h1>
        </div>
        <span className="bg-blue-400 text-white px-3 py-1 rounded-full text-sm font-medium">
          {totalBooks}
        </span>
      </div>

      {/* Summary Stats */}
      <div className="p-4 bg-blue-50 border-b">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-slate-900">${totalCOGS.toFixed(2)}</div>
            <div className="text-xs text-slate-600">Total COGS</div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">${totalExpense.toFixed(2)}</div>
            <div className="text-xs text-slate-600">Expenses</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">${avgPrice.toFixed(2)}</div>
            <div className="text-xs text-slate-600">Avg. Price</div>
          </div>
        </div>
      </div>

      {/* Inventory List */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-3">
          {books.map((book: any) => (
            <div key={book.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <div className="flex space-x-3">
                <img 
                  src={book.imageUrl || "/placeholder-book.svg"}
                  alt={`${book.title} cover`}
                  className="w-12 h-18 object-cover rounded flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder-book.svg";
                  }}
                />
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold text-slate-900 text-sm leading-tight">
                    {book.title}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {book.author} • {book.year}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-green-600 font-bold">
                      ${parseFloat(book.purchasePrice).toFixed(2)}
                    </span>
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">
                      {book.condition}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {book.location || "Unknown location"} • {book.type}
                  </p>
                  <p className="text-xs text-slate-400">
                    Added {formatDate(book.dateAdded)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
