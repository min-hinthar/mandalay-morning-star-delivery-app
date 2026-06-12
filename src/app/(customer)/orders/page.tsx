import { redirect } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { Button } from "@/components/ui/button";
import { OrdersHeader } from "@/components/ui/orders/OrdersHeader";
import { OrderListPaginated } from "@/components/ui/orders/OrderListPaginated";
import { AfterDarkAmbient } from "@/components/ui/AfterDarkAmbient";
import { AfterDarkSpotlight } from "@/components/ui/AfterDarkSpotlight";
import type { OrderStatus } from "@/types/order";
import type { RefundStatus } from "@/types/database";

/** Must match API route default */
const PAGE_SIZE = 10;

interface OrderRow {
  id: string;
  status: OrderStatus;
  refund_status: RefundStatus;
  total_cents: number;
  delivery_window_start: string | null;
  placed_at: string;
  order_items: Array<{ quantity: number }>;
}

function encodeCursor(row: { placed_at: string; id: string }): string {
  return btoa(JSON.stringify({ placed_at: row.placed_at, id: row.id }));
}

export default async function OrdersPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch first page + 1 to detect hasMore (direct query, no self-fetch)
  const { data: ordersData, error: ordersError } = await supabase
    .from("orders")
    .select(
      `
      id,
      status,
      refund_status,
      total_cents,
      delivery_window_start,
      placed_at,
      order_items (quantity)
    `
    )
    .eq("user_id", user.id)
    .order("placed_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(PAGE_SIZE + 1)
    .returns<OrderRow[]>();

  if (ordersError) {
    logger.error("Failed to fetch orders", { api: "orders/page" });
  }

  const allRows = ordersData ?? [];
  const hasMore = allRows.length > PAGE_SIZE;
  const pageRows = hasMore ? allRows.slice(0, PAGE_SIZE) : allRows;

  const orders = pageRows.map((order) => ({
    id: order.id,
    status: order.status,
    refundStatus: order.refund_status,
    totalCents: order.total_cents,
    deliveryWindowStart: order.delivery_window_start,
    placedAt: order.placed_at,
    itemCount: order.order_items.reduce((sum, item) => sum + item.quantity, 0),
  }));

  const lastRow = pageRows[pageRows.length - 1];
  const initialCursor = hasMore && lastRow ? encodeCursor(lastRow) : null;

  return (
    <main
      className="after-dark-canvas relative isolate min-h-screen px-4 pb-32 pt-8"
      style={{ viewTransitionName: "orders-page" }}
    >
      {/* Kit living texture + desktop cursor spotlight, behind all content */}
      <AfterDarkAmbient className="-z-10" />
      <AfterDarkSpotlight className="-z-10" />

      <div className="mx-auto max-w-2xl">
        {/* Animated Header (client component) */}
        <OrdersHeader />

        {/* Orders List with pagination or empty state */}
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="rounded-full bg-surface-tertiary w-20 h-20 mx-auto flex items-center justify-center mb-6">
              <ShoppingBag className="h-10 w-10 text-text-muted" />
            </div>
            <h2 className="text-xl font-display font-bold text-text-primary mb-2">No orders yet</h2>
            <p className="font-body text-text-secondary mb-2">
              When you place an order, it will appear here.
            </p>
            <p className="font-body text-xs text-text-muted mb-8">
              Check our menu for delivery schedule and cutoff times.
            </p>
            <Button asChild variant="primary" size="lg" className="shadow-elevated">
              <Link href="/menu">Browse Menu</Link>
            </Button>
          </div>
        ) : (
          <OrderListPaginated
            initialOrders={orders}
            initialCursor={initialCursor}
            initialHasMore={hasMore}
          />
        )}
      </div>
    </main>
  );
}
