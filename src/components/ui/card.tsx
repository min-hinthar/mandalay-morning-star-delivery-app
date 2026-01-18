"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

/**
 * V3 Card System
 * Premium Burmese aesthetic with warm shadows
 *
 * Variants: flat, elevated, interactive, alert
 */
const cardVariants = cva(
  [
    "rounded-[var(--radius-md)] bg-[var(--color-surface)]",
    "transition-all duration-[var(--duration-fast)]",
  ].join(" "),
  {
    variants: {
      variant: {
        // Flat: Border only, no shadow (for list items)
        flat: "border border-[var(--color-border)]",

        // Elevated: Shadow for standalone cards
        elevated: "shadow-[var(--shadow-md)]",

        // Interactive: Clickable cards with hover effects
        interactive: [
          "shadow-[var(--shadow-sm)] cursor-pointer",
          "hover:shadow-[var(--shadow-md)] hover:scale-[1.01]",
          "active:shadow-[var(--shadow-sm)] active:scale-[0.99]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cta)]",
        ].join(" "),

        // Alert: Left border accent (exception cards)
        alert: "border-l-4",

        // Default: Basic card (legacy compatibility)
        default: "border border-[var(--color-border)] shadow-[var(--shadow-sm)]",
      },
      alertAccent: {
        error: "border-l-[var(--color-error)]",
        warning: "border-l-[var(--color-warning)]",
        success: "border-l-[var(--color-jade)]",
        info: "border-l-[var(--color-cta)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Make the card interactive with keyboard support */
  asButton?: boolean;
  /** Click handler for interactive cards */
  onPress?: () => void;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, alertAccent, asButton, onPress, children, ...props }, ref) => {
    const isInteractive = variant === "interactive" || asButton;

    if (isInteractive && onPress) {
      return (
        <div
          ref={ref}
          role="button"
          tabIndex={0}
          onClick={onPress}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onPress();
            }
          }}
          className={cn(cardVariants({ variant, alertAccent, className }))}
          {...props}
        >
          {children}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, alertAccent, className }))}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

/**
 * Animated Card with Framer Motion
 * Use for cards that need entrance/exit animations
 */
export interface AnimatedCardProps
  extends Omit<HTMLMotionProps<"div">, "onAnimationStart">,
    VariantProps<typeof cardVariants> {}

const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, variant, alertAccent, ...props }, ref) => (
    <motion.div
      ref={ref}
      className={cn(cardVariants({ variant, alertAccent, className }))}
      {...props}
    />
  )
);
AnimatedCard.displayName = "AnimatedCard";

// Sub-components for structured card content
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-[var(--space-4)]", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-[var(--font-display)] text-xl font-semibold leading-tight text-[var(--color-charcoal)]",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[var(--color-charcoal-muted)]", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-[var(--space-4)] pt-0", className)}
    {...props}
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-[var(--space-4)] pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  AnimatedCard,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
};
