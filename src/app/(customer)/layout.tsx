"use client";

import type { ReactNode } from "react";
import { CartOverlays } from "@/components/ui/cart/CartOverlays";
import { DomMaxProvider } from "@/components/providers/DomMaxProvider";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <DomMaxProvider>
      {children}
      <CartOverlays />
    </DomMaxProvider>
  );
}
