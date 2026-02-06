"use client";

/**
 * useMountedRef - Track component mount state
 */

import { useRef, useEffect } from "react";

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
