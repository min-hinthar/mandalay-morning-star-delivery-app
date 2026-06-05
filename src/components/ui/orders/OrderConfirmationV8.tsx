"use client";

import { useEffect } from "react";
import { m } from "framer-motion";
import { Clock, MapPin, Package, AlertCircle, Banknote } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCartStore } from "@/lib/stores/cart-store";
import { formatPrice } from "@/lib/utils/currency";
import { useConfetti } from "@/components/ui/Confetti";
import { OrderRewardsTeaser } from "@/components/ui/orders/OrderRewardsTeaser";
import { CutoffCountdown } from "@/components/ui/customer";
import { SuccessCheckmark } from "@/components/ui/success-checkmark";
import { spring, staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { Order } from "@/types/order";
import { parseISO } from "date-fns";

// Delivery is LA-only — format the window in LA time so the day/time shown is
// the real delivery day regardless of the viewer's timezone (avoids the
// getUTCDay-in-LA class of bug; see CLAUDE.md gotchas).
const LA_TZ = "America/Los_Angeles";
const LA_DATE_FMT = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: LA_TZ,
});
const LA_WEEKDAY_FMT = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: LA_TZ });
const LA_TIME_FMT = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: LA_TZ,
});

interface OrderConfirmationV8Props {
  order: Order;
}

/**
 * V8 Order Confirmation with celebration animations
 *
 * Features:
 * - Confetti burst on mount
 * - Animated checkmark with spring bounce
 * - Staggered content reveal
 * - Reduced motion support
 */
