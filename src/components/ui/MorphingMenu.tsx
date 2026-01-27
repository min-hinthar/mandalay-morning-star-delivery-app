"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring, transition } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

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

// ============================================
// ANIMATION VARIANTS BY STYLE
// ============================================

const createVariants = (
  variant: MorphingMenuProps["variant"],
  lineHeight: number
) => {
  const gap = lineHeight * 2.5;

  switch (variant) {
    case "arrow":
      return {
        top: {
          closed: { rotate: 0, y: 0, width: "100%" },
          open: { rotate: 45, y: gap, width: "50%", originX: 0 },
        },
        middle: {
          closed: { scaleX: 1, opacity: 1 },
          open: { scaleX: 1, opacity: 1, x: 4 },
        },
        bottom: {
          closed: { rotate: 0, y: 0, width: "100%" },
          open: { rotate: -45, y: -gap, width: "50%", originX: 0 },
        },
      };

    case "rotate":
      return {
        top: {
          closed: { rotate: 0, y: 0 },
          open: { rotate: 135, y: gap },
        },
        middle: {
          closed: { scaleX: 1, opacity: 1 },
          open: { scaleX: 0, opacity: 0 },
        },
        bottom: {
          closed: { rotate: 0, y: 0 },
          open: { rotate: -135, y: -gap },
        },
      };

    case "rounded":
      return {
        top: {
          closed: { rotate: 0, y: 0, borderRadius: "2px" },
          open: { rotate: 45, y: gap, borderRadius: "4px" },
        },
        middle: {
          closed: { scaleX: 1, opacity: 1, borderRadius: "2px" },
          open: { scaleX: 0, opacity: 0, borderRadius: "4px" },
        },
        bottom: {
          closed: { rotate: 0, y: 0, borderRadius: "2px" },
          open: { rotate: -45, y: -gap, borderRadius: "4px" },
        },
      };

    default:
      return {
        top: {
          closed: { rotate: 0, y: 0 },
          open: { rotate: 45, y: gap },
        },
        middle: {
          closed: { scaleX: 1, opacity: 1 },
          open: { scaleX: 0, opacity: 0 },
        },
        bottom: {
          closed: { rotate: 0, y: 0 },
          open: { rotate: -45, y: -gap },
        },
      };
  }
};

// ============================================
// COMPONENT
// ============================================

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
      // Haptic feedback
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
      <motion.button
        ref={ref}
        onClick={handleClick}
        className={cn(
          "relative flex flex-col items-center justify-center",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A41034]/30 focus-visible:ring-offset-2",
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
        <motion.span
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
        <motion.span
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
        <motion.span
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
          <motion.span
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
      </motion.button>
    );
  }
);

MorphingMenu.displayName = "MorphingMenu";

// ============================================
// MORPHING MENU WITH LABEL
// Shows text label that morphs with icon
// ============================================

export interface MorphingMenuWithLabelProps extends MorphingMenuProps {
  /** Label when closed */
  closedLabel?: string;
  /** Label when open */
  openLabel?: string;
  /** Position of label */
  labelPosition?: "left" | "right";
}

export const MorphingMenuWithLabel = forwardRef<
  HTMLButtonElement,
  MorphingMenuWithLabelProps
>(
  (
    {
      closedLabel = "Menu",
      openLabel = "Close",
      labelPosition = "right",
      isOpen,
      onToggle,
      className,
      ...props
    },
    ref
  ) => {
    const { shouldAnimate, getSpring } = useAnimationPreference();
    const label = isOpen ? openLabel : closedLabel;

    return (
      <div
        className={cn(
          "flex items-center gap-2",
          labelPosition === "left" && "flex-row-reverse",
          className
        )}
      >
        <MorphingMenu
          ref={ref}
          isOpen={isOpen}
          onToggle={onToggle}
          {...props}
        />

        <motion.span
          className="text-sm font-medium"
          initial={false}
          animate={
            shouldAnimate
              ? {
                  opacity: 1,
                  x: 0,
                }
              : undefined
          }
          key={label}
          transition={getSpring(spring.snappy)}
        >
          {label}
        </motion.span>
      </div>
    );
  }
);

MorphingMenuWithLabel.displayName = "MorphingMenuWithLabel";

// ============================================
// MORPHING CLOSE BUTTON
// X that morphs to checkmark on success
// ============================================

export interface MorphingCloseButtonProps {
  /** Current state */
  state?: "close" | "check" | "loading";
  /** Click handler */
  onClick?: () => void;
  /** Size */
  size?: number;
  /** Color */
  color?: string;
  /** Class names */
  className?: string;
}

export const MorphingCloseButton = forwardRef<
  HTMLButtonElement,
  MorphingCloseButtonProps
>(
  (
    {
      state = "close",
      onClick,
      size = 24,
      color = "currentColor",
      className,
    },
    ref
  ) => {
    const { shouldAnimate, getSpring } = useAnimationPreference();
    const strokeWidth = 2;

    const variants = {
      close: {
        line1: { rotate: 45, pathLength: 1 },
        line2: { rotate: -45, pathLength: 1 },
      },
      check: {
        line1: { rotate: 0, pathLength: 1 },
        line2: { rotate: 0, pathLength: 1 },
      },
      loading: {
        line1: { rotate: 0, pathLength: 0.3 },
        line2: { rotate: 0, pathLength: 0.3 },
      },
    };

    return (
      <motion.button
        ref={ref}
        onClick={onClick}
        className={cn(
          "flex items-center justify-center",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A41034]/30",
          "rounded-full p-1",
          className
        )}
        style={{ width: size + 8, height: size + 8 }}
        whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
        whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
        animate={state === "loading" ? { rotate: 360 } : undefined}
        transition={
          state === "loading"
            ? { duration: 1, repeat: Infinity, ease: "linear" }
            : getSpring(spring.snappy)
        }
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {state === "check" ? (
            <motion.path
              d="M5 12l5 5L19 7"
              initial={{ pathLength: 0 }}
              animate={shouldAnimate ? { pathLength: 1 } : undefined}
              transition={getSpring(spring.default)}
            />
          ) : (
            <>
              <motion.line
                x1="6"
                y1="6"
                x2="18"
                y2="18"
                initial={false}
                animate={shouldAnimate ? variants[state].line1 : undefined}
                transition={getSpring(spring.snappy)}
              />
              <motion.line
                x1="6"
                y1="18"
                x2="18"
                y2="6"
                initial={false}
                animate={shouldAnimate ? variants[state].line2 : undefined}
                transition={getSpring(spring.snappy)}
              />
            </>
          )}
        </svg>
      </motion.button>
    );
  }
);

MorphingCloseButton.displayName = "MorphingCloseButton";

export default MorphingMenu;
