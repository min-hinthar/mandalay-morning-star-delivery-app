"use client";

/**
 *  Onboarding Tour - Motion-First Welcome Experience
 *
 * Sprint 9: Auth & Onboarding
 * Features: Multi-step tour, progress indicators, animated illustrations,
 * skip/next controls, completion celebration
 */

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChefHat,
  Truck,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight,
  X,
  Check,
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

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: "chef" | "truck" | "clock" | "map" | "sparkles";
  illustration?: React.ReactNode;
}

export interface OnboardingTourProps {
  /** Steps to display */
  steps?: OnboardingStep[];
  /** Called when tour completes */
  onComplete?: () => void;
  /** Called when tour is skipped */
  onSkip?: () => void;
  /** Additional className */
  className?: string;
}

// ============================================
// DEFAULT STEPS
// ============================================

const DEFAULT_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to Mandalay Morning Star",
    description:
      "Authentic Burmese cuisine delivered fresh to your door. Let us show you around!",
    icon: "sparkles",
  },
  {
    id: "menu",
    title: "Explore Our Menu",
    description:
      "Discover traditional Burmese dishes from Mohinga to Tea Leaf Salad. Every dish is made with love.",
    icon: "chef",
  },
  {
    id: "delivery",
    title: "Fast Delivery",
    description:
      "Track your order in real-time. Our drivers bring your food fresh and hot.",
    icon: "truck",
  },
  {
    id: "schedule",
    title: "Order Ahead",
    description:
      "Schedule orders for later or get them now. We're here when you're hungry.",
    icon: "clock",
  },
  {
    id: "coverage",
    title: "We Deliver To You",
    description:
      "Enter your address to see if we deliver to your area. Expanding daily!",
    icon: "map",
  },
];

// ============================================
// ICON MAP
// ============================================

const ICON_MAP = {
  chef: ChefHat,
  truck: Truck,
  clock: Clock,
  map: MapPin,
  sparkles: Sparkles,
};

// ============================================
// ANIMATED ILLUSTRATION
// ============================================

interface StepIllustrationProps {
  icon: keyof typeof ICON_MAP;
  isActive: boolean;
}

function StepIllustration({ icon, isActive }: StepIllustrationProps) {
  const { shouldAnimate } = useAnimationPreference();
  const Icon = ICON_MAP[icon];

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      {/* Background circles */}
      <motion.div
        animate={
          isActive && shouldAnimate
            ? {
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }
            : undefined
        }
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute inset-0 rounded-full"
        style={{ background: "linear-gradient(to bottom right, var(--color-primary-light), var(--color-secondary-light))" }}
      />
      <motion.div
        animate={
          isActive && shouldAnimate
            ? {
                scale: [1, 1.15, 1],
                opacity: [0.2, 0.4, 0.2],
              }
            : undefined
        }
        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        className="absolute inset-4 rounded-full"
        style={{ background: "linear-gradient(to bottom right, var(--color-secondary-light), var(--color-accent-green-light))" }}
      />

      {/* Icon */}
      <motion.div
        initial={shouldAnimate ? { scale: 0, rotate: -180 } : undefined}
        animate={shouldAnimate ? { scale: 1, rotate: 0 } : undefined}
        transition={spring.ultraBouncy}
        className={cn(
          "relative w-24 h-24 rounded-2xl",
          "bg-gradient-primary",
          "flex items-center justify-center",
          "shadow-xl shadow-primary/30"
        )}
      >
        <motion.div
          animate={
            isActive && shouldAnimate
              ? { rotate: [0, 5, -5, 0] }
              : undefined
          }
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        >
          <Icon className="w-12 h-12 text-text-inverse" />
        </motion.div>
      </motion.div>

      {/* Floating particles */}
      {shouldAnimate && isActive && (
        <>
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: Math.cos((i / 5) * Math.PI * 2) * 80,
                y: Math.sin((i / 5) * Math.PI * 2) * 80,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
              }}
              className="absolute w-3 h-3 rounded-full bg-secondary"
            />
          ))}
        </>
      )}
    </div>
  );
}

// ============================================
// PROGRESS DOTS
// ============================================

interface ProgressDotsProps {
  total: number;
  current: number;
  onDotClick?: (index: number) => void;
}

