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
    "rounded-card bg-surface-primary",
    // V6 Motion: Spring-based transitions
    "transition-all duration-normal ease-spring",
  ].join(" "),
  {
    variants: {
      variant: {
        // Flat: Subtle background, no shadow (for list items)
        flat: [
          "bg-surface-secondary",
          "border border-border-subtle",
        ].join(" "),

        // Elevated: Warm shadow for standalone cards
        elevated: "shadow-card",

        // Interactive: Clickable cards with hover lift effects
        interactive: [
          "shadow-card cursor-pointer",
          "hover:shadow-card-hover hover:-translate-y-1 hover:scale-[1.01]",
          "active:shadow-md active:translate-y-0 active:scale-[0.99]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        ].join(" "),

        // Alert: Left border accent (exception cards)
        alert: "border-l-4 shadow-sm",

        // Default: Basic card (legacy compatibility)
        default: "border border-border shadow-sm",
      },
      alertAccent: {
        error: "border-l-status-error bg-status-error-bg",
        warning: "border-l-status-warning bg-status-warning-bg",
        success: "border-l-green bg-green-light",
        info: "border-l-teal bg-teal-light",
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
      "font-display text-xl font-bold leading-tight text-text-primary",
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
    className={cn("text-sm text-text-secondary", className)}
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
