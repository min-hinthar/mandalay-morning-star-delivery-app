"use client";

import type { ReactNode } from "react";
import { CartOverlays } from "@/components/ui/cart/CartOverlays";
import { SiteFooter } from "@/components/ui/homepage/SiteFooter";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
      <CartOverlays />
    </>
  );
}
