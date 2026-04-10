"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * CFIX-10: localStorage-backed mute preference for tracking audio notifications.
 *
 * - SSR-safe: renders `isMuted: false` default during SSR, reads localStorage post-mount.
 * - Global scope: single key ("trackingAudioMuted") persists across orders and sessions.
 * - Hydration flag: `isHydrated` indicates when localStorage has been read.
 *
 * Mirrors the SSR-safe pattern from useAnimationPreference.ts:41-59.
 */

const STORAGE_KEY = "trackingAudioMuted";

export interface MutePreferenceReturn {
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
  isHydrated: boolean;
}

export function useMutePreference(): MutePreferenceReturn {
  const [isMuted, setIsMuted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") {
        setIsMuted(true);
      } else {
        setIsMuted(false);
      }
    } catch {
      // localStorage unavailable (private mode, quota, etc.) — fall back to unmuted.
      setIsMuted(false);
    }
    setIsHydrated(true);
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, muted ? "true" : "false");
    } catch {
      // Write failed (quota exceeded) — in-memory state still updates below.
    }
    setIsMuted(muted);
  }, []);

  const toggleMuted = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "true" : "false");
      } catch {
        // Silent failure — keep in-memory state consistent.
      }
      return next;
    });
  }, []);

  return { isMuted, setMuted, toggleMuted, isHydrated };
}
