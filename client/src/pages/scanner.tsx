import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Keyboard, Zap, Monitor, Search } from "lucide-react";
import { useLocation } from "wouter";
import CameraScanner from "@/components/camera-scanner";
import ManualInputModal from "@/components/manual-input-modal";
import SwipeCardStack from "@/components/swipe-card-stack";
import PurchaseModal from "@/components/purchase-modal";
import { useRecentISBNs } from "@/lib/storage";
import { useScannedBooks } from "@/hooks/use-scanned-books";
import { useInventory, type BookMetadata } from "@/hooks/use-inventory";
import { useQuery } from "@tanstack/react-query";
import GlobalHeader from "@/components/global-header";

export default function Scanner() {
  const [, setLocation] = useLocation();
  const [showManualInput, setShowManualInput] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [purchaseModalBook, setPurchaseModalBook] = useState<{ isbn: string; metadata: BookMetadata } | null>(null);
  const { addRecentISBN } = useRecentISBNs();
  const { books, addBook, removeFirst } = useScannedBooks();
  const { addCopyToInventory } = useInventory();

  useEffect(() => {
    const checkDevice = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const screenWidth = window.innerWidth;
      
      // More aggressive desktop detection - any screen >= 1024px without mobile user agent
      setIsDesktop(!isMobile && screenWidth >= 1024);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Fetch book metadata when ISBN is detected
  const fetchBookMetadata = async (isbn: string): Promise<BookMetadata | null> => {
    try {
      const response = await fetch(`/api/book-metadata/${isbn}`);
      if (!response.ok) throw new Error('Failed to fetch book metadata');
      return await response.json();
    } catch (error) {
      console.error('Error fetching book metadata:', error);
      return null;
    }
  };

  const handleBarcodeDetected = async (isbn: string) => {
    addRecentISBN(isbn); // Track scanned ISBNs
    
    // Fetch metadata and add to scanned books for swipe interface
    const metadata = await fetchBookMetadata(isbn);
    if (metadata) {
      addBook(isbn, metadata);
    } else {
      // Fallback to basic metadata structure
      addBook(isbn, {
        title: `Book ${isbn}`,
        author: 'Unknown Author'
      });
    }
  };

  const handleManualSubmit = async (isbn: string) => {
    setShowManualInput(false);
    
    // Fetch metadata and add to scanned books for swipe interface
    const metadata = await fetchBookMetadata(isbn);
    if (metadata) {
      addBook(isbn, metadata);
    } else {
      // Fallback to basic metadata structure
      addBook(isbn, {
        title: `Book ${isbn}`,
        author: 'Unknown Author'
      });
    }
  };

  const handleSwipeRight = (book: { isbn: string; metadata: BookMetadata }) => {
    setPurchaseModalBook(book);
  };

  const handleSwipeLeft = (isbn: string) => {
    removeFirst(); // Remove the discarded book from stack
  };

  const handlePurchaseModalClose = () => {
    setPurchaseModalBook(null);
    removeFirst(); // Remove the purchased book from stack
  };

  // Show swipe interface if books are available
  if (books.length > 0) {
    return (
      <div className="flex-1 flex flex-col pb-24 min-h-screen" style={{ backgroundColor: 'var(--dark-background)' }}>
        <GlobalHeader title="Swipe to Save" showBackButton={true} />
        
        <div className="flex-1 p-6">
          <div className="text-center mb-6">
            <p className="text-lg" style={{ color: 'var(--text-light)' }}>
              Swipe right to purchase, left to discard
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
              {books.length} book{books.length > 1 ? 's' : ''} remaining
            </p>
          </div>
          
          <SwipeCardStack
            books={books}
            openPurchaseModal={handleSwipeRight}
            onDiscard={handleSwipeLeft}
          />
        </div>

        <PurchaseModal
          isOpen={!!purchaseModalBook}
          book={purchaseModalBook}
          onClose={handlePurchaseModalClose}
          addCopyToInventory={addCopyToInventory}
        />
      </div>
    );
  }

  // Desktop-friendly interface
  if (isDesktop) {
    return (
      <div className="flex-1 flex flex-col pb-24 min-h-screen" style={{ backgroundColor: 'var(--dark-background)' }}>
        <GlobalHeader title="ISBN Entry" showBackButton={true} />

        {/* Desktop Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-lg w-full space-y-8 text-center">
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" 
                   style={{ backgroundColor: 'var(--dark-card)', border: '2px solid var(--emerald-accent)' }}>
                <Search className="w-10 h-10" style={{ color: 'var(--emerald-accent)' }} />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-light)' }}>
                Desktop Book Entry
              </h2>
              <p style={{ color: 'var(--text-secondary)' }} className="text-lg">
                Camera scanning works best on mobile devices. On desktop, manual entry is more reliable.
              </p>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={() => setShowManualInput(true)}
                className="w-full py-4 text-lg border-2"
                style={{ backgroundColor: '#10B981', borderColor: '#10B981', color: '#FFFFFF', fontWeight: '700' }}
                size="lg"
              >
                <Keyboard className="w-6 h-6 mr-3" />
                Enter ISBN Manually
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: 'var(--dark-border)' }}></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span style={{ backgroundColor: 'var(--dark-background)', color: 'var(--text-secondary)' }} className="px-4">
                    or try camera scanning
                  </span>
                </div>
              </div>

              <Button 
                onClick={() => setIsDesktop(false)}
                variant="outline"
                className="w-full py-4 text-lg"
                style={{ backgroundColor: 'var(--dark-card)', borderColor: 'var(--dark-border)', color: 'var(--text-light)' }}
                size="lg"
              >
                <Zap className="w-5 h-5 mr-2" />
                Try Camera Scanner
              </Button>
            </div>

            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <p>💡 For best results on desktop:</p>
              <ul className="mt-2 space-y-1 text-left">
                <li>• Use manual ISBN entry</li>
                <li>• Check book spine or copyright page for 13-digit ISBN</li>
                <li>• Mobile devices work best for camera scanning</li>
              </ul>
            </div>
          </div>
        </div>

        <ManualInputModal
          isOpen={showManualInput}
          onClose={() => setShowManualInput(false)}
          onSubmit={handleManualSubmit}
        />

        <PurchaseModal
          isOpen={!!purchaseModalBook}
          book={purchaseModalBook}
          onClose={handlePurchaseModalClose}
          addCopyToInventory={addCopyToInventory}
        />
      </div>
    );
  }

  // Mobile-friendly camera interface
  return (
    <div className="flex-1 flex flex-col pb-24 min-h-screen" style={{ backgroundColor: 'var(--dark-background)' }}>
      <GlobalHeader title="Scan ISBN Barcode" showBackButton={true} />

      {/* Camera View */}
      <div className="flex-1 relative bg-black">
        <CameraScanner 
          onBarcodeDetected={handleBarcodeDetected}
          flashEnabled={flashEnabled}
        />
        
        {/* Scanner Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-72 h-28 relative">
            {/* Corner markers */}
            <div className="absolute top-0 left-0 w-6 h-6 border-l-3 border-t-3 border-white"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-r-3 border-t-3 border-white"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-3 border-b-3 border-white"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-3 border-b-3 border-white"></div>
            
            {/* Scanning line */}
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary animate-pulse transform -translate-y-1/2"></div>
            
            {/* Center guide */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-xs font-medium bg-black bg-opacity-60 px-3 py-1 rounded-md">
                Position barcode here
              </div>
            </div>
          </div>
        </div>

        {/* Bottom instructions and manual entry */}
        <div className="absolute bottom-6 left-4 right-4">
          <div className="text-center text-white bg-black bg-opacity-60 p-3 rounded-lg mb-4">
            <p className="text-sm">Position the ISBN barcode within the frame</p>
            <p className="text-xs text-gray-300 mt-1">Keep barcode centered and well-lit for best results</p>
          </div>
          
          <Button 
            onClick={() => setShowManualInput(true)}
            className="w-full bg-white bg-opacity-90 text-slate-800 hover:bg-white py-3 font-medium"
          >
            <Keyboard className="w-5 h-5 mr-2" />
            Manual Entry
          </Button>
        </div>
      </div>

      <ManualInputModal
        isOpen={showManualInput}
        onClose={() => setShowManualInput(false)}
        onSubmit={handleManualSubmit}
      />

      <PurchaseModal
        isOpen={!!purchaseModalBook}
        book={purchaseModalBook}
        onClose={handlePurchaseModalClose}
        addCopyToInventory={addCopyToInventory}
      />
    </div>
  );
}
