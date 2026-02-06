"use client";

import type { ReactNode } from "react";
import { LazyMotion, domMax } from "framer-motion";
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
          <LazyMotion features={domMax} strict>
            <AnimationProvider>
              {children}
            </AnimationProvider>
          </LazyMotion>
        </QueryProvider>
      </DynamicThemeProvider>
    </ThemeProvider>
  );
}
