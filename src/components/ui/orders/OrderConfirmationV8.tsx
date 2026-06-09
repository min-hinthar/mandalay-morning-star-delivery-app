"use client";

import { useEffect } from "react";
import { m } from "framer-motion";
import { Clock, MapPin, Package, AlertCircle, Banknote } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/stores/cart-store";
import { formatPrice } from "@/lib/utils/currency";
import { useConfetti } from "@/components/ui/Confetti";
import { OrderRewardsTeaser } from "@/components/ui/orders/OrderRewardsTeaser";
import { CutoffCountdown } from "@/components/ui/customer";
import { SuccessCheckmark } from "@/components/ui/success-checkmark";
import { HeroSunburst } from "@/components/ui/homepage/Hero/HeroSunburst";
import { HeroCardLayers } from "@/components/ui/homepage/Hero/HeroCardLayers";
import { TierUpCelebration } from "@/components/ui/TierUpCelebration";
import { useRewardsSummary } from "@/lib/hooks/useRewardsSummary";
import type { LoyaltyTierId } from "@/lib/loyalty";
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

  // Tier-threaded wax seal — the customer's loyalty tier tints the seal ring,
  // sunburst, and radial glow (text stays deep clay for contrast). Defaults to
  // clay for new/guest/loading — real data only, never fabricated.
  const { data: rewards } = useRewardsSummary(true);
  const tierId: LoyaltyTierId = rewards?.tier?.id ?? "new";
  const tierSeal: Record<LoyaltyTierId, { ring: string; sun: string; varName: string }> = {
    new: { ring: "border-hero-clay/55", sun: "text-hero-clay", varName: "--hero-clay" },
    jade: { ring: "border-hero-blue/55", sun: "text-hero-blue", varName: "--hero-blue" },
    ruby: { ring: "border-hero-ruby/55", sun: "text-hero-ruby", varName: "--hero-ruby" },
    gold: { ring: "border-hero-gold/60", sun: "text-hero-gold", varName: "--hero-gold" },
  };
  const seal = tierSeal[tierId];

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

      {/* Tier-up moment — fires only on a real tier crossing (kit; self-deduped) */}
      <TierUpCelebration />

      <div className="orders-canvas min-h-screen px-4 py-12">
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

          {/* Bilingual wax-seal stamp — presses in like a real stamp */}
          <m.div
            initial={shouldAnimate ? { scale: 1.55, rotate: -18, opacity: 0 } : undefined}
            animate={{ scale: 1, rotate: -7, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 15, delay: 0.5 }}
            className={`mx-auto mb-8 flex h-28 w-28 flex-col items-center justify-center gap-0.5 rounded-full border-2 text-center ${seal.ring}`}
            style={{
              background: `radial-gradient(circle at 35% 28%, color-mix(in srgb, var(${seal.varName}) 18%, transparent), transparent 72%)`,
            }}
            aria-label="Thank you"
          >
            <HeroSunburst className={`h-5 w-5 ${seal.sun}`} rays={10} />
            <span className="font-display text-sm font-semibold leading-tight text-hero-accent">
              Thank you
            </span>
            <span className="font-burmese text-2xs text-hero-accent" lang="my">
              ကျေးဇူးတင်ပါသည်
            </span>
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
            {/* Order Summary — warm-paper living-receipt */}
            <m.div variants={shouldAnimate ? staggerItem : undefined}>
              <div className="hero-surface-paper relative overflow-hidden rounded-2xl">
                <HeroCardLayers accent="sage" radius="rounded-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-2 border-b border-hero-line/70 p-4">
                    <Package className="h-5 w-5 text-hero-sage" aria-hidden="true" />
                    <span className="font-display font-semibold text-hero-ink">
                      Order summary
                      <span
                        className="ml-1.5 font-burmese text-2xs font-normal text-hero-ink-muted"
                        lang="my"
                      >
                        အော်ဒါ
                      </span>
                    </span>
                  </div>
                  <div className="space-y-4 p-5">
                    {/* Order Items */}
                    <ul className="space-y-3">
                      {order.items?.map((item) => (
                        <li key={item.id} className="flex justify-between gap-3 text-sm">
                          <div className="min-w-0 text-hero-ink">
                            <span className="font-medium">{item.quantity}×</span>{" "}
                            {item.nameSnapshot}
                            {item.modifiers.length > 0 && (
                              <span className="ml-1 text-hero-ink-muted">
                                ({item.modifiers.map((m) => m.nameSnapshot).join(", ")})
                              </span>
                            )}
                          </div>
                          <span className="shrink-0 font-semibold text-hero-ink">
                            {formatPrice(item.lineTotalCents)}
                          </span>
                        </li>
                      ))}
                    </ul>

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
                          <span className="text-hero-ink">
                            {formatPrice(order.deliveryFeeCents)}
                          </span>
                        )}
                      </div>
                      {order.taxCents > 0 && (
                        <div className="flex justify-between text-hero-ink-muted">
                          <span>Tax</span>
                          <span className="text-hero-ink">{formatPrice(order.taxCents)}</span>
                        </div>
                      )}
                      <div className="checkout-perf checkout-rule-draw my-1" aria-hidden="true" />
                      <div className="flex items-center justify-between pt-0.5 text-lg font-medium">
                        <span className="font-display text-hero-ink">Total</span>
                        <span className="font-bold text-hero-accent">
                          {formatPrice(order.totalCents)}
                        </span>
                      </div>
                      {isCOD && (
                        <div className="flex items-center gap-2 pt-2 text-sm text-hero-sage">
                          <Banknote className="h-4 w-4" />
                          <span className="font-medium">Cash on Delivery</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </m.div>

            {/* Delivery Info Cards */}
            <m.div
              variants={shouldAnimate ? staggerItem : undefined}
              className="grid gap-4 md:grid-cols-2"
            >
              {/* Delivery Time */}
              <div className="hero-surface-paper relative overflow-hidden rounded-2xl">
                <HeroCardLayers accent="clay" radius="rounded-2xl" />
                <div className="relative flex items-start gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-hero-clay/12">
                    <Clock className="h-5 w-5 text-hero-clay" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold text-hero-ink">Delivery time</p>
                    <p className="text-sm text-hero-ink-muted">{deliveryDate}</p>
                    <p className="text-sm text-hero-ink-muted">{deliveryTime}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="hero-surface-paper relative overflow-hidden rounded-2xl">
                <HeroCardLayers accent="blue" radius="rounded-2xl" />
                <div className="relative flex items-start gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-hero-blue/12">
                    <MapPin className="h-5 w-5 text-hero-blue" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold text-hero-ink">Delivery address</p>
                    {order.address ? (
                      <>
                        <p className="text-sm text-hero-ink-muted">{order.address.line1}</p>
                        <p className="text-sm text-hero-ink-muted">
                          {order.address.city}, {order.address.state} {order.address.postalCode}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-hero-ink-muted">Address on file</p>
                    )}
                  </div>
                </div>
              </div>
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
