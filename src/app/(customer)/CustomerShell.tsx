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
import type { DeliveryDayConfig } from "@/types/delivery";

interface CustomerShellProps {
  children: ReactNode;
  deliveryFeeCents: number;
  freeDeliveryThresholdCents: number;
  cutoffDay: number;
  cutoffHour: number;
  deliveryDays?: DeliveryDayConfig[];
  longDistanceFeeCents?: number;
  longDistanceThresholdMiles?: number;
}

export function CustomerShell({
  children,
  deliveryFeeCents,
  freeDeliveryThresholdCents,
  cutoffDay,
  cutoffHour,
  deliveryDays,
  longDistanceFeeCents,
  longDistanceThresholdMiles,
}: CustomerShellProps) {
  return (
    <DomMaxProvider>
      <VtNavSync />
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
      <CartOverlays />
      <FeedbackFAB />
      <FeedbackSheet />
    </DomMaxProvider>
  );
}
