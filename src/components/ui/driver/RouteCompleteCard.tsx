"use client";

/**
 * RouteCompleteCard — shared route-completion celebration for both Simple and
 * Standard driver modes. Shows a summary of the finished route and a clear way
 * back home (and, in standard mode, a link to earnings).
 */

import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { PartyPopper, PackageCheck, SkipForward, Banknote } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface RouteCompleteCardProps {
  deliveredCount: number;
  skippedCount: number;
  totalCount: number;
  /** Show a link to the earnings tab (standard mode only). */
  showEarningsLink?: boolean;
}

export function RouteCompleteCard({
  deliveredCount,
  skippedCount,
  totalCount,
  showEarningsLink = false,
}: RouteCompleteCardProps) {
  const router = useRouter();

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex min-h-[60vh] flex-col items-center justify-center px-4"
    >
      <m.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
      >
        <PartyPopper className="h-20 w-20 text-green" />
      </m.div>

      <h2 className="mt-6 font-display text-3xl font-bold text-text-primary">Route Complete!</h2>
      <p className="mt-2 font-body text-lg text-text-secondary">Great job — all stops handled.</p>

      {/* Summary chips */}
      <div className="mt-6 flex items-center gap-3 font-body text-sm">
        <span className="flex items-center gap-1.5 rounded-full bg-green/10 px-3 py-1.5 font-semibold text-green">
          <PackageCheck className="h-4 w-4" />
          {deliveredCount} delivered
        </span>
        {skippedCount > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-surface-tertiary px-3 py-1.5 font-medium text-text-secondary">
            <SkipForward className="h-4 w-4" />
            {skippedCount} skipped
          </span>
        )}
      </div>
      <p className="mt-2 font-body text-xs text-text-muted">{totalCount} stops total</p>

      <button
        onClick={() => router.push("/driver")}
        className={cn(
          "mt-8 flex min-h-[56px] w-full max-w-xs items-center justify-center rounded-card-sm",
          "bg-accent-teal font-body text-lg font-semibold text-text-inverse shadow-md",
          "transition-all duration-fast hover:shadow-lg",
          "active:scale-[0.98]"
        )}
      >
        Go Home
      </button>

      {showEarningsLink && (
        <button
          onClick={() => router.push("/driver/earnings")}
          className={cn(
            "mt-3 flex min-h-[44px] w-full max-w-xs items-center justify-center gap-2 rounded-card-sm",
            "font-body text-sm font-medium text-accent-teal",
            "transition-colors duration-fast hover:bg-accent-teal/10"
          )}
        >
          <Banknote className="h-4 w-4" />
          View earnings
        </button>
      )}
    </m.div>
  );
}
