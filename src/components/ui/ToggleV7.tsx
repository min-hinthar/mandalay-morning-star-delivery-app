"use client";

import React, { forwardRef, useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { v7Spring } from "@/lib/motion-tokens-v7";
import { useAnimationPreferenceV7 } from "@/lib/hooks/useAnimationPreferenceV7";

// ============================================
// TYPES
// ============================================

export interface ToggleV7Props {
  /** Controlled checked state */
  checked?: boolean;
  /** Default checked state (uncontrolled) */
  defaultChecked?: boolean;
  /** Callback when state changes */
  onCheckedChange?: (checked: boolean) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Color variant */
  color?: "primary" | "success" | "warning" | "gold";
  /** Label text */
  label?: string;
  /** Label position */
  labelPosition?: "left" | "right";
  /** Additional class names */
  className?: string;
  /** Show on/off icons inside toggle */
  showIcons?: boolean;
  /** Haptic feedback */
  haptic?: boolean;
  /** Required for forms */
  name?: string;
  /** Value for forms */
  value?: string;
}

// ============================================
// SIZE CONFIG
// ============================================

const sizeConfig = {
  sm: {
    track: "w-9 h-5",
    thumb: "w-4 h-4",
    translate: 16,
    iconSize: 10,
  },
  md: {
    track: "w-11 h-6",
    thumb: "w-5 h-5",
    translate: 20,
    iconSize: 12,
  },
  lg: {
    track: "w-14 h-7",
    thumb: "w-6 h-6",
    translate: 28,
    iconSize: 14,
  },
};

// ============================================
// COLOR CONFIG
// ============================================

const colorConfig = {
  primary: {
    active: "bg-v6-primary",
    activeShadow: "shadow-v6-primary/30",
    gradient: "from-v6-primary to-v6-primary-hover",
  },
  success: {
    active: "bg-v6-green",
    activeShadow: "shadow-v6-green/30",
    gradient: "from-v6-green to-v6-green-active",
  },
  warning: {
    active: "bg-v6-status-warning",
    activeShadow: "shadow-v6-status-warning/30",
    gradient: "from-v6-status-warning to-v6-status-warning-active",
  },
  gold: {
    active: "bg-v6-secondary",
    activeShadow: "shadow-v6-secondary/30",
    gradient: "from-v6-secondary to-v6-secondary-active",
  },
};

// ============================================
// COMPONENT
// ============================================

export const ToggleV7 = forwardRef<HTMLButtonElement, ToggleV7Props>(
  (
    {
      checked: controlledChecked,
      defaultChecked = false,
      onCheckedChange,
      disabled = false,
      size = "md",
      color = "primary",
      label,
      labelPosition = "right",
      className,
      showIcons = false,
      haptic = true,
      name,
      value,
    },
    ref
  ) => {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
    const { shouldAnimate, getSpring, isFullMotion } = useAnimationPreferenceV7();
    const id = useId();

    const isChecked = controlledChecked ?? internalChecked;
    const sizes = sizeConfig[size];
    const colors = colorConfig[color];

    const handleToggle = () => {
      if (disabled) return;

      // Haptic feedback
      if (haptic && isFullMotion && "vibrate" in navigator) {
        navigator.vibrate(isChecked ? 8 : 12);
      }

      const newChecked = !isChecked;

      if (controlledChecked === undefined) {
        setInternalChecked(newChecked);
      }

      onCheckedChange?.(newChecked);
    };

    const springConfig = getSpring(v7Spring.ultraBouncy);

    const toggleElement = (
      <motion.button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={isChecked}
        aria-labelledby={label ? `${id}-label` : undefined}
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "relative inline-flex items-center rounded-full",
          "transition-colors duration-150",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-v6-primary/30 focus-visible:ring-offset-2",
          sizes.track,
          isChecked
            ? cn("bg-gradient-to-r", colors.gradient, "shadow-md", colors.activeShadow)
            : "bg-v6-surface-tertiary",
          disabled && "opacity-50 cursor-not-allowed",
          !label && className
        )}
        whileHover={shouldAnimate && !disabled ? { scale: 1.02 } : undefined}
        whileTap={shouldAnimate && !disabled ? { scale: 0.98 } : undefined}
        transition={springConfig}
      >
        {/* Hidden input for form compatibility */}
        {name && (
          <input
            type="hidden"
            name={name}
            value={isChecked ? (value ?? "on") : ""}
          />
        )}

        {/* Icons inside track */}
        {showIcons && (
          <>
            {/* Check icon */}
            <motion.span
              className="absolute left-1.5 text-white"
              initial={false}
              animate={
                shouldAnimate
                  ? { opacity: isChecked ? 1 : 0, scale: isChecked ? 1 : 0.5 }
                  : undefined
              }
              transition={springConfig}
            >
              <svg
                width={sizes.iconSize}
                height={sizes.iconSize}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12l5 5L19 7" />
              </svg>
            </motion.span>

            {/* X icon */}
            <motion.span
              className="absolute right-1.5 text-v6-text-muted"
              initial={false}
              animate={
                shouldAnimate
                  ? { opacity: isChecked ? 0 : 1, scale: isChecked ? 0.5 : 1 }
                  : undefined
              }
              transition={springConfig}
            >
              <svg
                width={sizes.iconSize}
                height={sizes.iconSize}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </motion.span>
          </>
        )}

        {/* Thumb */}
        <motion.span
          className={cn(
            "absolute rounded-full bg-white shadow-md",
            "flex items-center justify-center",
            sizes.thumb
          )}
          initial={false}
          animate={
            shouldAnimate
              ? {
                  x: isChecked ? sizes.translate : 2,
                  scale: 1,
                }
              : { x: isChecked ? sizes.translate : 2 }
          }
          whileHover={shouldAnimate && !disabled ? { scale: 1.1 } : undefined}
          transition={springConfig}
          style={{
            boxShadow: isChecked
              ? "0 2px 8px rgba(0,0,0,0.15)"
              : "0 1px 4px rgba(0,0,0,0.1)",
          }}
        >
          {/* Inner glow on checked */}
          {isChecked && shouldAnimate && (
            <motion.span
              className={cn(
                "absolute inset-1 rounded-full",
                "bg-gradient-to-br from-white/80 to-transparent"
              )}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={springConfig}
            />
          )}
        </motion.span>
      </motion.button>
    );

    // Without label
    if (!label) {
      return toggleElement;
    }

    // With label
    return (
      <label
        className={cn(
          "inline-flex items-center gap-3 cursor-pointer",
          disabled && "cursor-not-allowed opacity-60",
          labelPosition === "left" && "flex-row-reverse",
          className
        )}
      >
        {toggleElement}
        <span
          id={`${id}-label`}
          className={cn(
            "text-sm font-medium select-none",
            isChecked ? "text-v6-text-primary" : "text-v6-text-secondary"
          )}
        >
          {label}
        </span>
      </label>
    );
  }
);