function ProgressDots({ total, current, onDotClick }: ProgressDotsProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <motion.button
          key={i}
          onClick={() => onDotClick?.(i)}
          whileHover={shouldAnimate ? { scale: 1.2 } : undefined}
          whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
          className={cn(
            "relative h-2 rounded-full transition-all",
            i === current ? "w-8 bg-primary" : "w-2 bg-surface-secondary",
            onDotClick && "cursor-pointer"
          )}
        >
          {i === current && shouldAnimate && (
            <motion.div
              layoutId="progress-indicator"
              className="absolute inset-0 rounded-full bg-primary"
              transition={getSpring(spring.snappy)}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function OnboardingTour({
  steps = DEFAULT_STEPS,
  onComplete,
  onSkip,
  className,
}: OnboardingTourProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const isLastStep = currentStep === steps.length - 1;
  const step = steps[currentStep];

  // Handle next
  const handleNext = useCallback(() => {
    if (isLastStep) {
      setIsExiting(true);
      // Haptic feedback
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([50, 30, 100]);
      }
      setTimeout(() => {
        onComplete?.();
      }, 500);
    } else {
      // Haptic feedback
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(10);
      }
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLastStep, onComplete]);

  // Handle skip
  const handleSkip = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onSkip?.();
    }, 300);
  }, [onSkip]);

  // Handle dot click
  const handleDotClick = useCallback((index: number) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    setCurrentStep(index);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        handleNext();
      } else if (e.key === "ArrowLeft" && currentStep > 0) {
        setCurrentStep((prev) => prev - 1);
      } else if (e.key === "Escape") {
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handleSkip, currentStep]);

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0 } : undefined}
      animate={shouldAnimate ? { opacity: isExiting ? 0 : 1 } : undefined}
      transition={{ duration: 0.3 }}
      className={cn(
        "fixed inset-0 z-modal",
        "flex items-center justify-center",
        "bg-gradient-surface",
        className
      )}
    >
      {/* Skip button */}
      <motion.button
        initial={shouldAnimate ? { opacity: 0, y: -20 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={{ delay: 0.5 }}
        onClick={handleSkip}
        className={cn(
          "absolute top-6 right-6",
          "flex items-center gap-2 px-4 py-2 rounded-full",
          "text-sm text-text-secondary",
          "hover:bg-surface-secondary transition-colors"
        )}
      >
        Skip
        <X className="w-4 h-4" />
      </motion.button>

      {/* Content */}
      <div className="max-w-md w-full px-6 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={shouldAnimate ? { opacity: 0, x: 50 } : undefined}
            animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
            exit={shouldAnimate ? { opacity: 0, x: -50 } : undefined}
            transition={getSpring(spring.default)}
          >
            {/* Illustration */}
            <div className="flex justify-center mb-8">
              <StepIllustration icon={step.icon} isActive={true} />
            </div>

            {/* Title */}
            <motion.h1
              initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.1 }}
              className="text-2xl font-bold text-text-primary mb-4"
            >
              {step.title}
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.2 }}
              className="text-text-secondary mb-8 leading-relaxed"
            >
              {step.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex justify-center mb-8">
          <ProgressDots
            total={steps.length}
            current={currentStep}
            onDotClick={handleDotClick}
          />
        </div>

        {/* Next button */}
        <motion.button
          {...(shouldAnimate ? hover.scale : {})}
          onClick={handleNext}
          className={cn(
            "inline-flex items-center gap-2",
            "px-8 py-4 rounded-2xl",
            "bg-gradient-primary",
            "text-text-inverse font-semibold text-lg",
            "shadow-lg shadow-primary/30",
            "hover:shadow-xl hover:shadow-primary/40",
            "transition-shadow"
          )}
        >
          {isLastStep ? (
            <>
              Get Started
              <Check className="w-5 h-5" />
            </>
          ) : (
            <>
              Next
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>

        {/* Step counter */}
        <motion.p
          initial={shouldAnimate ? { opacity: 0 } : undefined}
          animate={shouldAnimate ? { opacity: 0.5 } : undefined}
          transition={{ delay: 0.5 }}
          className="mt-6 text-xs text-text-muted"
        >
          {currentStep + 1} of {steps.length}
        </motion.p>
      </div>

      {/* Decorative elements */}
      {shouldAnimate && (
        <>
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute bottom-20 left-10 w-20 h-20 rounded-full bg-secondary/10"
          />
          <motion.div
            animate={{ y: [0, 15, 0], rotate: [0, -3, 0] }}
            transition={{ duration: 6, repeat: Infinity, delay: 1 }}
            className="absolute top-32 right-16 w-16 h-16 rounded-full bg-primary/10"
          />
          <motion.div
            animate={{ y: [0, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 5, repeat: Infinity, delay: 2 }}
            className="absolute top-1/4 left-1/4 w-8 h-8 rounded-full bg-green/10"
          />
        </>
      )}
    </motion.div>
  );
}

export default OnboardingTour;
