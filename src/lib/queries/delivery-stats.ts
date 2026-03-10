import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";

export interface DeliveryStats {
  deliveriesThisMonth: number;
  nextDeliveryDate: string;
}

const FALLBACK: DeliveryStats = { deliveriesThisMonth: 0, nextDeliveryDate: "" };

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

async function fetchDeliveryStats(): Promise<DeliveryStats> {
  try {
    const supabase = createPublicClient();

    const [countResult, daysResult] = await Promise.all([
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "delivered")
        .gte(
          "created_at",
          new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
        ),
      supabase
        .from("delivery_days")
        .select("day_of_week, is_active")
        .eq("is_active", true)
        .order("day_of_week", { ascending: true }),
    ]);

    const deliveriesThisMonth = countResult.count ?? 0;

    let nextDeliveryDate = "";
    if (daysResult.data && daysResult.data.length > 0) {
      const activeDays = daysResult.data.map((d) => d.day_of_week as number);
      const today = new Date();
      const todayDow = today.getDay();

      // Find next delivery day
      let daysUntil = Infinity;
      for (const dow of activeDays) {
        const diff = (dow - todayDow + 7) % 7 || 7; // At least 1 day away
        if (diff < daysUntil) daysUntil = diff;
      }

      if (daysUntil !== Infinity) {
        const next = new Date(today);
        next.setDate(today.getDate() + daysUntil);
        nextDeliveryDate = `${DAY_NAMES[next.getDay()]}, ${next.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      }
    }

    return { deliveriesThisMonth, nextDeliveryDate };
  } catch {
    return { ...FALLBACK };
  }
}

export const getDeliveryStats = unstable_cache(fetchDeliveryStats, ["delivery-stats"], {
  tags: ["delivery-stats"],
  revalidate: 300,
});
