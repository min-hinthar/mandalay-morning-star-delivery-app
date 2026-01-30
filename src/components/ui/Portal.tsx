"use client";

/**
 * Portal Component
 * SSR-safe portal wrapper using createPortal
 *
 * Renders children into document.body by default.
 * Uses mounted state pattern for SSR compatibility.
 *
 * NOTE: The cleanup does NOT set mounted to false because this can cause
 * race conditions with AnimatePresence exit animations. The portal will
 * unmount naturally when the parent unmounts.
 *
 * @example
 * <Portal>
 *   <div className="fixed inset-0">Overlay content</div>
 * </Portal>
 */

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface PortalProps {
  /** Content to render in portal */
  children: ReactNode;
  /** Target element for portal (default: document.body) */
  container?: Element | null;
}

export function Portal({ children, container }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // NOTE: We intentionally do NOT set mounted to false in cleanup.
    // Setting it to false can cause children to disappear before
    // AnimatePresence exit animations complete. The Portal will
    // unmount naturally when the parent component unmounts.
  }, []);

  // SSR safety: don't render until mounted on client
  if (!mounted) return null;

  const target = container ?? document.body;
  return createPortal(children, target);
}
