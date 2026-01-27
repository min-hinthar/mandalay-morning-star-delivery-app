"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/lib/providers/query-provider";
import { CartBar, CartDrawer, FlyToCart } from "@/components/ui/cart";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DynamicThemeProvider } from "@/components/theme/DynamicThemeProvider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <DynamicThemeProvider>
        <QueryProvider>
          {children}
          <CartBar />
          <CartDrawer />
          <FlyToCart />
        </QueryProvider>
      </DynamicThemeProvider>
    </ThemeProvider>
  );
}
