'use client';

import { useState } from "react";
import { m } from "framer-motion";
import {
  X,
  Image as ImageIcon,
  Link as LinkIcon,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhotoUploadZone } from "@/components/ui/admin/photos/PhotoUploadZone";
import type { UploadResult } from "@/lib/supabase/storage";

interface MenuItemPhotoSectionProps {
  imageUrl: string | null;
  nameEn: string;
  itemId: string;
  updatedAt: string;
  initialDriveUrl: string;
  initialDrivePreview: string | null;
  onImageChange: (url: string | null) => void;
}

export function MenuItemPhotoSection({
  imageUrl,
  nameEn,
  itemId,
  updatedAt,
  initialDriveUrl,
  initialDrivePreview,
  onImageChange,
}: MenuItemPhotoSectionProps) {
  const [driveUrl, setDriveUrl] = useState(initialDriveUrl);
  const [verifyingDrive, setVerifyingDrive] = useState(false);
  const [drivePreview, setDrivePreview] = useState<string | null>(initialDrivePreview);

  const handlePhotoUploadComplete = (results: UploadResult[]) => {
    if (results.length > 0) {
      onImageChange(results[0].publicUrl);
      toast({ title: "Photo uploaded", description: "Save to apply changes" });
    }
  };

  const handleRemovePhoto = () => {
    onImageChange(null);
  };

  const handleVerifyDriveUrl = async () => {
    if (!driveUrl) return;

    setVerifyingDrive(true);
    setDrivePreview(null);

    try {
      let fileId = "";
      const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]+)/,
        /id=([a-zA-Z0-9_-]+)/,
        /open\?id=([a-zA-Z0-9_-]+)/,
      ];

      for (const pattern of patterns) {
        const match = driveUrl.match(pattern);
        if (match) {
          fileId = match[1];
          break;
        }
      }

      if (!fileId) {
        throw new Error("Invalid Google Drive URL format");
      }

      const driveUrlForVerify = `https://drive.google.com/file/d/${fileId}/view`;
      const response = await fetch("/api/admin/photos/verify-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: driveUrlForVerify }),
      });

      const verifyData = await response.json();

      if (!response.ok || !verifyData.valid) {
        throw new Error(verifyData.error || "URL not accessible");
      }

      const verifiedImageUrl = verifyData.previewUrl;
      setDrivePreview(verifiedImageUrl);
      onImageChange(verifiedImageUrl);
      toast({ title: "URL verified", description: "Image is accessible. Save to apply." });
    } catch (err) {
      toast({
        title: "Verification failed",
        description: err instanceof Error ? err.message : "Could not verify URL",
        variant: "destructive",
      });
    } finally {
      setVerifyingDrive(false);
    }
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
            <div className="relative w-full aspect-square max-w-xs mx-auto rounded-card-sm overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={nameEn}
                className="w-full h-full object-cover"
              />
              <button
                onClick={handleRemovePhoto}
                className="absolute top-2 right-2 p-1.5 bg-surface-inverse/60 hover:bg-surface-inverse/80 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-text-inverse" />
              </button>
            </div>
            <p className="text-xs font-body text-text-muted text-center mt-2">
              Current photo
            </p>
          </div>
        ) : (
          <div className="w-full aspect-square max-w-xs mx-auto rounded-card-sm border-2 border-dashed border-border flex flex-col items-center justify-center bg-surface-tertiary/50">
            <ImageIcon className="h-12 w-12 text-text-muted mb-2" />
            <span className="text-sm font-body text-text-muted">No photo</span>
          </div>
        )}

        {/* Upload new photo */}
        <div className="pt-4 border-t border-border">
          <p className="text-sm font-body font-medium text-text-secondary mb-3">
            Upload new photo
          </p>
          <PhotoUploadZone
            menuItemId={itemId}
            onUploadComplete={handlePhotoUploadComplete}
            className="!p-4"
          />
        </div>

        {/* Google Drive URL */}
        <div className="pt-4 border-t border-border">
          <p className="text-sm font-body font-medium text-text-secondary mb-3 flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Or use Google Drive URL
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Paste Google Drive share link..."
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              className="bg-surface-primary border-border flex-1"
            />
            <Button
              variant="outline"
              onClick={handleVerifyDriveUrl}
              disabled={!driveUrl || verifyingDrive}
              className="shrink-0"
            >
              {verifyingDrive ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Verify"
              )}
            </Button>
          </div>
          {drivePreview && (
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={drivePreview}
                alt="Preview"
                className="w-20 h-20 rounded-input object-cover border border-green"
              />
              <p className="text-xs text-green mt-1">
                {imageUrl === drivePreview ? "Current saved URL" : "URL verified - Save to apply"}
              </p>
            </div>
          )}
          {imageUrl && imageUrl.includes("drive.google.com") && (
            <div className="mt-2">
              <p className="text-xs text-text-muted break-all bg-surface-tertiary p-2 rounded-input">
                {imageUrl}
              </p>
            </div>
          )}
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
