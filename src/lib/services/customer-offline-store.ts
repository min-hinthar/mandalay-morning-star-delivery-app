"use client";

/**
 * Customer Offline Store
 * IndexedDB-based cache for menu data with timestamp tracking
 * Follows existing driver offline-store.ts pattern
 */

const DB_NAME = "mms-customer-offline";
const DB_VERSION = 1;

const STORES = {
  MENU_CACHE: "menu-cache",
} as const;

interface MenuCacheEntry {
  id: "current"; // Single record pattern
  data: unknown;
  cachedAt: string;
  version: string;
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

      if (!db.objectStoreNames.contains(STORES.MENU_CACHE)) {
        db.createObjectStore(STORES.MENU_CACHE, { keyPath: "id" });
      }
    };
  });
}

// Generic store operations
async function putToStore<T extends { id: string }>(storeName: string, item: T): Promise<void> {
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

async function getFromStore<T>(storeName: string, key: string): Promise<T | null> {
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

/**
 * Menu cache operations (OFFLINE-07, OFFLINE-12)
 * Single record pattern - always uses "current" key
 */
export const menuCache = {
  /**
   * Save menu data to IndexedDB with current timestamp
   */
  async save(data: unknown, version: string = "v1"): Promise<void> {
    await putToStore(STORES.MENU_CACHE, {
      id: "current",
      data,
      cachedAt: new Date().toISOString(),
      version,
    } as MenuCacheEntry);
  },

  /**
   * Get cached menu data with metadata
   */
  async get(): Promise<{
    data: unknown;
    cachedAt: string;
    version: string;
  } | null> {
    const cached = await getFromStore<MenuCacheEntry>(STORES.MENU_CACHE, "current");
    if (!cached) return null;
    return {
      data: cached.data,
      cachedAt: cached.cachedAt,
      version: cached.version,
    };
  },

  /**
   * Check if cache is stale (default: 24 hours per CONTEXT.md)
   */
  isStale(cachedAt: string, thresholdHours: number = 24): boolean {
    const cacheTime = new Date(cachedAt).getTime();
    const now = Date.now();
    return now - cacheTime > thresholdHours * 60 * 60 * 1000;
  },

  /**
   * Get cache age in milliseconds
   */
  getAgeMs(cachedAt: string): number {
    return Date.now() - new Date(cachedAt).getTime();
  },

  /**
   * Clear all cached menu data
   */
  async clear(): Promise<void> {
    await clearStore(STORES.MENU_CACHE);
  },
};
