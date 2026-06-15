import type { ReactNode } from "react";
import { getBusinessRules } from "@/lib/settings";
import { PublicShell } from "./PublicShell";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const rules = await getBusinessRules();

  return (
    <PublicShell
      deliveryFeeCents={rules.deliveryFeeCents}
      freeDeliveryThresholdCents={rules.freeDeliveryThresholdCents}
      cutoffDay={rules.cutoffDay}
      cutoffHour={rules.cutoffHour}
      deliveryDays={rules.deliveryDays}
      deliveryZones={rules.deliveryZones}
      deliveryStartHour={rules.deliveryStartHour}
      deliveryEndHour={rules.deliveryEndHour}
      prepTimeBufferMinutes={rules.prepTimeBufferMinutes}
      longDistanceFeeCents={rules.longDistanceFeeCents}
      longDistanceThresholdMiles={rules.longDistanceThresholdMiles}
    >
      {children}
    </PublicShell>
  );
}
