"use client";

import { AnimatePresence, m } from "framer-motion";
import { BrandedSpinner } from "@/components/ui/branded-spinner";

interface OAuthLoadingOverlayProps {
  provider: "google" | "apple" | null;
}

const providerCopy = {
  google: "Google",
  apple: "Apple",
} as const;

export function OAuthLoadingOverlay({ provider }: OAuthLoadingOverlayProps) {
  return (
    <AnimatePresence>
      {provider && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
        >
          <div className="text-center space-y-4">
            <p className="text-lg font-semibold text-text-primary">
              Redirecting to {providerCopy[provider]}...
            </p>
            <BrandedSpinner size="md" className="mx-auto text-primary" />
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
