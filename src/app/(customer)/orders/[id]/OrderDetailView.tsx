import Link from "next/link";
import { ArrowLeft, MapPin, Clock, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderTimeline } from "@/components/ui/orders/OrderTimeline";
import { PendingOrderActions } from "@/components/ui/orders/PendingOrderActions";
import { HeroCardLayers } from "@/components/ui/homepage/Hero/HeroCardLayers";
import { HeroSunburst } from "@/components/ui/homepage/Hero/HeroSunburst";
import { RatingBanner } from "./RatingBanner";
import { ReorderButton } from "./ReorderButton";
import { OrderShareButton } from "./OrderShareButton";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/currency";
import { format, parseISO } from "date-fns";
import type { Order, OrderItem, OrderAddress } from "@/types/order";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/types/order";

interface OrderDetailViewProps {
  order: Order;
  address: OrderAddress | null;
  items: OrderItem[];
  deliveryDate: string;
  deliveryTime: string;
  isPastCutoff: boolean;
}

/** Warm "stacked paper" card (cream in both themes — constant ink reads). */
function PaperCard({
  accent = "clay",
  className,
  children,
}: {
  accent?: "clay" | "blue" | "sage";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("hero-surface-paper relative overflow-hidden rounded-2xl", className)}>
      <HeroCardLayers accent={accent} radius="rounded-2xl" />
      <div className="relative">{children}</div>
    </div>
  );
}

