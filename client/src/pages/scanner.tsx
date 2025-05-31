import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Keyboard, Zap } from "lucide-react";
import { useLocation } from "wouter";
import CameraScanner from "@/components/camera-scanner";
import ManualInputModal from "@/components/manual-input-modal";

export default function Scanner() {
  const [, setLocation] = useLocation();
  const [showManualInput, setShowManualInput] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);

  const handleBarcodeDetected = (isbn: string) => {
    setLocation(`/book-details/${isbn}`);
  };

  const handleManualSubmit = (isbn: string) => {
    setShowManualInput(false);
    setLocation(`/book-details/${isbn}`);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-primary text-white p-4 flex items-center space-x-4">
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

      {/* Camera View */}
      <div className="flex-1 relative bg-black">
        <CameraScanner 
          onBarcodeDetected={handleBarcodeDetected}
          flashEnabled={flashEnabled}
        />
        
        {/* Scanner Overlay */}
        <div className="absolute inset-0 scanner-overlay flex items-center justify-center">
          <div className="w-72 h-24 scanner-frame rounded-lg relative">
            {/* Scanning line animation */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-primary animate-pulse"></div>
            
            {/* Corner markers */}
            <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-white rounded-tl"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-white rounded-tr"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-white rounded-bl"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-white rounded-br"></div>
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 right-4 text-center text-white bg-black bg-opacity-50 p-4 rounded-lg">
          <p className="text-sm">Position the ISBN barcode within the frame</p>
          <p className="text-xs text-gray-300 mt-1">Hold steady for automatic detection</p>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 bg-white space-y-4">
        <div className="flex space-x-4">
          <Button 
            onClick={() => setFlashEnabled(!flashEnabled)}
            variant="outline"
            className="flex-1 bg-slate-100 text-slate-700 py-3 px-4 rounded-lg font-medium"
          >
            <Zap className="w-5 h-5 mr-2" />
            Flash
          </Button>
          <Button 
            onClick={() => setShowManualInput(true)}
            variant="outline"
            className="flex-1 bg-slate-100 text-slate-700 py-3 px-4 rounded-lg font-medium"
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