ToggleV7.displayName = "ToggleV7";

// ============================================
// TOGGLE GROUP
// Multiple toggles in a group layout
// ============================================

export interface ToggleGroupProps {
  children: React.ReactNode;
  /** Vertical or horizontal layout */
  orientation?: "horizontal" | "vertical";
  /** Additional class names */
  className?: string;
}

export function ToggleGroup({
  children,
  orientation = "vertical",
  className,
}: ToggleGroupProps) {
  return (
    <div
      role="group"
      className={cn(
        "flex gap-3",
        orientation === "vertical" ? "flex-col" : "flex-row flex-wrap",
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================
// ANIMATED CHECKBOX
// Toggle styled as a checkbox with bounce
// ============================================

export interface AnimatedCheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  haptic?: boolean;
}

export const AnimatedCheckbox = forwardRef<HTMLButtonElement, AnimatedCheckboxProps>(
  (
    {
      checked: controlledChecked,
      defaultChecked = false,
      onCheckedChange,
      disabled = false,
      label,
      className,
      haptic = true,
    },
    ref
  ) => {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
    const { shouldAnimate, getSpring, isFullMotion } = useAnimationPreferenceV7();
    const id = useId();

    const isChecked = controlledChecked ?? internalChecked;

    const handleToggle = () => {
      if (disabled) return;

      if (haptic && isFullMotion && "vibrate" in navigator) {
        navigator.vibrate(10);
      }

      const newChecked = !isChecked;

      if (controlledChecked === undefined) {
        setInternalChecked(newChecked);
      }

      onCheckedChange?.(newChecked);
    };

    const springConfig = getSpring(v7Spring.ultraBouncy);

    return (
      <label
        className={cn(
          "inline-flex items-center gap-3 cursor-pointer select-none",
          disabled && "cursor-not-allowed opacity-60",
          className
        )}
      >
        <motion.button
          ref={ref}
          type="button"
          role="checkbox"
          aria-checked={isChecked}
          aria-labelledby={label ? `${id}-label` : undefined}
          onClick={handleToggle}
          disabled={disabled}
          className={cn(
            "relative w-5 h-5 rounded-md",
            "border-2 transition-colors duration-150",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-v6-primary/30 focus-visible:ring-offset-2",
            isChecked
              ? "bg-v6-primary border-v6-primary"
              : "bg-white border-v6-border-strong hover:border-v6-primary/50"
          )}
          whileHover={shouldAnimate && !disabled ? { scale: 1.1 } : undefined}
          whileTap={shouldAnimate && !disabled ? { scale: 0.9 } : undefined}
          transition={springConfig}
        >
          {/* Checkmark */}
          <motion.svg
            className="absolute inset-0 w-full h-full p-0.5 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ opacity: 0, scale: 0, rotate: -45 }}
            animate={
              shouldAnimate
                ? isChecked
                  ? { opacity: 1, scale: 1, rotate: 0 }
                  : { opacity: 0, scale: 0, rotate: -45 }
                : isChecked
                ? { opacity: 1 }
                : { opacity: 0 }
            }
            transition={springConfig}
          >
            <motion.path
              d="M5 12l5 5L19 7"
              initial={{ pathLength: 0 }}
              animate={shouldAnimate ? { pathLength: isChecked ? 1 : 0 } : undefined}
              transition={{ ...springConfig, delay: 0.05 }}
            />
          </motion.svg>
        </motion.button>

        {label && (
          <span
            id={`${id}-label`}
            className={cn(
              "text-sm font-medium",
              isChecked ? "text-v6-text-primary" : "text-v6-text-secondary"
            )}
          >
            {label}
          </span>
        )}
      </label>
    );
  }
);

AnimatedCheckbox.displayName = "AnimatedCheckbox";

export default ToggleV7;
