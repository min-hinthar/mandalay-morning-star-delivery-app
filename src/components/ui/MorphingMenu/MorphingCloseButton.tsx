"use client";

import { forwardRef } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

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
      <m.button
        ref={ref}
        onClick={onClick}
        className={cn(
          "flex items-center justify-center",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          "rounded-full p-1",
          className
        )}
        style={{ width: size + 8, height: size + 8 }}
        whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
        whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
        animate={state === "loading" ? { rotate: 360 } : undefined}
        transition={
          state === "loading"
            ? { duration: 1, repeat: 20, ease: "linear" }
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
            <m.path
              d="M5 12l5 5L19 7"
              initial={{ pathLength: 0 }}
              animate={shouldAnimate ? { pathLength: 1 } : undefined}
              transition={getSpring(spring.default)}
            />
          ) : (
            <>
              <m.line
                x1="6"
                y1="6"
                x2="18"
                y2="18"
                initial={false}
                animate={shouldAnimate ? variants[state].line1 : undefined}
                transition={getSpring(spring.snappy)}
              />
              <m.line
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
      </m.button>
    );
  }
);

MorphingCloseButton.displayName = "MorphingCloseButton";
