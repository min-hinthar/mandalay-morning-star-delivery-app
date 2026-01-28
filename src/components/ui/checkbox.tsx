"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

const checkVariants = {
  unchecked: {
    pathLength: 0,
    opacity: 0,
  },
  checked: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.2, ease: "easeOut" as const },
      opacity: { duration: 0.1 },
    },
  },
};

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, checked, ...props }, ref) => {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const isChecked = checked === true || checked === "indeterminate";

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      checked={checked}
      className={cn(
        "peer h-5 w-5 shrink-0 rounded-md border-2 border-border",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
        "transition-colors duration-150",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator asChild>
        <motion.span
          className="flex items-center justify-center text-text-inverse"
          initial={shouldAnimate ? { scale: 0.5 } : undefined}
          animate={shouldAnimate ? { scale: 1 } : undefined}
          transition={
            shouldAnimate ? getSpring(spring.rubbery) : undefined
          }
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <AnimatePresence>
              {isChecked && (
                <motion.path
                  d="M2.5 6L5 8.5L9.5 3.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  variants={shouldAnimate ? checkVariants : undefined}
                  initial="unchecked"
                  animate="checked"
                  exit="unchecked"
                />
              )}
            </AnimatePresence>
          </svg>
        </motion.span>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
