import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Star, AlertTriangle, Tag, CheckCircle, AlertCircle, XCircle, type LucideIcon } from "lucide-react";
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
    "rounded-badge",
    "border px-3 py-0.5",
    "font-body text-xs font-semibold",
    "transition-colors duration-fast",
  ].join(" "),
  {
    variants: {
      variant: {
        // V6 Default: Primary deep red
        default: [
          "border-transparent",
          "bg-primary text-text-inverse",
        ],
        // V6 Secondary: Golden yellow
        secondary: [
          "border-transparent",
          "bg-secondary text-text-primary",
        ],
        // V6 Outline: Border with primary accent
        outline: [
          "border-primary",
          "bg-transparent text-primary",
        ],

        // Featured/Popular - Golden yellow with glow
        featured: [
          "border-transparent",
          "bg-secondary text-text-primary",
          "shadow-sm",
        ],

        // Allergen/Warning - Orange
        allergen: [
          "border-orange/30",
          "bg-orange-light text-orange",
        ],

        // Price modifiers
        "price-discount": [
          "border-green/30",
          "bg-green-light text-green",
        ],
        "price-premium": [
          "border-magenta/30",
          "bg-magenta-light text-magenta",
        ],

        // Status variants - V6 vibrant colors
        "status-success": [
          "border-green/30",
          "bg-green-light text-green",
        ],
        "status-warning": [
          "border-orange/30",
          "bg-orange-light text-orange",
        ],
        "status-error": [
          "border-status-error/30",
          "bg-status-error-bg text-status-error",
        ],
        "status-info": [
          "border-teal/30",
          "bg-teal-light text-teal",
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
const variantIcons: Partial<Record<NonNullable<BadgeProps["variant"]>, LucideIcon>> = {
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
  icon?: LucideIcon;
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
