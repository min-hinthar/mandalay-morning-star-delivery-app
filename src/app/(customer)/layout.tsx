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
    redirect("/login");
  }

  const rules = await getBusinessRules();

  return (
    <CustomerShell
      deliveryFeeCents={rules.deliveryFeeCents}
      freeDeliveryThresholdCents={rules.freeDeliveryThresholdCents}
      cutoffDay={rules.cutoffDay}
      cutoffHour={rules.cutoffHour}
      deliveryDays={rules.deliveryDays}
    >
      {children}
    </CustomerShell>
  );
}
