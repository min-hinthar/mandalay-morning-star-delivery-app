"use client";

import { m } from "framer-motion";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { AnimatedValue } from "./AnimatedValue";

interface QuickStatProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  pulse?: boolean;
}

export function QuickStat({ label, value, icon, pulse }: QuickStatProps) {
  const { shouldAnimate } = useAnimationPreference();
  const numericValue = typeof value === "number" ? value : null;

  return (
    <m.div
      whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-secondary border border-accent-teal/10"
    >
      <div className="relative">
        {icon}
        {pulse && (
          <m.div
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green"
            animate={shouldAnimate ? {
              scale: [1, 1.3, 1],
              opacity: [1, 0.6, 1],
            } : undefined}
            transition={{ duration: 1.5, repeat: 5 }}
          />
        )}
      </div>
      {numericValue !== null ? (
        <AnimatedValue
          value={numericValue}
          format="number"
          className="text-sm font-medium text-text-primary"
        />
      ) : (
        <span className="text-sm font-medium text-text-primary">{value}</span>
      )}
      <span className="text-xs text-text-muted">{label}</span>
    </m.div>
  );
}
