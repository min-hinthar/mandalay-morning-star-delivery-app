"use client";

/**
 * VtNavSync — commits a pending View-Transition nav snapshot once the
 * destination route mounts. Resolves `resolveVtNavCommit()` on every pathname
 * change so `navigateWithViewTransition` captures the NEW view as soon as it's
 * in the DOM (instead of waiting out the safety-timeout). Renders nothing.
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { resolveVtNavCommit } from "@/lib/navigation/view-transition-nav";

export function VtNavSync() {
  const pathname = usePathname();

  useEffect(() => {
    resolveVtNavCommit();
  }, [pathname]);

  return null;
}

export default VtNavSync;
