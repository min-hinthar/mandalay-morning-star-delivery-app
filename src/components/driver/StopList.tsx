"use client";

import { useRouter } from "next/navigation";
import { StopCard } from "./StopCard";
import type { RouteStopStatus } from "@/types/driver";

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

  // Group stops by status
  const currentStop = stops.find((s) => s.stopIndex === currentStopIndex);
  const upcomingStops = stops.filter(
    (s) => s.status === "pending" && s.stopIndex !== currentStopIndex
  );
  const completedStops = stops.filter(
    (s) => s.status === "delivered" || s.status === "skipped"
  );

  const handleStopClick = (stopId: string) => {
    router.push(`/driver/route/${stopId}`);
  };

  return (
    <div className="space-y-6">
      {/* Current Stop */}
      {currentStop && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-charcoal/50">
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
            isCurrentStop
            onClick={() => handleStopClick(currentStop.id)}
          />
        </section>
      )}

      {/* Upcoming Stops */}
      {upcomingStops.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-charcoal/50">
            Upcoming ({upcomingStops.length})
          </h2>
          <div className="space-y-2">
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
                onClick={() => handleStopClick(stop.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed Stops */}
      {completedStops.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-charcoal/50">
            Completed ({completedStops.length})
          </h2>
          <div className="space-y-2">
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
                onClick={() => handleStopClick(stop.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
