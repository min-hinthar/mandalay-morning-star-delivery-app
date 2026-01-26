"use client";

/**
 * OrderListAnimated Component
 * Wraps order history list with AnimatedSection for scroll-reveal animation.
 * Per Phase 22 CONTEXT: animations replay on re-enter viewport.
 */

import { motion } from "framer-motion";
import { AnimatedSection, itemVariants } from "@/components/scroll/AnimatedSection";
import { OrderCard } from "./OrderCard";
import type { OrderStatus } from "@/types/order";

interface Order {
  id: string;
  status: OrderStatus;
  totalCents: number;
  deliveryWindowStart: string | null;
  placedAt: string;
  itemCount: number;
}

interface OrderListAnimatedProps {
  orders: Order[];
}

export function OrderListAnimated({ orders }: OrderListAnimatedProps) {
  return (
    <AnimatedSection as="div">
      <div className="space-y-4">
        {orders.map((order, index) => (
          <motion.div key={order.id} variants={itemVariants}>
            <OrderCard order={order} index={index} />
          </motion.div>
        ))}
      </div>
    </AnimatedSection>
  );
}
