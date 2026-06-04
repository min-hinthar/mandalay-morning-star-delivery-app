"use client";

import { m } from "framer-motion";
import { Route, Navigation, PackageCheck, AlertTriangle, Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AnimatedValue } from "@/components/ui/admin/AdminDashboard/AnimatedValue";
import { cardContainer, cardItem } from "@/components/ui/admin/CardRow";
import type { DeliveryDaySummary as Summary } from "@/components/ui/admin/ops/useDeliveryDayRoutes";

interface StatCardProps {
  label: string;
  value: number;
  secondary?: string;
  icon: LucideIcon;
  tone?: "default" | "teal" | "green" | "warning";
}

const TONE_STYLES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-text-secondary bg-surface-tertiary",
  teal: "text-accent-teal bg-accent-teal/10",
  green: "text-green bg-green/10",
  warning: "text-status-warning bg-status-warning/10",
};

function StatCard({ label, value, secondary, icon: Icon, tone = "default" }: StatCardProps) {
  return (
    <m.div
      variants={cardItem}
      className="rounded-card-sm border border-border bg-surface-primary p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</span>
        <span
          className={cn("flex h-7 w-7 items-center justify-center rounded-full", TONE_STYLES[tone])}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <AnimatedValue
          value={value}
          format="number"
          className="font-display text-2xl font-bold text-text-primary"
        />
        {secondary && <span className="text-sm text-text-muted">{secondary}</span>}
      </div>
    </m.div>
  );
}

interface DeliveryDaySummaryProps {
  summary: Summary;
  driversOnRoad: number;
  unassignedOrders: number;
}

export function DeliveryDaySummary({
  summary,
  driversOnRoad,
  unassignedOrders,
}: DeliveryDaySummaryProps) {
  return (
    <m.div
      variants={cardContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
    >
      <StatCard
        label="Routes"
        value={summary.totalRoutes}
        secondary={summary.completedRoutes > 0 ? `${summary.completedRoutes} done` : undefined}
        icon={Route}
        tone="teal"
      />
      <StatCard label="On the road" value={driversOnRoad} icon={Navigation} tone="teal" />
      <StatCard
        label="Stops delivered"
        value={summary.deliveredStops}
        secondary={`of ${summary.totalStops}`}
        icon={PackageCheck}
        tone="green"
      />
      <StatCard
        label="Exceptions"
        value={summary.exceptions}
        icon={AlertTriangle}
        tone={summary.exceptions > 0 ? "warning" : "default"}
      />
      <StatCard
        label="Unassigned"
        value={unassignedOrders}
        icon={Inbox}
        tone={unassignedOrders > 0 ? "warning" : "default"}
      />
    </m.div>
  );
}
