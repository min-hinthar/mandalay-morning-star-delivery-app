"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, MapPin, Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCartStore } from "@/lib/stores/cart-store";
import { formatPrice } from "@/lib/utils/currency";
import { useConfetti } from "@/components/ui/Confetti";
import { SuccessCheckmark } from "@/components/ui/success-checkmark";
import { spring, staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { Order } from "@/types/order";
import { format, parseISO } from "date-fns";

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

  // Clear cart and trigger confetti on mount
  useEffect(() => {
    clearCart();
    if (shouldAnimate) {
      trigger();
    }
  }, [clearCart, trigger, shouldAnimate]);

  const deliveryDate = order.deliveryWindowStart
    ? format(parseISO(order.deliveryWindowStart), "EEEE, MMMM d, yyyy")
    : "Scheduled";

  const deliveryTime = order.deliveryWindowStart && order.deliveryWindowEnd
    ? `${format(parseISO(order.deliveryWindowStart), "h:mm a")} - ${format(parseISO(order.deliveryWindowEnd), "h:mm a")}`
    : "Time slot selected";

  return (
    <>
      {/* Confetti celebration */}
      <ConfettiComponent particleCount={30} duration={2.5} />

      <div className="min-h-screen bg-gradient-to-b from-cream to-lotus/30 py-12 px-4">
        <div className="mx-auto max-w-2xl">
          {/* Success Checkmark Animation */}
          <motion.div
            initial={shouldAnimate ? { scale: 0, opacity: 0 } : undefined}
            animate={{ scale: 1, opacity: 1 }}
            transition={getSpring(spring.ultraBouncy)}
            className="flex justify-center mb-6"
          >
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-6 shadow-lg">
              <SuccessCheckmark show={true} size={64} variant="default" />
            </div>
          </motion.div>

          {/* Confirmation Header */}
          <motion.div
            initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, ...getSpring(spring.default) }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-display text-charcoal mb-2">
              Order Confirmed!
            </h1>
            <p className="text-muted-foreground">
              Thank you for your order. We&apos;ll start preparing it for Saturday delivery.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </motion.div>

          {/* Staggered Content Container */}
          <motion.div
            variants={shouldAnimate ? staggerContainer(0.1, 0.4) : undefined}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Order Details Card */}
            <motion.div variants={shouldAnimate ? staggerItem : undefined}>
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
                          <span className="font-medium">{item.quantity}x</span>{" "}
                          {item.nameSnapshot}
                          {item.modifiers.length > 0 && (
                            <span className="text-muted-foreground ml-1">
                              ({item.modifiers.map(m => m.nameSnapshot).join(", ")})
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
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatPrice(order.subtotalCents)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Fee</span>
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
                        <span className="text-muted-foreground">Tax</span>
                        <span>{formatPrice(order.taxCents)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium text-lg pt-2 border-t">
                      <span>Total</span>
                      <span className="text-accent-tertiary">{formatPrice(order.totalCents)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Delivery Info Cards */}
            <motion.div
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
                    <p className="font-medium text-charcoal">Delivery Time</p>
                    <p className="text-sm text-muted-foreground">{deliveryDate}</p>
                    <p className="text-sm text-muted-foreground">{deliveryTime}</p>
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
                    <p className="font-medium text-charcoal">Delivery Address</p>
                    {order.address ? (
                      <>
                        <p className="text-sm text-muted-foreground">{order.address.line1}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.address.city}, {order.address.state} {order.address.postalCode}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Address on file</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              variants={shouldAnimate ? staggerItem : undefined}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-2"
            >
              <Button asChild variant="default" size="lg">
                <Link href={`/orders/${order.id}`}>
                  Track Order
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/menu">
                  Continue Shopping
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Contact Info */}
          <motion.p
            initial={shouldAnimate ? { opacity: 0 } : undefined}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-sm text-muted-foreground mt-8"
          >
            Questions about your order?{" "}
            <a href="mailto:support@mandalaymorningstar.com" className="text-accent-tertiary hover:underline">
              Contact us
            </a>
          </motion.p>
        </div>
      </div>
    </>
  );
}
