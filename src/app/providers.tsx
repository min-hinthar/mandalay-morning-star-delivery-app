"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/lib/providers/query-provider";
import { CartBarV8, CartDrawerV8, FlyToCart } from "@/components/ui-v8/cart";
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
          <CartBarV8 />
          <CartDrawerV8 />
          <FlyToCart />
        </QueryProvider>
      </DynamicThemeProvider>
    </ThemeProvider>
  );
}
