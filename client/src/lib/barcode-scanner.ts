import { useEffect, useRef } from "react";

// Mock barcode scanning for web demo
// In a real implementation, you would use a library like @zxing/library
export function useBarcodeScanner(
  videoRef: React.RefObject<HTMLVideoElement>,
  onBarcodeDetected: (isbn: string) => void
) {
  const scanIntervalRef = useRef<NodeJS.Timeout>();
  const lastScannedRef = useRef<string>("");

  useEffect(() => {
    if (!videoRef.current) return;

    // Mock scanning simulation for demo
    // In production, use @zxing/library or similar
    const simulateScanning = () => {
      // Demo ISBNs for testing
      const demoISBNs = [
        "9780262033848", // Introduction to Algorithms
        "9780134685991", // Effective Java
        "9780143129394", // The Seven Husbands of Evelyn Hugo
        "9780547928227", // The Hobbit
      ];

      // Simulate random scanning after 3-5 seconds
      const delay = Math.random() * 2000 + 3000;
      
      scanIntervalRef.current = setTimeout(() => {
        const randomISBN = demoISBNs[Math.floor(Math.random() * demoISBNs.length)];
        
        if (randomISBN !== lastScannedRef.current) {
          lastScannedRef.current = randomISBN;
          onBarcodeDetected(randomISBN);
        }
      }, delay);
    };

    // Start simulation
    simulateScanning();

    return () => {
      if (scanIntervalRef.current) {
        clearTimeout(scanIntervalRef.current);
      }
    };
  }, [videoRef, onBarcodeDetected]);

  // In production, implement actual barcode scanning here
  // Example with @zxing/library:
  /*
  useEffect(() => {
    if (!videoRef.current) return;

    const codeReader = new BrowserMultiFormatReader();
    
    const startScanning = async () => {
      try {
        const result = await codeReader.decodeFromVideoDevice(
          undefined, // Use default device
          videoRef.current!,
          (result, error) => {
            if (result) {
              const code = result.getText();
              // Validate ISBN format and call onBarcodeDetected
              if (isValidISBN(code)) {
                onBarcodeDetected(code);
              }
            }
          }
        );
      } catch (error) {
        console.error('Barcode scanning error:', error);
      }
    };

    startScanning();

    return () => {
      codeReader.reset();
    };
  }, [videoRef, onBarcodeDetected]);
  */
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
