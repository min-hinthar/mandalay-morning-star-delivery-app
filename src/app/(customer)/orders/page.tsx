import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { OrderCard } from "@/components/orders/OrderCard";
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
    <main className="min-h-screen bg-gradient-to-b from-v6-surface-secondary to-v6-surface-primary py-8 px-4">
      <div className="mx-auto max-w-2xl">
        {/* V6 Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-v6-primary-light p-2.5">
              <Package className="h-6 w-6 text-v6-primary" />
            </div>
            <h1 className="text-2xl font-v6-display font-bold text-v6-text-primary">Your Orders</h1>
          </div>
          <Button asChild variant="primary">
            <Link href="/menu">Order Again</Link>
          </Button>
        </div>

        {/* V6 Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="rounded-full bg-v6-surface-tertiary w-20 h-20 mx-auto flex items-center justify-center mb-6">
              <ShoppingBag className="h-10 w-10 text-v6-text-muted" />
            </div>
            <h2 className="text-xl font-v6-display font-bold text-v6-text-primary mb-2">No orders yet</h2>
            <p className="font-v6-body text-v6-text-secondary mb-8">
              When you place an order, it will appear here.
            </p>
            <Button asChild variant="primary" size="lg" className="shadow-v6-elevated">
              <Link href="/menu">Browse Menu</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <OrderCard key={order.id} order={order} index={index} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
