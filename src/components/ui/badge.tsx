import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Star, AlertTriangle, Tag, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * V4 Badge Component
 *
 * Semantic variants for different use cases:
 * - default: Primary brand styling
 * - secondary: Muted background
 * - outline: Border only
 * - featured: Gold/star for popular items
 * - allergen: Amber/warning for dietary info
 * - price-discount: Green for discounts
 * - price-premium: Red for surcharges
 * - status-success: Green success state
 * - status-warning: Amber warning state
 * - status-error: Red error state
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[var(--radius-md)] border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        // Default variants
        default: [
          "border-transparent",
          "bg-[var(--color-primary)] text-white",
        ],
        secondary: [
          "border-[var(--color-border)]",
          "bg-[var(--color-surface-muted)] text-[var(--color-charcoal)]",
        ],
        outline: [
          "border-[var(--color-border)]",
          "bg-transparent text-[var(--color-charcoal)]",
        ],

        // Featured/Popular - Gold
        featured: [
          "border-transparent",
          "bg-[var(--color-cta)] text-[var(--color-charcoal)]",
          "shadow-[var(--shadow-sm)]",
        ],

        // Allergen/Warning - Amber
        allergen: [
          "border-[var(--color-warning)]/30",
          "bg-[var(--color-warning-light)] text-[var(--color-warning-dark)]",
        ],

        // Price modifiers
        "price-discount": [
          "border-[var(--color-jade)]/30",
          "bg-[var(--color-jade-light)] text-[var(--color-jade-dark)]",
        ],
        "price-premium": [
          "border-[var(--color-error)]/30",
          "bg-[var(--color-error-light)] text-[var(--color-error-dark)]",
        ],

        // Status variants
        "status-success": [
          "border-[var(--color-jade)]/30",
          "bg-[var(--color-jade-light)] text-[var(--color-jade)]",
        ],
        "status-warning": [
          "border-[var(--color-warning)]/30",
          "bg-[var(--color-warning-light)] text-[var(--color-warning-dark)]",
        ],
        "status-error": [
          "border-[var(--color-error)]/30",
          "bg-[var(--color-error-light)] text-[var(--color-error)]",
        ],
        "status-info": [
          "border-[var(--color-info)]/30",
          "bg-[var(--color-info-light)] text-[var(--color-info)]",
        ],
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Icons for each variant
const variantIcons: Partial<Record<NonNullable<BadgeProps["variant"]>, React.ElementType>> = {
  featured: Star,
  allergen: AlertTriangle,
  "price-discount": Tag,
  "price-premium": Tag,
  "status-success": CheckCircle,
  "status-warning": AlertCircle,
  "status-error": XCircle,
  "status-info": AlertCircle,
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Show variant-specific icon */
  showIcon?: boolean;
  /** Custom icon component */
  icon?: React.ElementType;
}

function Badge({
  className,
  variant,
  size,
  showIcon = false,
  icon: CustomIcon,
  children,
  ...props
}: BadgeProps) {
  const IconComponent = CustomIcon || (variant ? variantIcons[variant] : undefined);
  const shouldShowIcon = showIcon && IconComponent;

  // Icon size based on badge size
  const iconSize = size === "sm" ? "h-2.5 w-2.5" : size === "lg" ? "h-4 w-4" : "h-3 w-3";

  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {shouldShowIcon && <IconComponent className={cn(iconSize, "fill-current")} />}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
