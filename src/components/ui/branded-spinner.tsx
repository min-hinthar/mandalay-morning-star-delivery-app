"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

interface BrandedSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  /** Optional label for accessibility */
  label?: string;
}

const sizeConfig = {
  sm: 20,
  md: 32,
  lg: 48,
  xl: 64,
};

export function BrandedSpinner({
  size = "md",
  className,
  label = "Loading",
}: BrandedSpinnerProps) {
  const { shouldAnimate } = useAnimationPreference();
  const pixelSize = sizeConfig[size];

  return (
    <div
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center justify-center", className)}
    >
      <motion.svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={shouldAnimate ? { rotate: 360 } : undefined}
        transition={
          shouldAnimate
            ? {
                duration: 1.5,
                repeat: 20, // Bound to 20 cycles - spinners should only show during loading
                ease: "linear",
              }
            : undefined
        }
      >
        {/* Morning Star - 8-pointed star shape */}
        <motion.path
          d="M20 2L23.5 14.5L36 14.5L26 22L29.5 35L20 27L10.5 35L14 22L4 14.5L16.5 14.5L20 2Z"
          fill="currentColor"
          className="text-primary"
          animate={
            shouldAnimate
              ? {
                  opacity: [0.4, 1, 0.4],
                  scale: [0.95, 1, 0.95],
                }
              : undefined
          }
          transition={
            shouldAnimate
              ? {
                  duration: 1.5,
                  repeat: 20, // Bound to 20 cycles - spinners should only show during loading
                  ease: "easeInOut",
                }
              : undefined
          }
        />
        {/* Center dot */}
        <circle
          cx="20"
          cy="20"
          r="3"
          fill="currentColor"
          className="text-secondary"
        />
      </motion.svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * Simpler rotating ring spinner as alternative
 */
export function RingSpinner({
  size = "md",
  className,
  label = "Loading",
}: BrandedSpinnerProps) {
  const { shouldAnimate } = useAnimationPreference();
  const pixelSize = sizeConfig[size];

  return (
    <div
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center justify-center", className)}
    >
      <motion.svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={shouldAnimate ? { rotate: 360 } : undefined}
        transition={
          shouldAnimate
            ? {
                duration: 1,
                repeat: 20, // Bound to 20 cycles - spinners should only show during loading
                ease: "linear",
              }
            : undefined
        }
      >
        <circle
          cx="20"
          cy="20"
          r="16"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="80"
          strokeDashoffset="60"
          className="text-primary"
        />
      </motion.svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default BrandedSpinner;
