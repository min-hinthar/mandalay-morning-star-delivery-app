"use client";

import { m } from "framer-motion";
import {
  Clock,
  ShieldCheck,
  ChefHat,
  Truck,
  Package,
  XCircle,
  DollarSign,
  AlertCircle,
  Ban,
  UserCheck,
  CheckCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export interface StatusBadgeProps {
  /** Status key (e.g. "pending", "in_transit", "delivered") */
  status: string;
  /** Override display label */
  label?: string;
  /** Badge size */
  size?: "sm" | "md";
}

// ============================================
// STATUS COLOR MAP
// ============================================

const STATUS_COLORS: Record<string, string> = {
  pending_approval: "bg-orange-100 text-orange-800",
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-teal-100 text-teal-800",
  preparing: "bg-purple-100 text-purple-800",
  in_transit: "bg-blue-100 text-blue-800",
  out_for_delivery: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
  failed: "bg-red-100 text-red-800",
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  skipped: "bg-amber-100 text-amber-800",
  assigned: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  in_progress: "bg-amber-100 text-amber-800",
  planned: "bg-gray-100 text-gray-800",
};

/** Statuses that receive a soft-pulse animation */
const ACTIVE_STATUSES = new Set([
  "pending_approval",
  "pending",
  "confirmed",
  "preparing",
  "in_transit",
  "out_for_delivery",
  "active",
  "assigned",
  "accepted",
]);

const DEFAULT_COLORS = "bg-gray-100 text-gray-800";

// ============================================
// STATUS ICON MAP (WCAG 1.4.1 — not color-only)
// ============================================

const STATUS_ICONS: Record<string, LucideIcon> = {
  pending_approval: AlertCircle,
  pending: Clock,
  confirmed: ShieldCheck,
  preparing: ChefHat,
  in_transit: Truck,
  out_for_delivery: Truck,
  delivered: Package,
  completed: Package,
  cancelled: XCircle,
  failed: XCircle,
  active: ShieldCheck,
  inactive: Ban,
  skipped: AlertCircle,
  refunded: DollarSign,
  partial: AlertCircle,
  refund_pending: Clock,
  assigned: UserCheck,
  accepted: CheckCircle,
  in_progress: Truck,
  planned: Clock,
};

// ============================================
// HELPERS
// ============================================

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ============================================
// COMPONENT
// ============================================

export function StatusBadge({ status, label, size = "sm" }: StatusBadgeProps) {
  const { shouldAnimate } = useAnimationPreference();
  const colors = STATUS_COLORS[status] ?? DEFAULT_COLORS;
  const displayLabel = label ?? formatStatusLabel(status);
  const isActive = ACTIVE_STATUSES.has(status);
  const Icon = STATUS_ICONS[status];

  const sizeClasses = size === "md" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs";
  const iconClasses = size === "md" ? "inline-block h-3.5 w-3.5 mr-1" : "inline-block h-3 w-3 mr-1";

  return (
    <m.div
      animate={
        shouldAnimate && isActive ? { scale: [1, 1.05, 1], opacity: [1, 0.8, 1] } : undefined
      }
      transition={isActive ? { duration: 2, repeat: 5 } : undefined}
      className="inline-flex"
    >
      <span
        className={cn(
          "inline-flex items-center rounded-full font-semibold whitespace-nowrap",
          sizeClasses,
          colors
        )}
      >
        {Icon && <Icon className={iconClasses} aria-hidden="true" />}
        {displayLabel}
      </span>
    </m.div>
  );
}
