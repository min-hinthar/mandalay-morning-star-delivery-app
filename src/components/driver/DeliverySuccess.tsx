"use client";

/**
 *  Delivery Success - Motion-First Celebration Design
 *
 * Sprint 7: Tracking & Driver
 * Features: Confetti burst, animated checkmark, stats reveal, badge unlock
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Clock,
  MapPin,
  Trophy,
  Flame,
  ChevronRight,
  Camera,
  Award,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { Button } from "@/components/ui/button";

// ============================================
// TYPES
// ============================================

export interface DeliverySuccessProps {
  /** Stop details */
  stop: {
    id: string;
    customerName: string;
    address: string;
    deliveryPhotoUrl?: string | null;
    deliveryNotes?: string | null;
  };
  /** Current stop number */
  currentStop: number;
  /** Total stops */
  totalStops: number;
  /** Time taken for this delivery in minutes */
  deliveryTimeMinutes: number;
  /** New badge unlocked */
  unlockedBadge?: {
    id: string;
    name: string;
    icon: string;
    description: string;
  };
  /** Current streak */
  currentStreak?: number;
  /** Callback to continue to next stop */
  onContinue?: () => void;
  /** Callback when rating is submitted */
  onRateDelivery?: (rating: number) => void;
  /** Additional className */
  className?: string;
}

// ============================================
// CONFETTI PARTICLES
// ============================================

const CONFETTI_COLORS = [
  "#A41034", // Deep Red
  "#EBCD00", // Golden Yellow
  "#52A52E", // Green
  "#FF6B6B",
  "#4ECDC4",
  "#FFE66D",
  "#A29BFE",
  "#FF9F43",
];

interface ConfettiParticleProps {
  index: number;
  color: string;
  delay: number;
}

function ConfettiParticle({ color, delay }: Omit<ConfettiParticleProps, "index">) {
  const startX = 50 + (Math.random() - 0.5) * 30;
  const endX = startX + (Math.random() - 0.5) * 80;
  const endY = 120 + Math.random() * 40;
  const rotation = Math.random() * 1080 - 540;
  const size = 6 + Math.random() * 6;
  const shape = Math.random() > 0.5 ? "circle" : "square";

  return (
    <motion.div
      className="fixed pointer-events-none"
      style={{
        left: `${startX}%`,
        top: "30%",
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
        delay,
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
      {/* Glow rings */}
      <motion.div
        animate={shouldAnimate ? { scale: [1, 1.4, 1], opacity: [0.5, 0.1, 0.5] } : undefined}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 rounded-full bg-green/30"
        style={{ width: 120, height: 120, left: -10, top: -10 }}
      />

      {/* Circle */}
      <motion.div
        initial={shouldAnimate ? { scale: 0 } : undefined}
        animate={shouldAnimate ? { scale: 1 } : undefined}
        transition={{ ...getSpring(spring.ultraBouncy), delay: 0.1 }}
        className={cn(
          "relative w-24 h-24 rounded-full",
          "bg-gradient-to-br from-green to-accent-green-hover",
          "flex items-center justify-center",
          "shadow-xl shadow-green/40"
        )}
      >
        {/* Checkmark SVG */}
        <svg
          className="w-12 h-12 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M5 12l5 5L20 7"
            initial={shouldAnimate ? { pathLength: 0 } : undefined}
            animate={shouldAnimate ? { pathLength: 1 } : undefined}
            transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
          />
        </svg>
      </motion.div>

      {/* Sparkle particles */}
      {shouldAnimate && (
        <>
          {[...Array(6)].map((_, i) => {
            const angle = (i / 6) * Math.PI * 2;
            const distance = 60;
            return (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  x: Math.cos(angle) * distance,
                  y: Math.sin(angle) * distance,
                }}
                transition={{ duration: 0.6, delay: 0.5 + i * 0.05 }}
                className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-secondary"
                style={{ marginLeft: -4, marginTop: -4 }}
              />
            );
          })}
        </>
      )}
    </motion.div>
  );
}

// ============================================
// BADGE UNLOCK
// ============================================

interface BadgeUnlockProps {
  badge: NonNullable<DeliverySuccessProps["unlockedBadge"]>;
}

