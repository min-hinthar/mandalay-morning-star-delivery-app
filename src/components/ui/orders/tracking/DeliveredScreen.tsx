/**
 * DeliveredScreen - Celebration overlay for delivered orders
 *
 * Shows animated checkmark, confetti, star rating, and order summary.
 * Skips celebration animation when revisiting (rating already exists).
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { StarRating } from "./StarRating";
import { useDriverRating } from "@/lib/hooks/useDriverRating";
import { cn } from "@/lib/utils/cn";

interface DeliveredScreenProps {
  orderId: string;
  initialRating: number | null;
  deliveryPhotoUrl?: string | null;
  className?: string;
}

// Confetti colors using brand palette
const CONFETTI_COLORS = [
  "bg-saffron-400",
  "bg-saffron-500",
  "bg-jade-400",
  "bg-jade-500",
  "bg-primary",
  "bg-secondary",
  "bg-ruby-400",
  "bg-info",
];

function ConfettiDots() {
  // Generate confetti dots with randomized positions and timing (stable across renders)
  const dots = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 1.5}s`,
        duration: `${1.5 + Math.random() * 1.5}s`,
        size: Math.random() > 0.5 ? "h-2 w-2" : "h-3 w-3",
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((dot) => (
        <span
          key={dot.id}
          className={cn(
            "absolute rounded-full opacity-0",
            dot.size,
            dot.color,
            "animate-confetti-fall"
          )}
          style={{
            left: dot.left,
            animationDelay: dot.delay,
            animationDuration: dot.duration,
          }}
        />
      ))}
    </div>
  );
}

function AnimatedCheckmark() {
  return (
    <svg
      viewBox="0 0 80 80"
      className="h-20 w-20"
      aria-hidden="true"
    >
      {/* Circle */}
      <m.circle
        cx="40"
        cy="40"
        r="36"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-jade-500"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      {/* Checkmark */}
      <m.path
        d="M24 42 L34 52 L56 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-jade-500"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
      />
    </svg>
  );
}

export function DeliveredScreen({
  orderId,
  initialRating,
  deliveryPhotoUrl,
  className,
}: DeliveredScreenProps) {
  const { rating, submitRating, isSubmitting } = useDriverRating(
    orderId,
    initialRating ?? undefined
  );

  // Skip celebration if rating already exists (post-delivery revisit)
  const isRevisit = initialRating !== null && initialRating > 0;
  const [showCelebration, setShowCelebration] = useState(!isRevisit);

  // Auto-dismiss confetti after animation completes
  useEffect(() => {
    if (!showCelebration) return;
    const timer = setTimeout(() => setShowCelebration(false), 3500);
    return () => clearTimeout(timer);
  }, [showCelebration]);

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative rounded-xl bg-surface-primary p-6 shadow-warm-sm",
        className
      )}
    >
      {/* Confetti overlay (celebration only) */}
      <AnimatePresence>
        {showCelebration && (
          <m.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ConfettiDots />
          </m.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
        {/* Animated checkmark */}
        {showCelebration ? (
          <AnimatedCheckmark />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center">
            <svg viewBox="0 0 80 80" className="h-20 w-20" aria-hidden="true">
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-jade-500"
              />
              <path
                d="M24 42 L34 52 L56 30"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-jade-500"
              />
            </svg>
          </div>
        )}

        {/* Heading */}
        <m.h2
          initial={showCelebration ? { scale: 0.5, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            delay: showCelebration ? 0.7 : 0,
          }}
          className="text-xl font-bold text-charcoal"
        >
          Delivered!
        </m.h2>

        <p className="text-sm text-charcoal-500">
          Your order has been delivered. Enjoy your meal!
        </p>

        {/* Star rating */}
        <div className="space-y-2 py-2">
          <p className="text-sm font-medium text-charcoal-600">
            How was your delivery?
          </p>
          <StarRating
            value={rating}
            onChange={submitRating}
            disabled={isSubmitting}
            size="lg"
          />
        </div>

        {/* Delivery photo */}
        {deliveryPhotoUrl && (
          <div className="w-full pt-2">
            <p className="text-sm font-medium text-charcoal-600 mb-2">
              Delivery Photo
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={deliveryPhotoUrl}
              alt="Delivery confirmation"
              className="w-full rounded-lg object-cover"
              style={{ maxHeight: 200 }}
            />
          </div>
        )}

        {/* View order details link */}
        <Link
          href={`/orders/${orderId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-jade-600 hover:text-jade-700 transition-colors pt-2"
        >
          <ExternalLink className="h-4 w-4" />
          View Order Details
        </Link>
      </div>
    </m.div>
  );
}
