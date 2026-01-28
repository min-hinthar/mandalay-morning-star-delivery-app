"use client";

/**
 * V7 Welcome Animation - Post-Auth Celebration
 *
 * Sprint 9: Auth & Onboarding
 * Features: Full-screen celebration, confetti, personalized greeting,
 * mascot animation, auto-redirect
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PartyPopper,
  Sparkles,
  Heart,
  Star,
  ChefHat,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  spring,
  hover,
} from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export interface WelcomeAnimationProps {
  /** User's name for personalized greeting */
  userName?: string;
  /** Called when animation completes or user clicks continue */
  onContinue?: () => void;
  /** Auto-dismiss after milliseconds (default: 4000) */
  autoDismissMs?: number;
  /** Additional className */
  className?: string;
}

// ============================================
// CONFETTI SYSTEM
// ============================================

interface ConfettiParticle {
  id: number;
  x: number;
  color: string;
  rotation: number;
  scale: number;
  delay: number;
  shape: "circle" | "square" | "star";
}

const CONFETTI_COLORS = [
  "#A41034", // V6 Primary Red
  "#EBCD00", // V6 Secondary Yellow
  "#52A52E", // V6 Green
  "#FF6B6B", // Coral
  "#4ECDC4", // Teal
  "#FFE66D", // Bright Yellow
  "#FF8E53", // Orange
  "#9B5DE5", // Purple
];

function WelcomeConfettiV7() {
  const { shouldAnimate } = useAnimationPreference();

  const particles: ConfettiParticle[] = React.useMemo(
    () =>
      Array.from({ length: 80 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * 720 - 360,
        scale: 0.4 + Math.random() * 0.6,
        delay: Math.random() * 0.8,
        shape: (["circle", "square", "star"] as const)[Math.floor(Math.random() * 3)],
      })),
    []
  );

  if (!shouldAnimate) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            x: `${particle.x}vw`,
            y: "-5vh",
            rotate: 0,
            scale: 0,
            opacity: 1,
          }}
          animate={{
            y: "110vh",
            rotate: particle.rotation,
            scale: particle.scale,
            opacity: [1, 1, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 1.5,
            delay: particle.delay,
            ease: [0.2, 0.8, 0.2, 1],
          }}
          className="absolute"
          style={{ left: 0 }}
        >
          {particle.shape === "circle" && (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: particle.color }}
            />
          )}
          {particle.shape === "square" && (
            <div
              className="w-3 h-3 rounded-sm"
              style={{
                backgroundColor: particle.color,
                transform: `rotate(${Math.random() * 45}deg)`,
              }}
            />
          )}
          {particle.shape === "star" && (
            <Star
              className="w-4 h-4"
              style={{ color: particle.color, fill: particle.color }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ============================================
// MASCOT CELEBRATION
// ============================================

function MascotCelebrationV7() {
  const { shouldAnimate } = useAnimationPreference();

  return (
    <motion.div
      initial={shouldAnimate ? { scale: 0, rotate: -180 } : undefined}
      animate={shouldAnimate ? { scale: 1, rotate: 0 } : undefined}
      transition={spring.ultraBouncy}
      className="relative"
    >
      {/* Glow background */}
      <motion.div
        animate={
          shouldAnimate
            ? {
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }
            : undefined
        }
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 rounded-full blur-2xl"
        style={{ background: "linear-gradient(to bottom right, var(--color-secondary-light), var(--color-primary-light))" }}
      />

      {/* Main mascot container */}
      <motion.div
        animate={
          shouldAnimate
            ? { y: [0, -10, 0], rotate: [0, 3, -3, 0] }
            : undefined
        }
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        className={cn(
          "relative w-32 h-32 rounded-full",
          "bg-gradient-primary",
          "flex items-center justify-center",
          "shadow-2xl shadow-primary/40"
        )}
      >
        <ChefHat className="w-16 h-16 text-text-inverse" />

        {/* Celebration emoji */}
        <motion.div
          initial={shouldAnimate ? { scale: 0 } : undefined}
          animate={shouldAnimate ? { scale: 1 } : undefined}
          transition={{ ...spring.ultraBouncy, delay: 0.5 }}
          className={cn(
            "absolute -top-2 -right-2",
            "w-12 h-12 rounded-full",
            "bg-secondary",
            "flex items-center justify-center",
            "shadow-lg shadow-secondary/40"
          )}
        >
          <PartyPopper className="w-6 h-6 text-text-inverse" />
        </motion.div>
      </motion.div>

      {/* Floating hearts */}
      {shouldAnimate && (
        <>
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0.5],
                y: -60 - i * 20,
                x: (Math.random() - 0.5) * 60,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeOut",
              }}
              className="absolute top-1/2 left-1/2"
            >
              <Heart className="w-4 h-4 text-primary fill-primary" />
            </motion.div>
          ))}
        </>
      )}
    </motion.div>
  );
}

