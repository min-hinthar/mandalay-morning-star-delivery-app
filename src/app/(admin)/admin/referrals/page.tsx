/**
 * Admin Referrals — program ROI at a glance.
 *
 * Shows referred signups, rewards issued (count + $), pending attributions,
 * and a recent-activity table. Read-only; reward issuance happens server-side
 * in the checkout webhook.
 */

import { redirect } from "next/navigation";
import { Gift, Users, DollarSign, Clock, Star, BadgeCheck } from "lucide-react";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/currency";
import type { ProfileRole } from "@/types/database";
import { TierDistribution, type TierRow } from "./TierDistribution";

export const metadata = {
  title: "Referrals | Mandalay Morning Star",
  description: "Referral program signups and rewards issued",
};

interface ProfileCheck {
  role: ProfileRole;
}

interface ReferralRow {
  id: string;
  referrer_id: string;
  referee_id: string;
  status: string;
  reward_cents: number;
  created_at: string;
  completed_at: string | null;
}

interface LoyaltyRow {
  reward_cents: number;
  reward_code: string | null;
  redeemed_at: string | null;
}

interface ProfileLite {
  id: string;
  full_name: string | null;
  email: string | null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function nameFor(map: Map<string, ProfileLite>, id: string): string {
  const p = map.get(id);
  return p?.full_name || p?.email || "—";
}

export default async function ReferralsPage() {
  const supabase = await createClient();

  // Auth + admin gate
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login?next=/admin/referrals");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .returns<ProfileCheck[]>()
    .single();
  if (!profile || profile.role !== "admin") {
    redirect("/?error=unauthorized");
  }

  // Service client — admin already verified, bypass RLS for aggregates.
  const service = createServiceClient();

  const [{ data: rows }, { data: loyaltyRows }, { data: tierRows }] = await Promise.all([
    service
      .from("referrals")
      .select("id, referrer_id, referee_id, status, reward_cents, created_at, completed_at")
      .order("created_at", { ascending: false })
      .returns<ReferralRow[]>(),
    service
      .from("loyalty_rewards")
      .select("reward_cents, reward_code, redeemed_at")
      .not("reward_code", "is", null)
      .returns<LoyaltyRow[]>(),
    service.rpc("get_loyalty_tier_distribution").returns<TierRow[]>(),
  ]);

  const referrals = rows ?? [];
  const total = referrals.length;
  const completed = referrals.filter((r) => r.status === "completed");
  const pending = total - completed.length;
  const rewardCents = completed.reduce((sum, r) => sum + (r.reward_cents ?? 0), 0);
  const conversion = total > 0 ? Math.round((completed.length / total) * 100) : 0;

  // Loyalty (Kyay-Zu-Par!) rewards issued + redeemed.
  const loyalty = loyaltyRows ?? [];
  const loyaltyCount = loyalty.length;
  const loyaltyCents = loyalty.reduce((sum, r) => sum + (r.reward_cents ?? 0), 0);
  const loyaltyRedeemed = loyalty.filter((r) => r.redeemed_at).length;
  const redemptionRate = loyaltyCount > 0 ? Math.round((loyaltyRedeemed / loyaltyCount) * 100) : 0;

  // Resolve names for the recent slice.
  const recent = referrals.slice(0, 50);
  const ids = Array.from(new Set(recent.flatMap((r) => [r.referrer_id, r.referee_id])));
  const profileMap = new Map<string, ProfileLite>();
  if (ids.length > 0) {
    const { data: people } = await service
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ids)
      .returns<ProfileLite[]>();
    for (const p of people ?? []) profileMap.set(p.id, p);
  }

  const stats = [
    {
      label: "Referred signups",
      value: String(total),
      icon: Users,
      tint: "text-saffron",
    },
    {
      label: "Rewards issued",
      value: String(completed.length),
      icon: Gift,
      tint: "text-jade",
    },
    {
      label: "Reward value",
      value: formatPrice(rewardCents),
      icon: DollarSign,
      tint: "text-curry",
    },
    {
      label: "Pending first order",
      value: String(pending),
      icon: Clock,
      tint: "text-accent-teal",
    },
    {
      label: "Loyalty rewards",
      value: String(loyaltyCount),
      icon: Star,
      tint: "text-accent-orange",
    },
    {
      label: "Loyalty value",
      value: formatPrice(loyaltyCents),
      icon: Gift,
      tint: "text-primary",
    },
    {
      label: "Loyalty redeemed",
      value: `${loyaltyRedeemed} · ${redemptionRate}%`,
      icon: BadgeCheck,
      tint: "text-jade",
    },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display text-charcoal">Referrals</h1>
        <p className="text-muted-foreground">
          {total > 0
            ? `${conversion}% of referred signups have placed a first order.`
            : "Track signups and rewards as the program grows."}
        </p>
      </div>

      {/* KPIs */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tint }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className={cn("h-4 w-4", tint)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loyalty tier distribution */}
      <TierDistribution rows={tierRows ?? []} />

      {/* Recent activity */}
      {recent.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 p-12 text-center">
            <Gift className="h-10 w-10 text-charcoal-400" />
            <p className="text-lg font-medium text-charcoal">No referrals yet</p>
            <p className="text-sm text-muted-foreground">
              Shared links from account settings will start attributing here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border-subtle bg-surface-primary">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-secondary">
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Referrer</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Friend</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                <th className="px-4 py-3 text-right font-medium text-text-secondary">Reward</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {recent.map((r) => {
                const isCompleted = r.status === "completed";
                return (
                  <tr key={r.id} className="hover:bg-surface-secondary/50">
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {nameFor(profileMap, r.referrer_id)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {nameFor(profileMap, r.referee_id)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          isCompleted
                            ? "bg-status-success/10 text-status-success"
                            : "bg-status-warning/10 text-status-warning"
                        )}
                      >
                        {isCompleted ? "Rewarded" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-secondary">
                      {isCompleted && r.reward_cents > 0 ? formatPrice(r.reward_cents) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                      {formatDate(r.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
