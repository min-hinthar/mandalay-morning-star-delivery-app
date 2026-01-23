"use client";

/**
 * Portal Component
 * SSR-safe portal wrapper using createPortal
 *
 * Renders children into document.body by default.
 * Uses mounted state pattern for SSR compatibility.
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
    return () => setMounted(false);
  }, []);

  // SSR safety: don't render until mounted on client
  if (!mounted) return null;

  const target = container ?? document.body;
  return createPortal(children, target);
}
