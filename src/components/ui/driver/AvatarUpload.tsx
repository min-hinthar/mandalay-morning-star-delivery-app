/**
 * AvatarUpload - Profile photo upload with circular crop
 *
 * Supports camera + gallery, client-side compression (HEIC/WebP/JPEG/PNG),
 * circular crop via react-easy-crop, and upload to Supabase Storage.
 */

"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { Camera, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { validateDriverPhoto, compressDriverPhoto } from "@/lib/supabase/driver-storage";
import { toast } from "@/lib/hooks/useToastV8";
import { InitialsAvatar } from "./InitialsAvatar";

interface AvatarUploadProps {
  currentImageUrl: string | null;
  driverName: string | null;
  driverId: string;
  onPhotoUpdated: (url: string | null) => void;
  className?: string;
}

/**
 * Creates a cropped image from a source image and crop area
 */
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = document.createElement("img");
  image.crossOrigin = "anonymous";

  return new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create cropped image"));
        },
        "image/jpeg",
        0.85
      );
    };
    image.onerror = () => reject(new Error("Failed to load image for cropping"));
    image.src = imageSrc;
  });
}

export function AvatarUpload({
  currentImageUrl,
  driverName,
  driverId: _driverId,
  onPhotoUpdated,
  className,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input for re-selection
    e.target.value = "";

    // Validate
    const validation = validateDriverPhoto(file);
    if (!validation.valid) {
      toast({ message: validation.error, type: "error" });
      return;
    }

    try {
      setIsCompressing(true);

      // Compress (handles HEIC→JPEG, EXIF orientation, size reduction)
      const compressed = await compressDriverPhoto(file);

      // Create preview URL for crop modal
      const previewUrl = URL.createObjectURL(compressed);
      setPreviewSrc(previewUrl);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setShowCropModal(true);
    } catch {
      toast({
        message: "Could not process the image. Try a different photo.",
        type: "error",
      });
    } finally {
      setIsCompressing(false);
    }
  }, []);

  const handleCropConfirm = useCallback(async () => {
    if (!previewSrc || !croppedAreaPixels) return;

    try {
      setIsUploading(true);

      // Crop the image
      const croppedBlob = await getCroppedImg(previewSrc, croppedAreaPixels);

      // Upload to server
      const formData = new FormData();
      formData.append("photo", croppedBlob, "profile.jpg");

      const response = await fetch("/api/driver/profile/photo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      onPhotoUpdated(data.profileImageUrl);

      toast({ message: "Your profile photo has been saved.", type: "success" });
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "Could not upload photo. Try again.",
        type: "error",
      });
    } finally {
      setIsUploading(false);
      setShowCropModal(false);
      if (previewSrc) URL.revokeObjectURL(previewSrc);
      setPreviewSrc(null);
    }
  }, [previewSrc, croppedAreaPixels, onPhotoUpdated]);

  const handleCropCancel = useCallback(() => {
    setShowCropModal(false);
    if (previewSrc) URL.revokeObjectURL(previewSrc);
    setPreviewSrc(null);
  }, [previewSrc]);

  const handleRemovePhoto = useCallback(async () => {
    try {
      setIsUploading(true);
      const response = await fetch("/api/driver/profile/photo", { method: "DELETE" });

      if (!response.ok) {
        throw new Error("Failed to remove photo");
      }

      onPhotoUpdated(null);
      toast({ message: "Your profile photo has been removed.", type: "success" });
    } catch {
      toast({
        message: "Could not remove photo. Try again.",
        type: "error",
      });
    } finally {
      setIsUploading(false);
    }
  }, [onPhotoUpdated]);

  return (
    <>
      <div className={cn("flex flex-col items-center gap-3", className)}>
        {/* Avatar display */}
        <div className="relative">
          {currentImageUrl ? (
            <Image
              src={currentImageUrl}
              alt={driverName || "Driver profile"}
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover border-2 border-border"
              unoptimized
            />
          ) : (
            <InitialsAvatar name={driverName} size="xl" />
          )}

          {/* Camera button overlay */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isCompressing || isUploading}
            className={cn(
              "absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center",
              "rounded-full bg-accent-teal text-text-inverse shadow-md",
              "transition-transform duration-fast hover:scale-110 active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            aria-label="Upload photo"
          >
            {isCompressing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>

          {/* Remove button (only when photo exists) */}
          {currentImageUrl && !isUploading && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className={cn(
                "absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center",
                "rounded-full bg-status-error text-text-inverse shadow-sm",
                "transition-transform duration-fast hover:scale-110 active:scale-95"
              )}
              aria-label="Remove photo"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <p className="text-sm text-text-muted">
          {currentImageUrl ? "Tap camera to change photo" : "Tap to add a photo"}
        </p>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      {/* Crop Modal */}
      {showCropModal && previewSrc && (
        <div className="fixed inset-0 z-50 flex flex-col bg-surface-inverse/90">
          {/* Crop area */}
          <div className="relative flex-1">
            <Cropper
              image={previewSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          {/* Zoom slider */}
          <div className="flex items-center justify-center gap-4 px-6 py-3 bg-surface-inverse/80">
            <span className="text-sm text-text-inverse/60">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-48 accent-accent-teal"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 p-4 bg-surface-inverse/80 safe-area-pb">
            <button
              type="button"
              onClick={handleCropCancel}
              disabled={isUploading}
              className={cn(
                "flex-1 rounded-xl py-3 px-4 font-semibold text-text-inverse",
                "bg-surface-primary/10 transition-colors hover:bg-surface-primary/20",
                "disabled:opacity-50"
              )}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCropConfirm}
              disabled={isUploading}
              className={cn(
                "flex-1 rounded-xl py-3 px-4 font-semibold text-text-inverse",
                "bg-accent-teal transition-colors hover:bg-accent-teal/90",
                "disabled:opacity-50 flex items-center justify-center gap-2"
              )}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Confirm"
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
