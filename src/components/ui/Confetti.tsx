/**
 * V3 Sprint 6: Confetti Component
 *
 * Celebratory confetti animation for order confirmation and success states.
 * 20-30 particles with random colors, respects reduced motion.
 */

"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

// ============================================
// TYPES
// ============================================

interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
  shape: "circle" | "square" | "triangle";
}

export interface ConfettiProps {
  /** Whether confetti is active */
  isActive?: boolean;
  /** Number of particles (default 25) */
  particleCount?: number;
  /** Duration in seconds (default 2) */
  duration?: number;
  /** Colors for particles */
  colors?: string[];
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Additional class names */
  className?: string;
}

// Default celebratory colors
const DEFAULT_COLORS = [
  "var(--color-cta)", // Gold/Saffron
  "var(--color-primary)", // Red
  "var(--color-jade)", // Green
  "#FF6B6B", // Coral
  "#4ECDC4", // Teal
  "#FFE66D", // Yellow
  "#95E1D3", // Mint
];

// ============================================
// CONFETTI COMPONENT
// ============================================

export function Confetti({
  isActive = false,
  particleCount = 25,
  duration = 2,
  colors = DEFAULT_COLORS,
  onComplete,
  className,
}: ConfettiProps) {
  const prefersReducedMotion = useReducedMotion();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Generate particles when activated
  useEffect(() => {
    if (isActive && !prefersReducedMotion) {
      const newParticles: Particle[] = Array.from(
        { length: particleCount },
        (_, i) => ({
          id: i,
          x: Math.random() * 100, // Random horizontal position (%)
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 6, // 6-14px
          rotation: Math.random() * 720 - 360, // -360 to 360
          delay: Math.random() * 0.3, // 0-0.3s delay
          shape: ["circle", "square", "triangle"][
            Math.floor(Math.random() * 3)
          ] as Particle["shape"],
        })
      );

      setParticles(newParticles);
      setIsAnimating(true);

      // Cleanup after animation
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setParticles([]);
        onComplete?.();
      }, duration * 1000 + 500); // Extra buffer for exit animation

      return () => clearTimeout(timer);
    }
  }, [isActive, particleCount, colors, duration, onComplete, prefersReducedMotion]);

  // Skip rendering if reduced motion
  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-[100] overflow-hidden",
        className
      )}
      aria-hidden="true"
    >
      <AnimatePresence>
        {isAnimating &&
          particles.map((particle) => (
            <ConfettiParticle
              key={particle.id}
              particle={particle}
              duration={duration}
            />
          ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// CONFETTI PARTICLE
// ============================================

interface ConfettiParticleProps {
  particle: Particle;
  duration: number;
}

function ConfettiParticle({ particle, duration }: ConfettiParticleProps) {
  const startY = -20; // Start above viewport
  const endY = 120; // Fall below viewport

  // Random horizontal drift
  const drift = useMemo(() => (Math.random() - 0.5) * 30, []);

  return (
    <motion.div
      initial={{
        x: `${particle.x}vw`,
        y: `${startY}vh`,
        rotate: 0,
        opacity: 1,
        scale: 0,
      }}
      animate={{
        x: `calc(${particle.x}vw + ${drift}px)`,
        y: `${endY}vh`,
        rotate: particle.rotation,
        opacity: [1, 1, 1, 0],
        scale: [0, 1, 1, 0.5],
      }}
      transition={{
        duration: duration,
        delay: particle.delay,
        ease: [0.25, 0.1, 0.25, 1],
        opacity: { times: [0, 0.1, 0.8, 1] },
        scale: { times: [0, 0.1, 0.9, 1] },
      }}
      className="absolute"
      style={{
        width: particle.size,
        height: particle.size,
      }}
    >
      <ParticleShape shape={particle.shape} color={particle.color} />
    </motion.div>
  );
}

// ============================================
// PARTICLE SHAPES
// ============================================

interface ParticleShapeProps {
  shape: Particle["shape"];
  color: string;
}

function ParticleShape({ shape, color }: ParticleShapeProps) {
  switch (shape) {
    case "circle":
      return (
        <div
          className="h-full w-full rounded-full"
          style={{ backgroundColor: color }}
        />
      );
    case "square":
      return (
        <div
          className="h-full w-full rounded-sm"
          style={{ backgroundColor: color }}
        />
      );
    case "triangle":
      return (
        <div
          className="h-0 w-0"
          style={{
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderBottom: `10px solid ${color}`,
          }}
        />
      );
    default:
      return null;
  }
}

// ============================================
// CONFETTI BURST (Single trigger)
// ============================================

export function useConfetti() {
  const [isActive, setIsActive] = useState(false);

  const trigger = () => {
    setIsActive(true);
  };

  const reset = () => {
    setIsActive(false);
  };

  return {
    isActive,
    trigger,
    reset,
    Confetti: (props: Omit<ConfettiProps, "isActive" | "onComplete">) => (
      <Confetti
        {...props}
        isActive={isActive}
        onComplete={reset}
      />
    ),
  };
}

// ============================================
// SUCCESS CHECKMARK WITH CONFETTI
// ============================================

export interface SuccessAnimationProps {
  isVisible?: boolean;
  title?: string;
  subtitle?: string;
  showConfetti?: boolean;
  onComplete?: () => void;
  className?: string;
}

export function SuccessAnimation({
  isVisible = false,
  title = "Success!",
  subtitle,
  showConfetti = true,
  onComplete,
  className,
}: SuccessAnimationProps) {
  const prefersReducedMotion = useReducedMotion();
  const completeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount to prevent setState/callback on unmounted component
  useEffect(() => {
    return () => {
      if (completeTimeoutRef.current) {
        clearTimeout(completeTimeoutRef.current);
        completeTimeoutRef.current = null;
      }
    };
  }, []);

  const checkmarkVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };

  const circleVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" as const },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.3, duration: 0.3 },
    },
  };

  return (
    <>
      {showConfetti && <Confetti isActive={isVisible} />}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onAnimationComplete={() => {
              // Delay onComplete to let user see the success state
              // Use ref to allow cleanup on unmount
              if (completeTimeoutRef.current) {
                clearTimeout(completeTimeoutRef.current);
              }
              completeTimeoutRef.current = setTimeout(() => {
                onComplete?.();
                completeTimeoutRef.current = null;
              }, 1500);
            }}
            className={cn(
              "flex flex-col items-center justify-center p-8",
              className
            )}
          >
            {/* Animated checkmark */}
            <motion.div
              variants={prefersReducedMotion ? undefined : circleVariants}
              initial="hidden"
              animate="visible"
              className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-jade)]"
            >
              <svg
                className="h-10 w-10 text-text-inverse"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <motion.path
                  variants={prefersReducedMotion ? undefined : checkmarkVariants}
                  initial="hidden"
                  animate="visible"
                  d="M5 12l5 5L20 7"
                />
              </svg>
            </motion.div>

            {/* Title */}
            <motion.h2
              variants={prefersReducedMotion ? undefined : textVariants}
              initial="hidden"
              animate="visible"
              className="text-xl font-bold text-[var(--color-text-primary)]"
            >
              {title}
            </motion.h2>

            {/* Subtitle */}
            {subtitle && (
              <motion.p
                variants={prefersReducedMotion ? undefined : textVariants}
                initial="hidden"
                animate="visible"
                className="mt-2 text-[var(--color-text-muted)]"
              >
                {subtitle}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
