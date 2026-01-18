"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils/cn";
import { progressSpring } from "@/lib/micro-interactions";

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** Use spring physics for animation (default: true) */
  useSpring?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, useSpring = true, ...props }, ref) => {
  const percentage = value || 0;

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      {useSpring ? (
        <motion.div
          className="h-full bg-gradient-to-r from-saffron to-jade"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={progressSpring}
        />
      ) : (
        <ProgressPrimitive.Indicator
          className="h-full w-full flex-1 bg-gradient-to-r from-saffron to-jade transition-all duration-300 ease-out"
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      )}
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
