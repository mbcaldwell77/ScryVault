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
        <div className="text-white text-center">
          <div className="text-4xl mb-4">📷</div>
          <p className="text-lg mb-2">Camera not available</p>
          <p className="text-sm text-gray-300">
            {error}
          </p>
          <p className="text-xs text-gray-400 mt-4">
            Please use manual entry option
          </p>
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
      style={{ transform: 'scaleX(-1)' }} // Mirror the video for better UX
    />
  );
}
