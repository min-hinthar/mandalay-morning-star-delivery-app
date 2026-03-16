"use client";

import { useState } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { Users } from "lucide-react";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { StatusBadge } from "@/components/ui/admin/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { useRouteProgressPolling } from "./useRouteProgressPolling";
import type { RouteProgressItem } from "@/app/api/admin/ops/routes-progress/route";

// ============================================
// ROUTE PROGRESS CARD
// ============================================

function RouteProgressCard({ route }: { route: RouteProgressItem }) {
  const [isHovered, setIsHovered] = useState(false);
  const stats = route.stats_json;
  const delivered = stats?.delivered_stops ?? 0;
  const total = stats?.total_stops ?? 0;
  const skipped = stats?.skipped_stops ?? 0;
  const completionRate = stats?.completion_rate ?? 0;
  const isWaiting = route.status === "assigned" || route.status === "accepted";

  return (
    <Link href={`/admin/routes/${route.id}`}>
      <div
        className="rounded-lg border border-border bg-surface-secondary p-4 hover:border-border-strong transition-colors cursor-pointer"
        style={{ willChange: isHovered ? "transform" : "auto" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Row 1: Driver name + status badge */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Users className="h-4 w-4 text-text-muted shrink-0" />
            <span className="text-sm font-medium truncate">
              {route.driver_name || "Unknown Driver"}
            </span>
          </div>
          <StatusBadge status={route.status} />
        </div>

        {/* Row 2: Progress bar + count (or waiting state) */}
        {isWaiting ? (
          <p className="text-sm text-text-secondary">
            {route.status === "assigned" ? "Assigned" : "Accepted"} — waiting to start
          </p>
        ) : (
          <div className="flex items-center gap-3">
            <Progress value={completionRate} className="flex-1 h-2" />
            <span className="text-sm font-medium text-text-secondary whitespace-nowrap">
              {delivered}/{total} delivered
            </span>
          </div>
        )}

        {/* Row 3: Start time + route identifier */}
        <div className="flex items-center justify-between mt-2 text-xs text-text-muted">
          <span>
            {route.started_at
              ? `Started ${new Date(route.started_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
              : "Not started"}
          </span>
          <span>Route #{route.id.slice(0, 8)}</span>
        </div>

        {/* Skipped stops indicator (if any) */}
        {skipped > 0 && !isWaiting && (
          <p className="text-xs text-status-warning mt-1">{skipped} skipped</p>
        )}
      </div>
    </Link>
  );
}

// ============================================
// ROUTE PROGRESS WIDGET
// ============================================

export function RouteProgressWidget() {
  const { routes } = useRouteProgressPolling();
  const { shouldAnimate } = useAnimationPreference();

  return (
    <section aria-labelledby="route-progress-heading">
      <h2 id="route-progress-heading" className="text-lg font-semibold text-text-primary mb-4">
        Route Progress
      </h2>

      {routes.length === 0 ? (
        <div className="rounded-lg border border-border border-dashed p-6 text-center">
          <p className="text-sm font-medium text-text-secondary">No active routes</p>
          <p className="text-xs text-text-muted mt-1">
            Routes will appear here once drivers start deliveries.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map((route, index) => (
            <m.div
              key={route.id}
              initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <RouteProgressCard route={route} />
            </m.div>
          ))}
        </div>
      )}
    </section>
  );
}
