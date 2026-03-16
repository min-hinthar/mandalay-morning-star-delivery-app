/**
 * DriverRouteSwitch - Client wrapper that conditionally renders
 * SimpleStopView or ActiveRouteView based on simple mode state.
 */

"use client";

import { useRouter } from "next/navigation";
import { useSimpleMode } from "@/components/ui/driver/SimpleModeProvider";
import { SimpleStopView } from "@/components/ui/driver/SimpleStopView";
import { ActiveRouteView } from "@/components/ui/driver/ActiveRouteView";
import { AcceptDeclineBar } from "@/components/ui/driver/AcceptDeclineBar";
import { DriverPageHeader } from "@/components/ui/driver/DriverPageHeader";
import { Package } from "lucide-react";
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
    customer: { fullName: string | null };
    address: { line1: string; line2: string | null; city: string; state: string };
    phone?: string | null;
  };
}

interface DriverRouteSwitchProps {
  route: {
    id: string;
    status: string;
  } | null;
  stops: StopData[];
}

export function DriverRouteSwitch({ route, stops }: DriverRouteSwitchProps) {
  const { isSimpleMode } = useSimpleMode();
  const router = useRouter();

  const showBar = route?.status === "assigned" || route?.status === "accepted";
  const barPadding = showBar ? "pb-[calc(80px+env(safe-area-inset-bottom,0px)+16px)]" : "";

  if (!route) {
    if (isSimpleMode) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-tertiary">
            <Package className="h-10 w-10 text-text-muted" />
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold text-text-primary">
            No Route Today
          </h2>
          <p className="mt-1 font-body text-text-muted">Check back when a route is assigned.</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-surface-secondary">
        <DriverPageHeader title="Route" showBack backHref="/driver" />
        <div className="flex flex-col items-center justify-center px-4 py-16">
          <div className="text-center">
            <h2 className="mb-2 font-display text-xl font-semibold text-text-primary">
              No Active Route
            </h2>
            <p className="font-body text-text-secondary">
              You don&apos;t have a route assigned for today.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isSimpleMode) {
    return (
      <div className={barPadding}>
        <SimpleStopView routeId={route.id} stops={stops} />
        {showBar && route && (
          <AcceptDeclineBar
            routeId={route.id}
            routeStatus={route.status}
            onAccepted={() => router.refresh()}
            onDeclined={() => router.refresh()}
          />
        )}
      </div>
    );
  }

  const deliveredCount = stops.filter((s) => s.status === "delivered").length;
  const totalCount = stops.length;

  return (
    <div className={`min-h-screen bg-surface-secondary ${showBar ? barPadding : "pb-20"}`}>
      <DriverPageHeader
        title="Route"
        subtitle={`${deliveredCount}/${totalCount} Complete`}
        showBack
        backHref="/driver"
      />
      <div className="p-4">
        <ActiveRouteView routeId={route.id} routeStatus={route.status} stops={stops} />
      </div>
      {showBar && (
        <AcceptDeclineBar
          routeId={route.id}
          routeStatus={route.status}
          onAccepted={() => router.refresh()}
          onDeclined={() => router.refresh()}
        />
      )}
    </div>
  );
}
