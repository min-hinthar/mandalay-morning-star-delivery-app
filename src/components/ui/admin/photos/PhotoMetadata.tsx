"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  Trash2,
  Link2,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PhotoItem } from "./PhotoGrid";

interface MenuItem {
  id: string;
  name: string;
  categoryName: string;
  imageUrl: string | null;
  basePriceCents: number;
}

interface PhotoMetadataProps {
  photo: PhotoItem | null;
  menuItems: MenuItem[];
  onClose: () => void;
  onAssign: (photoId: string, menuItemId: string) => Promise<void>;
  onDelete: (photoId: string) => Promise<void>;
  onGoogleDriveLink: (photoId: string, url: string) => Promise<void>;
}

export function PhotoMetadata({
  photo,
  menuItems,
  onClose,
  onAssign,
  onDelete,
  onGoogleDriveLink,
}: PhotoMetadataProps) {
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>("");
  const [driveUrl, setDriveUrl] = useState("");
  const [driveStatus, setDriveStatus] = useState<
    "idle" | "verifying" | "valid" | "invalid"
  >("idle");
  const [driveError, setDriveError] = useState<string | null>(null);
  const [verifiedPreviewUrl, setVerifiedPreviewUrl] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingDrive, setIsSavingDrive] = useState(false);

  // Reset state when photo changes
  useEffect(() => {
    setSelectedMenuItemId("");
    setDriveUrl("");
    setDriveStatus("idle");
    setDriveError(null);
    setVerifiedPreviewUrl(null);
  }, [photo?.id]);

  if (!photo) {
    return null;
  }

  const handleAssign = async () => {
    if (!selectedMenuItemId) return;
    setIsAssigning(true);
    try {
      await onAssign(photo.id, selectedMenuItemId);
      setSelectedMenuItemId("");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to remove this photo?")) return;
    setIsDeleting(true);
    try {
      await onDelete(photo.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVerifyDrive = async () => {
    if (!driveUrl.trim()) return;

    setDriveStatus("verifying");
    setDriveError(null);
    setVerifiedPreviewUrl(null);

    try {
      const response = await fetch("/api/admin/photos/verify-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: driveUrl }),
      });

      const data = await response.json();

      if (data.valid && data.previewUrl) {
        setDriveStatus("valid");
        setVerifiedPreviewUrl(data.previewUrl);
      } else {
        setDriveStatus("invalid");
        setDriveError(data.error || "Could not verify URL");
      }
    } catch {
      setDriveStatus("invalid");
      setDriveError("Failed to verify URL");
    }
  };

  const handleSaveDriveUrl = async () => {
    if (driveStatus !== "valid" || !verifiedPreviewUrl) return;
    setIsSavingDrive(true);
    try {
      // Use the API's verified preview URL (optimized thumbnail format)
      await onGoogleDriveLink(photo.id, verifiedPreviewUrl);
      setDriveUrl("");
      setDriveStatus("idle");
      setVerifiedPreviewUrl(null);
    } finally {
      setIsSavingDrive(false);
    }
  };

  // Filter to menu items without photos (for assignment)
  const unassignedMenuItems = menuItems.filter((item) => !item.imageUrl);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-full max-w-sm bg-surface-secondary border border-border rounded-card-sm p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-text-primary">
          Photo Details
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Photo Preview */}
      <div className="aspect-square w-full overflow-hidden rounded-card-sm bg-surface-tertiary">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.imageUrl}
          alt={photo.name}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Photo Info */}
      <div className="space-y-2">
        <div>
          <label className="text-xs font-body text-text-muted">Menu Item</label>
          <p className="font-body font-medium text-text-primary">{photo.name}</p>
        </div>
        {photo.categoryName && (
          <div>
            <label className="text-xs font-body text-text-muted">Category</label>
            <p className="font-body text-text-secondary">{photo.categoryName}</p>
          </div>
        )}
        <div>
          <label className="text-xs font-body text-text-muted">Status</label>
          <div className="mt-1">
            <Badge
              variant={photo.isAssigned ? "default" : "outline"}
              className={cn(
                photo.isAssigned
                  ? "bg-green/10 text-green border-green/30"
                  : "border-border text-text-muted"
              )}
            >
              {photo.isAssigned ? "Assigned" : "Unassigned"}
            </Badge>
          </div>
        </div>
        {/* Show current URL if it's a Google Drive URL */}
        {photo.imageUrl && photo.imageUrl.includes("drive.google.com") && (
          <div>
            <label className="text-xs font-body text-text-muted">Current URL</label>
            <p className="font-body text-xs text-text-secondary break-all bg-surface-tertiary p-2 rounded-input mt-1">
              {photo.imageUrl}
            </p>
          </div>
        )}
      </div>

      {/* Assign to Menu Item */}
      <div className="space-y-2 pt-2 border-t border-border">
        <label className="text-sm font-body font-medium text-text-primary">
          Assign to Different Item
        </label>
        <div className="flex gap-2">
          <Select
            value={selectedMenuItemId}
            onValueChange={setSelectedMenuItemId}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select menu item" />
            </SelectTrigger>
            <SelectContent>
              {unassignedMenuItems.length === 0 ? (
                <SelectItem value="none" disabled>
                  All items have photos
                </SelectItem>
              ) : (
                unassignedMenuItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <div className="flex items-center gap-2">
                      <span>{item.name}</span>
                      <span className="text-text-muted text-xs">
                        {formatPrice(item.basePriceCents)}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button
            onClick={handleAssign}
            disabled={!selectedMenuItemId || isAssigning}
            size="sm"
          >
            {isAssigning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Assign"
            )}
          </Button>
        </div>
      </div>

      {/* Google Drive Link */}
      <div className="space-y-2 pt-2 border-t border-border">
        <label className="text-sm font-body font-medium text-text-primary flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Google Drive Link
        </label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={driveUrl}
              onChange={(e) => {
                setDriveUrl(e.target.value);
                setDriveStatus("idle");
                setDriveError(null);
              }}
              placeholder="Paste Google Drive URL"
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleVerifyDrive}
              disabled={!driveUrl.trim() || driveStatus === "verifying"}
            >
              {driveStatus === "verifying" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Verify"
              )}
            </Button>
          </div>

          {/* Verification Status */}
          {driveStatus === "valid" && (
            <div className="flex items-center gap-2 text-green text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>URL verified - publicly accessible</span>
            </div>
          )}
          {driveStatus === "invalid" && driveError && (
            <div className="flex items-center gap-2 text-status-error text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{driveError}</span>
            </div>
          )}

          {driveStatus === "valid" && (
            <Button
              onClick={handleSaveDriveUrl}
              disabled={isSavingDrive}
              className="w-full"
              size="sm"
            >
              {isSavingDrive ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Save Drive URL
            </Button>
          )}
        </div>
      </div>

      {/* Delete */}
      <div className="pt-2 border-t border-border">
        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-full text-status-error border-status-error/30 hover:bg-status-error/10"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Remove Photo
        </Button>
      </div>
    </motion.div>
  );
}
