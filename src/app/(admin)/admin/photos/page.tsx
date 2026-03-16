"use client";

import { useState, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/hooks/useToastV8";
import { Button } from "@/components/ui/button";
import { PhotoUploadZone } from "@/components/ui/admin/photos/PhotoUploadZone";
import { BulkUploadMatcher } from "@/components/ui/admin/photos/BulkUploadMatcher";
import { type PhotoItem } from "@/components/ui/admin/photos/PhotoGrid";
import { PhotosStatsCards } from "./PhotosStatsCards";
import { PhotosFilters } from "./PhotosFilters";
import { PhotoGridSection, usePhotoHandlers, usePhotoData } from "./PhotosPage";

interface MenuItem {
  id: string;
  slug: string;
  name: string;
  categoryName: string;
  imageUrl: string | null;
  basePriceCents: number;
}

interface PhotoStats {
  total: number;
  assigned: number;
  unassigned: number;
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
  const [bulkFiles, setBulkFiles] = useState<File[] | null>(null);

  const { fetchPhotos: fetchPhotosRaw, fetchMenuItems: fetchMenuItemsRaw } = usePhotoData();

  const fetchPhotos = useCallback(async () => {
    try {
      const data = await fetchPhotosRaw(searchQuery, filter);
      setPhotos(data.photos || []);
      setStats(data.stats || { total: 0, assigned: 0, unassigned: 0 });
    } catch {
      toast({ message: "Failed to fetch photos", type: "error" });
    }
  }, [fetchPhotosRaw, searchQuery, filter]);

  const fetchMenuItems = useCallback(async () => {
    const items = await fetchMenuItemsRaw();
    setMenuItems(items);
  }, [fetchMenuItemsRaw]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchPhotos(), fetchMenuItems()]);
      setLoading(false);
    };
    load();
  }, [fetchPhotos, fetchMenuItems]);

  const handlers = usePhotoHandlers({
    photos,
    setPhotos,
    setMenuItems,
    setSelectedIds,
    setSelectedPhoto,
    setBulkFiles,
    fetchPhotos,
    fetchMenuItems,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPhotos(), fetchMenuItems()]);
    setRefreshing(false);
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
    <div
      className="p-4 md:p-8 space-y-6"
      onDrop={handlers.handlePageDrop}
      onDragOver={handlers.handlePageDragOver}
    >
      <AnimatePresence>
        {bulkFiles && (
          <BulkUploadMatcher
            files={bulkFiles}
            menuItems={menuItems}
            onComplete={handlers.handleBulkUploadComplete}
            onCancel={() => setBulkFiles(null)}
          />
        )}
      </AnimatePresence>

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

      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <PhotoUploadZone onUploadComplete={handlers.handleUploadComplete} />
      </m.div>

      <PhotosFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filter={filter}
        onFilterChange={setFilter}
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onBulkDelete={() => handlers.handleBulkDelete(selectedIds)}
      />

      <PhotoGridSection
        filteredPhotos={filteredPhotos}
        selectedIds={selectedIds}
        onSelect={handlers.handleSelect}
        onPhotoClick={handlers.handlePhotoClick}
        selectedPhoto={selectedPhoto}
        menuItems={menuItems}
        onCloseMetadata={() => setSelectedPhoto(null)}
        onAssign={handlers.handleAssign}
        onDelete={handlers.handleDelete}
        onGoogleDriveLink={handlers.handleGoogleDriveLink}
        searchQuery={searchQuery}
        filter={filter}
      />
    </div>
  );
}
