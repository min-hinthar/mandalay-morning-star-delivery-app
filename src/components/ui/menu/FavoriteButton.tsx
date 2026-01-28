"use client";

import React, { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export interface FavoriteButtonProps {
  /** Whether the item is favorited */
  isFavorite: boolean;
  /** Callback when favorite state changes */
  onToggle: (newState: boolean) => void;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show background circle */
  showBackground?: boolean;
  /** Additional className */
  className?: string;
  /** Aria label override */
  ariaLabel?: string;
}

// ============================================
// SIZE CONFIG
// ============================================

const sizeConfig = {
  sm: {
    button: "w-7 h-7",
    icon: "w-4 h-4",
    burst: "w-10 h-10",
  },
  md: {
    button: "w-9 h-9",
    icon: "w-5 h-5",
    burst: "w-14 h-14",
  },
  lg: {
    button: "w-11 h-11",
    icon: "w-6 h-6",
    burst: "w-16 h-16",
  },
};

// ============================================
// HAPTIC FEEDBACK
// ============================================

function triggerHaptic(type: "light" | "medium" = "medium") {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    const durations = { light: 5, medium: 15 };
    navigator.vibrate(durations[type]);
  }
}

// ============================================
// ANIMATION VARIANTS
// ============================================

const heartVariants = {
  initial: {
    scale: 1,
  },
  unfavorited: {
    scale: 1,
    fill: "transparent",
  },
  favorited: {
    scale: [1, 1.3, 0.9, 1.1, 1],
    fill: "#ef4444",
    transition: {
      ...spring.ultraBouncy,
      scale: {
        times: [0, 0.2, 0.4, 0.6, 1],
        duration: 0.5,
      },
    },
  },
  tap: {
    scale: 0.85,
  },
};

const burstVariants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  animate: {
    scale: [0, 1.2, 1.5],
    opacity: [0.8, 0.4, 0],
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

// Ring burst particles animation
const particleCount = 6;
const getParticleVariants = (index: number) => ({
  initial: {
    scale: 0,
    x: 0,
    y: 0,
    opacity: 0,
  },
  animate: {
    scale: [0, 1, 0.5],
    x: Math.cos((index * 2 * Math.PI) / particleCount) * 20,
    y: Math.sin((index * 2 * Math.PI) / particleCount) * 20,
    opacity: [1, 0.8, 0],
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
      delay: 0.05,
    },
  },
});

// ============================================
// MAIN COMPONENT
// ============================================

export function FavoriteButton({
  isFavorite,
  onToggle,
  size = "md",
  showBackground = true,
  className,
  ariaLabel,
}: FavoriteButtonProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [showBurst, setShowBurst] = useState(false);
  const sizes = sizeConfig[size];
  const springConfig = getSpring(spring.ultraBouncy);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const newState = !isFavorite;

      // Haptic feedback
      triggerHaptic(newState ? "medium" : "light");

      // Show burst animation on favorite
      if (newState && shouldAnimate) {
        setShowBurst(true);
        setTimeout(() => setShowBurst(false), 500);
      }

      onToggle(newState);
    },
    [isFavorite, onToggle, shouldAnimate]
  );

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      className={cn(
        sizes.button,
        "relative flex items-center justify-center",
        "rounded-full",
        showBackground && [
          "bg-surface-primary/90 dark:bg-surface-primary/90",
          "backdrop-blur-sm",
          "shadow-sm",
          isFavorite && "bg-red-50 dark:bg-red-950/30",
        ],
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-red-500 focus-visible:ring-offset-2",
        className
      )}
      whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
      whileTap={shouldAnimate ? heartVariants.tap : undefined}
      transition={springConfig}
      aria-label={ariaLabel ?? (isFavorite ? "Remove from favorites" : "Add to favorites")}
      aria-pressed={isFavorite}
    >
      {/* Burst effect on favorite - each element rendered separately to avoid Fragment inside AnimatePresence */}
      <AnimatePresence>
        {/* Ring burst */}
        {showBurst && shouldAnimate && (
          <motion.div
            key="ring-burst"
            className={cn(
              sizes.burst,
              "absolute rounded-full border-2 border-red-400"
            )}
            variants={burstVariants}
            initial="initial"
            animate="animate"
            exit="initial"
          />
        )}
        {/* Particle bursts */}
        {showBurst && shouldAnimate && Array.from({ length: particleCount }).map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1.5 h-1.5 rounded-full bg-red-400"
            variants={getParticleVariants(i)}
            initial="initial"
            animate="animate"
            exit="initial"
          />
        ))}
      </AnimatePresence>

      {/* Heart icon with fill animation */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isFavorite ? "filled" : "empty"}
          variants={shouldAnimate ? heartVariants : undefined}
          initial={shouldAnimate ? "initial" : undefined}
          animate={shouldAnimate ? (isFavorite ? "favorited" : "unfavorited") : undefined}
          transition={springConfig}
        >
          <Heart
            className={cn(
              sizes.icon,
              "transition-colors duration-150",
              isFavorite
                ? "fill-red-500 stroke-red-500"
                : "fill-transparent stroke-gray-400 hover:stroke-red-400"
            )}
            strokeWidth={2}
          />
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}

// ============================================
// SKELETON
// ============================================

export function FavoriteButtonSkeleton({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = sizeConfig[size];

  return (
    <div
      className={cn(
        sizes.button,
        "rounded-full bg-surface-tertiary animate-pulse",
        className
      )}
    />
  );
}

export default FavoriteButton;
