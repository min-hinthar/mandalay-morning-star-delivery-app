"use client";

import { useState, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { logger } from "@/lib/utils/logger";
import { toast } from "@/lib/hooks/useToastV8";
import { Button } from "@/components/ui/button";
import { PhotoUploadZone } from "@/components/ui/admin/photos/PhotoUploadZone";
import { PhotoGrid, type PhotoItem } from "@/components/ui/admin/photos/PhotoGrid";
import { PhotoMetadata } from "@/components/ui/admin/photos/PhotoMetadata";
import { PhotosStatsCards } from "./PhotosStatsCards";
import { PhotosFilters } from "./PhotosFilters";

interface PhotoStats {
  total: number;
  assigned: number;
  unassigned: number;
}

interface MenuItem {
  id: string;
  name: string;
  categoryName: string;
  imageUrl: string | null;
  basePriceCents: number;
}

type FilterType = "all" | "assigned" | "unassigned";

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [stats, setStats] = useState<PhotoStats>({ total: 0, assigned: 0, unassigned: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);

  const fetchPhotos = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (filter !== "all") params.set("filter", filter);

      const response = await fetch(`/api/admin/photos?${params}`);
      if (!response.ok) throw new Error("Failed to fetch photos");

      const data = await response.json();
      setPhotos(data.photos || []);
      setStats(data.stats || { total: 0, assigned: 0, unassigned: 0 });
    } catch {
      toast({
        message: "Failed to fetch photos",
        type: "error",
      });
    }
  }, [searchQuery, filter]);

  const fetchMenuItems = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/menu");
      if (!response.ok) throw new Error("Failed to fetch menu items");

      const json = await response.json();
      const data = json.data ?? json;
      setMenuItems(
        data.map(
          (item: {
            id: string;
            name_en: string;
            menu_categories: { name: string };
            image_url: string | null;
            base_price_cents: number;
          }) => ({
            id: item.id,
            name: item.name_en,
            categoryName: item.menu_categories?.name || "Unknown",
            imageUrl: item.image_url,
            basePriceCents: item.base_price_cents,
          })
        )
      );
    } catch {
      logger.error("Failed to fetch menu items", { api: "admin/photos" });
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchPhotos(), fetchMenuItems()]);
      setLoading(false);
    };
    load();
  }, [fetchPhotos, fetchMenuItems]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPhotos(), fetchMenuItems()]);
    setRefreshing(false);
  };

  const handleUploadComplete = () => {
    fetchPhotos();
    fetchMenuItems();
    toast({
      message: "Photos uploaded successfully",
      type: "success",
    });
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePhotoClick = (photo: PhotoItem) => {
    setSelectedPhoto(photo);
  };

  const handleAssign = async (photoId: string, menuItemId: string) => {
    try {
      const photo = photos.find((p) => p.id === photoId);
      if (!photo) return;

      const response = await fetch(`/api/admin/photos/${photoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId, imageUrl: photo.imageUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign photo");
      }

      toast({ message: "Photo assigned to menu item", type: "success" });
      fetchPhotos();
      fetchMenuItems();
      setSelectedPhoto(null);
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "Failed to assign photo",
        type: "error",
      });
    }
  };

  const handleDelete = async (photoId: string) => {
    try {
      const response = await fetch(`/api/admin/photos/${photoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete photo");
      }

      toast({ message: "Photo removed from menu item", type: "success" });
      fetchPhotos();
      fetchMenuItems();
      setSelectedPhoto(null);
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "Failed to delete photo",
        type: "error",
      });
    }
  };

  const handleGoogleDriveLink = async (photoId: string, url: string) => {
    try {
      const verifyResponse = await fetch("/api/admin/photos/verify-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const verifyData = await verifyResponse.json();
      if (!verifyData.valid && !verifyData.warning) {
        throw new Error(verifyData.error || "Invalid Drive URL");
      }

      const response = await fetch(`/api/admin/menu/${photoId}/photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: verifyData.previewUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save Drive URL");
      }

      toast({ message: "Photo URL updated", type: "success" });
      fetchPhotos();
      fetchMenuItems();
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "Failed to save Drive URL",
        type: "error",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected photos?`)) return;

    let successCount = 0;
    for (const id of selectedIds) {
      try {
        const response = await fetch(`/api/admin/photos/${id}`, {
          method: "DELETE",
        });
        if (response.ok) successCount++;
      } catch {
        // Continue with other deletions
      }
    }

    toast({
      message: `${successCount} of ${selectedIds.size} photos removed`,
      type: "success",
    });
    setSelectedIds(new Set());
    fetchPhotos();
    fetchMenuItems();
  };

  const filteredPhotos = photos.filter((photo) => {
    const matchesSearch =
      searchQuery === "" || photo.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-surface-tertiary rounded-input" />
          <div className="h-4 w-64 bg-surface-tertiary rounded-input" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-surface-tertiary rounded-card-sm" />
            ))}
          </div>
          <div className="h-32 bg-surface-tertiary rounded-card-sm" />
          <div className="h-96 bg-surface-tertiary rounded-card-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <m.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary">Photos</h1>
          <p className="font-body text-text-secondary mt-1">Upload and manage menu item photos</p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="border-border hover:bg-surface-tertiary"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </m.div>

      <PhotosStatsCards
        total={stats.total}
        assigned={stats.assigned}
        unassigned={stats.unassigned}
      />

      {/* Upload Zone */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <PhotoUploadZone onUploadComplete={handleUploadComplete} />
      </m.div>

      <PhotosFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filter={filter}
        onFilterChange={setFilter}
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onBulkDelete={handleBulkDelete}
      />

      {/* Main Content */}
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
            <PhotoGrid
              photos={filteredPhotos}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onPhotoClick={handlePhotoClick}
            />
          )}
        </div>

        <AnimatePresence>
          {selectedPhoto && (
            <PhotoMetadata
              photo={selectedPhoto}
              menuItems={menuItems}
              onClose={() => setSelectedPhoto(null)}
              onAssign={handleAssign}
              onDelete={handleDelete}
              onGoogleDriveLink={handleGoogleDriveLink}
            />
          )}
        </AnimatePresence>
      </m.div>
    </div>
  );
}
