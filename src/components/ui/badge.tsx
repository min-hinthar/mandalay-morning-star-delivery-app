import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Star, AlertTriangle, Tag, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * V5 Badge Component
 *
 * Semantic variants using V5 design tokens:
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
 * - status-info: Blue info state
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[var(--radius-md)] border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        // Default variants
        default: [
          "border-transparent",
          "bg-[var(--color-interactive-primary)] text-[var(--color-text-inverse)]",
        ],
        secondary: [
          "border-[var(--color-border-default)]",
          "bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]",
        ],
        outline: [
          "border-[var(--color-border-default)]",
          "bg-transparent text-[var(--color-text-primary)]",
        ],

        // Featured/Popular - Gold
        featured: [
          "border-transparent",
          "bg-[var(--color-interactive-primary)] text-[var(--color-text-primary)]",
          "shadow-[var(--elevation-1)]",
        ],

        // Allergen/Warning - Amber
        allergen: [
          "border-[var(--color-status-warning)]/30",
          "bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning)]",
        ],

        // Price modifiers
        "price-discount": [
          "border-[var(--color-status-success)]/30",
          "bg-[var(--color-status-success-bg)] text-[var(--color-status-success)]",
        ],
        "price-premium": [
          "border-[var(--color-status-error)]/30",
          "bg-[var(--color-status-error-bg)] text-[var(--color-status-error)]",
        ],

        // Status variants
        "status-success": [
          "border-[var(--color-status-success)]/30",
          "bg-[var(--color-status-success-bg)] text-[var(--color-status-success)]",
        ],
        "status-warning": [
          "border-[var(--color-status-warning)]/30",
          "bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning)]",
        ],
        "status-error": [
          "border-[var(--color-status-error)]/30",
          "bg-[var(--color-status-error-bg)] text-[var(--color-status-error)]",
        ],
        "status-info": [
          "border-[var(--color-status-info)]/30",
          "bg-[var(--color-status-info-bg)] text-[var(--color-status-info)]",
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
