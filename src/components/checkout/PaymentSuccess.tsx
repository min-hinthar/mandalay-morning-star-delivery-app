"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { spring, staggerContainer } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { Button } from "@/components/ui/button";
import { PriceTicker } from "@/components/ui/PriceTicker";

// ============================================
// TYPES
// ============================================

export interface PaymentSuccessProps {
  /** Order ID */
  orderId: string;
  /** Order total in cents */
  totalCents: number;
  /** Estimated delivery time range */
  deliveryTime: string;
  /** Delivery address */
  deliveryAddress: string;
  /** Number of items */
  itemCount: number;
  /** Callback when view order is clicked */
  onViewOrder?: () => void;
  /** Additional className */
  className?: string;
}

// ============================================
// CONFETTI  (Full screen burst)
// ============================================

interface ConfettiParticleProps {
  index: number;
  color: string;
  delay: number;
}

const CONFETTI_COLORS = [
  "#A41034", // Deep Red
  "#EBCD00", // Golden Yellow
  "#52A52E", // Green
  "#FF6B6B", // Coral
  "#4ECDC4", // Teal
  "#FFE66D", // Bright Yellow
  "#FF9F43", // Orange
  "#A29BFE", // Purple
];

function ConfettiParticle({ color, delay }: Omit<ConfettiParticleProps, "index">) {
  const startX = 50 + (Math.random() - 0.5) * 20;
  const endX = startX + (Math.random() - 0.5) * 100;
  const endY = 100 + Math.random() * 50;
  const rotation = Math.random() * 1080 - 540;
  const size = 8 + Math.random() * 8;

  const shape = Math.random() > 0.5 ? "circle" : "square";

  return (
    <motion.div
      className="fixed pointer-events-none"
      style={{
        left: `${startX}%`,
        top: "40%",
        width: size,
        height: shape === "circle" ? size : size * 0.6,
        backgroundColor: color,
        borderRadius: shape === "circle" ? "50%" : "2px",
      }}
      initial={{
        y: 0,
        x: 0,
        scale: 0,
        rotate: 0,
        opacity: 1,
      }}
      animate={{
        y: `${endY}vh`,
        x: `${endX - startX}vw`,
        scale: [0, 1.5, 1, 0.5, 0],
        rotate: rotation,
        opacity: [1, 1, 1, 0.8, 0],
      }}
      transition={{
        duration: 2 + Math.random(),
        delay: delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    />
  );
}

// ============================================
// ANIMATED CHECKMARK
// ============================================

function AnimatedCheckmark() {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <motion.div
      initial={shouldAnimate ? { scale: 0 } : undefined}
      animate={shouldAnimate ? { scale: 1 } : undefined}
      transition={getSpring(spring.ultraBouncy)}
      className="relative"
    >
      {/* Outer glow */}
      <motion.div
        animate={shouldAnimate ? {
          scale: [1, 1.3, 1],
          opacity: [0.5, 0.2, 0.5],
        } : undefined}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
        className="absolute inset-0 rounded-full bg-green/30"
      />

      {/* Circle background */}
      <motion.div
        initial={shouldAnimate ? { scale: 0 } : undefined}
        animate={shouldAnimate ? { scale: 1 } : undefined}
        transition={{ ...getSpring(spring.ultraBouncy), delay: 0.2 }}
        className={cn(
          "relative w-24 h-24 rounded-full",
          "bg-gradient-to-br from-green to-accent-green-hover",
          "flex items-center justify-center",
          "shadow-xl shadow-green/30"
        )}
      >
        {/* Checkmark SVG */}
        <svg
          className="w-12 h-12 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M5 12l5 5L20 7"
            initial={shouldAnimate ? { pathLength: 0 } : undefined}
            animate={shouldAnimate ? { pathLength: 1 } : undefined}
            transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// ORDER TIMELINE
// ============================================

interface TimelineStepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isActive: boolean;
  index: number;
}

function TimelineStep({ icon, title, description, isActive, index }: TimelineStepProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, x: -20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
      transition={{ ...getSpring(spring.default), delay: 0.8 + index * 0.15 }}
      className="flex items-start gap-3"
    >
      <motion.div
        animate={isActive && shouldAnimate ? {
          scale: [1, 1.2, 1],
        } : undefined}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 1,
        }}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          isActive
            ? "bg-primary text-white"
            : "bg-surface-tertiary text-text-muted"
        )}
      >
        {icon}
      </motion.div>
      <div>
        <p className="font-semibold text-text-primary">{title}</p>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

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

  // Generate confetti particles
  const confettiParticles = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: i * 0.02,
    }));
  }, []);

  // Hide confetti after animation
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Haptic feedback on mount
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([50, 50, 100]);
    }
  }, []);

  // Copy order ID
  const handleCopyOrderId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy");
    }
  }, [orderId]);

  return (
    <div className={cn("relative min-h-[80vh] flex flex-col", className)}>
      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && shouldAnimate && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {confettiParticles.map((particle) => (
              <ConfettiParticle
                key={particle.id}
                color={particle.color}
                delay={particle.delay}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={getSpring(spring.default)}
        className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center"
      >
        {/* Checkmark */}
        <AnimatedCheckmark />

        {/* Title */}
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-primary">
            Order Confirmed!
          </h1>
          <motion.div
            initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
            animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 mt-2"
          >
            <PartyPopper className="w-5 h-5 text-secondary" />
            <p className="text-text-secondary">
              Thank you for your order!
            </p>
          </motion.div>
        </motion.div>

        {/* Order ID */}
        <motion.div
          initial={shouldAnimate ? { opacity: 0 } : undefined}
          animate={shouldAnimate ? { opacity: 1 } : undefined}
          transition={{ delay: 0.6 }}
          className="mt-4 flex items-center gap-2"
        >
          <span className="text-sm text-text-muted">Order ID:</span>
          <code className="px-3 py-1 rounded-lg bg-surface-secondary font-mono text-sm text-text-primary">
            {orderId}
          </code>
          <motion.button
            type="button"
            onClick={handleCopyOrderId}
            whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
            className="p-1.5 rounded-md hover:bg-surface-tertiary transition-colors"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Check className="w-4 h-4 text-green" />
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Copy className="w-4 h-4 text-text-muted" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>

        {/* Order summary card */}
        <motion.div
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
          {/* Header */}
          <div className="p-4 bg-surface-secondary border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">
                {itemCount} item{itemCount !== 1 ? "s" : ""}
              </span>
              <PriceTicker
                value={totalCents}
                className="text-xl font-bold text-primary"
              />
            </div>
          </div>

          {/* Details */}
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
        </motion.div>

        {/* Timeline */}
        <motion.div
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
        </motion.div>

        {/* Action buttons */}
        <motion.div
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

          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            asChild
          >
            <Link href="/menu">
              Order Again
            </Link>
          </Button>
        </motion.div>

        {/* Share button */}
        <motion.button
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
        </motion.button>
      </motion.div>
    </div>
  );
}

export default PaymentSuccess;
