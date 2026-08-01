import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { getBusinessRules } from "@/lib/settings";
import { CustomerShell } from "./CustomerShell";

export default async function CustomerLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    // Belt only — the middleware (src/lib/supabase/middleware.ts) redirects
    // unauthenticated hits on these paths first, WITH ?next=<path> so the
    // post-login flow returns the customer here. This layout cannot see the
    // request path, so if it ever fires (middleware matcher gap), the
    // destination is lost — keep the protected-path lists in sync.
    redirect("/login");
  }

  const rules = await getBusinessRules();

  return (
    <CustomerShell
      deliveryFeeCents={rules.deliveryFeeCents}
      freeDeliveryThresholdCents={rules.freeDeliveryThresholdCents}
      minimumOrderCents={rules.minimumOrderCents}
      extendedMinOrderCents={rules.extendedMinOrderCents}
      cutoffDay={rules.cutoffDay}
      cutoffHour={rules.cutoffHour}
      deliveryDays={rules.deliveryDays}
      longDistanceFeeCents={rules.longDistanceFeeCents}
      longDistanceThresholdMiles={rules.longDistanceThresholdMiles}
      deliveryFeeBands={rules.deliveryFeeBands}
      standardRadiusMiles={rules.deliveryRadiusMiles}
      extendedDeliveryEnabled={rules.extendedDeliveryEnabled}
      extendedPerMileCents={rules.extendedDeliveryPerMileCents}
      maxRadiusMiles={rules.maxDeliveryRadiusMiles}
    >
      {children}
    </CustomerShell>
  );
}
