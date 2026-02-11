"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";

// ============================================
// TYPES
// ============================================

export interface SkeletonCrossfadeProps {
  /** Whether data is still loading */
  isLoading: boolean;
  /** Skeleton placeholder to show while loading */
  skeleton: ReactNode;
  /** Content to show once loaded */
  children: ReactNode;
  /** Minimum time skeleton must be visible (ms) */
  minDisplayMs?: number;
}

// ============================================
// COMPONENT
// ============================================

export function SkeletonCrossfade({
  isLoading,
  skeleton,
  children,
  minDisplayMs = 300,
}: SkeletonCrossfadeProps) {
  const mountTimeRef = useRef<number>(Date.now());
  const [showContent, setShowContent] = useState(!isLoading);

  useEffect(() => {
    if (isLoading) {
      // Reset mount time when loading starts
      mountTimeRef.current = Date.now();
      setShowContent(false);
      return;
    }

    // Loading resolved -- enforce minimum display time
    const elapsed = Date.now() - mountTimeRef.current;
    const remaining = minDisplayMs - elapsed;

    if (remaining <= 0) {
      setShowContent(true);
      return;
    }

    const timer = setTimeout(() => setShowContent(true), remaining);
    return () => clearTimeout(timer);
  }, [isLoading, minDisplayMs]);

  return (
    <AnimatePresence mode="wait">
      {!showContent ? (
        <m.div
          key="skeleton"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {skeleton}
        </m.div>
      ) : (
        <m.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
}
