"use client";

import type { ReactNode } from "react";
import { CartOverlays } from "@/components/ui/cart/CartOverlays";
import { DeliverySettingsSync } from "@/components/ui/cart/DeliverySettingsSync";
import { OfflineBanner } from "@/components/ui/customer";
import { SiteFooter } from "@/components/ui/homepage/SiteFooter";
import type { DeliveryDayConfig } from "@/types/delivery";

interface PublicShellProps {
  children: ReactNode;
  deliveryFeeCents: number;
  freeDeliveryThresholdCents: number;
  cutoffDay: number;
  cutoffHour: number;
  deliveryDays?: DeliveryDayConfig[];
  longDistanceFeeCents?: number;
  longDistanceThresholdMiles?: number;
}

export function PublicShell({
  children,
  deliveryFeeCents,
  freeDeliveryThresholdCents,
  cutoffDay,
  cutoffHour,
  deliveryDays,
  longDistanceFeeCents,
  longDistanceThresholdMiles,
}: PublicShellProps) {
  return (
    <>
      <OfflineBanner />
      <DeliverySettingsSync
        deliveryFeeCents={deliveryFeeCents}
        freeDeliveryThresholdCents={freeDeliveryThresholdCents}
        cutoffDay={cutoffDay}
        cutoffHour={cutoffHour}
        deliveryDays={deliveryDays}
        longDistanceFeeCents={longDistanceFeeCents}
        longDistanceThresholdMiles={longDistanceThresholdMiles}
      />
      {children}
      <SiteFooter />
      <CartOverlays />
    </>
  );
}
