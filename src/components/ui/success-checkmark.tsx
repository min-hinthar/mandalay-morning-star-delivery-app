/**
 * V6 Success Checkmark Animation - Pepper Aesthetic
 *
 * Animated checkmark for success states.
 * Use after: Add to cart, Save, Submit, etc.
 *
 * Features:
 * - Scale-in animation (0 → 1)
 * - Path drawing effect for checkmark
 * - V6 green color
 * - Duration: 400ms
 * - Reduced motion support
 */

"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";

interface SuccessCheckmarkProps {
  /** Whether to show the checkmark */
  show?: boolean;
  /** Size in pixels */
  size?: number;
  /** Optional callback when animation completes */
  onAnimationComplete?: () => void;
  /** Additional className */
  className?: string;
  /** Variant: default (circle + check) or minimal (check only) */
  variant?: "default" | "minimal";
}

/**
 * V6 Success Checkmark
 *
 * @example
 * // Show after successful action
 * <SuccessCheckmark show={isSuccess} onAnimationComplete={() => setShowCheckmark(false)} />
 *
 * @example
 * // Inline with text
 * <div className="flex items-center gap-2">
 *   <SuccessCheckmark show size={20} variant="minimal" />
 *   <span>Added to cart</span>
 * </div>
 */
export function SuccessCheckmark({
  show = true,
  size = 48,
  onAnimationComplete,
  className,
  variant = "default",
}: SuccessCheckmarkProps) {
  const prefersReducedMotion = useReducedMotion();
  const [animationStarted, setAnimationStarted] = useState(false);

  // Trigger animation when show becomes true
  useEffect(() => {
    if (show) {
      setAnimationStarted(true);
    }
  }, [show]);

  if (!show && !animationStarted) return null;

  // SVG path for checkmark
  const checkmarkPath = "M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z";

  // Animation variants with proper types
  const circleVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 260,
        damping: 20,
      },
    },
  };

  const checkVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        delay: variant === "default" ? 0.2 : 0,
        duration: 0.3,
        ease: "easeOut" as const,
      },
    },
  };

  // For reduced motion, show immediately
  if (prefersReducedMotion) {
    return variant === "default" ? (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-green",
          className
        )}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          className="text-text-inverse"
          style={{ width: size * 0.5, height: size * 0.5 }}
        >
          <path d={checkmarkPath} />
        </svg>
      </div>
    ) : (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        className={cn("text-green", className)}
        style={{ width: size, height: size }}
      >
        <path d={checkmarkPath} />
      </svg>
    );
  }

  return variant === "default" ? (
    <motion.div
      variants={circleVariants}
      initial="hidden"
      animate={show ? "visible" : "hidden"}
      onAnimationComplete={() => {
        if (show) onAnimationComplete?.();
      }}
      className={cn(
        "flex items-center justify-center rounded-full bg-green shadow-md",
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-text-inverse"
        style={{ width: size * 0.5, height: size * 0.5 }}
      >
        <motion.path
          d="M5 12l5 5L20 7"
          variants={checkVariants}
          initial="hidden"
          animate={show ? "visible" : "hidden"}
        />
      </svg>
    </motion.div>
  ) : (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("text-green", className)}
      style={{ width: size, height: size }}
    >
      <motion.path
        d="M5 12l5 5L20 7"
        variants={checkVariants}
        initial="hidden"
        animate={show ? "visible" : "hidden"}
        onAnimationComplete={() => {
          if (show) onAnimationComplete?.();
        }}
      />
    </svg>
  );
}

/**
 * V6 Success Overlay
 *
 * Full-screen or container overlay with success checkmark.
 * For modal/page transitions after successful actions.
 *
 * @example
 * <SuccessOverlay show={orderComplete} message="Order placed!" />
 */
interface SuccessOverlayProps {
  show: boolean;
  message?: string;
  subMessage?: string;
  onAnimationComplete?: () => void;
  className?: string;
}

export function SuccessOverlay({
  show,
  message = "Success!",
  subMessage,
  onAnimationComplete,
  className,
}: SuccessOverlayProps) {
  const prefersReducedMotion = useReducedMotion();

  // Body scroll lock when overlay is shown
  useBodyScrollLock(show);

  if (!show) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      transition: { delay: 1.5, duration: 0.3 },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.4, duration: 0.3 },
    },
  };

  return (
    <motion.div
      variants={prefersReducedMotion ? undefined : containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onAnimationComplete={onAnimationComplete}
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center",
        "bg-surface-primary/95 backdrop-blur-sm",
        className
      )}
    >
      <SuccessCheckmark show={show} size={80} />

      <motion.div
        variants={prefersReducedMotion ? undefined : textVariants}
        initial="hidden"
        animate="visible"
        className="mt-6 text-center"
      >
        <h2 className="font-display text-2xl font-bold text-text-primary">
          {message}
        </h2>
        {subMessage && (
          <p className="mt-2 font-body text-text-secondary">
            {subMessage}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

export default SuccessCheckmark;
