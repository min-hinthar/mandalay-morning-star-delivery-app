"use client";

import type { ReactNode } from "react";
import { CartOverlays } from "@/components/ui/cart/CartOverlays";
import { DeliverySettingsSync } from "@/components/ui/cart/DeliverySettingsSync";
import { OfflineBanner } from "@/components/ui/customer";
import { DomMaxProvider } from "@/components/providers/DomMaxProvider";
import type { DeliveryDayConfig } from "@/types/delivery";

interface CustomerShellProps {
  children: ReactNode;
  deliveryFeeCents: number;
  freeDeliveryThresholdCents: number;
  cutoffDay: number;
  cutoffHour: number;
  deliveryDays?: DeliveryDayConfig[];
}

export function CustomerShell({
  children,
  deliveryFeeCents,
  freeDeliveryThresholdCents,
  cutoffDay,
  cutoffHour,
  deliveryDays,
}: CustomerShellProps) {
  return (
    <DomMaxProvider>
      <OfflineBanner />
      <DeliverySettingsSync
        deliveryFeeCents={deliveryFeeCents}
        freeDeliveryThresholdCents={freeDeliveryThresholdCents}
        cutoffDay={cutoffDay}
        cutoffHour={cutoffHour}
        deliveryDays={deliveryDays}
      />
      {children}
      <CartOverlays />
    </DomMaxProvider>
  );
}
