"use client";

/**
 * useSafeInterval - Auto-clearing setInterval
 */

import { useRef, useEffect, useCallback } from "react";

/**
 * Return type for useSafeInterval hook.
 */
export interface SafeIntervalControls {
  /**
   * Start an interval. Automatically clears any existing interval.
   * @param callback Function to call on each interval tick
   * @param delay Interval duration in milliseconds
   */
  set: (callback: () => void, delay: number) => void;
  /**
   * Stop the current interval.
   */
  clear: () => void;
}

/**
 * Provides safe setInterval functionality with automatic cleanup on unmount.
 *
 * Features:
 * - Automatically clears interval on component unmount
 * - Calling `set()` again clears any existing interval
 * - Returns stable `set` and `clear` functions
 *
 * @returns {SafeIntervalControls} Object with `set` and `clear` functions
 *
 * @example
 * ```tsx
 * function LiveClock() {
 *   const [time, setTime] = useState(new Date());
 *   const interval = useSafeInterval();
 *
 *   useEffect(() => {
 *     interval.set(() => {
 *       setTime(new Date());
 *     }, 1000);
 *   }, [interval]);
 *
 *   return <span>{time.toLocaleTimeString()}</span>;
 * }
 * ```
 */
export function useSafeInterval(): SafeIntervalControls {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear any pending interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const clear = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const set = useCallback((callback: () => void, delay: number) => {
    // Clear any existing interval
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(callback, delay);
  }, []);

  return { set, clear };
}
