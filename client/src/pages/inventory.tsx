import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Package, ChevronDown, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function Inventory() {
  const [, setLocation] = useLocation();
  const [expandedISBNs, setExpandedISBNs] = useState<Set<string>>(new Set());
  
  const { data: books = [], isLoading } = useQuery({
    queryKey: ["/api/books"],
  });

  // Group books by ISBN
  const groupedBooks = books.reduce((acc: any, book: any) => {
    if (!acc[book.isbn]) {
      acc[book.isbn] = [];
    }
    acc[book.isbn].push(book);
    return acc;
  }, {});

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

  const toggleISBN = (isbn: string) => {
    const newExpanded = new Set(expandedISBNs);
    if (newExpanded.has(isbn)) {
      newExpanded.delete(isbn);
    } else {
      newExpanded.add(isbn);
    }
    setExpandedISBNs(newExpanded);
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
    <div className="flex-1 flex flex-col pb-24 min-h-screen">
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

      {/* Grouped Inventory List */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-3">
          {Object.entries(groupedBooks).map(([isbn, isbnBooks]: [string, any]) => {
            const mainBook = isbnBooks[0]; // Use first book for main display
            const copyCount = isbnBooks.length;
            const isExpanded = expandedISBNs.has(isbn);
            
            return (
              <div key={isbn} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Main Book Display */}
                <div 
                  className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleISBN(isbn)}
                >
                  <div className="flex space-x-3">
                    <img 
                      src={mainBook.imageUrl || "/placeholder-book.svg"}
                      alt={`${mainBook.title} cover`}
                      className="w-12 h-18 object-cover rounded flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder-book.svg";
                      }}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-slate-900 text-sm leading-tight">
                          {mainBook.title}
                        </h3>
                        <div className="flex items-center space-x-2 ml-2">
                          {copyCount > 1 && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              {copyCount} copies
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600">
                        {mainBook.author} • {mainBook.year}
                      </p>
                      {copyCount === 1 ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-green-600 font-bold">
                              ${parseFloat(mainBook.purchasePrice).toFixed(2)}
                            </span>
                            <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">
                              {mainBook.condition}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            {mainBook.location || "Unknown location"} • {mainBook.type}
                          </p>
                          <p className="text-xs text-slate-400">
                            Added {formatDate(mainBook.dateAdded)}
                          </p>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-600">
                          Click to view {copyCount} copies
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Expanded Copies */}
                {isExpanded && copyCount > 1 && (
                  <div className="border-t border-slate-100 bg-slate-50">
                    <div className="p-3 space-y-3">
                      {isbnBooks.map((book: any, index: number) => (
                        <div key={book.id} className="bg-white rounded-lg p-3 border border-slate-200">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="text-xs font-medium text-slate-500">Copy {index + 1}</span>
                              {book.sku && (
                                <div className="text-xs text-slate-400 font-mono mt-1">
                                  SKU: {book.sku}
                                </div>
                              )}
                            </div>
                            <span className="text-green-600 font-bold text-sm">
                              ${parseFloat(book.purchasePrice).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">
                              {book.condition}
                            </span>
                            <span className="text-xs text-slate-600">{book.type}</span>
                          </div>
                          <p className="text-xs text-slate-600 mb-1">
                            {book.location || "Unknown location"}
                          </p>
                          <p className="text-xs text-slate-400">
                            Added {formatDate(book.dateAdded)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
