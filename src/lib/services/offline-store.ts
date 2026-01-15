"use client";

// IndexedDB Offline Store for Driver App
// Handles offline queuing of status updates, photos, and location data

const DB_NAME = "mms-driver-offline";
const DB_VERSION = 1;

// Store names
const STORES = {
  ROUTE_CACHE: "route-cache",
  PENDING_STATUS: "pending-status",
  PENDING_PHOTOS: "pending-photos",
  PENDING_LOCATIONS: "pending-locations",
} as const;

interface RouteCache {
  id: string; // Uses routeId as key
  routeId: string;
  data: unknown;
  cachedAt: string;
}

interface PendingStatusUpdate {
  id: string;
  routeId: string;
  stopId: string;
  status: string;
  deliveryNotes?: string;
  createdAt: string;
}

interface PendingPhoto {
  id: string;
  routeId: string;
  stopId: string;
  blob: Blob;
  createdAt: string;
}

interface PendingLocation {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  routeId?: string;
  createdAt: string;
}

// Open database
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not supported"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores
      if (!db.objectStoreNames.contains(STORES.ROUTE_CACHE)) {
        db.createObjectStore(STORES.ROUTE_CACHE, { keyPath: "routeId" });
      }

      if (!db.objectStoreNames.contains(STORES.PENDING_STATUS)) {
        const statusStore = db.createObjectStore(STORES.PENDING_STATUS, {
          keyPath: "id",
        });
        statusStore.createIndex("createdAt", "createdAt");
      }

      if (!db.objectStoreNames.contains(STORES.PENDING_PHOTOS)) {
        const photoStore = db.createObjectStore(STORES.PENDING_PHOTOS, {
          keyPath: "id",
        });
        photoStore.createIndex("createdAt", "createdAt");
      }

      if (!db.objectStoreNames.contains(STORES.PENDING_LOCATIONS)) {
        const locationStore = db.createObjectStore(STORES.PENDING_LOCATIONS, {
          keyPath: "id",
        });
        locationStore.createIndex("createdAt", "createdAt");
      }
    };
  });
}

// Generic store operations
async function addToStore<T extends { id: string }>(
  storeName: string,
  item: T
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();

    transaction.oncomplete = () => db.close();
  });
}

async function getFromStore<T>(
  storeName: string,
  key: string
): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result ?? null);

    transaction.oncomplete = () => db.close();
  });
}

async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result ?? []);

    transaction.oncomplete = () => db.close();
  });
}

async function deleteFromStore(storeName: string, key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();

    transaction.oncomplete = () => db.close();
  });
}

async function clearStore(storeName: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();

    transaction.oncomplete = () => db.close();
  });
}

// Route cache operations
export const routeCache = {
  async save(routeId: string, data: unknown): Promise<void> {
    await addToStore(STORES.ROUTE_CACHE, {
      id: routeId,
      routeId,
      data,
      cachedAt: new Date().toISOString(),
    } as RouteCache);
  },

  async get(routeId: string): Promise<unknown | null> {
    const cached = await getFromStore<RouteCache>(STORES.ROUTE_CACHE, routeId);
    return cached?.data ?? null;
  },

  async clear(): Promise<void> {
    await clearStore(STORES.ROUTE_CACHE);
  },
};

// Pending status updates
export const pendingStatus = {
  async add(
    routeId: string,
    stopId: string,
    status: string,
    deliveryNotes?: string
  ): Promise<void> {
    await addToStore(STORES.PENDING_STATUS, {
      id: crypto.randomUUID(),
      routeId,
      stopId,
      status,
      deliveryNotes,
      createdAt: new Date().toISOString(),
    } as PendingStatusUpdate);
  },

  async getAll(): Promise<PendingStatusUpdate[]> {
    return getAllFromStore<PendingStatusUpdate>(STORES.PENDING_STATUS);
  },

  async remove(id: string): Promise<void> {
    await deleteFromStore(STORES.PENDING_STATUS, id);
  },

  async clear(): Promise<void> {
    await clearStore(STORES.PENDING_STATUS);
  },
};

// Pending photos
export const pendingPhotos = {
  async add(routeId: string, stopId: string, blob: Blob): Promise<void> {
    await addToStore(STORES.PENDING_PHOTOS, {
      id: crypto.randomUUID(),
      routeId,
      stopId,
      blob,
      createdAt: new Date().toISOString(),
    } as PendingPhoto);
  },

  async getAll(): Promise<PendingPhoto[]> {
    return getAllFromStore<PendingPhoto>(STORES.PENDING_PHOTOS);
  },

  async remove(id: string): Promise<void> {
    await deleteFromStore(STORES.PENDING_PHOTOS, id);
  },

  async clear(): Promise<void> {
    await clearStore(STORES.PENDING_PHOTOS);
  },
};

// Pending locations
export const pendingLocations = {
  async add(
    latitude: number,
    longitude: number,
    accuracy: number,
    heading: number | null,
    speed: number | null,
    routeId?: string
  ): Promise<void> {
    await addToStore(STORES.PENDING_LOCATIONS, {
      id: crypto.randomUUID(),
      latitude,
      longitude,
      accuracy,
      heading,
      speed,
      routeId,
      createdAt: new Date().toISOString(),
    } as PendingLocation);
  },

  async getAll(): Promise<PendingLocation[]> {
    return getAllFromStore<PendingLocation>(STORES.PENDING_LOCATIONS);
  },

  async remove(id: string): Promise<void> {
    await deleteFromStore(STORES.PENDING_LOCATIONS, id);
  },

  async clear(): Promise<void> {
    await clearStore(STORES.PENDING_LOCATIONS);
  },
};

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
