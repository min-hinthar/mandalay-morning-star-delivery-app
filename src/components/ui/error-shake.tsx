"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

interface ErrorShakeProps {
  /** Whether to trigger the shake animation */
  shake: boolean;
  /** Children to wrap */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
  /** Callback when shake animation completes */
  onShakeComplete?: () => void;
}

// Combined shake + pulse animation (defined locally)
const shakeVariants = {
  idle: {
    x: 0,
    backgroundColor: "transparent",
  },
  shake: {
    x: [-8, 8, -6, 6, -4, 4, 0],
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

const pulseVariants = {
  idle: {
    opacity: 0,
  },
  pulse: {
    opacity: [0, 0.15, 0],
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

export function ErrorShake({
  shake,
  children,
  className,
  onShakeComplete,
}: ErrorShakeProps) {
  const { shouldAnimate } = useAnimationPreference();

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn("relative", className)}
      variants={shakeVariants}
      initial="idle"
      animate={shake ? "shake" : "idle"}
      onAnimationComplete={() => {
        if (shake) {
          onShakeComplete?.();
        }
      }}
    >
      {/* Red pulse overlay */}
      <AnimatePresence>
        {shake && (
          <motion.div
            className="absolute inset-0 rounded-inherit bg-status-error pointer-events-none"
            variants={pulseVariants}
            initial="idle"
            animate="pulse"
            exit="idle"
          />
        )}
      </AnimatePresence>
      {children}
    </motion.div>
  );
}

/**
 * Hook to manage shake state - auto-resets after animation
 */
export function useErrorShake() {
  const [shake, setShake] = useState(false);

  const triggerShake = useCallback(() => {
    setShake(true);
    // Auto-reset after animation duration
    setTimeout(() => setShake(false), 500);
  }, []);

  return { shake, triggerShake };
}

export default ErrorShake;
