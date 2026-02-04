"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/lib/providers/query-provider";
import { CartBar, CartDrawer, FlyToCart } from "@/components/ui/cart";
import { ThemeProvider, DynamicThemeProvider } from "@/components/ui/theme";
import { AuthHandler } from "@/components/ui/auth/AuthHandler";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <DynamicThemeProvider>
        <QueryProvider>
          <AuthHandler />
          {children}
          <CartBar />
          <CartDrawer />
          <FlyToCart />
        </QueryProvider>
      </DynamicThemeProvider>
    </ThemeProvider>
  );
}
