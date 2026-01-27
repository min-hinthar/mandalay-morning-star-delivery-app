"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

/**
 * V7 Animation preference levels
 * - full: Maximum playfulness - all animations enabled (DEFAULT)
 * - reduced: Essential animations only
 * - none: All animations disabled
 *
 * V7 PHILOSOPHY: Animations are ON by default.
 * We ignore prefers-reduced-motion OS setting.
 * Users must manually toggle if they want reduced motion.
 */
export type AnimationPreference = "full" | "reduced" | "none";

const STORAGE_KEY = "animation-preference";
const DATA_ATTRIBUTE = "data-motion";

/**
 * V7 Hook to manage animation preferences
 *
 * Key difference from V5/V6:
 * - Defaults to "full" regardless of OS setting
 * - User must explicitly opt-in to reduced motion
 * - Provides more granular control and callbacks
 *
 * @example
 * const {
 *   preference,
 *   setPreference,
 *   isFullMotion,
 *   isReduced,
 *   isDisabled,
 *   shouldAnimate,
 *   getSpring,
 * } = useAnimationPreference();
 */
export function useAnimationPreference() {
  const [preference, setPreferenceState] = useState<AnimationPreference>("full");
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasCustomPreference, setHasCustomPreference] = useState(false);

  // Initialize on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as AnimationPreference | null;
    const validStored =
      stored === "full" || stored === "reduced" || stored === "none" ? stored : null;

    // V7: Default to "full" - no OS preference check
    const initialPref = validStored ?? "full";

    setPreferenceState(initialPref);
    setIsHydrated(true);
    setHasCustomPreference(stored !== null);

    // Apply data attribute for CSS targeting
    document.documentElement.setAttribute(DATA_ATTRIBUTE, initialPref);
  }, []);

  /**
   * Update animation preference
   */
  const setPreference = useCallback((newPref: AnimationPreference) => {
    localStorage.setItem(STORAGE_KEY, newPref);
    setPreferenceState(newPref);
    document.documentElement.setAttribute(DATA_ATTRIBUTE, newPref);
  }, []);

  /**
   * Reset to default (full animations)
   */
  const resetToDefault = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPreferenceState("full");
    document.documentElement.setAttribute(DATA_ATTRIBUTE, "full");
  }, []);

  /**
   * Toggle between full and reduced
   */
  const toggleReduced = useCallback(() => {
    const newPref = preference === "full" ? "reduced" : "full";
    setPreference(newPref);
  }, [preference, setPreference]);

  /**
   * Cycle through all options: full -> reduced -> none -> full
   */
  const cyclePreference = useCallback(() => {
    const cycle: AnimationPreference[] = ["full", "reduced", "none"];
    const currentIndex = cycle.indexOf(preference);
    const nextIndex = (currentIndex + 1) % cycle.length;
    setPreference(cycle[nextIndex]);
  }, [preference, setPreference]);

  // Computed values
  const isFullMotion = preference === "full";
  const isReduced = preference === "reduced";
  const isDisabled = preference === "none";
  const shouldAnimate = preference !== "none";

  /**
   * Get spring config based on preference
   * Returns instant spring for reduced/none
   */
  const getSpring = useCallback(
    <T extends object>(fullSpring: T): T | { duration: 0 } => {
      if (!shouldAnimate) {
        return { duration: 0 };
      }
      if (isReduced) {
        // Reduced: use gentler spring
        return {
          ...fullSpring,
          stiffness: 200,
          damping: 30,
        } as T;
      }
      return fullSpring;
    },
    [shouldAnimate, isReduced]
  );

  /**
   * Get duration multiplier based on preference
   * 1 = full, 0.5 = reduced, 0 = none
   */
  const durationMultiplier = useMemo(() => {
    if (isDisabled) return 0;
    if (isReduced) return 0.5;
    return 1;
  }, [isDisabled, isReduced]);

  /**
   * Scale a duration based on preference
   */
  const scaleDuration = useCallback(
    (duration: number): number => {
      return duration * durationMultiplier;
    },
    [durationMultiplier]
  );

  /**
   * Get animation props conditionally
   * Returns empty object if animations disabled
   */
  const getAnimationProps = useCallback(
    <T extends object>(props: T): T | Record<string, never> => {
      if (!shouldAnimate) {
        return {};
      }
      return props;
    },
    [shouldAnimate]
  );

  return {
    // State
    preference,
    isHydrated,
    hasCustomPreference,

    // Boolean flags
    isFullMotion,
    isReduced,
    isDisabled,
    shouldAnimate,

    // Actions
    setPreference,
    resetToDefault,
    toggleReduced,
    cyclePreference,

    // Utilities
    getSpring,
    durationMultiplier,
    scaleDuration,
    getAnimationProps,
  };
}

// ============================================
// NON-HOOK UTILITIES
// ============================================

/**
 * Get current animation preference (one-time, non-reactive)
 * Use in non-component code
 */
export function getAnimationPreference(): AnimationPreference {
  if (typeof window === "undefined") return "full";
  const stored = localStorage.getItem(STORAGE_KEY) as AnimationPreference | null;
  return stored === "full" || stored === "reduced" || stored === "none"
    ? stored
    : "full";
}

/**
 * Check if animations should run (one-time)
 */
export function shouldAnimate(): boolean {
  return getAnimationPreference() !== "none";
}

/**
 * Check if full motion is enabled (one-time)
 */
export function isFullMotion(): boolean {
  return getAnimationPreference() === "full";
}

/**
 * CSS data attribute for targeting in styles
 *
 * @example
 * // In CSS/Tailwind
 * [data-motion="none"] .animate-class { animation: none; }
 * [data-motion="reduced"] .animate-class { animation-duration: 0.01s; }
 */
export const motionDataAttribute = DATA_ATTRIBUTE;

/**
 * CSS selector helpers
 */
export const motionSelectors = {
  full: `[${DATA_ATTRIBUTE}="full"]`,
  reduced: `[${DATA_ATTRIBUTE}="reduced"]`,
  none: `[${DATA_ATTRIBUTE}="none"]`,
} as const;
