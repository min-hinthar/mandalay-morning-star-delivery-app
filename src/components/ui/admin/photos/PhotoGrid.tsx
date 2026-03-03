"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { m, AnimatePresence } from "framer-motion";
import { Check, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";

export interface PhotoItem {
  id: string;
  name: string;
  imageUrl: string;
  categoryName?: string;
  categoryId?: string;
  storagePath?: string;
  isAssigned?: boolean;
}

interface PhotoGridProps {
  photos: PhotoItem[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onPhotoClick: (photo: PhotoItem) => void;
  isLoading?: boolean;
}

interface PhotoCardProps {
  photo: PhotoItem;
  isSelected: boolean;
  onPhotoClick: (photo: PhotoItem) => void;
  onSelect: (id: string) => void;
}

const PhotoCard = memo(function PhotoCard({
  photo,
  isSelected,
  onPhotoClick,
  onSelect,
}: PhotoCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <m.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative group"
    >
      {/* Photo Card */}
      <button
        type="button"
        onClick={() => onPhotoClick(photo)}
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-card-sm",
          "border-2 transition-all duration-fast",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          isSelected
            ? "border-primary ring-2 ring-primary/30"
            : "border-border hover:border-primary/50"
        )}
      >
        {/* Image -- routed through Next.js /_next/image proxy to avoid
            cross-origin opaque response issues with Google Drive thumbnails */}
        {!imgError ? (
          <Image
            src={photo.imageUrl}
            alt={photo.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-surface-tertiary">
            <ImageIcon className="h-8 w-8 text-text-muted" />
          </div>
        )}

        {/* Hover Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-surface-inverse/50 opacity-0 transition-opacity duration-fast",
            "group-hover:opacity-100"
          )}
        >
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <p className="font-body text-xs font-medium text-text-inverse truncate">{photo.name}</p>
            {photo.categoryName && (
              <p className="font-body text-xs text-text-inverse/70 truncate">
                {photo.categoryName}
              </p>
            )}
          </div>
        </div>

        {/* Assignment Badge */}
        {photo.isAssigned === true && (
          <Badge
            className={cn(
              "absolute top-2 left-2",
              "bg-green/90 text-text-inverse border-0 text-xs"
            )}
          >
            Assigned
          </Badge>
        )}
        {photo.isAssigned === false && (
          <Badge
            className={cn(
              "absolute top-2 left-2",
              "bg-yellow/90 text-text-inverse border-0 text-xs"
            )}
          >
            Unassigned
          </Badge>
        )}
      </button>

      {/* Selection Checkbox */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(photo.id);
        }}
        className={cn(
          "absolute top-2 right-2 h-6 w-6 rounded-full",
          "flex items-center justify-center",
          "border-2 transition-all duration-fast",
          "opacity-0 group-hover:opacity-100",
          isSelected
            ? "bg-primary border-primary opacity-100"
            : "bg-surface-primary/80 border-border hover:border-primary"
        )}
      >
        {isSelected && <Check className="h-4 w-4 text-text-inverse" />}
      </button>
    </m.div>
  );
});

export function PhotoGrid({
  photos,
  selectedIds,
  onSelect,
  onPhotoClick,
  isLoading = false,
}: PhotoGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-card-sm bg-surface-tertiary animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-surface-tertiary p-4 mb-4">
          <ImageIcon className="h-8 w-8 text-text-muted" />
        </div>
        <p className="font-body font-medium text-text-primary">No photos found</p>
        <p className="text-sm font-body text-text-muted mt-1">
          Upload photos or adjust your filters
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <AnimatePresence mode="popLayout">
        {photos.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            isSelected={selectedIds.has(photo.id)}
            onPhotoClick={onPhotoClick}
            onSelect={onSelect}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
