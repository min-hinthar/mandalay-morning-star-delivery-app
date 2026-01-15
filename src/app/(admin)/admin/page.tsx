import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  DollarSign,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { formatPrice } from "@/lib/utils/currency";
import { format, subDays, startOfDay } from "date-fns";
import Link from "next/link";
import type { OrderStatus } from "@/types/database";

interface OrderStatsRow {
  status: OrderStatus;
  total_cents: number;
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
    .select("status, total_cents, placed_at")
    .gte("placed_at", sevenDaysAgo.toISOString())
    .returns<OrderStatsRow[]>();

  const orders = ordersData ?? [];

  // Calculate stats
  const totalOrders = orders.length;
  const confirmedOrders = orders.filter(
    (o) => o.status !== "cancelled" && o.status !== "pending"
  );
  const totalRevenue = confirmedOrders.reduce((sum, o) => sum + o.total_cents, 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const avgOrderValue = confirmedOrders.length > 0
    ? Math.round(totalRevenue / confirmedOrders.length)
    : 0;

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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display text-charcoal">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your orders.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Orders (7d)
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {confirmedOrders.length} confirmed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenue (7d)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From confirmed orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Orders
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Order Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(avgOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              Per confirmed order
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
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
                    These orders are awaiting payment confirmation.
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
                <Package className="h-5 w-5 text-brand-red" />
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
