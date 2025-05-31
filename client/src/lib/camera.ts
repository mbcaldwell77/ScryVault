export interface CameraConstraints {
  video: {
    facingMode: string;
    width?: { ideal: number };
    height?: { ideal: number };
  };
  audio: boolean;
}

export const defaultCameraConstraints: CameraConstraints = {
  video: {
    facingMode: "environment", // Use back camera on mobile
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
  audio: false,
};

export async function requestCameraAccess(constraints: CameraConstraints = defaultCameraConstraints): Promise<MediaStream> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("Camera API not supported in this browser");
  }

  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    if (error instanceof Error) {
      switch (error.name) {
        case "NotAllowedError":
          throw new Error("Camera access denied. Please allow camera permissions and try again.");
        case "NotFoundError":
          throw new Error("No camera found on this device.");
        case "NotReadableError":
          throw new Error("Camera is already in use by another application.");
        case "OverconstrainedError":
          throw new Error("Camera settings are not supported by this device.");
        default:
          throw new Error(`Camera access failed: ${error.message}`);
      }
    }
    throw new Error("Unknown camera access error");
  }
}

export function stopCameraStream(stream: MediaStream): void {
  stream.getTracks().forEach(track => track.stop());
}

export async function toggleFlashlight(stream: MediaStream, enabled: boolean): Promise<void> {
  const videoTrack = stream.getVideoTracks()[0];
  
  if (!videoTrack) {
    throw new Error("No video track found");
  }

  const capabilities = videoTrack.getCapabilities();
  
  if (!capabilities.torch) {
    throw new Error("Flashlight not supported on this device");
  }

  try {
    await videoTrack.applyConstraints({
      advanced: [{ torch: enabled } as any]
    });
  } catch (error) {
    throw new Error(`Failed to toggle flashlight: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
