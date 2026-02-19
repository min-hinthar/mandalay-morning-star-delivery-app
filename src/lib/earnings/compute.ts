/**
 * Shared earnings computation logic
 *
 * Computes per-route earnings from route_stops data and a configurable pay rate.
 * Aggregates earnings by daily/weekly/monthly periods for chart display.
 */

// ===========================================
// TYPES
// ===========================================

export interface RouteEarning {
  routeId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  deliveredStops: number;
  earningsCents: number;
}

export type EarningsPeriod = "daily" | "weekly" | "monthly";

export interface ChartDataPoint {
  label: string;
  value: number; // cents
}

interface RouteWithStops {
  id: string;
  delivery_date: string;
  route_stops: Array<{ status: string }>;
}

// ===========================================
// COMPUTATION
// ===========================================

/**
 * Compute per-route earnings from routes with nested route_stops.
 * Counts delivered stops per route and multiplies by rate.
 */
export function computeRouteEarnings(routes: RouteWithStops[], rateCents: number): RouteEarning[] {
  return routes.map((route) => {
    const deliveredStops = route.route_stops.filter((s) => s.status === "delivered").length;
    return {
      routeId: route.id,
      date: route.delivery_date,
      deliveredStops,
      earningsCents: deliveredStops * rateCents,
    };
  });
}

// ===========================================
// AGGREGATION
// ===========================================

/**
 * Aggregate route earnings by period for chart display.
 * - daily: "Mon 2/5" format
 * - weekly: "Feb 3-9" format (ISO week, Monday start)
 * - monthly: "Feb 2026" format
 */
export function aggregateByPeriod(
  routeEarnings: RouteEarning[],
  period: EarningsPeriod
): ChartDataPoint[] {
  const grouped = new Map<string, number>();

  for (const re of routeEarnings) {
    const key = getPeriodKey(re.date, period);
    grouped.set(key, (grouped.get(key) ?? 0) + re.earningsCents);
  }

  // Sort by key (chronological since keys are sortable)
  const sorted = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return sorted.map(([key, value]) => ({
    label: formatPeriodLabel(key, period),
    value,
  }));
}

// ===========================================
// HELPERS
// ===========================================

/** Get a sortable period key for grouping */
function getPeriodKey(dateStr: string, period: EarningsPeriod): string {
  const date = new Date(dateStr + "T12:00:00Z"); // noon UTC to avoid DST issues

  switch (period) {
    case "daily":
      return dateStr; // YYYY-MM-DD is already sortable

    case "weekly": {
      // ISO week: find Monday of the week
      const day = date.getUTCDay();
      const diff = day === 0 ? -6 : 1 - day; // Monday = 1, Sunday = 0 -> -6
      const monday = new Date(date);
      monday.setUTCDate(date.getUTCDate() + diff);
      return monday.toISOString().split("T")[0];
    }

    case "monthly":
      return dateStr.slice(0, 7); // YYYY-MM
  }
}

/** Format a period key into a human-readable label */
function formatPeriodLabel(key: string, period: EarningsPeriod): string {
  switch (period) {
    case "daily": {
      const date = new Date(key + "T12:00:00Z");
      const dayName = date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
      const month = date.getUTCMonth() + 1;
      const day = date.getUTCDate();
      return `${dayName} ${month}/${day}`;
    }

    case "weekly": {
      // key is the Monday date
      const monday = new Date(key + "T12:00:00Z");
      const sunday = new Date(monday);
      sunday.setUTCDate(monday.getUTCDate() + 6);
      const monMonth = monday.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
      const monDay = monday.getUTCDate();
      const sunDay = sunday.getUTCDate();
      return `${monMonth} ${monDay}-${sunDay}`;
    }

    case "monthly": {
      const date = new Date(key + "-15T12:00:00Z");
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
    }
  }
}
