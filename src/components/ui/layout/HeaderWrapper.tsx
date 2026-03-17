"use client";

/**
 * HeaderWrapper - Client-side wrapper for AppHeader
 *
 * Provides the AppHeader with HeaderSpacer for use in server component layouts.
 * All header state (mobile menu, command palette, cart drawer) is managed internally.
 * Hidden on admin/driver routes which have their own navigation.
 */

import { usePathname } from "next/navigation";
import { AppHeader, HeaderSpacer } from "./AppHeader";

export function HeaderWrapper() {
  const pathname = usePathname();

  // Admin and driver layouts have their own navigation — hide customer header
  if (pathname.startsWith("/admin") || pathname.startsWith("/driver")) {
    return null;
  }

  return (
    <>
      <AppHeader />
      <HeaderSpacer />
    </>
  );
}

export default HeaderWrapper;
