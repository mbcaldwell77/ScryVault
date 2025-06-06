import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Package, ChevronDown, ChevronRight, Download, Search, Upload, RefreshCw, Edit, Trash2, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import type { InventoryBook } from "@/types";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { usePricingData, getConfidenceDisplay } from "@/hooks/use-pricing";
import LivePricingDisplay from "@/components/live-pricing-display";
import EditBookDialog from "@/components/edit-book-dialog";
import DeleteBookDialog from "@/components/delete-book-dialog";
import GlobalHeader from "@/components/global-header";

export default function Inventory() {
  const [, setLocation] = useLocation();
  const [expandedISBNs, setExpandedISBNs] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [editingBook, setEditingBook] = useState<InventoryBook | null>(null);
  const [deletingBook, setDeletingBook] = useState<InventoryBook | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    data: books = [],
    isLoading,
    refetch,
  } = useQuery<InventoryBook[]>({
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
  const filteredBooks = books.filter((book: InventoryBook) => {
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

  const totalBooks = books.length;
  const totalInvestment = books.reduce((sum: number, book: InventoryBook) => sum + Number(book.purchasePrice ?? 0), 0);
  const totalEstimatedValue = books.reduce((sum: number, book: InventoryBook) => sum + Number(book.estimatedPrice ?? book.purchasePrice ?? 0), 0);
  const potentialProfit = totalEstimatedValue - totalInvestment;
  const profitMargin = totalInvestment > 0 ? (potentialProfit / totalInvestment) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col pb-20" style={{ backgroundColor: 'var(--pure-white)' }}>
        <GlobalHeader title="My Inventory" showBackButton={true} />
        
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
        <GlobalHeader title="My Inventory" showBackButton={true} />
        
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-32 h-32 rounded-full flex items-center justify-center mb-6" 
               style={{ backgroundColor: 'var(--dark-card)', border: '3px solid var(--emerald-accent)' }}>
            <Package className="w-16 h-16" style={{ color: 'var(--emerald-accent)' }} />
          </div>
          
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-light)' }}>
            No Books in Inventory
          </h2>
          
          <p className="mb-8 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
            Start building your inventory by scanning or manually adding books.
          </p>
          
          <div className="space-y-3 w-full max-w-xs">
            <Button 
              onClick={() => setLocation("/scanner")}
              className="w-full border-2"
              style={{
                backgroundColor: 'var(--emerald-primary)',
                borderColor: 'var(--emerald-accent)',
                color: 'white'
              }}
            >
              <Camera className="w-5 h-5 mr-2" />
              Scan First Book
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-20" style={{ backgroundColor: 'var(--pure-white)' }} {...pullToRefresh}>
      <GlobalHeader title="My Inventory" showBackButton={true} />
      
      {/* Rest of inventory page content */}
      <div className="p-4">
        <Input
          placeholder="Search books..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
        
        <div className="space-y-3">
          {filteredBooks.map((book: InventoryBook) => (
            <div key={book.id} className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{book.title}</h3>
                  <p className="text-sm text-gray-600">{book.author}</p>
                  <p className="text-sm">${book.purchasePrice}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingBook(book)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeletingBook(book)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Dialog */}
      {editingBook && (
        <EditBookDialog
          book={editingBook}
          isOpen={!!editingBook}
          onClose={() => setEditingBook(null)}
        />
      )}

      {/* Delete Dialog */}
      {deletingBook && (
        <DeleteBookDialog
          book={deletingBook}
          isOpen={!!deletingBook}
          onClose={() => setDeletingBook(null)}
        />
      )}
    </div>
  );
}