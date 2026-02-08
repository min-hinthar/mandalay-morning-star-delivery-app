import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

/**
 * PreferenceCounterCard
 * Server component for admin dashboard. Fetches aggregate counts
 * from customer_settings and displays dietary restriction counts
 * and notification opt-out summary.
 */

interface PreferenceCounterCardProps {
  className?: string;
}

interface DietaryCounts {
  [key: string]: number;
}

interface NotifOptOuts {
  order_updates: number;
  marketing: number;
  reminders: number;
}

export async function PreferenceCounterCard({ className }: PreferenceCounterCardProps) {
  const supabase = await createClient();

  const { data: allSettings } = await supabase
    .from("customer_settings")
    .select("dietary_restrictions, notification_prefs");

  const dietaryCounts: DietaryCounts = {};
  const notifOptOuts: NotifOptOuts = { order_updates: 0, marketing: 0, reminders: 0 };
  let totalCustomers = 0;

  for (const row of allSettings ?? []) {
    totalCustomers++;

    // Count dietary restrictions
    const restrictions = row.dietary_restrictions as string[] | null;
    if (Array.isArray(restrictions)) {
      for (const r of restrictions) {
        dietaryCounts[r] = (dietaryCounts[r] || 0) + 1;
      }
    }

    // Count notification opt-outs
    const prefs = row.notification_prefs as Record<string, boolean> | null;
    if (prefs) {
      if (!prefs.order_updates) notifOptOuts.order_updates++;
      if (!prefs.marketing) notifOptOuts.marketing++;
      if (!prefs.reminders) notifOptOuts.reminders++;
    }
  }

  // Sort dietary restrictions by count (descending)
  const sortedDietary = Object.entries(dietaryCounts)
    .sort(([, a], [, b]) => b - a);

  const hasData = totalCustomers > 0;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Customer Preferences</CardTitle>
        <Users className="h-5 w-5 text-text-secondary" />
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-sm text-text-secondary">No customer preferences set yet</p>
        ) : (
          <div className="space-y-4">
            {/* Total customers */}
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                {totalCustomers}
              </span>
              <span>customer{totalCustomers !== 1 ? "s" : ""} with settings</span>
            </div>

            {/* Dietary restrictions */}
            {sortedDietary.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Dietary Restrictions
                </h4>
                <div className="space-y-1.5">
                  {sortedDietary.map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between text-sm">
                      <span className="text-text-primary">{name}</span>
                      <span className="text-text-secondary font-medium tabular-nums">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notification opt-outs */}
            {(notifOptOuts.order_updates > 0 || notifOptOuts.marketing > 0 || notifOptOuts.reminders > 0) && (
              <div>
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Notification Opt-outs
                </h4>
                <div className="space-y-1.5">
                  {notifOptOuts.order_updates > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-primary">Order Updates</span>
                      <span className="text-text-secondary font-medium tabular-nums">
                        {notifOptOuts.order_updates}
                      </span>
                    </div>
                  )}
                  {notifOptOuts.marketing > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-primary">Marketing</span>
                      <span className="text-text-secondary font-medium tabular-nums">
                        {notifOptOuts.marketing}
                      </span>
                    </div>
                  )}
                  {notifOptOuts.reminders > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-primary">Reminders</span>
                      <span className="text-text-secondary font-medium tabular-nums">
                        {notifOptOuts.reminders}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
