"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface ExistingOrder {
  id: string;
  status: string;
}

/**
 * CHKT-05: Check if user already has an order for the given Saturday.
 * Used for early client-side warning on checkout page load.
 * Server-side enforcement is the real gate (in checkout route).
 */
export function useExistingOrder(
  userId: string | undefined,
  scheduledDate: string | undefined
): {
  existingOrder: ExistingOrder | null;
  isLoading: boolean;
} {
  const [existingOrder, setExistingOrder] = useState<ExistingOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId || !scheduledDate) return;

    const check = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const nextDay = new Date(scheduledDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().split("T")[0];

        const { data } = await supabase
          .from("orders")
          .select("id, status")
          .eq("user_id", userId)
          .neq("status", "cancelled")
          .gte("delivery_window_start", `${scheduledDate}T00:00:00`)
          .lt("delivery_window_start", `${nextDayStr}T00:00:00`)
          .limit(1)
          .maybeSingle();

        setExistingOrder(data ?? null);
      } catch {
        // Silent fail -- server-side check is the real enforcement
      } finally {
        setIsLoading(false);
      }
    };

    check();
  }, [userId, scheduledDate]);

  return { existingOrder, isLoading };
}
