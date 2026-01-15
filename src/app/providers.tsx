"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/lib/providers/query-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      {children}
      <CartDrawer />
    </QueryProvider>
  );
}
