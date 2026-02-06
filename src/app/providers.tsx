"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/lib/providers/query-provider";
import { AnimationProvider } from "@/lib/providers/animation-provider";
import { ThemeProvider, DynamicThemeProvider } from "@/components/ui/theme";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <DynamicThemeProvider>
        <QueryProvider>
          <AnimationProvider>
            {children}
          </AnimationProvider>
        </QueryProvider>
      </DynamicThemeProvider>
    </ThemeProvider>
  );
}
