/**
 * V6 Quantity Selector - Pepper Aesthetic
 *
 * Features:
 * - V6 colors and typography
 * - Number scale animation on change
 * - Spring-based button feedback
 * - Bounce effect on quantity change
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { v6SpringBouncy } from "@/lib/motion";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  /** Size variant: default (44px) or large (56px for driver) */
  size?: "default" | "large";
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 50,
  disabled = false,
  size = "default",
}: QuantitySelectorProps) {
  const canDecrement = value > min && !disabled;
  const canIncrement = value < max && !disabled;
  const prefersReducedMotion = useReducedMotion();
  const [animationKey, setAnimationKey] = useState(0);
  const prevValueRef = useRef(value);

  // Track value changes for animation direction
  useEffect(() => {
    if (value !== prevValueRef.current) {
      setAnimationKey((k) => k + 1);
      prevValueRef.current = value;
    }
  }, [value]);

  const buttonSize = size === "large" ? "h-14 w-14" : "h-11 w-11";
  const textSize = size === "large" ? "text-2xl" : "text-xl";

  return (
    <div className="flex items-center gap-3">
      {/* Decrement Button */}
      <motion.div
        whileTap={!prefersReducedMotion && canDecrement ? { scale: 0.9 } : undefined}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={() => onChange(value - 1)}
          disabled={!canDecrement}
          aria-label="Decrease quantity"
          className={cn(
            buttonSize,
            "rounded-full border-2",
            canDecrement
              ? "border-v6-primary text-v6-primary hover:bg-v6-primary-light"
              : "border-v6-border text-v6-text-muted"
          )}
        >
          <Minus className="h-5 w-5" />
        </Button>
      </motion.div>

      {/* Quantity Display with Animation */}
      <div
        className={cn(
          "relative w-14 text-center overflow-hidden",
          textSize
        )}
        aria-live="polite"
        aria-atomic="true"
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={animationKey}
            initial={prefersReducedMotion ? false : { y: 10, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? undefined : { y: -10, opacity: 0, scale: 0.8 }}
            transition={prefersReducedMotion ? { duration: 0 } : v6SpringBouncy}
            className={cn(
              "block font-v6-display font-bold tabular-nums",
              disabled ? "text-v6-text-muted" : "text-v6-text-primary"
            )}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Increment Button */}
      <motion.div
        whileTap={!prefersReducedMotion && canIncrement ? { scale: 0.9 } : undefined}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={() => onChange(value + 1)}
          disabled={!canIncrement}
          aria-label="Increase quantity"
          className={cn(
            buttonSize,
            "rounded-full border-2",
            canIncrement
              ? "border-v6-primary text-v6-primary hover:bg-v6-primary-light"
              : "border-v6-border text-v6-text-muted"
          )}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </motion.div>
    </div>
  );
}
