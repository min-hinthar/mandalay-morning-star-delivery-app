import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderConfirmationV8 } from "@/components/ui/orders/OrderConfirmationV8";
import type { Order, OrderItem, OrderItemModifier, OrderAddress, OrderStatus } from "@/types/order";

// Define the expected shape of the query result
interface OrderQueryResult {
  id: string;
  user_id: string;
  status: OrderStatus;
  subtotal_cents: number;
  delivery_fee_cents: number;
  tax_cents: number;
  total_cents: number;
  delivery_window_start: string | null;
  delivery_window_end: string | null;
  special_instructions: string | null;
  stripe_payment_intent_id: string | null;
  placed_at: string;
  confirmed_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  addresses: {
    id: string;
    label: string;
    line_1: string;
    line_2: string | null;
    city: string;
    state: string;
    postal_code: string;
    formatted_address: string | null;
  } | null;
  order_items: Array<{
    id: string;
    name_snapshot: string;
    base_price_snapshot: number;
    quantity: number;
    line_total_cents: number;
    special_instructions: string | null;
    order_item_modifiers: Array<{
      id: string;
      name_snapshot: string;
      price_delta_snapshot: number;
    }>;
  }>;
}

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

export default async function OrderConfirmationPage({ params, searchParams }: PageProps) {
  const { id: orderId } = await params;
  const { session_id } = await searchParams;

  const supabase = await createClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch order with items, modifiers, and address
  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .select(`
      *,
      addresses (
        id,
        label,
        line_1,
        line_2,
        city,
        state,
        postal_code,
        formatted_address
      ),
      order_items (
        id,
        name_snapshot,
        base_price_snapshot,
        quantity,
        line_total_cents,
        special_instructions,
        order_item_modifiers (
          id,
          name_snapshot,
          price_delta_snapshot
        )
      )
    `)
    .eq("id", orderId)
    .eq("user_id", user.id)
    .returns<OrderQueryResult[]>()
    .single();

  if (orderError || !orderData) {
    notFound();
  }

  // Transform the data to match our Order type
  const addressData = orderData.addresses;

  const address: OrderAddress | null = addressData
    ? {
        id: addressData.id,
        label: addressData.label,
        line1: addressData.line_1,
        line2: addressData.line_2,
        city: addressData.city,
        state: addressData.state,
        postalCode: addressData.postal_code,
        formattedAddress: addressData.formatted_address,
      }
    : null;

  const items: OrderItem[] = orderData.order_items.map((item) => ({
    id: item.id,
    nameSnapshot: item.name_snapshot,
    basePriceSnapshot: item.base_price_snapshot,
    quantity: item.quantity,
    lineTotalCents: item.line_total_cents,
    specialInstructions: item.special_instructions,
    modifiers: item.order_item_modifiers.map((mod): OrderItemModifier => ({
      id: mod.id,
      nameSnapshot: mod.name_snapshot,
      priceDeltaSnapshot: mod.price_delta_snapshot,
    })),
  }));

  const order: Order = {
    id: orderData.id,
    userId: orderData.user_id,
    status: orderData.status,
    subtotalCents: orderData.subtotal_cents,
    deliveryFeeCents: orderData.delivery_fee_cents,
    taxCents: orderData.tax_cents,
    totalCents: orderData.total_cents,
    deliveryWindowStart: orderData.delivery_window_start,
    deliveryWindowEnd: orderData.delivery_window_end,
    specialInstructions: orderData.special_instructions,
    stripePaymentIntentId: orderData.stripe_payment_intent_id,
    placedAt: orderData.placed_at,
    confirmedAt: orderData.confirmed_at,
    deliveredAt: orderData.delivered_at,
    createdAt: orderData.created_at,
    updatedAt: orderData.updated_at,
    address,
    items,
  };

  // If order is still pending and we have a session_id, the webhook hasn't processed yet
  // Show the confirmation anyway - the webhook will update the status
  if (order.status === "pending" && !session_id) {
    // Order exists but wasn't confirmed - redirect to checkout
    redirect("/checkout");
  }

  return <OrderConfirmationV8 order={order} />;
}