// ============================================
// GREETING TEXT
// ============================================

interface GreetingTextV7Props {
  userName?: string;
}

function GreetingTextV7({ userName }: GreetingTextV7Props) {
  const { shouldAnimate } = useAnimationPreference();

  const greeting = userName ? `Welcome, ${userName}!` : "Welcome!";
  const characters = greeting.split("");

  return (
    <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
      {shouldAnimate ? (
        characters.map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 20, rotate: -10 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{
              ...spring.default,
              delay: 0.3 + i * 0.03,
            }}
            className="inline-block"
            style={{ whiteSpace: char === " " ? "pre" : undefined }}
          >
            {char}
          </motion.span>
        ))
      ) : (
        greeting
      )}
    </h1>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function WelcomeAnimation({
  userName,
  onContinue,
  autoDismissMs = 4000,
  className,
}: WelcomeAnimationProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [showContent, setShowContent] = useState(false);

  // Haptic celebration
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([50, 30, 100, 30, 150, 30, 100]);
    }
  }, []);

  // Show content after brief delay
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    if (autoDismissMs && onContinue) {
      const timer = setTimeout(() => {
        onContinue();
      }, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [autoDismissMs, onContinue]);

  // Handle continue click
  const handleContinue = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    onContinue?.();
  }, [onContinue]);

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0 } : undefined}
      animate={shouldAnimate ? { opacity: 1 } : undefined}
      exit={shouldAnimate ? { opacity: 0 } : undefined}
      className={cn(
        "fixed inset-0 z-modal",
        "flex flex-col items-center justify-center",
        "bg-gradient-surface",
        className
      )}
    >
      {/* Confetti */}
      <WelcomeConfettiV7 />

      {/* Content */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
            animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
            transition={getSpring(spring.default)}
            className="relative z-10 flex flex-col items-center text-center px-6"
          >
            {/* Mascot */}
            <div className="mb-8">
              <MascotCelebrationV7 />
            </div>

            {/* Greeting */}
            <div className="mb-4">
              <GreetingTextV7 userName={userName} />
            </div>

            {/* Subtitle */}
            <motion.p
              initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.8 }}
              className="text-text-secondary text-lg mb-8 max-w-sm"
            >
              We&apos;re so glad you&apos;re here. Let&apos;s get you something delicious.
            </motion.p>

            {/* Sparkle icons */}
            <motion.div
              initial={shouldAnimate ? { opacity: 0 } : undefined}
              animate={shouldAnimate ? { opacity: 1 } : undefined}
              transition={{ delay: 1 }}
              className="flex items-center gap-3 mb-8"
            >
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={
                    shouldAnimate
                      ? {
                          scale: [1, 1.2, 1],
                          rotate: [0, 10, -10, 0],
                        }
                      : undefined
                  }
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                >
                  <Sparkles className="w-5 h-5 text-secondary" />
                </motion.div>
              ))}
            </motion.div>

            {/* Continue button */}
            <motion.button
              initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
              whileHover={shouldAnimate ? hover.bounce.whileHover : undefined}
              whileTap={shouldAnimate ? hover.bounce.whileTap : undefined}
              transition={{ delay: 1.2, ...spring.ultraBouncy }}
              onClick={handleContinue}
              className={cn(
                "inline-flex items-center gap-2",
                "px-8 py-4 rounded-2xl",
                "bg-gradient-primary",
                "text-text-inverse font-semibold text-lg",
                "shadow-xl shadow-primary/30",
                "hover:shadow-2xl hover:shadow-primary/40",
                "transition-shadow"
              )}
            >
              Start Exploring
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            {/* Auto-dismiss indicator */}
            {autoDismissMs && (
              <motion.div
                initial={shouldAnimate ? { opacity: 0 } : undefined}
                animate={shouldAnimate ? { opacity: 0.4 } : undefined}
                transition={{ delay: 1.5 }}
                className="mt-6"
              >
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{
                    duration: autoDismissMs / 1000,
                    ease: "linear",
                  }}
                  style={{ transformOrigin: "left" }}
                  className="w-32 h-1 rounded-full bg-primary/30"
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background decorations */}
      {shouldAnimate && (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 -left-20 w-40 h-40 rounded-full border border-primary/10"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-1/4 -right-32 w-64 h-64 rounded-full border border-secondary/10"
          />
          <div className="absolute top-20 right-20 w-20 h-20 rounded-full bg-secondary/5" />
          <div className="absolute bottom-32 left-16 w-16 h-16 rounded-full bg-primary/5" />
        </>
      )}
    </motion.div>
  );
}

export default WelcomeAnimation;
