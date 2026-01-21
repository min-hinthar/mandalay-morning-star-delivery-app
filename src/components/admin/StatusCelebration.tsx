"use client";

/**
 * V7 Status Celebration - Motion-First Goal Achievements
 *
 * Sprint 8: Admin Dashboard
 * Features: Confetti bursts, milestone badges, animated counters,
 * celebration modals, sound effects (optional)
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Star,
  Target,
  Sparkles,
  Flame,
  Award,
  Zap,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  spring,
} from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export type CelebrationType =
  | "goal_reached"
  | "milestone"
  | "streak"
  | "record"
  | "achievement";

export interface CelebrationConfig {
  type: CelebrationType;
  title: string;
  subtitle?: string;
  value?: number | string;
  icon?: "trophy" | "star" | "target" | "flame" | "crown" | "award";
  duration?: number;
}

export interface StatusCelebrationProps {
  /** Whether to show the celebration */
  show: boolean;
  /** Celebration configuration */
  config: CelebrationConfig;
  /** Callback when celebration ends */
  onComplete?: () => void;
  /** Additional className */
  className?: string;
}

// ============================================
// CONFETTI PARTICLE
// ============================================

interface ConfettiParticle {
  id: number;
  x: number;
  color: string;
  rotation: number;
  scale: number;
  delay: number;
}

const CONFETTI_COLORS = [
  "#A41034", // V6 Primary Red
  "#EBCD00", // V6 Secondary Yellow
  "#52A52E", // V6 Green
  "#FF6B6B", // Coral
  "#4ECDC4", // Teal
  "#FFE66D", // Bright Yellow
  "#FF8E53", // Orange
];

function ConfettiV7({ count = 50, isActive }: { count?: number; isActive: boolean }) {
  const { shouldAnimate } = useAnimationPreference();

  const particles: ConfettiParticle[] = React.useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * 720 - 360,
        scale: 0.5 + Math.random() * 0.5,
        delay: Math.random() * 0.5,
      })),
    [count]
  );

  if (!isActive || !shouldAnimate) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[var(--z-max)] overflow-hidden">
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
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 2.5 + Math.random(),
            delay: particle.delay,
            ease: [0.2, 0.8, 0.2, 1],
          }}
          className="absolute"
          style={{ left: 0 }}
        >
          <div
            className="w-3 h-3 rounded-sm"
            style={{
              backgroundColor: particle.color,
              transform: `rotate(${Math.random() * 45}deg)`,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ============================================
// SPARKLE BURST
// ============================================

function SparkleBurstV7({ isActive }: { isActive: boolean }) {
  const { shouldAnimate } = useAnimationPreference();

  if (!isActive || !shouldAnimate) return null;

  const sparkles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i / 12) * 360,
    distance: 60 + Math.random() * 40,
    delay: Math.random() * 0.2,
  }));

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          initial={{ scale: 0, opacity: 1 }}
          animate={{
            scale: [0, 1.5, 0],
            opacity: [1, 1, 0],
            x: Math.cos((sparkle.angle * Math.PI) / 180) * sparkle.distance,
            y: Math.sin((sparkle.angle * Math.PI) / 180) * sparkle.distance,
          }}
          transition={{
            duration: 0.8,
            delay: sparkle.delay,
            ease: "easeOut",
          }}
          className="absolute"
        >
          <Star className="w-4 h-4 text-secondary fill-secondary" />
        </motion.div>
      ))}
    </div>
  );
}

// ============================================
// ICON MAP
// ============================================

const ICON_MAP = {
  trophy: Trophy,
  star: Star,
  target: Target,
  flame: Flame,
  crown: Crown,
  award: Award,
};

const TYPE_CONFIG: Record<
  CelebrationType,
  { defaultIcon: keyof typeof ICON_MAP; gradient: string; ring: string }
> = {
  goal_reached: {
    defaultIcon: "target",
    gradient: "from-green to-emerald-400",
    ring: "ring-green/30",
  },
  milestone: {
    defaultIcon: "trophy",
    gradient: "from-secondary to-amber-400",
    ring: "ring-secondary/30",
  },
  streak: {
    defaultIcon: "flame",
    gradient: "from-orange-500 to-red-500",
    ring: "ring-orange-500/30",
  },
  record: {
    defaultIcon: "crown",
    gradient: "from-primary to-rose-500",
    ring: "ring-primary/30",
  },
  achievement: {
    defaultIcon: "award",
    gradient: "from-purple-500 to-indigo-500",
    ring: "ring-purple-500/30",
  },
};

// ============================================
// CELEBRATION BADGE
// ============================================

interface CelebrationBadgeV7Props {
  config: CelebrationConfig;
}

