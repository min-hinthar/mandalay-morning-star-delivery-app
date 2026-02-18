"use client";

// IndexedDB Offline Store - Cache Stores
// Route cache, pending status, photos, and location stores

import {
  STORES,
  addToStore,
  getFromStore,
  getAllFromStore,
  deleteFromStore,
  clearStore,
} from "./db";
import type { RouteCache, PendingStatusUpdate, PendingPhoto, PendingLocation } from "./db";

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
    deliveryNotes?: string,
    idempotencyKey?: string
  ): Promise<void> {
    await addToStore(STORES.PENDING_STATUS, {
      id: crypto.randomUUID(),
      routeId,
      stopId,
      idempotencyKey: idempotencyKey ?? crypto.randomUUID(),
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
  async add(routeId: string, stopId: string, blob: Blob, idempotencyKey?: string): Promise<void> {
    await addToStore(STORES.PENDING_PHOTOS, {
      id: crypto.randomUUID(),
      routeId,
      stopId,
      idempotencyKey: idempotencyKey ?? crypto.randomUUID(),
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
