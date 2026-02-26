"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  CheckCircle,
  PartyPopper,
  MapPin,
  Clock,
  ChefHat,
  Truck,
  Home,
  Copy,
  Check,
  Share2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { logger } from "@/lib/utils/logger";
import { spring, staggerContainer } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { Button } from "@/components/ui/button";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { ConfettiParticle, CONFETTI_COLORS } from "./ConfettiParticle";
import { AnimatedCheckmark } from "./AnimatedCheckmark";
import { TimelineStep } from "./TimelineStep";

export interface PaymentSuccessProps {
  orderId: string;
  totalCents: number;
  deliveryTime: string;
  deliveryAddress: string;
  itemCount: number;
  onViewOrder?: () => void;
  className?: string;
}

export function PaymentSuccess({
  orderId,
  totalCents,
  deliveryTime,
  deliveryAddress,
  itemCount,
  onViewOrder,
  className,
}: PaymentSuccessProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [showConfetti, setShowConfetti] = useState(true);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const confettiParticles = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: i * 0.02,
    }));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([50, 50, 100]);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopyOrderId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      logger.error("Failed to copy order ID to clipboard", { api: "payment-success" });
    }
  }, [orderId]);

  return (
    <div className={cn("relative min-h-[80vh] flex flex-col", className)}>
      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && shouldAnimate && (
          <m.div
            key="confetti-container"
            className="fixed inset-0 pointer-events-none z-[100]"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {confettiParticles.map((particle) => (
              <ConfettiParticle key={particle.id} color={particle.color} delay={particle.delay} />
            ))}
          </m.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <m.div
        initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={getSpring(spring.default)}
        className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center"
      >
        <AnimatedCheckmark />

        {/* Title */}
        <m.div
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-primary">
            Order Confirmed!
          </h1>
          <m.div
            initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
            animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 mt-2"
          >
            <PartyPopper className="w-5 h-5 text-secondary" />
            <p className="text-text-secondary">Thank you for your order!</p>
          </m.div>
        </m.div>

        {/* Order ID */}
        <m.div
          initial={shouldAnimate ? { opacity: 0 } : undefined}
          animate={shouldAnimate ? { opacity: 1 } : undefined}
          transition={{ delay: 0.6 }}
          className="mt-4 flex items-center gap-2"
        >
          <span className="text-sm text-text-muted">Order ID:</span>
          <code className="px-3 py-1 rounded-lg bg-surface-secondary font-mono text-sm text-text-primary">
            {orderId}
          </code>
          <m.button
            type="button"
            onClick={handleCopyOrderId}
            whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
            className="p-1.5 rounded-md hover:bg-surface-tertiary transition-colors"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <m.div
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Check className="w-4 h-4 text-green" />
                </m.div>
              ) : (
                <m.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Copy className="w-4 h-4 text-text-muted" />
                </m.div>
              )}
            </AnimatePresence>
          </m.button>
        </m.div>

        {/* Order summary card */}
        <m.div
          initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.7 }}
          className={cn(
            "mt-8 w-full max-w-md",
            "bg-surface-primary rounded-2xl",
            "border border-border",
            "shadow-card",
            "overflow-hidden"
          )}
        >
          <div className="p-4 bg-surface-secondary border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">
                {itemCount} item{itemCount !== 1 ? "s" : ""}
              </span>
              <PriceTicker value={totalCents} className="text-xl font-bold text-primary" />
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm text-text-muted">Delivery to</p>
                <p className="font-medium text-text-primary">{deliveryAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm text-text-muted">Estimated delivery</p>
                <p className="font-medium text-text-primary">{deliveryTime}</p>
              </div>
            </div>
          </div>
        </m.div>

        {/* Timeline */}
        <m.div
          variants={shouldAnimate ? staggerContainer(0.15, 0.8) : undefined}
          initial="hidden"
          animate="visible"
          className="mt-8 w-full max-w-md space-y-4 text-left"
        >
          <TimelineStep
            icon={<CheckCircle className="w-5 h-5" />}
            title="Order Placed"
            description="We've received your order"
            isActive={true}
            index={0}
          />
          <TimelineStep
            icon={<ChefHat className="w-5 h-5" />}
            title="Preparing"
            description="Our chefs are cooking your food"
            isActive={false}
            index={1}
          />
          <TimelineStep
            icon={<Truck className="w-5 h-5" />}
            title="On the Way"
            description="Your order is being delivered"
            isActive={false}
            index={2}
          />
          <TimelineStep
            icon={<Home className="w-5 h-5" />}
            title="Delivered"
            description="Enjoy your meal!"
            isActive={false}
            index={3}
          />
        </m.div>

        {/* Action buttons */}
        <m.div
          initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 1.3 }}
          className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-md"
        >
          <Button
            variant="primary"
            size="lg"
            className="flex-1 gap-2"
            onClick={onViewOrder}
            asChild
          >
            <Link href={`/orders/${orderId}`}>
              Track Order
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="flex-1" asChild>
            <Link href="/menu">Order Again</Link>
          </Button>
        </m.div>

        {/* Share button */}
        <m.button
          type="button"
          initial={shouldAnimate ? { opacity: 0 } : undefined}
          animate={shouldAnimate ? { opacity: 1 } : undefined}
          transition={{ delay: 1.5 }}
          className={cn(
            "mt-4 flex items-center gap-2",
            "text-sm text-text-muted hover:text-primary",
            "transition-colors"
          )}
        >
          <Share2 className="w-4 h-4" />
          Share with friends
        </m.button>
      </m.div>
    </div>
  );
}

export default PaymentSuccess;
