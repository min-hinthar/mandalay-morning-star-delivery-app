import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";

// ===========================================
// TYPES
// ===========================================

interface EmailStatsBucket {
  sent: number;
  delivered: number;
  failed: number;
  bounced: number;
}

interface EmailStats {
  today: EmailStatsBucket;
  week: EmailStatsBucket;
  allTime: EmailStatsBucket;
}

// ===========================================
// HELPERS
// ===========================================

const STAT_STATUSES = ["sent", "delivered", "failed", "bounced"] as const;

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = 0
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

function getTodayStart(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// ===========================================
// GET HANDLER
// ===========================================

/**
 * GET /api/admin/emails/stats
 *
 * Returns aggregated email stats: sent/delivered/failed/bounced
 * for today, this week, and all time.
 */
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: auth.userId,
      role: "admin",
      route: "admin/emails/stats",
    });
    if (rl.limited) return rl.response;
    const { supabase } = auth;

    const todayStart = getTodayStart().toISOString();
    const weekStart = getWeekStart().toISOString();

    // Run 12 count queries in parallel (4 statuses x 3 time ranges)
    // Uses head:true to avoid fetching rows — just counts
    type CountResult = { range: string; status: string; count: number };

    const ranges: Record<string, string | null> = {
      today: todayStart,
      week: weekStart,
      allTime: null,
    };

    const queries = Object.entries(ranges).flatMap(([range, since]) =>
      STAT_STATUSES.map(async (status): Promise<CountResult> => {
        let q = supabase
          .from("notification_logs")
          .select("id", { count: "exact", head: true })
          .eq("status", status);
        if (since) q = q.gte("created_at", since);
        const { count } = await q;
        return { range, status, count: count ?? 0 };
      })
    );

    const results = await Promise.all(queries);

    // Shape into response
    const stats: EmailStats = {
      today: { sent: 0, delivered: 0, failed: 0, bounced: 0 },
      week: { sent: 0, delivered: 0, failed: 0, bounced: 0 },
      allTime: { sent: 0, delivered: 0, failed: 0, bounced: 0 },
    };

    for (const { range, status, count } of results) {
      const bucket = stats[range as keyof EmailStats];
      if (bucket && status in bucket) {
        bucket[status as keyof EmailStatsBucket] = count;
      }
    }

    return NextResponse.json({ stats });
  } catch (error) {
    logger.exception(error, { api: "admin/emails/stats" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