function CelebrationBadgeV7({ config }: CelebrationBadgeV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const typeConfig = TYPE_CONFIG[config.type];
  const iconKey = config.icon || typeConfig.defaultIcon;
  const Icon = ICON_MAP[iconKey];

  return (
    <motion.div
      initial={shouldAnimate ? { scale: 0, rotate: -180 } : undefined}
      animate={shouldAnimate ? { scale: 1, rotate: 0 } : undefined}
      exit={shouldAnimate ? { scale: 0, rotate: 180 } : undefined}
      transition={getSpring(spring.dramatic)}
      className="relative"
    >
      {/* Outer ring */}
      <motion.div
        animate={shouldAnimate ? {
          scale: [1, 1.2, 1],
          opacity: [0.5, 0, 0.5],
        } : undefined}
        transition={{ duration: 2, repeat: Infinity }}
        className={cn(
          "absolute inset-0 rounded-full",
          "ring-4",
          typeConfig.ring
        )}
      />

      {/* Badge */}
      <div
        className={cn(
          "relative w-24 h-24 rounded-full",
          "bg-gradient-to-br",
          typeConfig.gradient,
          "flex items-center justify-center",
          "shadow-2xl"
        )}
      >
        <motion.div
          animate={shouldAnimate ? { rotate: [0, 10, -10, 0] } : undefined}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Icon className="w-12 h-12 text-white" />
        </motion.div>
      </div>

      {/* Sparkle burst */}
      <SparkleBurstV7 isActive={true} />
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function StatusCelebration({
  show,
  config,
  onComplete,
  className,
}: StatusCelebrationProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle visibility
  useEffect(() => {
    if (show) {
      setIsVisible(true);

      // Haptic feedback
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([50, 30, 100, 30, 50]);
      }

      // Auto-dismiss
      timerRef.current = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, config.duration || 3000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [show, config.duration, onComplete]);

  return (
    <>
      {/* Confetti overlay */}
      <ConfettiV7 count={60} isActive={isVisible} />

      {/* Celebration modal */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "fixed inset-0 z-[var(--z-modal)]",
              "flex items-center justify-center",
              "bg-black/40 backdrop-blur-sm",
              className
            )}
            onClick={() => {
              setIsVisible(false);
              onComplete?.();
            }}
          >
            <motion.div
              initial={shouldAnimate ? { opacity: 0, scale: 0.8, y: 50 } : undefined}
              animate={shouldAnimate ? { opacity: 1, scale: 1, y: 0 } : undefined}
              exit={shouldAnimate ? { opacity: 0, scale: 0.8, y: 50 } : undefined}
              transition={getSpring(spring.ultraBouncy)}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "relative max-w-sm w-full mx-4",
                "p-8 rounded-3xl",
                "bg-white shadow-2xl",
                "text-center"
              )}
            >
              {/* Badge */}
              <div className="flex justify-center mb-6">
                <CelebrationBadgeV7 config={config} />
              </div>

              {/* Title */}
              <motion.h2
                initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
                animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-text-primary mb-2"
              >
                {config.title}
              </motion.h2>

              {/* Subtitle */}
              {config.subtitle && (
                <motion.p
                  initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
                  animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
                  transition={{ delay: 0.4 }}
                  className="text-text-secondary mb-4"
                >
                  {config.subtitle}
                </motion.p>
              )}

              {/* Value */}
              {config.value && (
                <motion.div
                  initial={shouldAnimate ? { opacity: 0, scale: 0.5 } : undefined}
                  animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
                  transition={{ ...getSpring(spring.ultraBouncy), delay: 0.5 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-secondary"
                >
                  <Zap className="w-5 h-5 text-secondary" />
                  <span className="text-xl font-bold text-text-primary">
                    {config.value}
                  </span>
                </motion.div>
              )}

              {/* Dismiss hint */}
              <motion.p
                initial={shouldAnimate ? { opacity: 0 } : undefined}
                animate={shouldAnimate ? { opacity: 0.5 } : undefined}
                transition={{ delay: 1 }}
                className="mt-6 text-xs text-text-muted"
              >
                Tap anywhere to dismiss
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================
// INLINE CELEBRATION (for smaller triggers)
// ============================================

export interface InlineCelebrationV7Props {
  /** Whether celebration is active */
  isActive: boolean;
  /** Celebration type */
  type?: CelebrationType;
  /** Children to wrap */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

export function InlineCelebrationV7({
  isActive,
  type = "achievement",
  children,
  className,
}: InlineCelebrationV7Props) {
  const { shouldAnimate } = useAnimationPreference();
  const typeConfig = TYPE_CONFIG[type];

  return (
    <motion.div
      animate={
        isActive && shouldAnimate
          ? {
              scale: [1, 1.1, 1],
              transition: { duration: 0.4 },
            }
          : undefined
      }
      className={cn("relative inline-block", className)}
    >
      {children}

      {/* Success ring */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.3, opacity: 0 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className={cn(
              "absolute inset-0 rounded-full",
              "ring-4",
              typeConfig.ring
            )}
          />
        )}
      </AnimatePresence>

      {/* Sparkles */}
      <AnimatePresence>
        {isActive && shouldAnimate && (
          <>
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 0,
                  scale: 0,
                  x: 0,
                  y: 0,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: (Math.random() - 0.5) * 60,
                  y: (Math.random() - 0.5) * 60,
                }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.1,
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              >
                <Sparkles className="w-4 h-4 text-secondary" />
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// HOOK: Use Celebration
// ============================================

export function useCelebration() {
  const [config, setConfig] = useState<CelebrationConfig | null>(null);
  const [show, setShow] = useState(false);

  const celebrate = useCallback((celebrationConfig: CelebrationConfig) => {
    setConfig(celebrationConfig);
    setShow(true);
  }, []);

  const dismiss = useCallback(() => {
    setShow(false);
    setTimeout(() => setConfig(null), 300);
  }, []);

  return {
    show,
    config: config || {
      type: "achievement" as const,
      title: "",
    },
    celebrate,
    dismiss,
    CelebrationComponent: StatusCelebration,
  };
}

export default StatusCelebration;
