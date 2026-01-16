import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import type { OrderStatus } from "@/types/database";

interface OrderRow {
  id: string;
  status: OrderStatus;
  total_cents: number;
  delivery_window_start: string | null;
  placed_at: string;
  order_items: Array<{ quantity: number }>;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase } = auth;

    // Fetch all orders with customer info
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        status,
        total_cents,
        delivery_window_start,
        placed_at,
        order_items (quantity),
        profiles (
          full_name,
          email
        )
      `)
      .order("placed_at", { ascending: false })
      .limit(100)
      .returns<OrderRow[]>();

    if (ordersError) {
      console.error("Failed to fetch orders:", ordersError);
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      );
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
