"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

export interface UseNavigationGuardOptions {
  /** Guard active when true (typically: cart has items) */
  enabled: boolean;
  /** Routes that should NOT trigger the guard (e.g., ["/cart", "/checkout"]) */
  allowedPaths?: string[];
  /** When true, browser back/forward navigates freely (no popstate guard) */
  allowBackNavigation?: boolean;
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
 * Navigation guard hook combining:
 * - beforeunload: native browser dialog on tab close / external nav
 * - popstate: intercepts browser back/forward
 * - pushState monkey-patch: intercepts Next.js client-side Link/router.push navigation
 *
 * Navigation to allowedPaths passes through without triggering the guard.
 */
export function useNavigationGuard({
  enabled,
  allowedPaths = [],
  allowBackNavigation = false,
}: UseNavigationGuardOptions): UseNavigationGuardReturn {
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);
  const enabledRef = useRef(enabled);
  const allowedRef = useRef(allowedPaths);
  const allowBackRef = useRef(allowBackNavigation);
  const pendingUrlRef = useRef<string | null>(null);
  const guardIdRef = useRef("");

  // Keep refs in sync
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    allowedRef.current = allowedPaths;
  }, [allowedPaths]);

  useEffect(() => {
    allowBackRef.current = allowBackNavigation;
  }, [allowBackNavigation]);

  // Check if a URL is in the allowed list
  const isAllowed = useCallback((url: string): boolean => {
    try {
      const path = new URL(url, window.location.origin).pathname;
      return allowedRef.current.some((allowed) => path.startsWith(allowed));
    } catch {
      return false;
    }
  }, []);

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

  // ── Push sentinel history entry so popstate can intercept back button ──
  // On remount (e.g. returning via back button), reuse the existing sentinel
  // instead of pushing a duplicate. No cleanup — history.back() is async and
  // triggers false-positive popstate events under React Strict Mode.
  useEffect(() => {
    if (!enabled || allowBackNavigation) return;

    if (window.history.state?.navigationGuard && window.history.state._guardId) {
      guardIdRef.current = window.history.state._guardId;
      return;
    }

    const id = `g-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    guardIdRef.current = id;

    window.history.pushState({ navigationGuard: true, _guardId: id }, "", pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, allowBackNavigation]);

  // ── popstate (browser back/forward) ──
  useEffect(() => {
    if (!enabled || allowBackNavigation) return;

    const handlePopState = () => {
      if (!enabledRef.current || allowBackRef.current) return;

      // If the current state still carries our sentinel's _guardId, this
      // is a spurious popstate from Next.js navigation (replaceState merges
      // our sentinel state). A real back press pops past our sentinel, so
      // the current state will NOT have our _guardId.
      if (window.history.state?._guardId === guardIdRef.current) return;

      window.history.pushState(
        { navigationGuard: true, _guardId: guardIdRef.current },
        "",
        pathname
      );
      pendingUrlRef.current = null; // back nav — proceed uses history.go
      setShowModal(true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [enabled, allowBackNavigation, pathname]);

  // ── Link click interceptor (capture phase — fires before Next.js) ──
  useEffect(() => {
    if (!enabled) return;

    const handleClick = (e: MouseEvent) => {
      if (!enabledRef.current) return;

      const anchor = (e.target as HTMLElement).closest("a[href]");
      if (!anchor) return;

      const href = (anchor as HTMLAnchorElement).href;
      if (!href || isAllowed(href)) return;

      // Block Next.js from handling this link click
      e.preventDefault();
      e.stopPropagation();

      pendingUrlRef.current = new URL(href, window.location.origin).pathname;
      setShowModal(true);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [enabled, isAllowed]);

  // ── pushState fallback (catches programmatic router.push to disallowed paths) ──
  useEffect(() => {
    if (!enabled) return;

    const originalPushState = window.history.pushState.bind(window.history);

    window.history.pushState = function patchedPushState(
      data: unknown,
      unused: string,
      url?: string | URL | null
    ) {
      // If guard is disabled or no URL, pass through
      if (!enabledRef.current || !url) {
        return originalPushState(data, unused, url);
      }

      const urlStr = typeof url === "string" ? url : url.toString();

      // Allow navigation to allowed paths and our own sentinel pushes
      if (
        isAllowed(urlStr) ||
        (data && typeof data === "object" && (data as Record<string, unknown>).navigationGuard)
      ) {
        return originalPushState(data, unused, url);
      }

      // Block navigation: show modal instead
      pendingUrlRef.current = urlStr;
      setShowModal(true);
    };

    return () => {
      window.history.pushState = originalPushState;
    };
  }, [enabled, isAllowed]);

  const proceed = useCallback(() => {
    setShowModal(false);
    enabledRef.current = false;

    if (pendingUrlRef.current) {
      // Client-side nav was blocked — replay it
      const url = pendingUrlRef.current;
      pendingUrlRef.current = null;
      window.location.href = url;
    } else {
      // Back/forward nav was blocked — go back past sentinel
      window.history.go(-2);
    }
  }, []);

  const cancel = useCallback(() => {
    setShowModal(false);
    pendingUrlRef.current = null;
  }, []);

  const disable = useCallback(() => {
    enabledRef.current = false;
  }, []);

  return { showModal, proceed, cancel, disable };
}
