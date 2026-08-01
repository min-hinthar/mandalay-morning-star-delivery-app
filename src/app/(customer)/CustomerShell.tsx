"use client";

import type { ReactNode } from "react";
import { CartOverlays } from "@/components/ui/cart/CartOverlays";
import { DeliverySettingsSync } from "@/components/ui/cart/DeliverySettingsSync";
import { CartServerSync } from "@/components/ui/cart/CartServerSync";
import { ReferralCapture } from "@/components/ui/referrals/ReferralCapture";
import { OfflineBanner } from "@/components/ui/customer";
import { DomMaxProvider } from "@/components/providers/DomMaxProvider";
import { FeedbackFAB, FeedbackSheet } from "@/components/ui/feedback";
import { VtNavSync } from "@/components/ui/VtNavSync";
import type { DeliveryDayConfig, DeliveryZoneConfig } from "@/types/delivery";
import type { DeliveryFeeBand } from "@/lib/utils/order";

interface CustomerShellProps {
  children: ReactNode;
  deliveryFeeCents: number;
  freeDeliveryThresholdCents: number;
  minimumOrderCents?: number;
  extendedMinOrderCents?: number;
  cutoffDay: number;
  cutoffHour: number;
  deliveryDays?: DeliveryDayConfig[];
  deliveryZones?: DeliveryZoneConfig[];
  longDistanceFeeCents?: number;
  longDistanceThresholdMiles?: number;
  deliveryFeeBands?: DeliveryFeeBand[];
  standardRadiusMiles?: number;
  extendedDeliveryEnabled?: boolean;
  extendedPerMileCents?: number;
  maxRadiusMiles?: number;
}

export function CustomerShell({
  children,
  deliveryFeeCents,
  freeDeliveryThresholdCents,
  minimumOrderCents,
  extendedMinOrderCents,
  cutoffDay,
  cutoffHour,
  deliveryDays,
  deliveryZones,
  longDistanceFeeCents,
  longDistanceThresholdMiles,
  deliveryFeeBands,
  standardRadiusMiles,
  extendedDeliveryEnabled,
  extendedPerMileCents,
  maxRadiusMiles,
}: CustomerShellProps) {
  return (
    <DomMaxProvider>
      <VtNavSync />
      <OfflineBanner />
      <DeliverySettingsSync
        deliveryFeeCents={deliveryFeeCents}
        freeDeliveryThresholdCents={freeDeliveryThresholdCents}
        minimumOrderCents={minimumOrderCents}
        extendedMinOrderCents={extendedMinOrderCents}
        cutoffDay={cutoffDay}
        cutoffHour={cutoffHour}
        deliveryDays={deliveryDays}
        deliveryZones={deliveryZones}
        longDistanceFeeCents={longDistanceFeeCents}
        longDistanceThresholdMiles={longDistanceThresholdMiles}
        deliveryFeeBands={deliveryFeeBands}
        standardRadiusMiles={standardRadiusMiles}
        extendedDeliveryEnabled={extendedDeliveryEnabled}
        extendedPerMileCents={extendedPerMileCents}
        maxRadiusMiles={maxRadiusMiles}
      />
      <CartServerSync />
      <ReferralCapture />
      {children}
      <CartOverlays />
      <FeedbackFAB />
      <FeedbackSheet />
    </DomMaxProvider>
  );
}
