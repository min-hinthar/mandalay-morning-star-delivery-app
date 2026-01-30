/**
 * V6 Photo Capture Component - Pepper Aesthetic
 *
 * Camera capture for delivery proof photos.
 * V6 colors, typography, and 56px touch targets.
 */

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";

interface PhotoCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (blob: Blob) => void;
  onUpload?: (blob: Blob) => Promise<void>;
  title?: string;
}

// Compress image to max size
async function compressImage(blob: Blob, maxSizeKB: number = 1024): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      // Scale down if too large
      const maxDimension = 1920;
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Try different quality levels to hit target size
      let quality = 0.9;
      const tryCompress = () => {
        canvas.toBlob(
          (resultBlob) => {
            if (!resultBlob) {
              reject(new Error("Failed to compress image"));
              return;
            }

            if (resultBlob.size > maxSizeKB * 1024 && quality > 0.1) {
              quality -= 0.1;
              tryCompress();
            } else {
              resolve(resultBlob);
            }
          },
          "image/jpeg",
          quality
        );
      };

      tryCompress();
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(blob);
  });
}

export function PhotoCapture({
  isOpen,
  onClose,
  onCapture,
  onUpload,
  title = "Take Photo",
}: PhotoCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Body scroll lock (deferred restore for animation safety)
  const { restoreScrollPosition } = useBodyScrollLock(isOpen, { deferRestore: true });

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Prefer back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Camera permission denied");
        } else if (err.name === "NotFoundError") {
          setError("No camera found");
        } else {
          setError("Failed to access camera");
        }
      }
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Take photo
  const takePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    // Get blob
    canvas.toBlob(
      async (blob) => {
        if (!blob) return;

        try {
          // Compress to max 1MB
          const compressedBlob = await compressImage(blob, 1024);
          const photoUrl = URL.createObjectURL(compressedBlob);

          setCapturedPhoto(photoUrl);
          setCapturedBlob(compressedBlob);
          stopCamera();
        } catch {
          setError("Failed to process photo");
        }
      },
      "image/jpeg",
      0.9
    );
  }, [stopCamera]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    if (capturedPhoto) {
      URL.revokeObjectURL(capturedPhoto);
    }
    setCapturedPhoto(null);
    setCapturedBlob(null);
    startCamera();
  }, [capturedPhoto, startCamera]);

  // Handle close - defined before confirmPhoto to avoid circular dependency
  const handleClose = useCallback(() => {
    stopCamera();
    if (capturedPhoto) {
      URL.revokeObjectURL(capturedPhoto);
    }
    setCapturedPhoto(null);
    setCapturedBlob(null);
    setError(null);
    onClose();
  }, [stopCamera, capturedPhoto, onClose]);

  // Confirm and upload
  const confirmPhoto = useCallback(async () => {
    if (!capturedBlob) return;

    if (onUpload) {
      setIsUploading(true);
      try {
        await onUpload(capturedBlob);
      } catch {
        setError("Failed to upload photo");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    onCapture(capturedBlob);
    handleClose();
  }, [capturedBlob, onCapture, onUpload, handleClose]);

  // Start camera when modal opens (proper useEffect, not side effect in render)
  useEffect(() => {
    if (isOpen && !stream && !capturedPhoto && !error) {
      startCamera();
    }
  }, [isOpen, stream, capturedPhoto, error, startCamera]);

  return (
    <AnimatePresence onExitComplete={restoreScrollPosition}>
      {isOpen && (
        // Camera full-screen overlay - intentionally dark for camera UI
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface-inverse"
        >
          {/* Hidden canvas for capturing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Header */}
          <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-surface-inverse/70 to-transparent p-4">
            <h2 className="font-display text-lg font-semibold text-text-inverse">{title}</h2>
            <button
              onClick={handleClose}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                "bg-surface-primary/20 text-text-inverse",
                "transition-colors duration-fast hover:bg-surface-primary/30"
              )}
              disabled={isUploading}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Camera View or Preview */}
          <div className="relative h-full w-full">
            {!capturedPhoto ? (
              // Live camera view
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-overlay-heavy"
                    >
                      <div className="text-center">
                        <p className="mb-4 font-body text-lg text-text-inverse">{error}</p>
                        <button
                          onClick={startCamera}
                          className={cn(
                            "rounded-card-sm bg-surface-primary px-6 py-3",
                            "font-body font-medium text-text-primary",
                            "transition-colors duration-fast hover:bg-surface-secondary"
                          )}
                        >
                          Try Again
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              // Photo preview - uses blob URL
              <motion.img
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={capturedPhoto}
                alt="Captured photo"
                className="h-full w-full object-contain"
              />
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-8 bg-gradient-to-t from-surface-inverse/70 to-transparent p-8 pb-12">
            {!capturedPhoto ? (
              // Capture button
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={takePhoto}
                disabled={!stream || !!error}
                className={cn(
                  "flex h-20 w-20 items-center justify-center rounded-full",
                  "bg-surface-primary transition-all duration-fast",
                  "active:scale-95",
                  "disabled:opacity-50"
                )}
                aria-label="Take photo"
              >
                <div className="h-16 w-16 rounded-full border-4 border-primary" />
              </motion.button>
            ) : (
              // Confirm/Retake buttons
              <>
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={retakePhoto}
                  disabled={isUploading}
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full",
                    "bg-surface-primary/20 text-text-inverse",
                    "transition-colors duration-fast hover:bg-surface-primary/30"
                  )}
                  aria-label="Retake photo"
                >
                  <RotateCcw className="h-7 w-7" />
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={confirmPhoto}
                  disabled={isUploading}
                  className={cn(
                    "flex h-20 w-20 items-center justify-center rounded-full",
                    "bg-green text-text-inverse shadow-lg",
                    "transition-all duration-fast",
                    "active:scale-95"
                  )}
                  aria-label="Confirm photo"
                >
                  {isUploading ? (
                    <Loader2 className="h-10 w-10 animate-spin" />
                  ) : (
                    <Check className="h-10 w-10" />
                  )}
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
