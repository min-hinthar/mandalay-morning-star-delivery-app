"use client";

// IndexedDB Offline Store - Retry & Expiry Utilities
// Exponential backoff, idempotent retries, and expired entry purge

import { pendingStatus, pendingPhotos, pendingLocations } from "./stores";

export function getBackoffDelay(attempt: number, baseMs = 2000, maxMs = 32000): number {
  return Math.min(baseMs * Math.pow(2, attempt), maxMs);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface RetryResult {
  ok: boolean;
  status: number;
  permanentFailure: boolean;
}

export async function retryWithBackoff(
  url: string,
  options: RequestInit,
  idempotencyKey: string,
  maxAttempts = 5
): Promise<RetryResult> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          "Idempotency-Key": idempotencyKey,
        },
      });

      if (response.ok) {
        return { ok: true, status: response.status, permanentFailure: false };
      }

      if (response.status >= 400 && response.status < 500) {
        return {
          ok: false,
          status: response.status,
          permanentFailure: true,
        };
      }

      if (response.status >= 500) {
        console.warn(`Retry attempt ${attempt + 1}/${maxAttempts} for ${url}: ${response.status}`);
      }
    } catch (error) {
      // Network errors (TypeError from fetch)
      console.warn(`Retry attempt ${attempt + 1}/${maxAttempts} for ${url}: network error`, error);
    }

    // Backoff between attempts (skip after last attempt)
    if (attempt < maxAttempts - 1) {
      await sleep(getBackoffDelay(attempt));
    }
  }

  return { ok: false, status: 0, permanentFailure: false };
}

export async function purgeExpiredEntries(maxAgeMs = 2 * 60 * 60 * 1000): Promise<number> {
  const now = Date.now();
  let purged = 0;

  const [statuses, photos, locations] = await Promise.all([
    pendingStatus.getAll(),
    pendingPhotos.getAll(),
    pendingLocations.getAll(),
  ]);

  for (const item of statuses) {
    if (now - new Date(item.createdAt).getTime() > maxAgeMs) {
      await pendingStatus.remove(item.id);
      purged++;
    }
  }

  for (const item of photos) {
    if (now - new Date(item.createdAt).getTime() > maxAgeMs) {
      await pendingPhotos.remove(item.id);
      purged++;
    }
  }

  for (const item of locations) {
    if (now - new Date(item.createdAt).getTime() > maxAgeMs) {
      await pendingLocations.remove(item.id);
      purged++;
    }
  }

  return purged;
}
