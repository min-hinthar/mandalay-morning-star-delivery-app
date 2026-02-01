/**
 * Driver Stats Cards Component
 *
 * Displays key driver metrics in a responsive grid with motion animations.
 * Following MetricCard pattern from analytics.
 */

"use client";

import { motion } from "framer-motion";
import { Star, Truck, Circle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerContainer } from "@/lib/motion-tokens";

interface Driver {
  id: string;
  ratingAvg: number;
  deliveriesCount: number;
  isActive: boolean;
  createdAt: string;
}

interface DriverStatsCardsProps {
  driver: Driver;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: spring.default,
  },
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  color: "saffron" | "jade" | "curry" | "charcoal";
}

const colorStyles = {
  saffron: {
    icon: "bg-primary-light text-primary",
    accent: "border-l-primary",
  },
  jade: {
    icon: "bg-green/10 text-green",
    accent: "border-l-green",
  },
  curry: {
    icon: "bg-secondary-light text-secondary-hover",
    accent: "border-l-secondary",
  },
  charcoal: {
    icon: "bg-surface-tertiary text-text-secondary",
    accent: "border-l-text-primary",
  },
};

function StatCard({ title, value, icon, subtitle, color }: StatCardProps) {
  const styles = colorStyles[color];

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={spring.default}
      className={cn(
        "relative overflow-hidden rounded-card-sm bg-surface-primary p-5 shadow-sm",
        "border-l-4 transition-shadow duration-fast",
        "hover:shadow-md",
        styles.accent
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-body font-medium text-text-secondary">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-display font-bold text-text-primary">{value}</span>
            {subtitle && <span className="text-sm font-body text-text-muted">{subtitle}</span>}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className={cn("rounded-card-sm p-2.5", styles.icon)}
        >
          {icon}
        </motion.div>
      </div>

      {/* Gradient overlay */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full"
        style={{ background: "linear-gradient(to bottom right, var(--color-primary-light), transparent)" }}
      />
    </motion.div>
  );
}

export function DriverStatsCards({ driver }: DriverStatsCardsProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  return (
    <motion.div
      variants={staggerContainer(0.08, 0.1)}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      <StatCard
        title="Rating"
        value={driver.ratingAvg > 0 ? driver.ratingAvg.toFixed(1) : "-"}
        subtitle={driver.ratingAvg > 0 ? "/ 5" : undefined}
        icon={<Star className="h-5 w-5 fill-current" />}
        color="saffron"
      />

      <StatCard
        title="Total Deliveries"
        value={driver.deliveriesCount}
        icon={<Truck className="h-5 w-5" />}
        color="jade"
      />

      <StatCard
        title="Status"
        value={driver.isActive ? "Active" : "Inactive"}
        icon={
          <Circle
            className={cn(
              "h-5 w-5",
              driver.isActive ? "fill-green text-green" : "fill-text-muted text-text-muted"
            )}
          />
        }
        color={driver.isActive ? "jade" : "charcoal"}
      />

      <StatCard
        title="Member Since"
        value={formatDate(driver.createdAt)}
        icon={<Calendar className="h-5 w-5" />}
        color="curry"
      />
    </motion.div>
  );
}
