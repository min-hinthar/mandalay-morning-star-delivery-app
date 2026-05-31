import { LOYALTY_TIERS, type LoyaltyTierId } from "@/lib/loyalty";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export interface TierRow {
  tier: string;
  customers: number;
  orders: number;
}

// Admin strip palette — token classes, one per gem tier.
const TIER_STYLE: Record<LoyaltyTierId, { bar: string; text: string; bg: string }> = {
  new: { bar: "bg-text-muted", text: "text-text-secondary", bg: "bg-surface-secondary" },
  jade: { bar: "bg-accent-green", text: "text-accent-green", bg: "bg-accent-green/10" },
  ruby: { bar: "bg-magenta", text: "text-magenta", bg: "bg-magenta/10" },
  gold: { bar: "bg-accent-orange", text: "text-accent-orange", bg: "bg-accent-orange/10" },
};

/**
 * Customer distribution across the Burmese-gem tiers. Server-rendered from
 * get_loyalty_tier_distribution; shows each tier's share of the customer base
 * so the team can see the program's shape at a glance.
 */
export function TierDistribution({ rows }: { rows: TierRow[] }) {
  const byTier = new Map(rows.map((r) => [r.tier, r]));
  const totalCustomers = rows.reduce((sum, r) => sum + r.customers, 0);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-base">Loyalty tiers</CardTitle>
      </CardHeader>
      <CardContent>
        {totalCustomers === 0 ? (
          <p className="text-sm text-muted-foreground">
            No customers with orders yet — tiers populate as orders roll in.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LOYALTY_TIERS.map((t) => {
              const row = byTier.get(t.id);
              const customers = row?.customers ?? 0;
              const pct = totalCustomers > 0 ? Math.round((customers / totalCustomers) * 100) : 0;
              const style = TIER_STYLE[t.id];
              return (
                <div key={t.id} className={cn("rounded-xl p-4", style.bg)}>
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true">{t.emoji}</span>
                    <span className={cn("text-sm font-semibold", style.text)}>{t.name}</span>
                    {t.english !== t.name && (
                      <span className="text-xs text-muted-foreground">{t.english}</span>
                    )}
                  </div>
                  <p className="mt-2 text-2xl font-bold text-text-primary">{customers}</p>
                  <p className="text-xs text-muted-foreground">
                    {pct}% of customers · {(row?.orders ?? 0).toLocaleString()} orders
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-tertiary">
                    <div
                      className={cn("h-full rounded-full", style.bar)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TierDistribution;
