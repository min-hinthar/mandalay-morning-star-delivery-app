"use client";

import type { ReactNode } from "react";
import { DomMaxProvider } from "@/components/providers/DomMaxProvider";
import { CartOverlays } from "@/components/ui/cart/CartOverlays";
import { DeliverySettingsSync } from "@/components/ui/cart/DeliverySettingsSync";
import { CartServerSync } from "@/components/ui/cart/CartServerSync";
import { ReferralCapture } from "@/components/ui/referrals/ReferralCapture";
import { OfflineBanner } from "@/components/ui/customer";
import { SiteFooter } from "@/components/ui/homepage/SiteFooter";
import { FeedbackFAB, FeedbackSheet } from "@/components/ui/feedback";
import type { DeliveryDayConfig, DeliveryZoneConfig } from "@/types/delivery";

interface PublicShellProps {
  children: ReactNode;
  deliveryFeeCents: number;
  freeDeliveryThresholdCents: number;
  cutoffDay: number;
  cutoffHour: number;
  deliveryDays?: DeliveryDayConfig[];
  deliveryZones?: DeliveryZoneConfig[];
  deliveryStartHour?: number;
  deliveryEndHour?: number;
  prepTimeBufferMinutes?: number;
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
  deliveryZones,
  deliveryStartHour,
  deliveryEndHour,
  prepTimeBufferMinutes,
  longDistanceFeeCents,
  longDistanceThresholdMiles,
}: PublicShellProps) {
  // domMax enables framer `drag` so the swipe-to-close bottom sheets that already
  // render on public surfaces (cart drawer, dish detail sheet) work here too —
  // previously inert under the root domAnimation-only provider. Lazy-loaded.
  return (
    <DomMaxProvider>
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
      <CartServerSync />
      <ReferralCapture />
      {children}
      <SiteFooter
        deliveryDays={deliveryDays}
        deliveryZones={deliveryZones}
        deliveryStartHour={deliveryStartHour}
        deliveryEndHour={deliveryEndHour}
        prepTimeBufferMinutes={prepTimeBufferMinutes}
        freeDeliveryThresholdCents={freeDeliveryThresholdCents}
        longDistanceFeeCents={longDistanceFeeCents}
        longDistanceThresholdMiles={longDistanceThresholdMiles}
      />
      <CartOverlays />
      <FeedbackFAB />
      <FeedbackSheet />
    </DomMaxProvider>
  );
}
