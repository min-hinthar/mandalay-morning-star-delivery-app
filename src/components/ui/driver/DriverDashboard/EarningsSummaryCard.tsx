"use client";

import { DollarSign, Banknote } from "lucide-react";
import { m } from "framer-motion";
import { staggerContainer } from "@/lib/motion-tokens";
import { StatCard } from "./StatCard";

interface EarningsSummaryCardProps {
  todayEarningsCents: number;
  weeklyEarningsCents: number;
}

export function EarningsSummaryCard({
  todayEarningsCents,
  weeklyEarningsCents,
}: EarningsSummaryCardProps) {
  return (
    <m.div
      variants={staggerContainer(0.04, 0.08)}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-4"
    >
      <StatCard
        icon={<DollarSign className="w-6 h-6 text-secondary" />}
        value={todayEarningsCents / 100}
        label="Today's Earnings"
        color="bg-secondary"
        index={0}
        animatedFormat="currency"
      />
      <StatCard
        icon={<Banknote className="w-6 h-6 text-accent-teal" />}
        value={weeklyEarningsCents / 100}
        label="This Week"
        color="bg-accent-teal"
        index={1}
        animatedFormat="currency"
      />
    </m.div>
  );
}
