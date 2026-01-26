"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

/**
 * V7 AnimatedToggle - Bouncy switch with spring physics
 *
 * Features:
 * - Spring overshoot when knob moves (bouncyToggle spring)
 * - Haptic feedback on toggle
 * - Three sizes (sm, md, lg)
 * - Respects animation preference
 * - Full accessibility (role="switch", aria-checked, focus ring)
 */

interface AnimatedToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  "aria-label"?: string;
}

// Size configurations
const sizeConfig = {
  sm: { track: "w-9 h-5", knob: "w-4 h-4", travel: 16 },
  md: { track: "w-11 h-6", knob: "w-5 h-5", travel: 20 },
  lg: { track: "w-14 h-8", knob: "w-7 h-7", travel: 24 },
};

export function AnimatedToggle({
  checked,
  onCheckedChange,
  disabled = false,
  size = "md",
  className,
  "aria-label": ariaLabel,
}: AnimatedToggleProps) {
  const { shouldAnimate } = useAnimationPreference();
  const { track, knob, travel } = sizeConfig[size];

  // Haptic feedback
  const handleChange = () => {
    if (disabled) return;
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    onCheckedChange(!checked);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleChange}
      className={cn(
        track,
        "relative inline-flex items-center rounded-full",
        "transition-colors duration-200",
        checked ? "bg-primary" : "bg-surface-tertiary",
        disabled && "opacity-50 cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className
      )}
    >
      <motion.span
        className={cn(
          knob,
          "absolute left-0.5 rounded-full bg-white shadow-md"
        )}
        animate={shouldAnimate ? { x: checked ? travel : 0 } : { x: checked ? travel : 0 }}
        initial={false}
        transition={shouldAnimate ? spring.bouncyToggle : { duration: 0 }}
      />
    </button>
  );
}

export default AnimatedToggle;
