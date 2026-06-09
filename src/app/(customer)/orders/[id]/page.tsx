import { redirect, notFound } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";
import { format, parseISO } from "date-fns";
import { isPastCutoff } from "@/lib/utils/delivery-dates";
import { getBusinessRules } from "@/lib/settings";
import type { Order, OrderItem, OrderItemModifier, OrderAddress, OrderStatus } from "@/types/order";
import { OrderDetailView } from "./OrderDetailView";

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
  stripe_checkout_session_id: string | null;
  payment_method: string;
  cod_approved_at: string | null;
  cod_approved_by: string | null;
  tip_cents: number;
  promo_code: string | null;
  discount_cents: number;
  delivery_instructions: string | null;
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
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id: orderId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .select(
      `
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
    `
    )
    .eq("id", orderId)
    .eq("user_id", user.id)
    .returns<OrderQueryResult[]>()
    .single();

  if (orderError || !orderData) {
    notFound();
  }

  // Self-heal: verify pending Stripe orders
  if (orderData.status === "pending" && orderData.stripe_checkout_session_id) {
    try {
      const stripeSession = await stripe.checkout.sessions.retrieve(
        orderData.stripe_checkout_session_id
      );
      if (stripeSession.payment_status === "paid") {
        const rawPI = stripeSession.payment_intent;
        const piId =
          typeof rawPI === "string"
            ? rawPI
            : typeof rawPI === "object" && rawPI !== null
              ? rawPI.id
              : null;

        const svc = createServiceClient();
        const { error: healError } = await svc
          .from("orders")
          .update({
            status: "confirmed" as const,
            stripe_payment_intent_id: piId ?? `session_${stripeSession.id}`,
            confirmed_at: new Date().toISOString(),
          })
          .eq("id", orderId)
          .eq("status", "pending");

        if (!healError) {
          orderData.status = "confirmed";
          orderData.confirmed_at = new Date().toISOString();
          orderData.stripe_payment_intent_id = piId ?? `session_${stripeSession.id}`;
        }
      }
    } catch {
      // Stripe unavailable — render with current status, no crash
    }
  }

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
    modifiers: item.order_item_modifiers.map(
      (mod): OrderItemModifier => ({
        id: mod.id,
        nameSnapshot: mod.name_snapshot,
        priceDeltaSnapshot: mod.price_delta_snapshot,
      })
    ),
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
    paymentMethod: (orderData.payment_method ?? "stripe") as import("@/types/order").PaymentMethod,
    codApprovedAt: orderData.cod_approved_at ?? null,
    codApprovedBy: orderData.cod_approved_by ?? null,
    tipCents: orderData.tip_cents,
    promoCode: orderData.promo_code,
    discountCents: orderData.discount_cents,
    deliveryInstructions: orderData.delivery_instructions,
    placedAt: orderData.placed_at,
    confirmedAt: orderData.confirmed_at,
    deliveredAt: orderData.delivered_at,
    createdAt: orderData.created_at,
    updatedAt: orderData.updated_at,
    customerPhone: null,
    customerName: null,
    address,
    items,
  };

  const rules = await getBusinessRules();

  const ws = order.deliveryWindowStart;
  const we = order.deliveryWindowEnd;
  const deliveryDate = ws ? format(parseISO(ws), "EEEE, MMMM d, yyyy") : "Scheduled";
  const deliveryTime =
    ws && we
      ? `${format(parseISO(ws), "h:mm a")} - ${format(parseISO(we), "h:mm a")}`
      : "Time slot selected";

  const pastCutoff = order.deliveryWindowStart
    ? isPastCutoff(
        parseISO(order.deliveryWindowStart),
        new Date(),
        rules.cutoffDay,
        rules.cutoffHour
      )
    : false;

  return (
    <OrderDetailView
      order={order}
      address={address}
      items={items}
      deliveryDate={deliveryDate}
      deliveryTime={deliveryTime}
      isPastCutoff={pastCutoff}
    />
  );
}
