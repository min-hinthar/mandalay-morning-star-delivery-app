/**
 * V8 Stop List Component - Driver Polish
 *
 * Grouped list of delivery stops with staggered entry animation (40ms per card).
 * Shows current, upcoming, and completed stops with empty state fallback.
 */

"use client";

import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { staggerContainer } from "@/lib/motion-tokens/stagger";
import { EmptyState } from "@/components/ui/EmptyState";
import { StopCard } from "./StopCard";
import type { RouteStopStatus } from "@/types/driver";

/** 40ms per card stagger container */
const stopContainer = staggerContainer(0.04, 0.06);

interface StopData {
  id: string;
  stopIndex: number;
  status: RouteStopStatus;
  eta: string | null;
  order: {
    id: string;
    deliveryWindowStart: string | null;
    deliveryWindowEnd: string | null;
    customer: {
      fullName: string | null;
    };
    address: {
      line1: string;
      line2: string | null;
      city: string;
      state: string;
    };
  };
}

interface StopListProps {
  stops: StopData[];
  currentStopIndex: number;
}

export function StopList({ stops, currentStopIndex }: StopListProps) {
  const router = useRouter();

  // Empty state
  if (stops.length === 0) {
    return <EmptyState variant="driver-route" />;
  }

  // Group stops by status
  const currentStop = stops.find((s) => s.stopIndex === currentStopIndex);
  const upcomingStops = stops.filter(
    (s) => s.status === "pending" && s.stopIndex !== currentStopIndex
  );
  const completedStops = stops.filter((s) => s.status === "delivered" || s.status === "skipped");

  const handleStopClick = (stopId: string) => {
    router.push(`/driver/route/${stopId}`);
  };

  return (
    <div className="space-y-6">
      {/* Current Stop */}
      {currentStop && (
        <m.section variants={stopContainer} initial="hidden" animate="visible">
          <h2 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-text-muted">
            Current Stop
          </h2>
          <StopCard
            stopIndex={currentStop.stopIndex}
            status={currentStop.status}
            customerName={currentStop.order.customer.fullName}
            address={currentStop.order.address}
            timeWindow={{
              start: currentStop.order.deliveryWindowStart,
              end: currentStop.order.deliveryWindowEnd,
            }}
            eta={currentStop.eta}
            isCurrentStop
            onClick={() => handleStopClick(currentStop.id)}
          />
        </m.section>
      )}

      {/* Upcoming Stops */}
      {upcomingStops.length > 0 && (
        <section>
          <h2 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-text-muted">
            Upcoming ({upcomingStops.length})
          </h2>
          <m.div className="space-y-2" variants={stopContainer} initial="hidden" animate="visible">
            {upcomingStops.map((stop) => (
              <StopCard
                key={stop.id}
                stopIndex={stop.stopIndex}
                status={stop.status}
                customerName={stop.order.customer.fullName}
                address={stop.order.address}
                timeWindow={{
                  start: stop.order.deliveryWindowStart,
                  end: stop.order.deliveryWindowEnd,
                }}
                eta={stop.eta}
                onClick={() => handleStopClick(stop.id)}
              />
            ))}
          </m.div>
        </section>
      )}

      {/* Completed Stops */}
      {completedStops.length > 0 && (
        <section>
          <h2 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-text-muted">
            Completed ({completedStops.length})
          </h2>
          <m.div className="space-y-2" variants={stopContainer} initial="hidden" animate="visible">
            {completedStops.map((stop) => (
              <StopCard
                key={stop.id}
                stopIndex={stop.stopIndex}
                status={stop.status}
                customerName={stop.order.customer.fullName}
                address={stop.order.address}
                timeWindow={{
                  start: stop.order.deliveryWindowStart,
                  end: stop.order.deliveryWindowEnd,
                }}
                eta={stop.eta}
                onClick={() => handleStopClick(stop.id)}
              />
            ))}
          </m.div>
        </section>
      )}
    </div>
  );
}
