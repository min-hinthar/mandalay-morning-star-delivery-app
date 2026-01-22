"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { QueryProvider } from "@/lib/providers/query-provider";
import { CartDrawerV8 } from "@/components/ui-v8/cart";
import { CartBar } from "@/components/cart/CartBar";
import { ThemeProvider } from "@/components/theme-provider";
import { DynamicThemeProvider } from "@/components/theme/DynamicThemeProvider";

interface ProvidersProps {
  children: ReactNode;
}

// Routes where cart bar should be hidden
const HIDE_CART_BAR_ROUTES = ["/checkout", "/cart", "/login", "/signup", "/admin", "/driver"];

export function Providers({ children }: ProvidersProps) {
  const pathname = usePathname();
  const showCartBar = !HIDE_CART_BAR_ROUTES.some((route) => pathname.startsWith(route));

  return (
    <ThemeProvider>
      <DynamicThemeProvider>
        <QueryProvider>
          {children}
          <CartDrawerV8 />
          {showCartBar && <CartBar />}
        </QueryProvider>
      </DynamicThemeProvider>
    </ThemeProvider>
  );
}
