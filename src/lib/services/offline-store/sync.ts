"use client";

// IndexedDB Offline Store - Sync Logic
// Sync pending items when online, get pending counts

import { pendingStatus, pendingPhotos, pendingLocations } from "./stores";

// Sync all pending items when online
export async function syncPendingItems(): Promise<{
  statusSynced: number;
  photosSynced: number;
  locationsSynced: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let statusSynced = 0;
  let photosSynced = 0;
  let locationsSynced = 0;

  // Sync pending status updates
  const statusUpdates = await pendingStatus.getAll();
  for (const update of statusUpdates) {
    try {
      const response = await fetch(
        `/api/driver/routes/${update.routeId}/stops/${update.stopId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: update.status,
            deliveryNotes: update.deliveryNotes,
          }),
        }
      );

      if (response.ok) {
        await pendingStatus.remove(update.id);
        statusSynced++;
      } else {
        errors.push(`Status update for stop ${update.stopId} failed`);
      }
    } catch {
      errors.push(`Network error syncing status for stop ${update.stopId}`);
    }
  }

  // Sync pending photos
  const photos = await pendingPhotos.getAll();
  for (const photo of photos) {
    try {
      const formData = new FormData();
      formData.append("photo", photo.blob, "delivery-photo.jpg");

      const response = await fetch(
        `/api/driver/routes/${photo.routeId}/stops/${photo.stopId}/photo`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        await pendingPhotos.remove(photo.id);
        photosSynced++;
      } else {
        errors.push(`Photo upload for stop ${photo.stopId} failed`);
      }
    } catch {
      errors.push(`Network error uploading photo for stop ${photo.stopId}`);
    }
  }

  // Sync pending locations
  const locations = await pendingLocations.getAll();
  for (const loc of locations) {
    try {
      const response = await fetch("/api/driver/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy,
          heading: loc.heading,
          speed: loc.speed,
          routeId: loc.routeId,
        }),
      });

      if (response.ok || response.status === 429) {
        // Remove even if rate limited - location is outdated anyway
        await pendingLocations.remove(loc.id);
        if (response.ok) locationsSynced++;
      } else {
        errors.push("Location sync failed");
      }
    } catch {
      errors.push("Network error syncing location");
    }
  }

  return { statusSynced, photosSynced, locationsSynced, errors };
}

// Get pending counts for UI
export async function getPendingCounts(): Promise<{
  status: number;
  photos: number;
  locations: number;
}> {
  const [statusUpdates, photos, locations] = await Promise.all([
    pendingStatus.getAll(),
    pendingPhotos.getAll(),
    pendingLocations.getAll(),
  ]);

  return {
    status: statusUpdates.length,
    photos: photos.length,
    locations: locations.length,
  };
}
