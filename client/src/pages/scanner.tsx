import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Keyboard, Zap } from "lucide-react";
import { useLocation } from "wouter";
import CameraScanner from "@/components/camera-scanner";
import ManualInputModal from "@/components/manual-input-modal";
import { useRecentISBNs } from "@/lib/storage";

export default function Scanner() {
  const [, setLocation] = useLocation();
  const [showManualInput, setShowManualInput] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const { addRecentISBN } = useRecentISBNs();

  const handleBarcodeDetected = (isbn: string) => {
    addRecentISBN(isbn); // Track scanned ISBNs
    setLocation(`/book-details/${isbn}`);
  };

  const handleManualSubmit = (isbn: string) => {
    setShowManualInput(false);
    setLocation(`/book-details/${isbn}`);
  };

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
          <h1 className="text-xl font-semibold">Scan ISBN Barcode</h1>
        </div>
        
        {/* Flash toggle in header */}
        <Button 
          onClick={() => setFlashEnabled(!flashEnabled)}
          variant="ghost"
          size="icon"
          className={`text-white hover:bg-blue-600 ${flashEnabled ? 'bg-blue-600' : ''}`}
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
