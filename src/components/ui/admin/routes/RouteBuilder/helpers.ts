import { nextSaturday, isSaturday, format } from "date-fns";

// ============================================
// TYPES
// ============================================

export interface BuilderOrder {
  id: string;
  status: string;
  totalCents: number;
  customerName: string | null;
  customerEmail: string;
  deliveryWindowStart: string | null;
  deliveryWindowEnd: string | null;
  itemCount: number;
  lat: number | null;
  lng: number | null;
  addressLine1: string | null;
  city: string | null;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Returns the upcoming Saturday in YYYY-MM-DD format.
 * If today is Saturday, returns today (so admin can plan same-day deliveries).
 */
export function getNextSaturday(): string {
  const today = new Date();
  const target = isSaturday(today) ? today : nextSaturday(today);
  return format(target, "yyyy-MM-dd");
}

/**
 * Format cents to "$XX.XX" string.
 */
export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Detect overlapping time windows in the selected orders.
 * Returns true if any two orders have overlapping delivery windows.
 * Returns false if fewer than 2 orders or any order has null window.
 */
export function hasTimeWindowConflict(orders: BuilderOrder[]): boolean {
  if (orders.length < 2) return false;

  const windowed = orders.filter(
    (o) => o.deliveryWindowStart !== null && o.deliveryWindowEnd !== null
  );

  if (windowed.length < 2) return false;

  for (let i = 0; i < windowed.length; i++) {
    for (let j = i + 1; j < windowed.length; j++) {
      const a = windowed[i];
      const b = windowed[j];

      // Overlap: a starts before b ends AND b starts before a ends
      const aStart = new Date(a.deliveryWindowStart!).getTime();
      const aEnd = new Date(a.deliveryWindowEnd!).getTime();
      const bStart = new Date(b.deliveryWindowStart!).getTime();
      const bEnd = new Date(b.deliveryWindowEnd!).getTime();

      if (aStart < bEnd && bStart < aEnd) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Maps the raw API response from /api/admin/routes/builder-orders to BuilderOrder.
 */
export function transformApiOrder(raw: Record<string, unknown>): BuilderOrder {
  return {
    id: raw.id as string,
    status: raw.status as string,
    totalCents: raw.totalCents as number,
    customerName: (raw.customerName as string | null) ?? null,
    customerEmail: (raw.customerEmail as string) ?? "",
    deliveryWindowStart: (raw.deliveryWindowStart as string | null) ?? null,
    deliveryWindowEnd: (raw.deliveryWindowEnd as string | null) ?? null,
    itemCount: (raw.itemCount as number) ?? 0,
    lat: (raw.lat as number | null) ?? null,
    lng: (raw.lng as number | null) ?? null,
    addressLine1: (raw.addressLine1 as string | null) ?? null,
    city: (raw.city as string | null) ?? null,
  };
}
