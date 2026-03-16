"use client";

import { m, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import {
  PhotoGrid as PhotoGridComponent,
  type PhotoItem,
} from "@/components/ui/admin/photos/PhotoGrid";
import { PhotoMetadata } from "@/components/ui/admin/photos/PhotoMetadata";

interface MenuItem {
  id: string;
  slug: string;
  name: string;
  categoryName: string;
  imageUrl: string | null;
  basePriceCents: number;
}

interface PhotoGridSectionProps {
  filteredPhotos: PhotoItem[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onPhotoClick: (photo: PhotoItem) => void;
  selectedPhoto: PhotoItem | null;
  menuItems: MenuItem[];
  onCloseMetadata: () => void;
  onAssign: (photoId: string, menuItemId: string) => Promise<void>;
  onDelete: (photoId: string) => Promise<void>;
  onGoogleDriveLink: (photoId: string, url: string) => Promise<void>;
  searchQuery: string;
  filter: string;
}

export function PhotoGridSection({
  filteredPhotos,
  selectedIds,
  onSelect,
  onPhotoClick,
  selectedPhoto,
  menuItems,
  onCloseMetadata,
  onAssign,
  onDelete,
  onGoogleDriveLink,
  searchQuery,
  filter,
}: PhotoGridSectionProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="flex gap-6"
    >
      <div className="flex-1">
        {filteredPhotos.length === 0 ? (
          <div className="text-center py-16 bg-surface-secondary rounded-card-sm border border-border">
            <AlertCircle className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <h2 className="text-lg font-display font-medium text-text-primary mb-2">
              No photos found
            </h2>
            <p className="font-body text-text-secondary">
              {searchQuery || filter !== "all"
                ? "Try adjusting your filters"
                : "Upload photos to get started"}
            </p>
          </div>
        ) : (
          <PhotoGridComponent
            photos={filteredPhotos}
            selectedIds={selectedIds}
            onSelect={onSelect}
            onPhotoClick={onPhotoClick}
          />
        )}
      </div>

      <AnimatePresence>
        {selectedPhoto && (
          <PhotoMetadata
            photo={selectedPhoto}
            menuItems={menuItems}
            onClose={onCloseMetadata}
            onAssign={onAssign}
            onDelete={onDelete}
            onGoogleDriveLink={onGoogleDriveLink}
          />
        )}
      </AnimatePresence>
    </m.div>
  );
}
