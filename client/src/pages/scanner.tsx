import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Keyboard, Zap, Monitor, Search } from "lucide-react";
import { useLocation } from "wouter";
import CameraScanner from "@/components/camera-scanner";
import ManualInputModal from "@/components/manual-input-modal";
import { useRecentISBNs } from "@/lib/storage";

export default function Scanner() {
  const [, setLocation] = useLocation();
  const [showManualInput, setShowManualInput] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const { addRecentISBN } = useRecentISBNs();

  useEffect(() => {
    const checkDevice = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const hasTouch = 'ontouchstart' in window;
      const screenWidth = window.innerWidth;
      
      // Consider it desktop if not mobile, no touch, and wide screen
      setIsDesktop(!isMobile && !hasTouch && screenWidth >= 1024);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const handleBarcodeDetected = (isbn: string) => {
    addRecentISBN(isbn); // Track scanned ISBNs
    setLocation(`/book-details/${isbn}`);
  };

  const handleManualSubmit = (isbn: string) => {
    setShowManualInput(false);
    setLocation(`/book-details/${isbn}`);
  };

  // Desktop-friendly interface
  if (isDesktop) {
    return (
      <div className="flex-1 flex flex-col pb-24 min-h-screen" style={{ backgroundColor: 'var(--dark-background)' }}>
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
            <h1 className="text-xl font-semibold">ISBN Entry</h1>
          </div>
          <Monitor className="w-6 h-6 text-white/80" />
        </div>

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
      </div>
    );
  }

  // Mobile-friendly camera interface
  return (
    <div className="flex-1 flex flex-col pb-24 min-h-screen" style={{ backgroundColor: 'var(--dark-background)' }}>
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
          <h1 className="text-xl font-semibold">Scan ISBN Barcode</h1>
        </div>
        
        {/* Flash toggle in header */}
        <Button 
          onClick={() => setFlashEnabled(!flashEnabled)}
          variant="ghost"
          size="icon"
          className={`text-white hover:bg-white/20 ${flashEnabled ? 'bg-white/20' : ''}`}
        >
          <Zap className="w-5 h-5" />
        </Button>
      </div>

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
    </div>
  );
}
