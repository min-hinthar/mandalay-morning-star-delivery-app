import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Clock, Package } from "lucide-react";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderTimeline } from "@/components/ui/orders/OrderTimeline";
import { PendingOrderActions } from "@/components/ui/orders/PendingOrderActions";
import { RatingBanner } from "./RatingBanner";
import { ReorderButton } from "./ReorderButton";
import { OrderShareButton } from "./OrderShareButton";
import { formatPrice } from "@/lib/utils/currency";
import { format, parseISO } from "date-fns";
import { isPastCutoff } from "@/lib/utils/delivery-dates";
import { getBusinessRules } from "@/lib/settings";
import type { Order, OrderItem, OrderItemModifier, OrderAddress, OrderStatus } from "@/types/order";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/types/order";

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

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch order with items, modifiers, and address
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

  // Self-healing: if order is pending and has a checkout session, verify with Stripe
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
    address,
    items,
  };

  // Load DB-sourced business rules for cutoff check
  const rules = await getBusinessRules();

  const deliveryDate = order.deliveryWindowStart
    ? format(parseISO(order.deliveryWindowStart), "EEEE, MMMM d, yyyy")
    : "Scheduled";

  const deliveryTime =
    order.deliveryWindowStart && order.deliveryWindowEnd
      ? `${format(parseISO(order.deliveryWindowStart), "h:mm a")} - ${format(parseISO(order.deliveryWindowEnd), "h:mm a")}`
      : "Time slot selected";

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream to-lotus/30 pt-8 pb-32 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Back + Share */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" asChild>
            <Link href="/orders" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Link>
          </Button>
          <OrderShareButton orderId={order.id} />
        </div>

        {/* Rating Banner (delivered orders only) */}
        {order.status === "delivered" && <RatingBanner orderId={order.id} />}

        {/* Order Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display text-charcoal">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-sm text-muted-foreground">
              Placed on {format(parseISO(order.placedAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          <Badge className={ORDER_STATUS_COLORS[order.status]}>
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
        </div>

        {/* Order Timeline */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-medium text-charcoal">Order Status</h2>
          </CardHeader>
          <CardContent>
            <OrderTimeline
              currentStatus={order.status}
              placedAt={order.placedAt}
              confirmedAt={order.confirmedAt}
              deliveredAt={order.deliveredAt}
            />
          </CardContent>
        </Card>

        {/* Delivery Info */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          {/* Delivery Time */}
          <Card>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="rounded-full bg-saffron/10 p-2">
                <Clock className="h-5 w-5 text-saffron" />
              </div>
              <div>
                <p className="font-medium text-charcoal">Delivery Time</p>
                <p className="text-sm text-muted-foreground">{deliveryDate}</p>
                <p className="text-sm text-muted-foreground">{deliveryTime}</p>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="rounded-full bg-curry/10 p-2">
                <MapPin className="h-5 w-5 text-curry" />
              </div>
              <div>
                <p className="font-medium text-charcoal">Delivery Address</p>
                {address ? (
                  <>
                    <p className="text-sm text-muted-foreground">{address.line1}</p>
                    <p className="text-sm text-muted-foreground">
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Address on file</p>
                )}
                {order.deliveryInstructions && (
                  <p className="text-sm text-muted-foreground italic mt-2">
                    {order.deliveryInstructions}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card className="mb-6">
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-charcoal" />
              <span className="font-medium">Order Items</span>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Items List */}
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div>
                    <span className="font-medium">{item.quantity}x</span> {item.nameSnapshot}
                    {item.modifiers.length > 0 && (
                      <span className="text-muted-foreground ml-1">
                        ({item.modifiers.map((m) => m.nameSnapshot).join(", ")})
                      </span>
                    )}
                    {item.specialInstructions && (
                      <p className="text-xs text-muted-foreground italic mt-1">
                        Note: {item.specialInstructions}
                      </p>
                    )}
                  </div>
                  <span>{formatPrice(item.lineTotalCents)}</span>
                </div>
              ))}
            </div>

            {/* Special Instructions */}
            {order.specialInstructions && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-charcoal mb-1">Special Instructions</p>
                <p className="text-sm text-muted-foreground">{order.specialInstructions}</p>
              </div>
            )}

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span>
                  {order.deliveryFeeCents === 0 ? (
                    <span className="text-jade">FREE</span>
                  ) : (
                    formatPrice(order.deliveryFeeCents)
                  )}
                </span>
              </div>
              {order.taxCents > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatPrice(order.taxCents)}</span>
                </div>
              )}
              {order.discountCents > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Discount{order.promoCode ? ` (${order.promoCode})` : ""}
                  </span>
                  <span className="text-jade">-{formatPrice(order.discountCents)}</span>
                </div>
              )}
              {order.tipCents > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tip</span>
                  <span>{formatPrice(order.tipCents)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-brand-red">{formatPrice(order.totalCents)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-4">
          {order.status === "pending" && (
            <PendingOrderActions
              orderId={order.id}
              isPastCutoff={
                order.deliveryWindowStart
                  ? isPastCutoff(
                      parseISO(order.deliveryWindowStart),
                      new Date(),
                      rules.cutoffDay,
                      rules.cutoffHour
                    )
                  : false
              }
            />
          )}

          <div className="flex justify-center">
            <ReorderButton orderId={order.id} />
          </div>
        </div>
      </div>
    </main>
  );
}
