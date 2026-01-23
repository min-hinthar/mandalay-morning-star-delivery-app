"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { cn } from "@/lib/utils/cn";

interface AnimatedFormFieldProps {
  children: ReactNode;
  className?: string;
  /** Scale amount on focus (default 1.02) */
  focusScale?: number;
}

/**
 * AnimatedFormField - Focus scale wrapper for form inputs
 *
 * Wraps any form input element to add subtle scale animation on focus.
 * Uses onFocusCapture/onBlurCapture to detect focus on any child element.
 *
 * @example
 * <AnimatedFormField>
 *   <Input placeholder="Name" />
 * </AnimatedFormField>
 */
export function AnimatedFormField({
  children,
  className,
  focusScale = 1.02,
}: AnimatedFormFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <motion.div
      className={cn("relative", className)}
      animate={shouldAnimate && isFocused ? { scale: focusScale } : { scale: 1 }}
      transition={getSpring(spring.snappy)}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={() => setIsFocused(false)}
    >
      {children}
    </motion.div>
  );
}
