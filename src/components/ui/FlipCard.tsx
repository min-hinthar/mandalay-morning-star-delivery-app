"use client";

import React, { useState, forwardRef, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring, hover } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export interface FlipCardProps {
  /** Front face content */
  front: ReactNode;
  /** Back face content */
  back: ReactNode;
  /** Controlled flip state */
  isFlipped?: boolean;
  /** Callback when flip state changes */
  onFlip?: (isFlipped: boolean) => void;
  /** Flip direction */
  direction?: "horizontal" | "vertical";
  /** Card height (required for proper 3D effect) */
  height?: number | string;
  /** Additional class names */
  className?: string;
  /** Front face class names */
  frontClassName?: string;
  /** Back face class names */
  backClassName?: string;
  /** Disable flip interaction */
  disabled?: boolean;
  /** Trigger flip on hover instead of click */
  flipOnHover?: boolean;
  /** Play haptic feedback on flip */
  haptic?: boolean;
}

// ============================================
// ANIMATION VARIANTS
// ============================================

const createFlipVariants = (direction: "horizontal" | "vertical") => {
  const axis = direction === "horizontal" ? "rotateY" : "rotateX";

  return {
    front: {
      unflipped: { [axis]: 0, scale: 1 },
      flipped: { [axis]: 180, scale: 1 },
    },
    back: {
      unflipped: { [axis]: -180, scale: 1 },
      flipped: { [axis]: 0, scale: 1 },
    },
  };
};

// ============================================
// COMPONENT
// ============================================

export const FlipCard = forwardRef<HTMLDivElement, FlipCardProps>(
  (
    {
      front,
      back,
      isFlipped: controlledFlipped,
      onFlip,
      direction = "horizontal",
      height = 200,
      className,
      frontClassName,
      backClassName,
      disabled = false,
      flipOnHover = false,
      haptic = true,
    },
    ref
  ) => {
    const [internalFlipped, setInternalFlipped] = useState(false);
    const { shouldAnimate, getSpring, isFullMotion } = useAnimationPreference();

    // Controlled or uncontrolled
    const isFlipped = controlledFlipped ?? internalFlipped;
    const variants = createFlipVariants(direction);

    const handleFlip = () => {
      if (disabled) return;

      // Haptic feedback
      if (haptic && isFullMotion && "vibrate" in navigator) {
        navigator.vibrate(10);
      }

      const newFlipped = !isFlipped;

      if (controlledFlipped === undefined) {
        setInternalFlipped(newFlipped);
      }

      onFlip?.(newFlipped);
    };

    const springConfig = getSpring(spring.default);

    // Interaction props based on flipOnHover
    const interactionProps = flipOnHover
      ? {
          onHoverStart: () => !disabled && handleFlip(),
          onHoverEnd: () => !disabled && handleFlip(),
        }
      : {
          onClick: handleFlip,
        };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative cursor-pointer select-none",
          disabled && "cursor-not-allowed opacity-60",
          className
        )}
        style={{
          perspective: 1200,
          height,
        }}
        {...(shouldAnimate ? hover.scaleGentle : {})}
        {...interactionProps}
      >
        {/* Front Face */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-2xl",
            "bg-gradient-to-br from-white to-surface-secondary",
            "border border-border-default/60",
            "shadow-lg shadow-text-primary/5",
            "overflow-hidden",
            frontClassName
          )}
          style={{
            backfaceVisibility: "hidden",
            transformStyle: "preserve-3d",
          }}
          variants={shouldAnimate ? variants.front : undefined}
          initial="unflipped"
          animate={isFlipped ? "flipped" : "unflipped"}
          transition={springConfig}
        >
          {/* Decorative corner ornament - Burmese inspired */}
          <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
            <div
              className="absolute -top-8 -right-8 w-16 h-16 rotate-45"
              style={{
                background: "linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary-hover) 100%)",
                opacity: 0.15,
              }}
            />
          </div>

          <div className="relative h-full p-5 flex flex-col justify-center">
            {front}
          </div>

          {/* Flip indicator */}
          <div className="absolute bottom-3 right-3 text-text-muted">
            <motion.svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={shouldAnimate ? {
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              } : undefined}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </motion.svg>
          </div>
        </motion.div>

        {/* Back Face */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-2xl",
            "bg-gradient-to-br from-primary to-primary-active",
            "border border-primary/20",
            "shadow-xl shadow-primary/20",
            "overflow-hidden text-white",
            backClassName
          )}
          style={{
            backfaceVisibility: "hidden",
            transformStyle: "preserve-3d",
          }}
          variants={shouldAnimate ? variants.back : undefined}
          initial="unflipped"
          animate={isFlipped ? "flipped" : "unflipped"}
          transition={springConfig}
        >
          {/* Golden decorative pattern - Burmese inspired */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
              <pattern id="lotus-pattern" patternUnits="userSpaceOnUse" width="30" height="30">
                <circle cx="15" cy="15" r="8" fill="none" stroke="#EBCD00" strokeWidth="0.5" />
                <circle cx="15" cy="15" r="4" fill="none" stroke="#EBCD00" strokeWidth="0.3" />
                <circle cx="15" cy="15" r="1" fill="#EBCD00" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#lotus-pattern)" />
            </svg>
          </div>

          <div className="relative h-full p-5 flex flex-col justify-center">
            {back}
          </div>

          {/* Close/flip back indicator */}
          <div className="absolute bottom-3 right-3 text-white/60">
            <motion.svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              whileHover={shouldAnimate ? { rotate: 180 } : undefined}
              transition={springConfig}
            >
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </motion.svg>
          </div>
        </motion.div>
      </motion.div>
    );
  }
);

FlipCard.displayName = "FlipCard";

// ============================================
// FAQ FLIP CARD VARIANT
// Pre-styled for FAQ usage
// ============================================

export interface FAQFlipCardProps {
  question: string;
  answer: string;
  className?: string;
}

export function FAQFlipCard({ question, answer, className }: FAQFlipCardProps) {
  return (
    <FlipCard
      className={cn("w-full", className)}
      height={180}
      front={
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Question
          </span>
          <h3 className="text-lg font-semibold text-text-primary leading-snug">
            {question}
          </h3>
          <span className="mt-auto text-sm text-text-muted">
            Tap to reveal answer
          </span>
        </div>
      }
      back={
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
            Answer
          </span>
          <p className="text-sm leading-relaxed text-white/90">
            {answer}
          </p>
        </div>
      }
    />
  );
}

export default FlipCard;
