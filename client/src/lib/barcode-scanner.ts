import { useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

export function useBarcodeScanner(
  videoRef: React.RefObject<HTMLVideoElement>,
  onBarcodeDetected: (isbn: string) => void
) {
  const codeReaderRef = useRef<BrowserMultiFormatReader>();
  const lastScannedRef = useRef<string>("");
  const scanTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!videoRef.current) return;

    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    const startScanning = async () => {
      try {
        await codeReader.decodeFromVideoDevice(
          null, // Use default camera device
          videoRef.current!,
          (result, error) => {
            if (result) {
              const code = result.getText();
              
              // Prevent duplicate scans in quick succession
              if (code !== lastScannedRef.current && isValidISBN(code)) {
                lastScannedRef.current = code;
                
                // Clear any existing timeout
                if (scanTimeoutRef.current) {
                  clearTimeout(scanTimeoutRef.current);
                }
                
                // Reduced debounce for faster scanning
                scanTimeoutRef.current = setTimeout(() => {
                  onBarcodeDetected(code);
                }, 100);
              }
            }
            
            if (error && error.name !== "NotFoundException") {
              console.warn("Barcode scanning error:", error);
            }
          }
        );
      } catch (error) {
        console.error("Failed to start barcode scanning:", error);
      }
    };

    startScanning();

    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, [videoRef, onBarcodeDetected]);
}

export function isValidISBN(code: string): boolean {
  // Remove any hyphens or spaces
  const cleaned = code.replace(/[-\s]/g, "");
  
  // Check if it's 10 or 13 digits
  if (!/^\d{10}$/.test(cleaned) && !/^\d{13}$/.test(cleaned)) {
    return false;
  }

  return true;
}

export function formatISBN(isbn: string): string {
  const cleaned = isbn.replace(/[-\s]/g, "");
  
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5, 9)}-${cleaned.slice(9)}`;
  } else if (cleaned.length === 13) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
  }
  
  return isbn;
}
