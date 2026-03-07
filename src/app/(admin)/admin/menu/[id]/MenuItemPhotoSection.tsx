"use client";

import Image from "next/image";
import { m } from "framer-motion";
import { X, Image as ImageIcon, Clock, Info } from "lucide-react";
import { toast } from "@/lib/hooks/useToastV8";
import { PhotoUploadZone } from "@/components/ui/admin/photos/PhotoUploadZone";
import type { UploadResult } from "@/lib/supabase/storage";

interface MenuItemPhotoSectionProps {
  imageUrl: string | null;
  nameEn: string;
  itemId: string;
  updatedAt: string;
  onImageChange: (url: string | null) => void;
}

export function MenuItemPhotoSection({
  imageUrl,
  nameEn,
  itemId,
  updatedAt,
  onImageChange,
}: MenuItemPhotoSectionProps) {
  const handlePhotoUploadComplete = (results: UploadResult[]) => {
    if (results.length > 0) {
      onImageChange(results[0].publicUrl);
      toast({ message: "Save to apply changes", type: "success" });
    }
  };

  const handleRemovePhoto = () => {
    onImageChange(null);
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-6"
    >
      <div className="bg-surface-secondary rounded-card-sm border border-border p-6 space-y-4">
        <h2 className="font-display font-semibold text-text-primary flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Photo
        </h2>

        {/* Current photo preview */}
        {imageUrl ? (
          <div className="relative">
            <div className="relative w-full aspect-[4/3] max-w-xs mx-auto rounded-card-sm overflow-hidden border border-border">
              <Image
                src={imageUrl}
                alt={nameEn}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={handleRemovePhoto}
                className="absolute top-2 right-2 p-1.5 bg-surface-inverse/60 hover:bg-surface-inverse/80 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-text-inverse" />
              </button>
            </div>
            <p className="text-xs font-body text-text-muted text-center mt-2">Current photo</p>
          </div>
        ) : (
          <div className="w-full aspect-[4/3] max-w-xs mx-auto rounded-card-sm border-2 border-dashed border-border flex flex-col items-center justify-center bg-surface-tertiary/50">
            <ImageIcon className="h-12 w-12 text-text-muted mb-2" />
            <span className="text-sm font-body text-text-muted">No photo</span>
          </div>
        )}

        {/* Upload new photo */}
        <div className="pt-4 border-t border-border">
          <p className="text-sm font-body font-medium text-text-secondary mb-3">Upload new photo</p>
          <PhotoUploadZone
            menuItemId={itemId}
            onUploadComplete={handlePhotoUploadComplete}
            className="!p-4"
          />
          <div className="flex items-center gap-1.5 mt-2 text-xs font-body text-text-muted">
            <Info className="h-3 w-3 shrink-0" />
            <span>Photos are auto-processed to WebP (4:3, 800x600)</span>
          </div>
        </div>
      </div>

      {/* Last Updated Info */}
      <div className="bg-surface-secondary rounded-card-sm border border-border p-6">
        <h2 className="font-display font-semibold text-text-primary mb-4">History</h2>
        <div className="flex items-center gap-3 text-sm">
          <Clock className="h-4 w-4 text-text-muted" />
          <span className="font-body text-text-secondary">
            Last updated: {formatDateTime(updatedAt)}
          </span>
        </div>
      </div>
    </m.div>
  );
}
