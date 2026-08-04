/**
 * Driver Stats Cards Component
 *
 * Displays key driver metrics in a responsive grid with motion animations.
 * Uses teal gradient styling consistent with admin dashboard KPICards.
 */

"use client";

import { m } from "framer-motion";
import { Star, Truck, Circle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { AnimatedValue } from "@/components/ui/admin/AdminDashboard/AnimatedValue";

interface Driver {
  id: string;
  ratingAvg: number | null;
  deliveriesCount: number;
  isActive: boolean;
  createdAt: string;
}

interface DriverStatsCardsProps {
  driver: Driver;
}

interface StatCardProps {
  title: string;
  value: number | null;
  displayValue?: string;
  format?: "number" | "percentage" | "duration";
  icon: React.ReactNode;
  subtitle?: string;
}

function StatCard({ title, value, displayValue, format, icon, subtitle }: StatCardProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <m.div
      variants={staggerItem}
      whileHover={shouldAnimate ? { y: -2, scale: 1.02 } : undefined}
      transition={getSpring(spring.snappy)}
      className={cn(
        "relative overflow-hidden rounded-xl p-5",
        "bg-gradient-to-br from-accent-teal/5 to-accent-teal/10",
        "border border-accent-teal/20",
        "transition-shadow hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-body font-medium text-text-secondary">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            {value !== null && format ? (
              <AnimatedValue
                value={value}
                format={format}
                className="text-2xl md:text-3xl font-display font-bold text-text-primary"
              />
            ) : (
              <span className="text-2xl md:text-3xl font-display font-bold text-text-primary">
                {displayValue ?? "—"}
              </span>
            )}
            {subtitle && <span className="text-sm font-body text-text-muted">{subtitle}</span>}
          </div>
        </div>

        <m.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="rounded-xl p-2.5 bg-accent-teal/10"
        >
          {icon}
        </m.div>
      </div>
    </m.div>
  );
}

export function DriverStatsCards({ driver }: DriverStatsCardsProps) {
  const { shouldAnimate } = useAnimationPreference();

  // null = no ratings yet, which reads the same as 0 here: show an em dash
  // rather than a 0.0 that looks like a bad score.
  const rated = driver.ratingAvg !== null && driver.ratingAvg > 0;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  return (
    <m.div
      variants={shouldAnimate ? staggerContainer(0.08, 0.1) : undefined}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      <StatCard
        title="Rating"
        value={rated ? driver.ratingAvg : null}
        displayValue={rated ? driver.ratingAvg!.toFixed(1) : "—"}
        icon={<Star className="h-5 w-5 text-accent-teal fill-current" />}
        subtitle={rated ? "/ 5" : undefined}
      />

      <StatCard
        title="Total Deliveries"
        value={driver.deliveriesCount}
        format="number"
        icon={<Truck className="h-5 w-5 text-accent-teal" />}
      />

      <StatCard
        title="Status"
        value={null}
        displayValue={driver.isActive ? "Active" : "Inactive"}
        icon={
          <Circle
            className={cn(
              "h-5 w-5",
              driver.isActive
                ? "fill-accent-teal text-accent-teal"
                : "fill-text-muted text-text-muted"
            )}
          />
        }
      />

      <StatCard
        title="Member Since"
        value={null}
        displayValue={formatDate(driver.createdAt)}
        icon={<Calendar className="h-5 w-5 text-accent-teal" />}
      />
    </m.div>
  );
}
