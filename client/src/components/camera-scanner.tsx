import { useEffect, useRef } from "react";
import { useCamera } from "@/hooks/use-camera";
import { useBarcodeScanner } from "@/lib/barcode-scanner";

interface CameraScannerProps {
  onBarcodeDetected: (isbn: string) => void;
  flashEnabled?: boolean;
}

export default function CameraScanner({ onBarcodeDetected, flashEnabled = false }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { stream, error, initializeCamera, stopCamera } = useCamera();
  
  useEffect(() => {
    initializeCamera();
    return () => stopCamera();
  }, [initializeCamera, stopCamera]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Initialize barcode scanner
  useBarcodeScanner(videoRef, onBarcodeDetected);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800">
        <div className="text-white text-center p-6">
          <div className="text-4xl mb-4">📷</div>
          <p className="text-lg mb-2">Camera Access Required</p>
          <p className="text-sm text-gray-300 mb-4">
            This app needs camera access to scan ISBN barcodes
          </p>
          <div className="text-xs text-gray-400 space-y-2">
            <p>• Allow camera permissions in your browser</p>
            <p>• Make sure no other app is using the camera</p>
            <p>• Try refreshing the page after granting access</p>
            <p className="mt-4 border-t border-gray-600 pt-2">
              Or use the Manual Entry button below to type ISBN codes
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="w-full h-full object-cover"
    />
  );
}
