"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

/**
 * V6 Card System - Pepper Aesthetic
 * Large rounded corners, warm shadows, spring hover effects
 *
 * Variants: flat, elevated, interactive, alert
 */
const cardVariants = cva(
  [
    // V6 Base: Large rounded corners, warm surface
    "rounded-v6-card bg-v6-surface-primary",
    // V6 Motion: Spring-based transitions
    "transition-all duration-v6-normal ease-v6-spring",
  ].join(" "),
  {
    variants: {
      variant: {
        // Flat: Subtle background, no shadow (for list items)
        flat: [
          "bg-v6-surface-secondary",
          "border border-v6-border-subtle",
        ].join(" "),

        // Elevated: Warm shadow for standalone cards
        elevated: "shadow-v6-card",

        // Interactive: Clickable cards with hover lift effects
        interactive: [
          "shadow-v6-card cursor-pointer",
          "hover:shadow-v6-card-hover hover:-translate-y-1 hover:scale-[1.01]",
          "active:shadow-v6-md active:translate-y-0 active:scale-[0.99]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v6-primary focus-visible:ring-offset-2",
        ].join(" "),

        // Alert: Left border accent (exception cards)
        alert: "border-l-4 shadow-v6-sm",

        // Default: Basic card (legacy compatibility)
        default: "border border-v6-border shadow-v6-sm",
      },
      alertAccent: {
        error: "border-l-v6-status-error bg-v6-status-error-bg",
        warning: "border-l-v6-status-warning bg-v6-status-warning-bg",
        success: "border-l-v6-green bg-v6-green-light",
        info: "border-l-v6-teal bg-v6-teal-light",
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
    className={cn("flex flex-col space-y-1.5 p-6", className)}
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
      "font-v6-display text-xl font-bold leading-tight text-v6-text-primary",
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
    className={cn("text-sm text-v6-text-secondary", className)}
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
    className={cn("p-6 pt-0", className)}
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
    className={cn("flex items-center p-6 pt-0", className)}
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
