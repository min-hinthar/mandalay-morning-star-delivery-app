"use client";

/**
 * DeliveryDayHub — single-screen command center for a delivery date.
 * Flows top-to-bottom in operational order: pick the day → see the day's
 * countdown + summary → watch the fleet live on the map → drill into route
 * progress and driver readiness → clear unassigned orders.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { AdminPageHeader } from "@/components/ui/admin/AdminPageHeader";
import { OpsCountdownBar } from "@/components/ui/admin/ops/OpsCountdownBar";
import { OpsDriverPanel } from "@/components/ui/admin/ops/OpsDriverPanel";
import { RouteProgressWidget } from "@/components/ui/admin/ops/RouteProgressWidget";
import { useDeliveryDayRoutes } from "@/components/ui/admin/ops/useDeliveryDayRoutes";
import { useDriverLocationsPolling } from "@/components/ui/admin/ops/useDriverLocationsPolling";
import { useOpsPolling } from "@/components/ui/admin/ops/useOpsPolling";
import { useCountdown } from "@/lib/hooks/useCountdown";
import { LazyDeliveryDayMap } from "@/components/ui/maps/LazyMaps";
import {
  getCutoffForDate,
  getZonedDateTimeUtc,
  parseDeliveryDateToUtc,
  getZonedDayOfWeek,
  formatDeliveryDateString,
} from "@/lib/utils/delivery-dates";
import type { BusinessRules } from "@/lib/settings/business-rules";
import { DeliveryDateSelector, type DateOption } from "./DeliveryDateSelector";
import { DeliveryDaySummary } from "./DeliveryDaySummary";

interface DeliveryDayHubProps {
  rules: BusinessRules;
  dateOptions: DateOption[];
  initialDate: string;
}

export function DeliveryDayHub({ rules, dateOptions, initialDate }: DeliveryDayHubProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const { shouldAnimate } = useAnimationPreference();

  // Resolve cutoff config for the selected date's weekday (falls back to the
  // global default when that weekday isn't a configured delivery day).
  const { cutoffDay, cutoffHour } = useMemo(() => {
    const weekday = getZonedDayOfWeek(parseDeliveryDateToUtc(selectedDate));
    const dayConfig = rules.deliveryDays.find((d) => d.dayOfWeek === weekday && d.isActive);
    return {
      cutoffDay: dayConfig?.cutoffDay ?? rules.cutoffDay,
      cutoffHour: dayConfig?.cutoffHour ?? rules.cutoffHour,
    };
  }, [selectedDate, rules]);

  // Stable target Dates so the countdown effect doesn't reset every render.
  const cutoffTarget = useMemo(
    () => getCutoffForDate(selectedDate, cutoffDay, cutoffHour),
    [selectedDate, cutoffDay, cutoffHour]
  );
  const deliveryTarget = useMemo(
    () => getZonedDateTimeUtc(selectedDate, rules.deliveryStartHour),
    [selectedDate, rules.deliveryStartHour]
  );

  const cutoff = useCountdown(cutoffTarget, "Order cutoff");
  const deliveryStart = useCountdown(deliveryTarget, "Delivery starts");

  const { summary } = useDeliveryDayRoutes(selectedDate);
  const { locations } = useDriverLocationsPolling(selectedDate);
  const { orders } = useOpsPolling(5000, selectedDate);

  const unassignedOrders = useMemo(
    () =>
      orders.filter((o) => !o.isAssigned && o.status !== "cancelled" && o.status !== "delivered")
        .length,
    [orders]
  );

  const dateDisplay = useMemo(() => formatDeliveryDateString(selectedDate), [selectedDate]);

  return (
    <div className="min-h-screen">
      <OpsCountdownBar cutoff={cutoff} deliveryStart={deliveryStart} />

      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
        <div className="space-y-4">
          <AdminPageHeader
            title="Delivery Day"
            breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Delivery Day" }]}
          />
          <p className="-mt-2 font-body text-sm text-text-secondary">{dateDisplay}</p>
          <DeliveryDateSelector
            options={dateOptions}
            value={selectedDate}
            onChange={setSelectedDate}
          />
        </div>

        <DeliveryDaySummary
          summary={summary}
          driversOnRoad={locations.length}
          unassignedOrders={unassignedOrders}
        />

        {/* Live fleet + driver readiness */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section aria-labelledby="fleet-heading" className="lg:col-span-2">
            <h2 id="fleet-heading" className="mb-4 text-lg font-semibold text-text-primary">
              Live Fleet
            </h2>
            <m.div
              initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
              className="h-[440px] overflow-hidden rounded-card-sm border border-border shadow-sm"
            >
              <LazyDeliveryDayMap locations={locations} />
            </m.div>
          </section>

          <div className="lg:col-span-1">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Drivers</h2>
            <OpsDriverPanel date={selectedDate} />
          </div>
        </div>

        {/* Route progress (live, active routes) */}
        <RouteProgressWidget date={selectedDate} />

        {/* Unassigned orders shortcut */}
        <Link
          href="/admin/ops"
          className="flex items-center justify-between rounded-card-sm border border-border bg-surface-primary p-4 shadow-sm transition-colors hover:border-border-strong"
        >
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {unassignedOrders > 0
                ? `${unassignedOrders} order${unassignedOrders === 1 ? "" : "s"} need assigning`
                : "All orders assigned"}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              Assign orders to routes and dispatch in the Ops Center
            </p>
          </div>
          <span className="flex items-center gap-1 text-sm font-medium text-accent-teal">
            Ops Center
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </div>
  );
}
