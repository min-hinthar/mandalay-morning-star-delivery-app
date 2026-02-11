"use client";

// IndexedDB Offline Store - Sync Logic
// Sync pending items when online with exponential backoff and idempotency

import { pendingStatus, pendingPhotos, pendingLocations } from "./stores";
import { retryWithBackoff } from "./retry";

// Sync all pending items when online
export async function syncPendingItems(): Promise<{
  statusSynced: number;
  photosSynced: number;
  locationsSynced: number;
  permanentFailures: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let statusSynced = 0;
  let photosSynced = 0;
  let locationsSynced = 0;
  let permanentFailures = 0;

  // Sync pending status updates (FIFO by createdAt)
  const statusUpdates = await pendingStatus.getAll();
  const sortedStatuses = statusUpdates.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  for (const update of sortedStatuses) {
    const result = await retryWithBackoff(
      `/api/driver/routes/${update.routeId}/stops/${update.stopId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: update.status,
          deliveryNotes: update.deliveryNotes,
        }),
      },
      update.idempotencyKey
    );

    if (result.ok) {
      await pendingStatus.remove(update.id);
      statusSynced++;
    } else if (result.permanentFailure) {
      await pendingStatus.remove(update.id);
      permanentFailures++;
      const msg = `[PERMANENT] Status update for stop ${update.stopId} failed: ${result.status}`;
      errors.push(msg);
      console.error(msg);
    } else {
      errors.push(
        `Status update for stop ${update.stopId} failed after retries`
      );
    }
  }

  // Sync pending photos (FIFO by createdAt)
  const photos = await pendingPhotos.getAll();
  const sortedPhotos = photos.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  for (const photo of sortedPhotos) {
    const formData = new FormData();
    formData.append("photo", photo.blob, "delivery-photo.jpg");

    const result = await retryWithBackoff(
      `/api/driver/routes/${photo.routeId}/stops/${photo.stopId}/photo`,
      {
        method: "POST",
        body: formData,
      },
      photo.idempotencyKey
    );

    if (result.ok) {
      await pendingPhotos.remove(photo.id);
      photosSynced++;
    } else if (result.permanentFailure) {
      await pendingPhotos.remove(photo.id);
      permanentFailures++;
      const msg = `[PERMANENT] Photo upload for stop ${photo.stopId} failed: ${result.status}`;
      errors.push(msg);
      console.error(msg);
    } else {
      errors.push(
        `Photo upload for stop ${photo.stopId} failed after retries`
      );
    }
  }

  // Sync pending locations (fire-and-forget, no idempotency, no backoff)
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

  return {
    statusSynced,
    photosSynced,
    locationsSynced,
    permanentFailures,
    errors,
  };
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
