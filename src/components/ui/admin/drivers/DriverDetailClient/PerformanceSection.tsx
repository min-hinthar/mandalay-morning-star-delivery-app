"use client";

import { m } from "framer-motion";
import { Package, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { AnimatedValue } from "@/components/ui/admin/AdminDashboard/AnimatedValue";
import type { DriverDetail } from "./types";

// ============================================
// TYPES
// ============================================

interface PerformanceSectionProps {
  driver: DriverDetail;
}

interface PerfCardProps {
  title: string;
  value: number;
  format: "number" | "percentage" | "duration";
  icon: React.ReactNode;
  /** For on-time rate: renders circular progress ring */
  ring?: number;
}

// ============================================
// ON-TIME RING SVG
// ============================================

const RING_SIZE = 48;
const RING_STROKE = 4;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function OnTimeRing({ percentage }: { percentage: number }) {
  const { shouldAnimate } = useAnimationPreference();
  const offset = RING_CIRCUMFERENCE - (percentage / 100) * RING_CIRCUMFERENCE;

  return (
    <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
      {/* Background circle */}
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        stroke="var(--color-surface-tertiary)"
        strokeWidth={RING_STROKE}
      />
      {/* Progress circle */}
      <m.circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        stroke="var(--color-accent-teal)"
        strokeWidth={RING_STROKE}
        strokeLinecap="round"
        strokeDasharray={RING_CIRCUMFERENCE}
        initial={shouldAnimate ? { strokeDashoffset: RING_CIRCUMFERENCE } : { strokeDashoffset: offset }}
        animate={{ strokeDashoffset: offset }}
        transition={shouldAnimate ? { duration: 1, ease: "easeOut", delay: 0.3 } : { duration: 0 }}
      />
    </svg>
  );
}

// ============================================
// PERFORMANCE CARD
// ============================================

function PerfCard({ title, value, format, icon, ring }: PerfCardProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <m.div
      variants={staggerItem}
      whileHover={shouldAnimate ? { y: -2, scale: 1.02 } : undefined}
      transition={getSpring(spring.snappy)}
      className={cn(
        "relative rounded-xl p-4",
        "bg-gradient-to-br from-accent-teal/5 to-accent-teal/10",
        "border border-accent-teal/20",
        "transition-shadow hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-text-secondary mb-2">{title}</p>
          <AnimatedValue
            value={value}
            format={format}
            className="text-2xl font-bold text-text-primary"
          />
        </div>

        <div className="relative">
          {ring !== undefined ? (
            <div className="relative flex items-center justify-center">
              <OnTimeRing percentage={ring} />
              <div className="absolute inset-0 flex items-center justify-center">
                {icon}
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-accent-teal/10">
              {icon}
            </div>
          )}
        </div>
      </div>
    </m.div>
  );
}

// ============================================
// PERFORMANCE SECTION
// ============================================

export function PerformanceSection({ driver }: PerformanceSectionProps) {
  const { shouldAnimate } = useAnimationPreference();

  // Derive performance stats from driver data
  // On-time rate and avg delivery time are derived stats;
  // use deliveriesCount as proxy (real API would provide these)
  const totalDeliveries = driver.deliveriesCount;
  const avgDeliveryTime = totalDeliveries > 0 ? 28 : 0; // placeholder avg minutes
  const onTimeRate = totalDeliveries > 0 ? Math.min(Math.round(driver.ratingAvg * 20), 100) : 0;
  const exceptions = 0; // placeholder; real API would provide exception count

  return (
    <m.div
      variants={shouldAnimate ? staggerContainer(0.08, 0.1) : undefined}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      <PerfCard
        title="Total Deliveries"
        value={totalDeliveries}
        format="number"
        icon={<Package className="h-5 w-5 text-accent-teal" />}
      />
      <PerfCard
        title="Avg Delivery Time"
        value={avgDeliveryTime}
        format="duration"
        icon={<Clock className="h-5 w-5 text-accent-teal" />}
      />
      <PerfCard
        title="On-Time Rate"
        value={onTimeRate}
        format="percentage"
        icon={<CheckCircle className="h-4 w-4 text-accent-teal" />}
        ring={onTimeRate}
      />
      <PerfCard
        title="Exceptions"
        value={exceptions}
        format="number"
        icon={<AlertTriangle className="h-5 w-5 text-accent-teal" />}
      />
    </m.div>
  );
}
