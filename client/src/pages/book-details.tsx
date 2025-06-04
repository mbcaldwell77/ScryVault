import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import GlobalHeader from "@/components/global-header";
import LivePricingDisplay from "@/components/live-pricing-display";

interface BookDetailsProps {
  isbn: string;
}

export default function BookDetails({ isbn }: BookDetailsProps) {
  const [, setLocation] = useLocation();
  
  const { data: bookData, isLoading, error } = useQuery({
    queryKey: [`/api/book-lookup/${isbn}`],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col pb-20" style={{ backgroundColor: 'var(--pure-white)' }}>
        <GlobalHeader title="Book Details" showBackButton={true} onBack={() => setLocation("/scanner")} />

        {/* Loading State */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--emerald-primary)', borderTopColor: 'transparent' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Looking up book information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !bookData) {
    return (
      <div className="flex-1 flex flex-col pb-20" style={{ backgroundColor: 'var(--pure-white)' }}>
        <GlobalHeader title="Book Details" showBackButton={true} onBack={() => setLocation("/scanner")} />

        {/* Error State */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Book Not Found</h3>
            <p className="text-slate-600 max-w-sm">
              We couldn't find information for ISBN {isbn}. The book may not be in our databases.
            </p>
            <Button 
              onClick={() => setLocation("/scanner")}
              className="bg-primary text-white"
            >
              Try Another ISBN
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-20">
      <GlobalHeader title="Book Details" showBackButton={true} onBack={() => setLocation("/scanner")} />

      {/* Book Info */}
      <div className="flex-1 overflow-auto">
        {/* Book Cover and Basic Info */}
        <div className="p-6" style={{ backgroundColor: 'var(--dark-card)' }}>
          <div className="flex space-x-4">
            <img 
              src={bookData.imageUrl || "/placeholder-book-dark.svg"}
              alt="Book cover"
              className="w-24 h-36 object-cover rounded-lg shadow-md flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder-book-dark.svg";
              }}
            />
            <div className="flex-1 space-y-2">
              <h2 className="text-lg font-bold leading-tight" style={{ color: 'var(--text-light)' }}>{bookData.title}</h2>
              <p style={{ color: 'var(--text-secondary)' }}>{bookData.author}</p>
              <div className="space-y-1 text-sm">
                <p style={{ color: 'var(--text-secondary)' }}><span className="font-medium">Publisher:</span> {bookData.publisher}</p>
                <p style={{ color: 'var(--text-secondary)' }}><span className="font-medium">Year:</span> {bookData.year}</p>
                <p style={{ color: 'var(--text-secondary)' }}><span className="font-medium">ISBN:</span> <span className="font-mono">{isbn}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Market Information with Live Pricing */}
        <div className="p-6 border-t" style={{ backgroundColor: 'var(--dark-surface)', borderColor: 'var(--dark-border)' }}>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--text-light)' }}>Market Insights</h3>
          <LivePricingDisplay 
            isbn={isbn}
            condition="Good"
            purchasePrice="0"
            compact={false}
          />
        </div>

        {/* Actions */}
        <div className="p-6 space-y-3">
          <Button 
            onClick={() => setLocation(`/add-inventory/${isbn}`)}
            className="w-full py-4 px-6 rounded-xl font-semibold text-lg border-2"
            style={{ backgroundColor: '#10B981', borderColor: '#10B981', color: '#FFFFFF', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)', fontWeight: '700' }}
            size="lg"
            title="Add this book to your inventory"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add to Inventory
          </Button>
          
          <Button 
            onClick={() => setLocation("/scanner")}
            variant="outline"
            className="w-full py-3 px-6 rounded-xl font-medium"
            style={{ backgroundColor: 'var(--dark-card)', borderColor: 'var(--dark-border)', color: 'var(--text-secondary)' }}
            size="lg"
          >
            <X className="w-5 h-5 mr-2" />
            Skip & Scan Next
          </Button>
        </div>
      </div>
    </div>
  );
}
