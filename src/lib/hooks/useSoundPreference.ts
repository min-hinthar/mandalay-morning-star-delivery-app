"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Simple sound preference toggle hook.
 * Reads/writes the same "soundEffectsEnabled" localStorage key as useSoundEffect
 * so both hooks stay in sync.
 *
 * Unlike useSoundEffect, this hook does NOT create an AudioContext or play sounds.
 * It's purely for the settings UI toggle.
 *
 * @example
 * const { isEnabled, setEnabled } = useSoundPreference();
 * <ToggleSwitch checked={isEnabled} onChange={setEnabled} />
 */
const STORAGE_KEY = "soundEffectsEnabled";

export function useSoundPreference() {
  const [isEnabled, setIsEnabled] = useState(true);

  // Read stored preference on mount (hydration-safe)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setIsEnabled(stored !== "false");
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(enabled));
    setIsEnabled(enabled);
  }, []);

  return { isEnabled, setEnabled };
}
