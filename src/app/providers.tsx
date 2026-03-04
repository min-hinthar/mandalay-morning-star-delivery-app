"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/lib/providers/query-provider";
import { ThemeProvider, DynamicThemeProvider } from "@/components/ui/theme";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <DynamicThemeProvider>
        <QueryProvider>{children}</QueryProvider>
      </DynamicThemeProvider>
    </ThemeProvider>
  );
}
