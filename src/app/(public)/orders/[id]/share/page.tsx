import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils/currency";

// ============================================
// TYPES
// ============================================

interface SharePageProps {
  params: Promise<{ id: string }>;
}

interface OrderItemModifier {
  name_snapshot: string;
}

interface OrderItem {
  name_snapshot: string;
  quantity: number;
  line_total_cents: number;
  order_item_modifiers: OrderItemModifier[];
}

interface SharedOrder {
  total_cents: number;
  subtotal_cents: number;
  delivery_fee_cents: number;
  delivery_window_start: string | null;
  order_items: OrderItem[];
}

// ============================================
// METADATA
// ============================================

export const metadata: Metadata = {
  title: "Order from Morning Star Delivery",
  openGraph: {
    title: "Order from Morning Star Delivery",
    description: "Check out this order from Morning Star Delivery!",
  },
};

// ============================================
// HELPERS
// ============================================

function formatDeliveryDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ============================================
// PAGE
// ============================================

export default async function SharePage({ params }: SharePageProps) {
  const { id: shareToken } = await params;

  const supabase = createServiceClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      total_cents,
      subtotal_cents,
      delivery_fee_cents,
      delivery_window_start,
      order_items (
        name_snapshot,
        quantity,
        line_total_cents,
        order_item_modifiers (
          name_snapshot
        )
      )
    `
    )
    .eq("share_token", shareToken)
    .returns<SharedOrder[]>()
    .single();

  if (error || !order) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-secondary to-surface-primary">
      <div className="mx-auto max-w-lg px-4 py-12">
        {/* Branding header */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Morning Star Delivery
          </h1>
          <p className="mt-1 text-sm text-text-secondary">Shared Order</p>
        </div>

        {/* Order summary card */}
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Order Summary</CardTitle>
            {order.delivery_window_start && (
              <p className="text-sm text-text-secondary">
                Delivery: {formatDeliveryDate(order.delivery_window_start)}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {/* Items list */}
            <ul className="divide-y divide-border-subtle">
              {order.order_items.map((item, idx) => (
                <li key={idx} className="flex justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium text-text-secondary">
                        {item.quantity}x
                      </span>
                      <span className="font-medium text-text-primary">{item.name_snapshot}</span>
                    </div>
                    {item.order_item_modifiers.length > 0 && (
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {item.order_item_modifiers.map((mod, modIdx) => (
                          <span key={modIdx} className="text-xs text-text-muted">
                            + {mod.name_snapshot}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-text-primary">
                    {formatPrice(item.line_total_cents)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Totals */}
            <div className="mt-4 space-y-1 border-t border-border-subtle pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Subtotal</span>
                <span className="text-text-primary">{formatPrice(order.subtotal_cents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Delivery Fee</span>
                <span className="text-text-primary">{formatPrice(order.delivery_fee_cents)}</span>
              </div>
              <div className="flex justify-between border-t border-border-subtle pt-2 font-semibold">
                <span className="text-text-primary">Total</span>
                <span className="text-text-primary">{formatPrice(order.total_cents)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
