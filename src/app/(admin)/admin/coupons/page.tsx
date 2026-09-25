/**
 * Admin Coupons — issue and track one-time coupons (free delivery, $ off,
 * % off). Codes are app-native (`coupons` table): single-use is enforced
 * atomically at checkout for both card and cash-on-delivery orders.
 */

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { ProfileRole } from "@/types/database";

import { CouponsClient } from "./CouponsClient";

export const metadata = {
  title: "Coupons | Mandalay Morning Star",
  description: "Issue one-time free delivery and discount coupons",
};

export default async function CouponsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login?next=/admin/coupons");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .returns<{ role: ProfileRole }[]>()
    .single();
  if (!profile || profile.role !== "admin") redirect("/?error=unauthorized");

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-charcoal">Coupons</h1>
        <p className="text-muted-foreground">
          One-time codes for free delivery or a discount. Each code works on exactly one order —
          card or cash on delivery.
        </p>
      </div>
      <CouponsClient />
    </div>
  );
}