export function OrderConfirmationV8({ order }: OrderConfirmationV8Props) {
  const clearCart = useCartStore((state) => state.clearCart);
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const { trigger, Confetti: ConfettiComponent } = useConfetti();

  const isCOD = order.paymentMethod === "cod";
  const isPendingApproval = order.status === "pending_approval";

  // Clear cart and trigger confetti on mount (no confetti for pending COD)
  useEffect(() => {
    clearCart();
    if (shouldAnimate && !isPendingApproval) {
      trigger();
    }
  }, [clearCart, trigger, shouldAnimate, isPendingApproval]);

  const deliveryDate = order.deliveryWindowStart
    ? LA_DATE_FMT.format(parseISO(order.deliveryWindowStart))
    : "Scheduled";

  // Weekday name for the "Locked in for {day}" ritual — LA tz, matching the
  // delivery-date card above so they always agree.
  const deliveryDayLabel = order.deliveryWindowStart
    ? LA_WEEKDAY_FMT.format(parseISO(order.deliveryWindowStart))
    : "your delivery day";

  const deliveryTime =
    order.deliveryWindowStart && order.deliveryWindowEnd
      ? `${LA_TIME_FMT.format(parseISO(order.deliveryWindowStart))} - ${LA_TIME_FMT.format(parseISO(order.deliveryWindowEnd))}`
      : "Time slot selected";

  return (
    <>
      {/* Confetti celebration */}
      <ConfettiComponent particleCount={30} duration={2.5} />

      <div className="min-h-screen bg-gradient-to-b from-surface-secondary to-primary/5 py-12 px-4">
        <div className="mx-auto max-w-2xl">
          {/* Icon Animation */}
          <m.div
            initial={shouldAnimate ? { scale: 0, opacity: 0 } : undefined}
            animate={{ scale: 1, opacity: 1 }}
            transition={getSpring(spring.ultraBouncy)}
            className="flex justify-center mb-6"
          >
            {isPendingApproval ? (
              <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-6 shadow-lg">
                <Banknote className="h-16 w-16 text-amber-600 dark:text-amber-400" />
              </div>
            ) : (
              <div className="rounded-full bg-status-success-bg p-6 shadow-lg">
                <SuccessCheckmark show={true} size={64} variant="default" />
              </div>
            )}
          </m.div>

          {/* Confirmation Header */}
          <m.div
            initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, ...getSpring(spring.default) }}
            className="text-center mb-8"
          >
            {isPendingApproval ? (
              <>
                <h1 className="text-3xl font-display text-text-primary mb-2">Order Received!</h1>
                <p className="text-text-muted">
                  Your cash-on-delivery order has been received and is awaiting confirmation.
                </p>
                <div className="mt-4 mx-auto max-w-md p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      Our team will confirm your order shortly. You&apos;ll receive an email once
                      your order is approved and scheduled for delivery.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-display text-text-primary mb-2">Order Confirmed!</h1>
                <p className="text-text-muted">
                  Thank you for your order. We&apos;ll start preparing it for delivery.
                </p>
              </>
            )}
            <p className="mt-2 text-sm text-text-muted">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </m.div>

          {/* "Locked in for {day}" anticipation ritual — only for a confirmed
              order with a delivery window. Skipped for COD awaiting approval and
              during the post-Stripe "confirming…" poller phase (status pending),
              so the locked copy can't contradict an in-flight confirmation. */}
          {order.status !== "pending" && !isPendingApproval && order.deliveryWindowStart && (
            <m.div
              initial={shouldAnimate ? { opacity: 0, y: 12 } : undefined}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, ...getSpring(spring.default) }}
              className="mb-8"
            >
              <CutoffCountdown
                cutoffAt={order.deliveryWindowStart}
                deliveryDayLabel={deliveryDayLabel}
                forceLocked
                lockedSubline={`Arriving ${deliveryDate}`}
              />
            </m.div>
          )}

          {/* Staggered Content Container */}
          <m.div
            variants={shouldAnimate ? staggerContainer(0.1, 0.4) : undefined}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Order Details Card */}
            <m.div variants={shouldAnimate ? staggerItem : undefined}>
              <Card className="border-accent-secondary/20 shadow-lg">
                <CardHeader className="bg-accent-secondary/5 border-b border-accent-secondary/10">
                  <div className="flex items-center gap-2 text-accent-secondary">
                    <Package className="h-5 w-5" />
                    <span className="font-medium">Order Summary</span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {/* Order Items */}
                  <div className="space-y-3">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <div>
                          <span className="font-medium">{item.quantity}x</span> {item.nameSnapshot}
                          {item.modifiers.length > 0 && (
                            <span className="text-text-muted ml-1">
                              ({item.modifiers.map((m) => m.nameSnapshot).join(", ")})
                            </span>
                          )}
                        </div>
                        <span>{formatPrice(item.lineTotalCents)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Subtotal</span>
                      <span>{formatPrice(order.subtotalCents)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Delivery Fee</span>
                      <span>
                        {order.deliveryFeeCents === 0 ? (
                          <span className="text-accent-secondary">FREE</span>
                        ) : (
                          formatPrice(order.deliveryFeeCents)
                        )}
                      </span>
                    </div>
                    {order.taxCents > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Tax</span>
                        <span>{formatPrice(order.taxCents)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium text-lg pt-2 border-t">
                      <span>Total</span>
                      <span className="text-text-money">{formatPrice(order.totalCents)}</span>
                    </div>
                    {isCOD && (
                      <div className="flex items-center gap-2 pt-2 text-sm text-emerald-700 dark:text-emerald-400">
                        <Banknote className="h-4 w-4" />
                        <span className="font-medium">Cash on Delivery</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </m.div>

            {/* Delivery Info Cards */}
            <m.div
              variants={shouldAnimate ? staggerItem : undefined}
              className="grid gap-4 md:grid-cols-2"
            >
              {/* Delivery Time */}
              <Card>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="rounded-full bg-interactive/10 p-2">
                    <Clock className="h-5 w-5 text-interactive" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Delivery Time</p>
                    <p className="text-sm text-text-muted">{deliveryDate}</p>
                    <p className="text-sm text-text-muted">{deliveryTime}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Address */}
              <Card>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="rounded-full bg-accent-tertiary/10 p-2">
                    <MapPin className="h-5 w-5 text-accent-tertiary" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Delivery Address</p>
                    {order.address ? (
                      <>
                        <p className="text-sm text-text-muted">{order.address.line1}</p>
                        <p className="text-sm text-text-muted">
                          {order.address.city}, {order.address.state} {order.address.postalCode}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-text-muted">Address on file</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </m.div>

            {/* Action Buttons */}
            <m.div
              variants={shouldAnimate ? staggerItem : undefined}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-2"
            >
              <Button asChild variant="default" size="lg">
                <Link href={`/orders/${order.id}`}>Track Order</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/menu">Continue Shopping</Link>
              </Button>
            </m.div>

            {/* Rewards nudge — skip while a COD order awaits approval (no Star yet) */}
            {!isPendingApproval && (
              <m.div variants={shouldAnimate ? staggerItem : undefined}>
                <OrderRewardsTeaser />
              </m.div>
            )}
          </m.div>

          {/* Contact Info */}
          <m.p
            initial={shouldAnimate ? { opacity: 0 } : undefined}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-sm text-text-muted mt-8"
          >
            Questions about your order?{" "}
            <a href="mailto:admin@mandalaymorningstar.com" className="text-primary hover:underline">
              Contact us
            </a>
          </m.p>
        </div>
      </div>
    </>
  );
}
