"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Animation preference levels
 * - full: All animations enabled
 * - reduced: Only essential animations (matches prefers-reduced-motion)
 * - none: All animations disabled
 */
export type AnimationPreference = "full" | "reduced" | "none";

const STORAGE_KEY = "animation-preference";
const DATA_ATTRIBUTE = "data-animation";

/**
 * Get the system's reduced motion preference
 */
function getSystemPreference(): AnimationPreference {
  if (typeof window === "undefined") return "full";
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "reduced"
    : "full";
}

/**
 * Get stored preference from localStorage
 */
function getStoredPreference(): AnimationPreference | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "full" || stored === "reduced" || stored === "none") {
    return stored;
  }
  return null;
}

/**
 * Hook to manage user animation preferences
 *
 * Priority: localStorage > system preference
 *
 * @example
 * const { preference, updatePreference, shouldAnimate, isReduced } = useAnimationPreference();
 *
 * // Check if animations should run
 * if (shouldAnimate) {
 *   // Run animation
 * }
 *
 * // Check if reduced motion
 * const variants = isReduced ? reducedVariants : fullVariants;
 */
export function useAnimationPreference() {
  const [preference, setPreference] = useState<AnimationPreference>("full");
  const [systemPreference, setSystemPreference] =
    useState<AnimationPreference>("full");
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize on mount
  useEffect(() => {
    const stored = getStoredPreference();
    const system = getSystemPreference();

    setSystemPreference(system);
    setPreference(stored ?? system);
    setIsHydrated(true);

    // Apply data attribute to document
    document.documentElement.setAttribute(
      DATA_ATTRIBUTE,
      stored ?? system
    );

    // Listen for system preference changes
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemPref = e.matches ? "reduced" : "full";
      setSystemPreference(newSystemPref);

      // Only update if no user override
      if (!getStoredPreference()) {
        setPreference(newSystemPref);
        document.documentElement.setAttribute(DATA_ATTRIBUTE, newSystemPref);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  /**
   * Update user preference
   * Pass null to clear override and use system preference
   */
  const updatePreference = useCallback(
    (newPreference: AnimationPreference | null) => {
      if (newPreference === null) {
        // Clear override, use system preference
        localStorage.removeItem(STORAGE_KEY);
        setPreference(systemPreference);
        document.documentElement.setAttribute(DATA_ATTRIBUTE, systemPreference);
      } else {
        localStorage.setItem(STORAGE_KEY, newPreference);
        setPreference(newPreference);
        document.documentElement.setAttribute(DATA_ATTRIBUTE, newPreference);
      }
    },
    [systemPreference]
  );

  /**
   * Clear user override and revert to system preference
   */
  const clearOverride = useCallback(() => {
    updatePreference(null);
  }, [updatePreference]);

  return {
    /** Current effective preference */
    preference,
    /** System's native preference (for display) */
    systemPreference,
    /** Update or clear user preference */
    updatePreference,
    /** Clear user override */
    clearOverride,
    /** Whether there's a user override */
    hasOverride: isHydrated && getStoredPreference() !== null,
    /** Whether any animations should run (not "none") */
    shouldAnimate: preference !== "none",
    /** Whether motion should be reduced (not "full") */
    isReduced: preference !== "full",
    /** Whether hook has hydrated (for SSR) */
    isHydrated,
  };
}

/**
 * CSS custom property for animations
 * Use in CSS: [data-animation="none"] .animate-class { animation: none; }
 */
export const animationDataAttribute = DATA_ATTRIBUTE;

/**
 * Get animation preference without hook (one-time check)
 * Useful for non-component code
 */
export function getAnimationPreference(): AnimationPreference {
  const stored = getStoredPreference();
  if (stored) return stored;
  return getSystemPreference();
}

/**
 * Check if animations should be enabled (one-time check)
 */
export function shouldAnimate(): boolean {
  return getAnimationPreference() !== "none";
}

/**
 * Check if reduced motion is preferred (one-time check)
 */
export function prefersReduced(): boolean {
  return getAnimationPreference() !== "full";
}
