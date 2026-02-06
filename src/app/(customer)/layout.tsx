"use client";

import type { ReactNode } from "react";
import { CartOverlays } from "@/components/ui/cart/CartOverlays";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <CartOverlays />
    </>
  );
}
