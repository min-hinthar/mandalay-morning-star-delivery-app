"use client";

/**
 * NextRouteChip
 * Passive indicator showing the next upcoming route date.
 * Tapping navigates to the schedule page.
 */

import Link from "next/link";
import { m } from "framer-motion";
import { CalendarDays, ChevronRight } from "lucide-react";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

interface NextRouteChipProps {
  nextRouteDate: string; // YYYY-MM-DD
}

export function NextRouteChip({ nextRouteDate }: NextRouteChipProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
    new Date(nextRouteDate + "T12:00:00Z")
  );

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(spring.default)}
    >
      <Link
        href="/driver/schedule"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-teal/10 border border-accent-teal/20 text-accent-teal text-sm font-medium transition-colors hover:bg-accent-teal/15"
      >
        <CalendarDays className="h-4 w-4" />
        <span>Next route: {dayName}</span>
        <ChevronRight className="h-4 w-4" />
      </Link>
    </m.div>
  );
}
