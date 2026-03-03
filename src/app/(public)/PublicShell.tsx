"use client";

import type { ReactNode } from "react";
import { CartOverlays } from "@/components/ui/cart/CartOverlays";
import { DeliverySettingsSync } from "@/components/ui/cart/DeliverySettingsSync";
import { SiteFooter } from "@/components/ui/homepage/SiteFooter";

interface PublicShellProps {
  children: ReactNode;
  deliveryFeeCents: number;
  freeDeliveryThresholdCents: number;
  cutoffDay: number;
  cutoffHour: number;
}

export function PublicShell({
  children,
  deliveryFeeCents,
  freeDeliveryThresholdCents,
  cutoffDay,
  cutoffHour,
}: PublicShellProps) {
  return (
    <>
      <DeliverySettingsSync
        deliveryFeeCents={deliveryFeeCents}
        freeDeliveryThresholdCents={freeDeliveryThresholdCents}
        cutoffDay={cutoffDay}
        cutoffHour={cutoffHour}
      />
      {children}
      <SiteFooter />
      <CartOverlays />
    </>
  );
}
