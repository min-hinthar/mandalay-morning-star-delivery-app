import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  AlertCircle,
  Star,
} from "lucide-react";
import { formatPrice } from "@/lib/utils/currency";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import Link from "next/link";
import type { OrderStatus } from "@/types/database";
import { RevenueChart } from "@/components/ui/admin/RevenueChart";
import { PopularItems } from "@/components/ui/admin/PopularItems";
import { AdminDashboard } from "@/components/ui/admin/AdminDashboard";
import type { KPIData } from "@/components/ui/admin/AdminDashboard";

interface OrderStatsRow {
  status: OrderStatus;
  total_cents: number;
  subtotal_cents: number;
  placed_at: string;
}

interface RecentOrderRow {
  id: string;
  status: OrderStatus;
  total_cents: number;
  placed_at: string;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

interface OrderItemRow {
  quantity: number;
  line_total_cents: number;
  menu_items: {
    name_en: string;
  } | null;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  out_for_delivery: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const today = startOfDay(new Date());
  const sevenDaysAgo = subDays(today, 7);

  // Fetch recent orders for stats
  const { data: ordersData } = await supabase
    .from("orders")
    .select("status, total_cents, subtotal_cents, placed_at")
    .gte("placed_at", sevenDaysAgo.toISOString())
    .returns<OrderStatsRow[]>();

  const orders = ordersData ?? [];

  // Calculate stats
  const totalOrders = orders.length;
  const confirmedOrders = orders.filter(
    (o) => o.status !== "cancelled" && o.status !== "pending"
  );
  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const totalRevenue = confirmedOrders.reduce((sum, o) => sum + o.total_cents, 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const avgOrderValue = confirmedOrders.length > 0
    ? Math.round(totalRevenue / confirmedOrders.length)
    : 0;

  // Calculate fulfillment rate
  const fulfillmentRate = totalOrders > 0
    ? Math.round((deliveredOrders.length / totalOrders) * 100)
    : 0;

  // Calculate free delivery orders (subtotal >= $100)
  const freeDeliveryOrders = confirmedOrders.filter(
    (o) => o.subtotal_cents >= 10000
  ).length;

  // Create KPI data for V7 dashboard
  const kpiData: KPIData[] = [
    {
      id: "total-orders",
      label: "Total Orders (7d)",
      value: totalOrders,
      format: "number",
      icon: "orders",
      variant: "default",
    },
    {
      id: "revenue",
      label: "Revenue (7d)",
      value: totalRevenue,
      format: "currency",
      icon: "revenue",
      variant: "success",
    },
    {
      id: "pending",
      label: "Pending Orders",
      value: pendingOrders,
      format: "number",
      icon: "exceptions",
      variant: pendingOrders > 5 ? "warning" : "default",
    },
    {
      id: "avg-order",
      label: "Avg Order Value",
      value: avgOrderValue,
      format: "currency",
      icon: "target",
      variant: "default",
    },
    {
      id: "fulfillment",
      label: "Fulfillment Rate",
      value: fulfillmentRate,
      format: "percentage",
      icon: "activity",
      variant: fulfillmentRate >= 90 ? "success" : "warning",
      goal: 95,
    },
    {
      id: "free-delivery",
      label: "Free Delivery Orders",
      value: freeDeliveryOrders,
      format: "number",
      icon: "drivers",
      variant: "default",
    },
  ];

  // Prepare daily revenue data for chart
  const days = eachDayOfInterval({ start: sevenDaysAgo, end: today });
  const dailyRevenue = days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayOrders = confirmedOrders.filter(
      (o) => format(new Date(o.placed_at), "yyyy-MM-dd") === dayStr
    );
    return {
      date: format(day, "MMM d"),
      revenue: dayOrders.reduce((sum, o) => sum + o.total_cents, 0),
      orders: dayOrders.length,
    };
  });

  // Fetch 5 most recent orders
  const { data: recentOrdersData } = await supabase
    .from("orders")
    .select(`
      id,
      status,
      total_cents,
      placed_at,
      profiles (
        full_name,
        email
      )
    `)
    .order("placed_at", { ascending: false })
    .limit(5)
    .returns<RecentOrderRow[]>();

  const recentOrders = recentOrdersData ?? [];

  // Fetch popular items (top 5 by quantity sold in last 7 days)
  const { data: orderItemsData } = await supabase
    .from("order_items")
    .select(`
      quantity,
      line_total_cents,
      menu_items (
        name_en
      )
    `)
    .gte("created_at", sevenDaysAgo.toISOString())
    .returns<OrderItemRow[]>();

  const orderItems = orderItemsData ?? [];

  // Aggregate popular items
  const itemStats = orderItems.reduce(
    (acc: Record<string, { quantity: number; revenue: number }>, item) => {
      const name = item.menu_items?.name_en ?? "Unknown";
      if (!acc[name]) {
        acc[name] = { quantity: 0, revenue: 0 };
      }
      acc[name].quantity += item.quantity;
      acc[name].revenue += item.line_total_cents;
      return acc;
    },
    {}
  );

  const popularItems = Object.entries(itemStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display text-charcoal">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your orders.
        </p>
      </div>

      {/* V7 KPI Dashboard */}
      <AdminDashboard kpis={kpiData} className="mb-8" />

      {/* Revenue Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Revenue Trend (7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={dailyRevenue} />
        </CardContent>
      </Card>

      {/* Recent Orders, Popular Items & Alerts */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Recent Orders */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link
              href="/admin/orders"
              className="text-sm text-brand-red hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.profiles?.full_name || order.profiles?.email || "Guest"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.placed_at), "MMM d, h:mm a")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {formatPrice(order.total_cents)}
                      </p>
                      <Badge className={STATUS_COLORS[order.status]}>
                        {STATUS_LABELS[order.status]}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Items */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Popular Items (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <PopularItems items={popularItems} />
          </CardContent>
        </Card>

        {/* Quick Actions / Alerts */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingOrders > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">
                    {pendingOrders} Pending Order{pendingOrders !== 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-yellow-700">
                    Awaiting payment confirmation.
                  </p>
                </div>
              </div>
            )}

            <Link
              href="/admin/orders"
              className="block p-4 rounded-lg border hover:border-brand-red hover:bg-brand-red/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-brand-red" />
                <div>
                  <p className="font-medium">Manage Orders</p>
                  <p className="text-sm text-muted-foreground">
                    View and update order statuses
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/menu"
              className="block p-4 rounded-lg border hover:border-brand-red hover:bg-brand-red/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-brand-red" />
                <div>
                  <p className="font-medium">Edit Menu</p>
                  <p className="text-sm text-muted-foreground">
                    Add, edit, or mark items sold out
                  </p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
