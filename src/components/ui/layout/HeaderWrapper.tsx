"use client";

/**
 * HeaderWrapper - Client-side wrapper for AppHeader
 *
 * Provides the AppHeader with HeaderSpacer for use in server component layouts.
 * All header state (mobile menu, command palette, cart drawer) is managed internally.
 */

import { AppHeader, HeaderSpacer } from "./AppHeader";

export function HeaderWrapper() {
  return (
    <>
      <AppHeader />
      <HeaderSpacer />
    </>
  );
}

export default HeaderWrapper;
