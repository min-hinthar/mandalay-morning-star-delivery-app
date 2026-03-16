"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import { type PhotoItem } from "@/components/ui/admin/photos/PhotoGrid";
import { toast } from "@/lib/hooks/useToastV8";
import { logger } from "@/lib/utils/logger";

interface MenuItem {
  id: string;
  slug: string;
  name: string;
  categoryName: string;
  imageUrl: string | null;
  basePriceCents: number;
}

interface UsePhotoHandlersOptions {
  photos: PhotoItem[];
  setPhotos: Dispatch<SetStateAction<PhotoItem[]>>;
  setMenuItems: Dispatch<SetStateAction<MenuItem[]>>;
  setSelectedIds: Dispatch<SetStateAction<Set<string>>>;
  setSelectedPhoto: Dispatch<SetStateAction<PhotoItem | null>>;
  setBulkFiles: Dispatch<SetStateAction<File[] | null>>;
  fetchPhotos: () => Promise<void>;
  fetchMenuItems: () => Promise<void>;
}

export function usePhotoHandlers({
  photos,
  setSelectedIds,
  setSelectedPhoto,
  setBulkFiles,
  fetchPhotos,
  fetchMenuItems,
}: UsePhotoHandlersOptions) {
  const handleUploadComplete = useCallback(() => {
    fetchPhotos();
    fetchMenuItems();
    toast({
      message: "Photos uploaded successfully",
      type: "success",
    });
  }, [fetchPhotos, fetchMenuItems]);

  const handleBulkUploadComplete = useCallback(() => {
    setBulkFiles(null);
    fetchPhotos();
    fetchMenuItems();
  }, [setBulkFiles, fetchPhotos, fetchMenuItems]);

  const handlePageDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
      if (files.length > 1) {
        setBulkFiles(files);
      }
      // Single file drops handled by PhotoUploadZone naturally
    },
    [setBulkFiles]
  );

  const handlePageDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    },
    [setSelectedIds]
  );

  const handlePhotoClick = useCallback(
    (photo: PhotoItem) => {
      setSelectedPhoto(photo);
    },
    [setSelectedPhoto]
  );

  const handleAssign = useCallback(
    async (photoId: string, menuItemId: string) => {
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
    },
    [photos, fetchPhotos, fetchMenuItems, setSelectedPhoto]
  );

  const handleDelete = useCallback(
    async (photoId: string) => {
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
    },
    [fetchPhotos, fetchMenuItems, setSelectedPhoto]
  );

  const handleGoogleDriveLink = useCallback(
    async (photoId: string, url: string) => {
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
    },
    [fetchPhotos, fetchMenuItems]
  );

  const handleBulkDelete = useCallback(
    async (selectedIds: Set<string>) => {
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
    },
    [setSelectedIds, fetchPhotos, fetchMenuItems]
  );

  return {
    handleUploadComplete,
    handleBulkUploadComplete,
    handlePageDrop,
    handlePageDragOver,
    handleSelect,
    handlePhotoClick,
    handleAssign,
    handleDelete,
    handleGoogleDriveLink,
    handleBulkDelete,
  };
}

export function usePhotoData() {
  const fetchPhotos = useCallback(async (searchQuery: string, filter: string) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (filter !== "all") params.set("filter", filter);

    const response = await fetch(`/api/admin/photos?${params}`);
    if (!response.ok) throw new Error("Failed to fetch photos");

    return response.json();
  }, []);

  const fetchMenuItems = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/menu?limit=500");
      if (!response.ok) throw new Error("Failed to fetch menu items");

      const json = await response.json();
      const data = json.data ?? json;
      return data.map(
        (item: {
          id: string;
          slug: string;
          name_en: string;
          menu_categories: { name: string };
          image_url: string | null;
          base_price_cents: number;
        }) => ({
          id: item.id,
          slug: item.slug,
          name: item.name_en,
          categoryName: item.menu_categories?.name || "Unknown",
          imageUrl: item.image_url,
          basePriceCents: item.base_price_cents,
        })
      );
    } catch {
      logger.error("Failed to fetch menu items", { api: "admin/photos" });
      return [];
    }
  }, []);

  return { fetchPhotos, fetchMenuItems };
}
