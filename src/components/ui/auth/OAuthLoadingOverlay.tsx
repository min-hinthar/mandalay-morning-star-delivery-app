"use client";

import { AnimatePresence, m } from "framer-motion";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

interface OAuthLoadingOverlayProps {
  provider: "google" | null;
}

const providerConfig = {
  google: {
    name: "Google",
    icon: (
      <svg width="28" height="28" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#FFC107"
          d="M43.611 20.083H42V20H24v8h11.303C33.637 32.54 29.23 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.843 1.154 7.957 3.043l5.657-5.657C34.051 6.053 29.224 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.649-.389-3.917z"
        />
        <path
          fill="#FF3D00"
          d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 12 24 12c3.059 0 5.843 1.154 7.957 3.043l5.657-5.657C34.051 6.053 29.224 4 24 4c-7.682 0-14.344 4.327-17.694 10.691z"
        />
        <path
          fill="#4CAF50"
          d="M24 44c5.151 0 9.877-1.977 13.409-5.194l-6.19-5.238C29.118 35.091 26.673 36 24 36c-5.208 0-9.607-3.432-11.257-8.149l-6.505 5.008C9.546 39.556 16.227 44 24 44z"
        />
        <path
          fill="#1976D2"
          d="M43.611 20.083H42V20H24v8h11.303c-.792 2.18-2.396 4.027-4.585 5.264l.002-.001 6.19 5.238C36.56 38.738 44 33.5 44 24c0-1.341-.138-2.649-.389-3.917z"
        />
      </svg>
    ),
  },
} as const;

function LoadingDots() {
  const { shouldAnimate } = useAnimationPreference();

  return (
    <span className="inline-flex gap-1 ml-1">
      {[0, 1, 2].map((i) => (
        <m.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
          animate={shouldAnimate ? { opacity: [0.3, 1, 0.3], y: [0, -3, 0] } : undefined}
          transition={
            shouldAnimate ? { duration: 0.8, repeat: Infinity, delay: i * 0.15 } : undefined
          }
        />
      ))}
    </span>
  );
}

export function OAuthLoadingOverlay({ provider }: OAuthLoadingOverlayProps) {
  return (
    <AnimatePresence>
      {provider && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
        >
          <m.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="text-center space-y-4"
          >
            {/* Provider icon in a soft circle */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center shadow-lg">
              {providerConfig[provider].icon}
            </div>
            <div>
              <p className="text-lg font-semibold text-text-primary">
                Redirecting to {providerConfig[provider].name}
                <LoadingDots />
              </p>
              <p className="text-sm text-muted-foreground mt-1">You&apos;ll be back in a moment</p>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
