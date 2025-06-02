import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Package, ChevronDown, ChevronRight, Download, Search, Upload, RefreshCw, Edit, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import EditBookDialog from "@/components/edit-book-dialog";
import DeleteBookDialog from "@/components/delete-book-dialog";

export default function Inventory() {
  const [, setLocation] = useLocation();
  const [expandedISBNs, setExpandedISBNs] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [editingBook, setEditingBook] = useState<any>(null);
  const [deletingBook, setDeletingBook] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: books = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/books"],
  });

  // Pull to refresh functionality
  const pullToRefresh = usePullToRefresh({
    onRefresh: async () => {
      await refetch();
      toast({
        title: "Inventory Updated",
        description: "Your collection has been refreshed"
      });
    },
    threshold: 80
  });

  // Filter books based on search term
  const filteredBooks = books.filter((book: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      book.title?.toLowerCase().includes(search) ||
      book.author?.toLowerCase().includes(search) ||
      book.isbn?.includes(search) ||
      book.condition?.toLowerCase().includes(search) ||
      book.location?.toLowerCase().includes(search) ||
      book.sku?.toLowerCase().includes(search)
    );
  });

  // Group filtered books by ISBN
  const groupedBooks = filteredBooks.reduce((acc: any, book: any) => {
    if (!acc[book.isbn]) {
      acc[book.isbn] = [];
    }
    acc[book.isbn].push(book);
    return acc;
  }, {});

  const totalBooks = books.length;
  const totalInvestment = books
    .reduce((sum: number, book: any) => sum + parseFloat(book.purchasePrice || 0), 0);
  const totalEstimatedValue = books
    .reduce((sum: number, book: any) => sum + parseFloat(book.estimatedPrice || book.purchasePrice || 0), 0);
  const potentialProfit = totalEstimatedValue - totalInvestment;
  const profitMargin = totalInvestment > 0 ? (potentialProfit / totalInvestment) * 100 : 0;

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

  const exportToCSV = () => {
    const headers = [
      'SKU',
      'ISBN',
      'Title',
      'Author',
      'Publisher',
      'Year',
      'Condition',
      'Purchase Price',
      'Location',
      'Type',
      'Date Added'
    ];

    const csvData = books.map((book: any) => [
      book.sku || '',
      book.isbn || '',
      book.title || '',
      book.author || '',
      book.publisher || '',
      book.year || '',
      book.condition || '',
      book.purchasePrice || '',
      book.location || '',
      book.type || '',
      formatDate(book.dateAdded)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        // Here you would typically send this data to your backend
        // For now, we'll just show a message
        toast({
          title: "Import Ready",
          description: `Found ${jsonData.length} items to import. Feature coming soon!`,
        });
        
        console.log("Import data:", jsonData);
      } catch (error) {
        toast({
          title: "Import Error",
          description: "Invalid JSON file format",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  const exportToJSON = () => {
    const jsonData = JSON.stringify(books, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory-backup-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col pb-20" style={{ backgroundColor: 'var(--pure-white)' }}>
        {/* Header */}
        <div style={{ backgroundColor: 'var(--emerald-primary)' }} className="text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/")}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-semibold">Inventory</h1>
          </div>
          <Skeleton className="h-6 w-8" style={{ backgroundColor: 'var(--dark-surface)' }} />
        </div>

        {/* Loading Skeletons */}
        <div className="p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" style={{ backgroundColor: 'var(--dark-card)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (totalBooks === 0) {
    return (
      <div className="flex-1 flex flex-col pb-20" style={{ backgroundColor: 'var(--pure-white)' }}>
        {/* Header */}
        <div style={{ backgroundColor: 'var(--emerald-primary)' }} className="text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/")}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-semibold">Inventory</h1>
          </div>
          <span style={{ backgroundColor: 'var(--gold-accent)' }} className="text-black px-3 py-1 rounded-full text-sm font-medium">0</span>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: 'var(--dark-card)' }}>
              <Package className="w-8 h-8" style={{ color: 'var(--gold-accent)' }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-light)' }}>No books yet</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Start scanning to build your inventory</p>
            </div>
            <Button 
              onClick={() => setLocation("/scanner")} 
              style={{ backgroundColor: 'var(--emerald-primary)' }}
              className="text-white hover:opacity-90"
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
    <div 
      className="flex-1 flex flex-col pb-24 min-h-screen relative"
      style={{ backgroundColor: 'var(--pure-white)' }}
      onTouchStart={pullToRefresh.onTouchStart}
      onTouchMove={pullToRefresh.onTouchMove}
      onTouchEnd={pullToRefresh.onTouchEnd}
    >
      {/* Pull to refresh indicator */}
      {pullToRefresh.isPulling && (
        <div 
          className="fixed top-0 left-0 right-0 z-40 text-white text-center py-2 transition-transform duration-200"
          style={{
            backgroundColor: 'var(--emerald-primary)',
            transform: `translateY(${Math.min(pullToRefresh.pullDistance - 60, 0)}px)`
          }}
        >
          <RefreshCw 
            className={`w-5 h-5 mx-auto ${pullToRefresh.isRefreshing ? 'animate-spin' : ''}`}
          />
          <div className="text-sm mt-1">
            {pullToRefresh.isRefreshing ? 'Refreshing...' : 
             pullToRefresh.pullDistance >= pullToRefresh.threshold ? 'Release to refresh' : 'Pull to refresh'}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ backgroundColor: 'var(--emerald-primary)' }} className="text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/")}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-semibold">Inventory</h1>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
              id="import-file"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => document.getElementById('import-file')?.click()}
              className="text-white hover:bg-white/20"
              title="Import backup"
            >
              <Upload className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={exportToJSON}
              className="text-white hover:bg-white/20"
              title="Backup data"
            >
              <Package className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={exportToCSV}
              className="text-white hover:bg-white/20"
              title="Export CSV"
            >
              <Download className="w-5 h-5" />
            </Button>
            <span style={{ backgroundColor: 'var(--gold-accent)' }} className="text-black px-3 py-1 rounded-full text-sm font-medium">
              {totalBooks}
            </span>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          <Input
            placeholder="Search books, authors, ISBN, SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            style={{ 
              backgroundColor: 'var(--dark-card)', 
              border: '1px solid var(--dark-border)', 
              color: 'var(--text-light)',
              '::placeholder': { color: 'var(--text-secondary)' }
            }}
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="p-4 border-b" style={{ backgroundColor: 'var(--dark-surface)', borderColor: 'var(--dark-border)' }}>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-light)' }}>${totalInvestment.toFixed(2)}</div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total Investment</div>
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: 'var(--gold-accent)' }}>${totalEstimatedValue.toFixed(2)}</div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Est. Value</div>
          </div>
          <div>
            <div className={`text-lg font-bold`} style={{ color: potentialProfit >= 0 ? 'var(--gold-accent)' : '#ef4444' }}>
              ${potentialProfit.toFixed(2)}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Profit ({profitMargin.toFixed(1)}%)
            </div>
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
              <div key={isbn} className="rounded-xl shadow-sm border overflow-hidden premium-card">
                {/* Main Book Display */}
                <div 
                  className="p-4 cursor-pointer transition-colors"
                  style={{ backgroundColor: 'var(--dark-card)' }}
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
                    <div className="flex-1 space-y-2">
                      {/* Title - Most prominent */}
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-base leading-tight" style={{ color: 'var(--text-light)' }}>
                          {mainBook.title}
                        </h3>
                        <div className="flex items-center space-x-2 ml-2">
                          {copyCount === 1 && (
                            <span className="px-3 py-1 rounded-md text-sm font-medium" style={{ backgroundColor: 'var(--dark-surface)', color: 'var(--text-secondary)' }}>
                              {mainBook.condition}
                            </span>
                          )}
                          {copyCount > 1 && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--emerald-accent)', color: 'var(--pure-white)' }}>
                              {copyCount} copies
                            </span>
                          )}
                          {copyCount > 1 && (
                            isExpanded ? (
                              <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                            ) : (
                              <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                            )
                          )}
                        </div>
                      </div>
                      
                      {/* Publisher and Format - Secondary info */}
                      {mainBook.publisher && (
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {mainBook.publisher} • {mainBook.format || "Other"}
                        </p>
                      )}
                      
                      {/* ISBN - Important for identification */}
                      <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        ISBN: {mainBook.isbn}
                      </p>
                      
                      {/* Author and Year - Supporting details */}
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {mainBook.author} • {mainBook.year || "Unknown"}
                      </p>
                      
                      {copyCount === 1 ? (
                        <div className="border-t border-slate-200 pt-3 mt-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-green-600 font-bold text-sm">
                                ${parseFloat(mainBook.purchasePrice || 0).toFixed(2)}
                              </span>
                              {mainBook.estimatedPrice && (
                                <span className="text-xs text-slate-500">
                                  Est: ${parseFloat(mainBook.estimatedPrice).toFixed(2)}
                                  {parseFloat(mainBook.estimatedPrice) > parseFloat(mainBook.purchasePrice || 0) && (
                                    <span className="text-green-600 ml-1">
                                      (+${(parseFloat(mainBook.estimatedPrice) - parseFloat(mainBook.purchasePrice || 0)).toFixed(2)})
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingBook(mainBook);
                                }}
                                className="h-7 px-2 text-xs hover:bg-blue-50"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingBook(mainBook);
                                }}
                                className="h-7 px-2 text-xs hover:bg-red-50 text-red-600 border-red-200"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            SKU: {mainBook.sku}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-600 mt-2">
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
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <span className="text-xs font-medium text-slate-500">Copy {index + 1}</span>
                              <span className="text-green-600 font-bold text-sm">
                                ${parseFloat(book.purchasePrice || 0).toFixed(2)}
                              </span>
                              {book.estimatedPrice && (
                                <span className="text-xs text-slate-500">
                                  Est: ${parseFloat(book.estimatedPrice).toFixed(2)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="bg-slate-100 px-3 py-1 rounded-md text-sm font-medium">
                                {book.condition}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingBook(book)}
                                className="h-7 px-2 text-xs hover:bg-blue-50"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeletingBook(book)}
                                className="h-7 px-2 text-xs hover:bg-red-50 text-red-600 border-red-200"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            SKU: {book.sku}
                          </div>
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

      {/* Edit and Delete Dialogs */}
      <EditBookDialog
        book={editingBook}
        isOpen={!!editingBook}
        onClose={() => setEditingBook(null)}
      />
      
      <DeleteBookDialog
        book={deletingBook}
        isOpen={!!deletingBook}
        onClose={() => setDeletingBook(null)}
      />
    </div>
  );
}