function BadgeUnlock({ badge }: BadgeUnlockProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, scale: 0.8, y: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, scale: 1, y: 0 } : undefined}
      transition={{ ...getSpring(spring.ultraBouncy), delay: 0.8 }}
      className={cn(
        "rounded-2xl overflow-hidden",
        "bg-gradient-to-r from-secondary/20 via-primary/20 to-secondary/20",
        "border border-secondary/30 p-4"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Badge icon */}
        <motion.div
          animate={shouldAnimate ? { rotate: [0, -10, 10, -10, 0] } : undefined}
          transition={{ duration: 0.5, delay: 1 }}
          className={cn(
            "w-16 h-16 rounded-full",
            "bg-gradient-to-br from-secondary to-primary",
            "flex items-center justify-center text-3xl",
            "shadow-lg shadow-secondary/30"
          )}
        >
          {badge.icon}
        </motion.div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-secondary" />
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
              Badge Unlocked!
            </span>
          </div>
          <p className="font-bold text-text-primary">{badge.name}</p>
          <p className="text-sm text-text-muted">{badge.description}</p>
        </div>

        <Sparkles className="w-6 h-6 text-secondary" />
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function DeliverySuccess({
  stop,
  currentStop,
  totalStops,
  deliveryTimeMinutes,
  unlockedBadge,
  currentStreak,
  onContinue,
  onRateDelivery,
  className,
}: DeliverySuccessProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [showConfetti, setShowConfetti] = useState(true);
  const [rating, setRating] = useState<number>(0);

  // Generate confetti particles
  const confettiParticles = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
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

  // Haptic feedback
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([50, 30, 100, 30, 50]);
    }
  }, []);

  // Handle rating
  const handleRating = useCallback(
    (stars: number) => {
      setRating(stars);
      onRateDelivery?.(stars);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(15);
      }
    },
    [onRateDelivery]
  );

  const isLastStop = currentStop === totalStops;

  return (
    <div className={cn("relative min-h-[80vh] flex flex-col", className)}>
      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && shouldAnimate && (
          <div className="fixed inset-0 pointer-events-none z-max">
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
        className="flex-1 flex flex-col items-center justify-center px-4 py-8 text-center"
      >
        {/* Checkmark */}
        <AnimatedCheckmark />

        {/* Title */}
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Delivery Complete!
          </h1>
          <motion.div
            initial={shouldAnimate ? { opacity: 0 } : undefined}
            animate={shouldAnimate ? { opacity: 1 } : undefined}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-2 mt-2"
          >
            <PartyPopper className="w-5 h-5 text-secondary" />
            <p className="text-text-secondary">Great job!</p>
          </motion.div>
        </motion.div>

        {/* Delivery details card */}
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.5 }}
          className={cn(
            "mt-6 w-full max-w-md",
            "bg-surface-primary rounded-2xl",
            "border border-border shadow-card",
            "overflow-hidden"
          )}
        >
          {/* Photo preview */}
          {stop.deliveryPhotoUrl && (
            <div className="relative h-32 bg-surface-tertiary">
              {/* eslint-disable-next-line @next/next/no-img-element -- Dynamic user-uploaded photo */}
              <img
                src={stop.deliveryPhotoUrl}
                alt="Delivery photo"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm flex items-center gap-1">
                <Camera className="w-3 h-3 text-white" />
                <span className="text-xs text-white">Photo saved</span>
              </div>
            </div>
          )}

          {/* Details */}
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="font-medium text-text-primary">{stop.customerName}</p>
                <p className="text-sm text-text-muted">{stop.address}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1.5 text-text-muted">
                <Clock className="w-4 h-4" />
                <span>{deliveryTimeMinutes} min</span>
              </div>
              <div className="flex items-center gap-1.5 text-text-muted">
                <Trophy className="w-4 h-4 text-secondary" />
                <span>
                  {currentStop}/{totalStops} stops
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Streak display */}
        {currentStreak && currentStreak > 1 && (
          <motion.div
            initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
            animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
            transition={{ delay: 0.6 }}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20"
          >
            <motion.div
              animate={shouldAnimate ? { scale: [1, 1.2, 1] } : undefined}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
            >
              <Flame className="w-5 h-5 text-orange-500" />
            </motion.div>
            <span className="font-semibold text-orange-600">
              {currentStreak} deliveries in a row!
            </span>
          </motion.div>
        )}

        {/* Badge unlock */}
        {unlockedBadge && (
          <div className="mt-4 w-full max-w-md">
            <BadgeUnlock badge={unlockedBadge} />
          </div>
        )}

        {/* Rating section */}
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.7 }}
          className="mt-6 w-full max-w-md"
        >
          <p className="text-sm text-text-muted mb-3">
            How was this delivery?
          </p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                type="button"
                onClick={() => handleRating(star)}
                whileHover={shouldAnimate ? { scale: 1.2 } : undefined}
                whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
                className="p-1"
              >
                <Star
                  className={cn(
                    "w-8 h-8 transition-colors",
                    star <= rating
                      ? "text-secondary fill-secondary"
                      : "text-border"
                  )}
                />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.9 }}
          className="mt-8 w-full max-w-md"
        >
          <Button
            variant="primary"
            size="lg"
            className="w-full gap-2"
            onClick={onContinue}
          >
            {isLastStop ? (
              <>
                <Trophy className="w-5 h-5" />
                Complete Route
              </>
            ) : (
              <>
                Next Delivery
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </Button>

          {isLastStop && (
            <p className="mt-3 text-sm text-text-muted">
              🎉 You&apos;ve completed all {totalStops} deliveries!
            </p>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default DeliverySuccess;
