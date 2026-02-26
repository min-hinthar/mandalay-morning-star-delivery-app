"use client";

import type { ReactNode } from "react";
import { CartOverlays } from "@/components/ui/cart/CartOverlays";
import { DomMaxProvider } from "@/components/providers/DomMaxProvider";

export function CustomerShell({ children }: { children: ReactNode }) {
  return (
    <DomMaxProvider>
      {children}
      <CartOverlays />
    </DomMaxProvider>
  );
}
