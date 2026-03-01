"use client";

import type { ReactNode } from "react";
import { CartOverlays } from "@/components/ui/cart/CartOverlays";
import { DeliverySettingsSync } from "@/components/ui/cart/DeliverySettingsSync";
import { SiteFooter } from "@/components/ui/homepage/SiteFooter";

interface PublicShellProps {
  children: ReactNode;
  deliveryFeeCents: number;
  freeDeliveryThresholdCents: number;
}

export function PublicShell({
  children,
  deliveryFeeCents,
  freeDeliveryThresholdCents,
}: PublicShellProps) {
  return (
    <>
      <DeliverySettingsSync
        deliveryFeeCents={deliveryFeeCents}
        freeDeliveryThresholdCents={freeDeliveryThresholdCents}
      />
      {children}
      <SiteFooter />
      <CartOverlays />
    </>
  );
}
