"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

export interface UseNavigationGuardOptions {
  /** Guard active when true (typically: cart has items) */
  enabled: boolean;
  /** Routes that should NOT trigger the guard (e.g., ["/cart", "/checkout"]) */
  allowedPaths?: string[];
}

export interface UseNavigationGuardReturn {
  /** Whether the confirmation modal should be shown */
  showModal: boolean;
  /** User confirmed they want to leave */
  proceed: () => void;
  /** User wants to stay on current page */
  cancel: () => void;
  /** Programmatically disable the guard (e.g., before Stripe redirect) */
  disable: () => void;
}

/**
 * Navigation guard hook combining beforeunload + popstate interception.
 *
 * - beforeunload: shows native browser dialog on tab close / external nav
 * - popstate: intercepts browser back/forward, pushes state back, shows custom modal
 *
 * NOTE: This hook does NOT intercept Next.js Link navigation. Pages should use
 * the Link `onNavigate` prop or similar pattern for in-app link interception.
 */
export function useNavigationGuard({
  enabled,
  // allowedPaths is part of the public API for callers to document intent;
  // actual path filtering should be done by the caller when computing `enabled`.
  allowedPaths: _allowedPaths = [],
}: UseNavigationGuardOptions): UseNavigationGuardReturn {
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);
  const enabledRef = useRef(enabled);

  // Keep ref in sync for use in event handlers
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // ── beforeunload (native browser dialog on tab close) ──
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!enabledRef.current) return;
      e.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled]);

  // ── Push initial history entry so popstate can intercept back button ──
  useEffect(() => {
    if (!enabled) return;

    // Push a sentinel state so we can detect back-button presses
    window.history.pushState({ navigationGuard: true }, "", pathname);

    return () => {
      // Clean up: if we still have our sentinel on top, pop it
      if (
        window.history.state &&
        window.history.state.navigationGuard === true
      ) {
        // Go back to remove the sentinel entry we pushed
        window.history.back();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // ── popstate (browser back/forward) ──
  useEffect(() => {
    if (!enabled) return;

    const handlePopState = () => {
      if (!enabledRef.current) return;

      // Re-push current state to prevent leaving
      window.history.pushState({ navigationGuard: true }, "", pathname);
      setShowModal(true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [enabled, pathname]);

  const proceed = useCallback(() => {
    setShowModal(false);
    // Temporarily disable guard, then navigate back
    enabledRef.current = false;
    // Remove our sentinel entry and the original entry (actual back navigation)
    window.history.go(-2);
  }, []);

  const cancel = useCallback(() => {
    setShowModal(false);
  }, []);

  const disable = useCallback(() => {
    enabledRef.current = false;
  }, []);

  return { showModal, proceed, cancel, disable };
}
