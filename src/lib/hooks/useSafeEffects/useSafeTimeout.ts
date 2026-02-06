"use client";

/**
 * useSafeTimeout - Auto-clearing setTimeout
 */

import { useRef, useEffect, useCallback } from "react";

/**
 * Return type for useSafeTimeout hook.
 */
export interface SafeTimeoutControls {
  /**
   * Schedule a timeout. Automatically clears any existing timeout.
   * @param callback Function to call after delay
   * @param delay Delay in milliseconds
   */
  set: (callback: () => void, delay: number) => void;
  /**
   * Clear any pending timeout.
   */
  clear: () => void;
}

/**
 * Provides safe setTimeout functionality with automatic cleanup on unmount.
 *
 * Features:
 * - Automatically clears timeout on component unmount
 * - Calling `set()` again clears any existing timeout
 * - Returns stable `set` and `clear` functions
 *
 * @returns {SafeTimeoutControls} Object with `set` and `clear` functions
 *
 * @example
 * ```tsx
 * function SearchInput() {
 *   const [query, setQuery] = useState("");
 *   const timeout = useSafeTimeout();
 *
 *   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 *     setQuery(e.target.value);
 *     timeout.set(() => {
 *       performSearch(e.target.value);
 *     }, 300);
 *   };
 *
 *   return <input value={query} onChange={handleChange} />;
 * }
 * ```
 */
export function useSafeTimeout(): SafeTimeoutControls {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const clear = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const set = useCallback((callback: () => void, delay: number) => {
    // Clear any existing timeout
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      callback();
    }, delay);
  }, []);

  return { set, clear };
}
