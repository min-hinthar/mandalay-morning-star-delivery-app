"use client";

/**
 * useSafeAsync - Safe async operations with AbortController
 */

import { useRef, useEffect, useCallback } from "react";
import { useMountedRef } from "./useMountedRef";

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
 *   const { execute, isMounted } = useSafeAsync<User>();
 *
 *   useEffect(() => {
 *     execute(async (signal) => {
 *       const response = await fetch(`/api/users/${userId}`, { signal });
 *       return response.json();
 *     }).then((result) => {
 *       if (result !== null) {
 *         setUser(result);
 *       }
 *     });
 *   }, [userId, execute]);
 *
 *   return <div>{user?.name}</div>;
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
