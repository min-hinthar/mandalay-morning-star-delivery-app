"use client";

import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { cardContainer, cardItem } from "@/components/ui/admin/CardRow";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { AnimatedValue } from "@/components/ui/admin/AdminDashboard/AnimatedValue";
import type { OrderStatus } from "@/types/database";
import type { OpsStatusCounts } from "./helpers";

// ============================================
// TYPES
// ============================================

export interface OpsKPIGridProps {
  counts: OpsStatusCounts;
  activeFilter: OrderStatus | "all";
  onFilterChange: (status: OrderStatus | "all") => void;
  unassignedCount: number;
}

// ============================================
// KPI CARD CONFIG
// ============================================

interface KPICardConfig {
  status: OrderStatus;
  label: string;
  colorClasses: string;
  activeRing: string;
}

const KPI_CARDS: KPICardConfig[] = [
  {
    status: "pending",
    label: "Pending",
    colorClasses: "bg-amber-50 text-amber-800 border-amber-200",
    activeRing: "ring-amber-500",
  },
  {
    status: "confirmed",
    label: "Confirmed",
    colorClasses: "bg-teal-50 text-teal-800 border-teal-200",
    activeRing: "ring-teal-500",
  },
  {
    status: "preparing",
    label: "Preparing",
    colorClasses: "bg-purple-50 text-purple-800 border-purple-200",
    activeRing: "ring-purple-500",
  },
  {
    status: "out_for_delivery",
    label: "Out for Delivery",
    colorClasses: "bg-blue-50 text-blue-800 border-blue-200",
    activeRing: "ring-blue-500",
  },
  {
    status: "delivered",
    label: "Delivered",
    colorClasses: "bg-green-50 text-green-800 border-green-200",
    activeRing: "ring-green-500",
  },
];

// ============================================
// COMPONENT
// ============================================

export function OpsKPIGrid({ counts, activeFilter, onFilterChange, unassignedCount }: OpsKPIGridProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  function handleClick(status: OrderStatus) {
    if (activeFilter === status) {
      onFilterChange("all");
    } else {
      onFilterChange(status);
    }
  }

  return (
    <m.div
      variants={cardContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5"
    >
      {KPI_CARDS.map((card) => {
        const isActive = activeFilter === card.status;
        const count = counts[card.status];

        return (
          <m.button
            key={card.status}
            variants={cardItem}
            onClick={() => handleClick(card.status)}
            whileHover={shouldAnimate ? { scale: 1.03 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.97 } : undefined}
            transition={getSpring(spring.snappy)}
            className={cn(
              "relative flex flex-col items-center gap-1 rounded-xl border p-4 transition-shadow",
              card.colorClasses,
              isActive && `ring-2 ${card.activeRing} shadow-lg`,
              !isActive && "hover:shadow-md"
            )}
          >
            <span className="text-xs font-medium uppercase tracking-wider opacity-70">
              {card.label}
            </span>
            <span className="text-3xl font-bold tabular-nums">
              <AnimatedValue value={count} format="number" />
            </span>

            {/* Unassigned badge on Confirmed card */}
            {card.status === "confirmed" && unassignedCount > 0 && (
              <m.span
                initial={shouldAnimate ? { scale: 0 } : undefined}
                animate={
                  shouldAnimate
                    ? { scale: [1, 1.15, 1] }
                    : undefined
                }
                transition={
                  shouldAnimate
                    ? { scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } }
                    : undefined
                }
                className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-text-inverse"
              >
                {unassignedCount}
              </m.span>
            )}
          </m.button>
        );
      })}
    </m.div>
  );
}
