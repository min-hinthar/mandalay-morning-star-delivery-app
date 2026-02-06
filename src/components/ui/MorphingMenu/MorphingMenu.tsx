"use client";

import { forwardRef } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring, transition } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { createVariants } from "./createVariants";

export interface MorphingMenuProps {
  /** Whether menu is open */
  isOpen: boolean;
  /** Callback when toggled */
  onToggle: () => void;
  /** Size of the icon */
  size?: number;
  /** Line thickness */
  lineHeight?: number;
  /** Color when closed */
  color?: string;
  /** Color when open */
  openColor?: string;
  /** Additional class names */
  className?: string;
  /** Accessible label */
  "aria-label"?: string;
  /** Play haptic feedback */
  haptic?: boolean;
  /** Style variant */
  variant?: "default" | "rounded" | "arrow" | "rotate";
}

export const MorphingMenu = forwardRef<HTMLButtonElement, MorphingMenuProps>(
  (
    {
      isOpen,
      onToggle,
      size = 24,
      lineHeight = 2,
      color = "currentColor",
      openColor,
      className,
      "aria-label": ariaLabel = "Toggle menu",
      haptic = true,
      variant = "default",
    },
    ref
  ) => {
    const { shouldAnimate, getSpring, isFullMotion } = useAnimationPreference();
    const variants = createVariants(variant, lineHeight);

    const handleClick = () => {
      if (haptic && isFullMotion && "vibrate" in navigator) {
        navigator.vibrate(10);
      }
      onToggle();
    };

    const springConfig = getSpring(spring.snappy);
    const currentColor = isOpen ? (openColor ?? color) : color;
    const lineWidth = size;
    const gap = lineHeight * 2.5;

    return (
      <m.button
        ref={ref}
        onClick={handleClick}
        className={cn(
          "relative flex flex-col items-center justify-center",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2",
          "rounded-lg p-3 -m-3",
          "hover:bg-surface-secondary/50 transition-colors duration-150",
          className
        )}
        style={{ width: Math.max(size + 24, 44), height: Math.max(size + 24, 44) }}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
        whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
        transition={springConfig}
      >
        {/* Top Line */}
        <m.span
          className="absolute"
          style={{
            width: lineWidth,
            height: lineHeight,
            backgroundColor: currentColor,
            top: `calc(50% - ${gap + lineHeight / 2}px)`,
            borderRadius: lineHeight / 2,
          }}
          variants={shouldAnimate ? variants.top : undefined}
          initial={false}
          animate={isOpen ? "open" : "closed"}
          transition={springConfig}
        />

        {/* Middle Line */}
        <m.span
          className="absolute"
          style={{
            width: lineWidth,
            height: lineHeight,
            backgroundColor: currentColor,
            top: `calc(50% - ${lineHeight / 2}px)`,
            borderRadius: lineHeight / 2,
            originX: 0.5,
          }}
          variants={shouldAnimate ? variants.middle : undefined}
          initial={false}
          animate={isOpen ? "open" : "closed"}
          transition={shouldAnimate ? transition.fast : undefined}
        />

        {/* Bottom Line */}
        <m.span
          className="absolute"
          style={{
            width: lineWidth,
            height: lineHeight,
            backgroundColor: currentColor,
            top: `calc(50% + ${gap - lineHeight / 2}px)`,
            borderRadius: lineHeight / 2,
          }}
          variants={shouldAnimate ? variants.bottom : undefined}
          initial={false}
          animate={isOpen ? "open" : "closed"}
          transition={springConfig}
        />

        {/* Decorative ring on open */}
        {shouldAnimate && (
          <m.span
            className="absolute inset-0 rounded-lg border-2"
            style={{ borderColor: currentColor }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={
              isOpen
                ? { opacity: 0.15, scale: 1 }
                : { opacity: 0, scale: 0.8 }
            }
            transition={springConfig}
          />
        )}
      </m.button>
    );
  }
);

MorphingMenu.displayName = "MorphingMenu";