export function OrderDetailView({
  order,
  address,
  items,
  deliveryDate,
  deliveryTime,
  isPastCutoff,
}: OrderDetailViewProps) {
  return (
    <main className="orders-canvas min-h-screen px-4 pb-20 pt-8">
      <div className="mx-auto max-w-2xl">
        {/* Back + Share */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link
              href="/orders"
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Link>
          </Button>
          <OrderShareButton orderId={order.id} />
        </div>

        {/* Rating Banner (delivered orders only) */}
        {order.status === "delivered" && <RatingBanner orderId={order.id} />}

        {/* Editorial order header (on the warm canvas — theme-aware text) */}
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <HeroSunburst className="mt-1 h-5 w-5 shrink-0 text-hero-clay" rays={8} />
            <div>
              <h1 className="font-display text-2xl text-text-primary">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="text-sm text-text-muted">
                Placed {format(parseISO(order.placedAt), "MMM d, yyyy 'at' h:mm a")}
                <span className="ml-1.5 font-burmese" lang="my">
                  · အော်ဒါ
                </span>
              </p>
            </div>
          </div>
          <Badge className={ORDER_STATUS_COLORS[order.status]}>
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
        </div>

        {/* Order Status */}
        <PaperCard accent="clay" className="mb-6 p-5">
          <h2 className="mb-4 font-display text-lg font-semibold text-hero-ink">
            Order status
            <span className="ml-1.5 font-burmese text-xs font-normal text-hero-ink-muted" lang="my">
              အခြေအနေ
            </span>
          </h2>
          <OrderTimeline
            currentStatus={order.status}
            placedAt={order.placedAt}
            confirmedAt={order.confirmedAt}
            deliveredAt={order.deliveredAt}
          />
        </PaperCard>

        {/* Delivery Info */}
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <PaperCard accent="clay">
            <div className="flex items-start gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-hero-clay/12">
                <Clock className="h-5 w-5 text-hero-clay" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-hero-ink">Delivery time</p>
                <p className="text-sm text-hero-ink-muted">{deliveryDate}</p>
                <p className="text-sm text-hero-ink-muted">{deliveryTime}</p>
              </div>
            </div>
          </PaperCard>

          <PaperCard accent="blue">
            <div className="flex items-start gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-hero-blue/12">
                <MapPin className="h-5 w-5 text-hero-blue" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-hero-ink">Delivery address</p>
                {address ? (
                  <>
                    <p className="text-sm text-hero-ink-muted">{address.line1}</p>
                    <p className="text-sm text-hero-ink-muted">
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-hero-ink-muted">Address on file</p>
                )}
                {order.deliveryInstructions && (
                  <p className="mt-2 text-sm italic text-hero-ink-muted">
                    {order.deliveryInstructions}
                  </p>
                )}
              </div>
            </div>
          </PaperCard>
        </div>

        {/* Order Items — living-receipt */}
        <PaperCard accent="sage" className="mb-6">
          <div className="flex items-center gap-2 border-b border-hero-line/70 p-4">
            <Package className="h-5 w-5 text-hero-sage" aria-hidden="true" />
            <span className="font-display font-semibold text-hero-ink">
              Order items
              <span
                className="ml-1.5 font-burmese text-2xs font-normal text-hero-ink-muted"
                lang="my"
              >
                ပစ္စည်းများ
              </span>
            </span>
          </div>
          <div className="space-y-4 p-5">
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <span className="font-medium text-hero-ink">
                      {item.quantity}× {item.nameSnapshot}
                    </span>
                    {item.modifiers.length > 0 && (
                      <span className="ml-1 text-hero-ink-muted">
                        ({item.modifiers.map((m) => m.nameSnapshot).join(", ")})
                      </span>
                    )}
                    {item.specialInstructions && (
                      <p className="mt-1 text-xs italic text-hero-ink-muted">
                        Note: {item.specialInstructions}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 font-semibold text-hero-ink">
                    {formatPrice(item.lineTotalCents)}
                  </span>
                </li>
              ))}
            </ul>

            {order.specialInstructions && (
              <div className="border-t border-hero-line/60 pt-4">
                <p className="mb-1 text-sm font-medium text-hero-ink">Special instructions</p>
                <p className="text-sm text-hero-ink-muted">{order.specialInstructions}</p>
              </div>
            )}

            {/* Totals */}
            <div className="checkout-perf checkout-rule-draw" aria-hidden="true" />
            <div className="space-y-2 pt-1 text-sm">
              <div className="flex justify-between text-hero-ink-muted">
                <span>Subtotal</span>
                <span className="text-hero-ink">{formatPrice(order.subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-hero-ink-muted">
                <span>Delivery fee</span>
                {order.deliveryFeeCents === 0 ? (
                  <span className="font-semibold text-hero-sage">FREE</span>
                ) : (
                  <span className="text-hero-ink">{formatPrice(order.deliveryFeeCents)}</span>
                )}
              </div>
              {order.taxCents > 0 && (
                <div className="flex justify-between text-hero-ink-muted">
                  <span>Tax</span>
                  <span className="text-hero-ink">{formatPrice(order.taxCents)}</span>
                </div>
              )}
              {order.discountCents > 0 && (
                <div className="flex justify-between text-hero-ink-muted">
                  <span>Discount{order.promoCode ? ` (${order.promoCode})` : ""}</span>
                  <span className="font-semibold text-hero-sage">
                    -{formatPrice(order.discountCents)}
                  </span>
                </div>
              )}
              {order.tipCents > 0 && (
                <div className="flex justify-between text-hero-ink-muted">
                  <span>Tip</span>
                  <span className="text-hero-ink">{formatPrice(order.tipCents)}</span>
                </div>
              )}
              <div className="checkout-perf checkout-rule-draw my-1" aria-hidden="true" />
              <div className="flex items-center justify-between pt-0.5 text-lg font-medium">
                <span className="font-display text-hero-ink">Total</span>
                <span className="font-bold text-hero-accent">{formatPrice(order.totalCents)}</span>
              </div>
            </div>
          </div>
        </PaperCard>

        {/* Pending actions */}
        {order.status === "pending" && (
          <div className="space-y-4">
            <PendingOrderActions orderId={order.id} isPastCutoff={isPastCutoff} />
          </div>
        )}

        {/* Sticky Reorder */}
        <div
          className={cn(
            "sticky bottom-0 z-20 -mx-4 mt-6 flex justify-center",
            "border-t border-border bg-surface-elevated px-4 py-3 shadow-lg"
          )}
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <ReorderButton orderId={order.id} />
        </div>
      </div>
    </main>
  );
}
