"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

/**
 * A/B Test Infrastructure for Vercel Edge Config
 *
 * Features:
 * - Consistent user experience (same variant per user)
 * - Persists variant assignment in localStorage
 * - Supports weighted variants
 * - Ready for Vercel Edge Config integration
 *
 * @example
 * // Basic usage
 * const { variant, isLoading } = useABTest("hero-layout", ["A", "B"]);
 *
 * // With weights (A: 70%, B: 30%)
 * const { variant } = useABTest("pricing", ["control", "discount"], {
 *   weights: { control: 70, discount: 30 }
 * });
 */

const STORAGE_PREFIX = "ab-test-";

export interface ABTestOptions<T extends string> {
  /** Variant weights (must sum to 100 or any positive numbers) */
  weights?: Partial<Record<T, number>>;
  /** Force a specific variant (useful for testing) */
  forceVariant?: T;
  /** Track exposure event */
  onExposure?: (testName: string, variant: T) => void;
}

export interface ABTestResult<T extends string> {
  /** The assigned variant */
  variant: T;
  /** Whether the variant is still being determined */
  isLoading: boolean;
  /** Whether the variant was loaded from storage */
  isFromStorage: boolean;
  /** Force a new variant assignment (clears stored value) */
  reassign: () => void;
}

/**
 * Hook for A/B test variant assignment
 *
 * @param testName - Unique identifier for the test
 * @param variants - Array of possible variants
 * @param options - Optional configuration
 * @returns ABTestResult with variant and utilities
 */
export function useABTest<T extends string>(
  testName: string,
  variants: readonly T[],
  options?: ABTestOptions<T>
): ABTestResult<T> {
  const { weights, forceVariant, onExposure } = options ?? {};
  const defaultVariant = variants[0];

  // State
  const [variant, setVariant] = useState<T>(forceVariant ?? defaultVariant);
  const [isLoading, setIsLoading] = useState(!forceVariant);
  const [isFromStorage, setIsFromStorage] = useState(false);

  // Storage key
  const storageKey = `${STORAGE_PREFIX}${testName}`;

  // Weighted random selection
  const selectVariant = useCallback((): T => {
    if (!weights) {
      // Equal probability for all variants
      const randomIndex = Math.floor(Math.random() * variants.length);
      return variants[randomIndex];
    }

    // Calculate total weight
    const totalWeight = variants.reduce((sum, v) => {
      return sum + (weights[v] ?? 1);
    }, 0);

    // Random number between 0 and total weight
    let random = Math.random() * totalWeight;

    // Find the variant that matches
    for (const v of variants) {
      const weight = weights[v] ?? 1;
      random -= weight;
      if (random <= 0) {
        return v;
      }
    }

    // Fallback (shouldn't reach here)
    return variants[0];
  }, [variants, weights]);

  // Initialize variant from storage or assign new one
  useEffect(() => {
    // If forced, don't check storage
    if (forceVariant) {
      setVariant(forceVariant);
      setIsLoading(false);
      return;
    }

    // Check localStorage for existing assignment
    const stored = localStorage.getItem(storageKey);
    if (stored && variants.includes(stored as T)) {
      setVariant(stored as T);
      setIsFromStorage(true);
      setIsLoading(false);

      // Track exposure
      onExposure?.(testName, stored as T);
      return;
    }

    // Assign new variant
    const assigned = selectVariant();
    localStorage.setItem(storageKey, assigned);
    setVariant(assigned);
    setIsLoading(false);

    // Track exposure
    onExposure?.(testName, assigned);
  }, [testName, storageKey, variants, forceVariant, selectVariant, onExposure]);

  // Reassign variant (for testing/debugging)
  const reassign = useCallback(() => {
    localStorage.removeItem(storageKey);
    const newVariant = selectVariant();
    localStorage.setItem(storageKey, newVariant);
    setVariant(newVariant);
    setIsFromStorage(false);
    onExposure?.(testName, newVariant);
  }, [storageKey, selectVariant, testName, onExposure]);

  return useMemo(
    () => ({
      variant,
      isLoading,
      isFromStorage,
      reassign,
    }),
    [variant, isLoading, isFromStorage, reassign]
  );
}

/**
 * Get stored A/B test variant without hooks (for server-side or one-time checks)
 */
export function getStoredVariant<T extends string>(
  testName: string,
  variants: readonly T[]
): T | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(`${STORAGE_PREFIX}${testName}`);
  if (stored && variants.includes(stored as T)) {
    return stored as T;
  }
  return null;
}

/**
 * Clear all A/B test assignments (useful for testing)
 */
export function clearAllABTests(): void {
  if (typeof window === "undefined") return;

  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key.startsWith(STORAGE_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
}

/**
 * List all active A/B test assignments
 */
export function listABTestAssignments(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const assignments: Record<string, string> = {};
  const keys = Object.keys(localStorage);

  for (const key of keys) {
    if (key.startsWith(STORAGE_PREFIX)) {
      const testName = key.replace(STORAGE_PREFIX, "");
      const value = localStorage.getItem(key);
      if (value) {
        assignments[testName] = value;
      }
    }
  }

  return assignments;
}

// Type-safe preset for Hero A/B test
export type HeroVariant = "default" | "minimal" | "featured";
export const HERO_VARIANTS: readonly HeroVariant[] = [
  "default",
  "minimal",
  "featured",
] as const;

/**
 * Hook specifically for Hero component A/B testing
 */
export function useHeroABTest(options?: ABTestOptions<HeroVariant>) {
  return useABTest("hero-variant", HERO_VARIANTS, options);
}
