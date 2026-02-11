"use client";

// IndexedDB Offline Store - Database Core
// Database open, generic CRUD operations

const DB_NAME = "mms-driver-offline";
const DB_VERSION = 1;

// Store names
export const STORES = {
  ROUTE_CACHE: "route-cache",
  PENDING_STATUS: "pending-status",
  PENDING_PHOTOS: "pending-photos",
  PENDING_LOCATIONS: "pending-locations",
} as const;

export interface RouteCache {
  id: string; // Uses routeId as key
  routeId: string;
  data: unknown;
  cachedAt: string;
}

export interface PendingStatusUpdate {
  id: string;
  routeId: string;
  stopId: string;
  idempotencyKey: string;
  status: string;
  deliveryNotes?: string;
  createdAt: string;
}

export interface PendingPhoto {
  id: string;
  routeId: string;
  stopId: string;
  idempotencyKey: string;
  blob: Blob;
  createdAt: string;
}

export interface PendingLocation {
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
export function openDB(): Promise<IDBDatabase> {
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
export async function addToStore<T extends { id: string }>(
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

export async function getFromStore<T>(
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

export async function getAllFromStore<T>(storeName: string): Promise<T[]> {
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

export async function deleteFromStore(storeName: string, key: string): Promise<void> {
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

export async function clearStore(storeName: string): Promise<void> {
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
