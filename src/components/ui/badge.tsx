import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Star, AlertTriangle, Tag, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * V6 Badge Component - Pepper Aesthetic
 * Pill-shaped badges with vibrant accent colors
 *
 * Semantic variants:
 * - default: Primary deep red
 * - secondary: Golden yellow
 * - outline: Border only with primary accent
 * - featured: Golden yellow with star
 * - allergen: Orange warning
 * - price-discount: Green for discounts
 * - price-premium: Magenta for surcharges
 * - status-*: Vibrant status colors
 */
const badgeVariants = cva(
  [
    "inline-flex items-center gap-1",
    "rounded-v6-badge",
    "border px-3 py-0.5",
    "font-v6-body text-xs font-semibold",
    "transition-colors duration-v6-fast",
  ].join(" "),
  {
    variants: {
      variant: {
        // V6 Default: Primary deep red
        default: [
          "border-transparent",
          "bg-v6-primary text-v6-text-inverse",
        ],
        // V6 Secondary: Golden yellow
        secondary: [
          "border-transparent",
          "bg-v6-secondary text-v6-text-primary",
        ],
        // V6 Outline: Border with primary accent
        outline: [
          "border-v6-primary",
          "bg-transparent text-v6-primary",
        ],

        // Featured/Popular - Golden yellow with glow
        featured: [
          "border-transparent",
          "bg-v6-secondary text-v6-text-primary",
          "shadow-v6-sm",
        ],

        // Allergen/Warning - Orange
        allergen: [
          "border-v6-orange/30",
          "bg-v6-orange-light text-v6-orange",
        ],

        // Price modifiers
        "price-discount": [
          "border-v6-green/30",
          "bg-v6-green-light text-v6-green",
        ],
        "price-premium": [
          "border-v6-magenta/30",
          "bg-v6-magenta-light text-v6-magenta",
        ],

        // Status variants - V6 vibrant colors
        "status-success": [
          "border-v6-green/30",
          "bg-v6-green-light text-v6-green",
        ],
        "status-warning": [
          "border-v6-orange/30",
          "bg-v6-orange-light text-v6-orange",
        ],
        "status-error": [
          "border-v6-status-error/30",
          "bg-v6-status-error-bg text-v6-status-error",
        ],
        "status-info": [
          "border-v6-teal/30",
          "bg-v6-teal-light text-v6-teal",
        ],
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        default: "px-3 py-0.5 text-xs",
        lg: "px-4 py-1 text-sm",
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
