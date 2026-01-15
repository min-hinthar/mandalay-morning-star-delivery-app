"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock, MapPin, Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCartStore } from "@/lib/stores/cart-store";
import { formatPrice } from "@/lib/utils/currency";
import type { Order } from "@/types/order";
import { format, parseISO } from "date-fns";

interface OrderConfirmationProps {
  order: Order;
}

export function OrderConfirmation({ order }: OrderConfirmationProps) {
  const clearCart = useCartStore((state) => state.clearCart);

  // Clear cart on successful order confirmation
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  const deliveryDate = order.deliveryWindowStart
    ? format(parseISO(order.deliveryWindowStart), "EEEE, MMMM d, yyyy")
    : "Scheduled";

  const deliveryTime = order.deliveryWindowStart && order.deliveryWindowEnd
    ? `${format(parseISO(order.deliveryWindowStart), "h:mm a")} - ${format(parseISO(order.deliveryWindowEnd), "h:mm a")}`
    : "Time slot selected";

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-lotus/30 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex justify-center mb-8"
        >
          <div className="rounded-full bg-jade/10 p-4">
            <CheckCircle className="h-16 w-16 text-jade" />
          </div>
        </motion.div>

        {/* Confirmation Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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

        {/* Order Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="mb-6 border-jade/20 shadow-lg">
            <CardHeader className="bg-jade/5 border-b border-jade/10">
              <div className="flex items-center gap-2 text-jade">
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
                <div className="flex justify-between font-medium text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-brand-red">{formatPrice(order.totalCents)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Delivery Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid gap-4 md:grid-cols-2 mb-8"
        >
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
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

        {/* Contact Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          Questions about your order?{" "}
          <a href="mailto:support@mandalaymorningstar.com" className="text-brand-red hover:underline">
            Contact us
          </a>
        </motion.p>
      </div>
    </div>
  );
}
