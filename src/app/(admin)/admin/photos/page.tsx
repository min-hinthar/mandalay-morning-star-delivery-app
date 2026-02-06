/**
 * V6 Admin Photos Page - Pepper Aesthetic
 *
 * Photo management page with drag-drop upload, search, and assignment.
 * Features stats cards, filter tabs, and photo grid.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Search,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  HardDrive,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PhotoUploadZone } from "@/components/ui/admin/photos/PhotoUploadZone";
import { PhotoGrid, type PhotoItem } from "@/components/ui/admin/photos/PhotoGrid";
import { PhotoMetadata } from "@/components/ui/admin/photos/PhotoMetadata";

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
        title: "Error",
        description: "Failed to fetch photos",
        variant: "destructive",
      });
    }
  }, [searchQuery, filter]);

  const fetchMenuItems = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/menu");
      if (!response.ok) throw new Error("Failed to fetch menu items");

      const data = await response.json();
      setMenuItems(
        data.map((item: { id: string; name_en: string; menu_categories: { name: string }; image_url: string | null; base_price_cents: number }) => ({
          id: item.id,
          name: item.name_en,
          categoryName: item.menu_categories?.name || "Unknown",
          imageUrl: item.image_url,
          basePriceCents: item.base_price_cents,
        }))
      );
    } catch {
      console.error("Failed to fetch menu items");
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
      title: "Upload complete",
      description: "Photos uploaded successfully",
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

      toast({ title: "Photo assigned", description: "Photo assigned to menu item" });
      fetchPhotos();
      fetchMenuItems();
      setSelectedPhoto(null);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to assign photo",
        variant: "destructive",
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

      toast({ title: "Photo removed", description: "Photo removed from menu item" });
      fetchPhotos();
      fetchMenuItems();
      setSelectedPhoto(null);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete photo",
        variant: "destructive",
      });
    }
  };

  const handleGoogleDriveLink = async (photoId: string, url: string) => {
    try {
      // First verify the URL
      const verifyResponse = await fetch("/api/admin/photos/verify-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const verifyData = await verifyResponse.json();
      if (!verifyData.valid && !verifyData.warning) {
        throw new Error(verifyData.error || "Invalid Drive URL");
      }

      // Then update the menu item
      const response = await fetch(`/api/admin/menu/${photoId}/photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: verifyData.previewUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save Drive URL");
      }

      toast({ title: "Drive URL saved", description: "Photo URL updated" });
      fetchPhotos();
      fetchMenuItems();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save Drive URL",
        variant: "destructive",
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
      title: "Bulk delete complete",
      description: `${successCount} of ${selectedIds.size} photos removed`,
    });
    setSelectedIds(new Set());
    fetchPhotos();
    fetchMenuItems();
  };

  const filteredPhotos = photos.filter((photo) => {
    const matchesSearch =
      searchQuery === "" ||
      photo.name.toLowerCase().includes(searchQuery.toLowerCase());
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
          <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary">
            Photos
          </h1>
          <p className="font-body text-text-secondary mt-1">
            Upload and manage menu item photos
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="border-border hover:bg-surface-tertiary"
        >
          <RefreshCw
            className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")}
          />
          Refresh
        </Button>
      </m.div>

      {/* Stats Cards */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Total Photos */}
        <div className="relative overflow-hidden rounded-card-sm bg-surface-secondary border border-border p-4 shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-primary">
              <ImageIcon className="h-5 w-5" />
              <span className="text-sm font-body font-medium">Total Photos</span>
            </div>
            <p className="text-3xl font-display font-bold text-text-primary mt-2">
              {stats.total}
            </p>
          </div>
        </div>

        {/* Assigned */}
        <div className="relative overflow-hidden rounded-card-sm bg-green/5 border border-green/20 p-4 shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-green">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-body font-medium">Assigned</span>
            </div>
            <p className="text-3xl font-display font-bold text-text-primary mt-2">
              {stats.assigned}
            </p>
          </div>
        </div>

        {/* Storage */}
        <div className="relative overflow-hidden rounded-card-sm bg-secondary/5 border border-secondary/20 p-4 shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-secondary-hover">
              <HardDrive className="h-5 w-5" />
              <span className="text-sm font-body font-medium">Unassigned</span>
            </div>
            <p className="text-3xl font-display font-bold text-text-primary mt-2">
              {stats.unassigned}
            </p>
          </div>
        </div>
      </m.div>

      {/* Upload Zone */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <PhotoUploadZone onUploadComplete={handleUploadComplete} />
      </m.div>

      {/* Filters */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search by item name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-surface-primary border-border focus:border-primary focus:ring-primary/20 rounded-input"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "assigned", "unassigned"] as FilterType[]).map((f) => (
            <Badge
              key={f}
              variant={filter === f ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-all duration-fast font-body capitalize",
                filter === f
                  ? "bg-primary hover:bg-primary-hover text-text-inverse border-transparent"
                  : "bg-surface-primary border-border text-text-primary hover:bg-primary/10 hover:border-primary/30"
              )}
              onClick={() => setFilter(f)}
            >
              {f}
            </Badge>
          ))}
        </div>
      </m.div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-4 p-3 bg-primary/10 border border-primary/30 rounded-card-sm"
          >
            <span className="font-body text-sm text-primary font-medium">
              {selectedIds.size} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              className="border-status-error/30 text-status-error hover:bg-status-error/10"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </m.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex gap-6"
      >
        {/* Photo Grid */}
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

        {/* Side Panel */}
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
