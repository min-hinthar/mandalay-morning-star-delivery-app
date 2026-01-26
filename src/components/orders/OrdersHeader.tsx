"use client";

/**
 * OrdersHeader Component
 * Animated header for the Orders page with fade-in slide effect.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

export function OrdersHeader() {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const springConfig = getSpring(spring.default);

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: -12 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={springConfig}
      className="flex items-center justify-between mb-8"
    >
      <div className="flex items-center gap-3">
        <motion.div
          initial={shouldAnimate ? { scale: 0 } : undefined}
          animate={shouldAnimate ? { scale: 1 } : undefined}
          transition={{ ...springConfig, delay: 0.1 }}
          className="rounded-full bg-primary-light p-2.5"
        >
          <Package className="h-6 w-6 text-primary" />
        </motion.div>
        <motion.h1
          initial={shouldAnimate ? { opacity: 0, x: -8 } : undefined}
          animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
          transition={{ ...springConfig, delay: 0.15 }}
          className="text-2xl font-display font-bold text-text-primary"
        >
          Your Orders
        </motion.h1>
      </div>
      <motion.div
        initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
        animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
        transition={{ ...springConfig, delay: 0.2 }}
      >
        <Button asChild variant="primary">
          <Link href="/menu">Order Again</Link>
        </Button>
      </motion.div>
    </motion.div>
  );
}
