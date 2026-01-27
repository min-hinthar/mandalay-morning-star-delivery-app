import { redirect } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { OrdersHeader } from "@/components/ui/orders/OrdersHeader";
import { OrderListAnimated } from "@/components/ui/orders/OrderListAnimated";
import type { OrderStatus } from "@/types/order";

interface OrderRow {
  id: string;
  status: OrderStatus;
  total_cents: number;
  delivery_window_start: string | null;
  placed_at: string;
  order_items: Array<{ quantity: number }>;
}

export default async function OrdersPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch user's orders
  const { data: ordersData, error: ordersError } = await supabase
    .from("orders")
    .select(`
      id,
      status,
      total_cents,
      delivery_window_start,
      placed_at,
      order_items (quantity)
    `)
    .eq("user_id", user.id)
    .order("placed_at", { ascending: false })
    .returns<OrderRow[]>();

  if (ordersError) {
    console.error("Failed to fetch orders:", ordersError);
  }

  const orders = (ordersData ?? []).map((order) => ({
    id: order.id,
    status: order.status,
    totalCents: order.total_cents,
    deliveryWindowStart: order.delivery_window_start,
    placedAt: order.placed_at,
    itemCount: order.order_items.reduce((sum, item) => sum + item.quantity, 0),
  }));

  return (
    <main
      className="min-h-screen bg-gradient-to-b from-surface-secondary to-surface-primary pt-8 pb-32 px-4"
      style={{ viewTransitionName: "orders-page" }}
    >
      <div className="mx-auto max-w-2xl">
        {/* Animated Header (client component) */}
        <OrdersHeader />

        {/* Orders List with scroll reveal or empty state */}
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="rounded-full bg-surface-tertiary w-20 h-20 mx-auto flex items-center justify-center mb-6">
              <ShoppingBag className="h-10 w-10 text-text-muted" />
            </div>
            <h2 className="text-xl font-display font-bold text-text-primary mb-2">No orders yet</h2>
            <p className="font-body text-text-secondary mb-8">
              When you place an order, it will appear here.
            </p>
            <Button asChild variant="primary" size="lg" className="shadow-elevated">
              <Link href="/menu">Browse Menu</Link>
            </Button>
          </div>
        ) : (
          <OrderListAnimated orders={orders} />
        )}
      </div>
    </main>
  );
}
