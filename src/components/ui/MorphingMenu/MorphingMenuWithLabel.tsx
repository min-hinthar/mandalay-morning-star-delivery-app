"use client";

import { forwardRef } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { MorphingMenu, type MorphingMenuProps } from "./MorphingMenu";

export interface MorphingMenuWithLabelProps extends MorphingMenuProps {
  /** Label when closed */
  closedLabel?: string;
  /** Label when open */
  openLabel?: string;
  /** Position of label */
  labelPosition?: "left" | "right";
}

export const MorphingMenuWithLabel = forwardRef<HTMLButtonElement, MorphingMenuWithLabelProps>(
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
        <MorphingMenu ref={ref} isOpen={isOpen} onToggle={onToggle} {...props} />

        <m.span
          className="text-sm font-medium"
          initial={false}
          animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
          key={label}
          transition={getSpring(spring.snappy)}
        >
          {label}
        </m.span>
      </div>
    );
  }
);

MorphingMenuWithLabel.displayName = "MorphingMenuWithLabel";
