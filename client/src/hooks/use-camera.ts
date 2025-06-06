import { useState, useCallback, useRef } from "react";

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const initializeCamera = useCallback(async () => {
    try {
      setError(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to access camera";
      setError(errorMessage);
      console.error("Camera initialization error:", err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  interface TorchTrackCapabilities extends MediaTrackCapabilities {
    torch?: boolean;
  }

  const toggleFlash = useCallback(async (enabled: boolean) => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      const capabilities = videoTrack?.getCapabilities() as TorchTrackCapabilities | undefined;
      if (videoTrack && capabilities?.torch) {
        try {
          await videoTrack.applyConstraints({
            advanced: [{ torch: enabled } as any]
          });
        } catch (err) {
          console.error("Failed to toggle flash:", err);
        }
      }
    }
  }, []);

  return {
    stream,
    error,
    initializeCamera,
    stopCamera,
    toggleFlash,
  };
}
