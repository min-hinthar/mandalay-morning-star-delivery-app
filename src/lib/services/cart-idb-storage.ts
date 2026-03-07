import { get, set, del } from "idb-keyval";
import type { StateStorage } from "zustand/middleware";
import { logger } from "@/lib/utils/logger";

export const cartIDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    // Try IndexedDB first
    const idbValue = await get<string>(name);
    if (idbValue != null) return idbValue;

    // Migration: check localStorage for existing data
    if (typeof window !== "undefined") {
      try {
        const lsValue = localStorage.getItem(name);
        if (lsValue) {
          // Migrate to IndexedDB
          await set(name, lsValue);
          // Clean up localStorage
          localStorage.removeItem(name);
          logger.info("[cart-idb] Migrated cart from localStorage to IndexedDB");
          return lsValue;
        }
      } catch {
        // localStorage may be unavailable
      }
    }

    return null;
  },

  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },

  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};
