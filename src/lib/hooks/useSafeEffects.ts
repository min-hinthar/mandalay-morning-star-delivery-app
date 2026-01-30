"use client";

/**
 * Safe Effect Utility Hooks
 *
 * Collection of hooks that provide safe patterns for common side effects
 * that require cleanup on unmount. Prevents memory leaks and "setState on
 * unmounted component" warnings.
 *
 * Key patterns:
 * - useMountedRef: Track component mount state
 * - useSafeTimeout: Auto-clearing setTimeout
 * - useSafeInterval: Auto-clearing setInterval
 * - useSafeAsync: Safe async operations with AbortController
 *
 * @module useSafeEffects
 */

import { useRef, useEffect, useCallback } from "react";

// ============================================
// useMountedRef
// ============================================

/**
 * Returns a ref that tracks whether the component is currently mounted.
 *
 * Use this ref in async callbacks to check if it's safe to update state.
 * The ref.current value is `true` while mounted and `false` after unmount.
 *
 * @returns {React.MutableRefObject<boolean>} Ref object with current mount state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isMountedRef = useMountedRef();
 *
 *   const handleAsyncOperation = async () => {
 *     const data = await fetchData();
 *     // Guard against setting state after unmount
 *     if (isMountedRef.current) {
 *       setData(data);
 *     }
 *   };
 *
 *   return <button onClick={handleAsyncOperation}>Load</button>;
 * }
 * ```
 */
export function useMountedRef(): React.MutableRefObject<boolean> {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return isMountedRef;
}

// ============================================
// useSafeTimeout
// ============================================

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
 *     // Debounce search - previous timeout automatically cleared
 *     timeout.set(() => {
 *       performSearch(e.target.value);
 *     }, 300);
 *   };
 *
 *   return <input value={query} onChange={handleChange} />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Manual clearing when needed
 * function SuccessMessage() {
 *   const [visible, setVisible] = useState(true);
 *   const timeout = useSafeTimeout();
 *
 *   useEffect(() => {
 *     // Auto-hide after 3 seconds
 *     timeout.set(() => setVisible(false), 3000);
 *   }, [timeout]);
 *
 *   // Clear timeout if user dismisses manually
 *   const handleDismiss = () => {
 *     timeout.clear();
 *     setVisible(false);
 *   };
 *
 *   return visible ? <div onClick={handleDismiss}>Success!</div> : null;
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

// ============================================
// useSafeInterval
// ============================================

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
 *
 * @example
 * ```tsx
 * // Pausable polling
 * function DataPoller({ isPaused }: { isPaused: boolean }) {
 *   const interval = useSafeInterval();
 *
 *   useEffect(() => {
 *     if (isPaused) {
 *       interval.clear();
 *     } else {
 *       interval.set(() => {
 *         fetchLatestData();
 *       }, 5000);
 *     }
 *   }, [isPaused, interval]);
 *
 *   return <div>...</div>;
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

// ============================================
// useSafeAsync
// ============================================

/**
 * Return type for useSafeAsync hook.
 */
export interface SafeAsyncControls<T> {
  /**
   * Execute an async function safely.
   * Returns null if component unmounts before completion.
   *
   * @param asyncFn Async function to execute. Receives AbortSignal for fetch cancellation.
   * @returns Promise resolving to result or null if unmounted/aborted
   */
  execute: (asyncFn: (signal: AbortSignal) => Promise<T>) => Promise<T | null>;
  /**
   * Ref indicating if component is currently mounted.
   * Use for additional safety checks in callbacks.
   */
  isMounted: React.MutableRefObject<boolean>;
}

/**
 * Provides safe async operation execution with automatic cleanup.
 *
 * Features:
 * - Provides AbortSignal for fetch cancellation
 * - Auto-aborts pending requests on unmount
 * - Returns null if component unmounts during async operation
 * - Provides isMounted ref for additional safety checks
 *
 * @returns {SafeAsyncControls<T>} Object with `execute` function and `isMounted` ref
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }: { userId: string }) {
 *   const [user, setUser] = useState<User | null>(null);
 *   const [loading, setLoading] = useState(true);
 *   const { execute, isMounted } = useSafeAsync<User>();
 *
 *   useEffect(() => {
 *     setLoading(true);
 *
 *     execute(async (signal) => {
 *       const response = await fetch(`/api/users/${userId}`, { signal });
 *       return response.json();
 *     }).then((result) => {
 *       // result is null if component unmounted
 *       if (result !== null) {
 *         setUser(result);
 *       }
 *       // Safe to update loading state because execute handles mount check
 *       if (isMounted.current) {
 *         setLoading(false);
 *       }
 *     });
 *   }, [userId, execute, isMounted]);
 *
 *   if (loading) return <Spinner />;
 *   return <div>{user?.name}</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Multiple sequential async operations
 * async function handleSubmit() {
 *   const validated = await execute(async (signal) => {
 *     return validateForm(formData, { signal });
 *   });
 *
 *   if (validated === null) return; // Unmounted
 *
 *   const result = await execute(async (signal) => {
 *     return submitForm(formData, { signal });
 *   });
 *
 *   if (result !== null) {
 *     // Success - component still mounted
 *     showSuccessToast();
 *   }
 * }
 * ```
 */
export function useSafeAsync<T>(): SafeAsyncControls<T> {
  const isMountedRef = useMountedRef();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Abort any pending request on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const execute = useCallback(
    async (asyncFn: (signal: AbortSignal) => Promise<T>): Promise<T | null> => {
      // Abort any previous pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const result = await asyncFn(abortController.signal);

        // Return null if component unmounted during async operation
        if (!isMountedRef.current) {
          return null;
        }

        return result;
      } catch (error) {
        // If aborted, return null silently
        if (error instanceof DOMException && error.name === "AbortError") {
          return null;
        }

        // Re-throw other errors if still mounted
        if (isMountedRef.current) {
          throw error;
        }

        return null;
      }
    },
    [isMountedRef]
  );

  return { execute, isMounted: isMountedRef };
}
