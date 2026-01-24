"use client";

import React, { useRef } from "react";
import { motion, useScroll, useSpring, useInView } from "framer-motion";
import {
  MapPin,
  UtensilsCrossed,
  CreditCard,
  Truck,
  Clock,
  CalendarCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  spring,
  staggerContainer,
  staggerItem,
} from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export interface TimelineStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  detail: string;
  color: string;
  bgColor: string;
  glowColor: string;
}

export interface TimelineProps {
  /** Custom steps array */
  steps?: TimelineStep[];
  /** Section title */
  title?: string;
  /** Section subtitle */
  subtitle?: string;
  /** Additional className */
  className?: string;
}

// ============================================
// DEFAULT STEPS
// ============================================

const defaultSteps: TimelineStep[] = [
  {
    icon: <MapPin className="w-6 h-6" />,
    title: "Check Coverage",
    description: "Enter your address",
    detail: "We deliver within 50 miles of Covina, CA",
    color: "text-primary",
    bgColor: "bg-primary/10",
    glowColor: "shadow-primary/30",
  },
  {
    icon: <UtensilsCrossed className="w-6 h-6" />,
    title: "Browse & Order",
    description: "Pick your favorites",
    detail: "Authentic Burmese dishes made fresh",
    color: "text-secondary-hover",
    bgColor: "bg-secondary/10",
    glowColor: "shadow-secondary/30",
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: "Checkout",
    description: "Secure payment",
    detail: "Order by Friday 3pm for Saturday delivery",
    color: "text-green",
    bgColor: "bg-green/10",
    glowColor: "shadow-green/30",
  },
  {
    icon: <Truck className="w-6 h-6" />,
    title: "Saturday Delivery",
    description: "Fresh to your door",
    detail: "Delivery window: 11am - 7pm",
    color: "text-accent-orange",
    bgColor: "bg-accent-orange/10",
    glowColor: "shadow-accent-orange/30",
  },
];

// ============================================
// ANIMATED PROGRESS LINE
// ============================================

interface ProgressLineProps {
  progress: number;
  orientation: "horizontal" | "vertical";
}

function ProgressLine({ progress, orientation }: ProgressLineProps) {
  const { shouldAnimate } = useAnimationPreference();

  if (orientation === "horizontal") {
    return (
      <div className="absolute top-14 left-0 right-0 h-1 bg-border/30 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-secondary via-green to-accent-orange rounded-full"
          style={{
            width: shouldAnimate ? `${progress * 100}%` : "100%",
            boxShadow: "0 0 20px rgba(235, 205, 0, 0.5)",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </div>
    );
  }

  return (
    <div className="absolute left-8 top-0 bottom-0 w-1 bg-border/30 rounded-full overflow-hidden">
      <motion.div
        className="w-full bg-gradient-to-b from-primary via-secondary via-green to-accent-orange rounded-full"
        style={{
          height: shouldAnimate ? `${progress * 100}%` : "100%",
          boxShadow: "0 0 20px rgba(235, 205, 0, 0.5)",
        }}
        initial={{ height: 0 }}
        animate={{ height: `${progress * 100}%` }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
    </div>
  );
}

// ============================================
// STEP ICON WITH BOUNCE
// ============================================

interface StepIconProps {
  step: TimelineStep;
  index: number;
  isActive: boolean;
  isMobile?: boolean;
}

function StepIcon({ step, index, isActive, isMobile }: StepIconProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const iconSize = isMobile ? "w-16 h-16" : "w-28 h-28";
  const numberSize = isMobile ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm";

  const numberColors = [
    "bg-primary text-white",
    "bg-secondary text-text-primary",
    "bg-green text-white",
    "bg-accent-orange text-white",
  ];

  return (
    <motion.div
      className="relative z-10"
      initial={shouldAnimate ? { scale: 0, rotate: -180 } : undefined}
      whileInView={shouldAnimate ? { scale: 1, rotate: 0 } : undefined}
      viewport={{ once: true, margin: "-50px" }}
      transition={shouldAnimate ? { ...getSpring(spring.rubbery), delay: index * 0.15 } : undefined}
    >
      <motion.div
        className={cn(
          iconSize,
          "rounded-full flex items-center justify-center",
          "bg-surface-primary border-4 border-surface-primary",
          step.bgColor,
          isActive && "shadow-lg",
          isActive && step.glowColor
        )}
        whileHover={shouldAnimate ? {
          scale: 1.1,
          boxShadow: "0 0 30px rgba(235, 205, 0, 0.4)",
        } : undefined}
        transition={getSpring(spring.snappy)}
      >
        <motion.div
          className={cn("p-3 rounded-full", step.bgColor, step.color)}
          animate={isActive && shouldAnimate ? {
            scale: [1, 1.2, 1],
          } : undefined}
          transition={{ duration: 0.6, repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
        >
          {step.icon}
        </motion.div>
      </motion.div>

      {/* Step number badge */}
      <motion.div
        className={cn(
          "absolute -top-2 -right-2 rounded-full",
          "flex items-center justify-center font-body font-bold shadow-lg",
          numberSize,
          numberColors[index % numberColors.length]
        )}
        initial={shouldAnimate ? { scale: 0 } : undefined}
        whileInView={shouldAnimate ? { scale: 1 } : undefined}
        viewport={{ once: true }}
        transition={shouldAnimate ? { ...getSpring(spring.ultraBouncy), delay: index * 0.15 + 0.3 } : undefined}
      >
        {index + 1}
      </motion.div>
    </motion.div>
  );
}

// ============================================
// STEP CONTENT
// ============================================

interface StepContentProps {
  step: TimelineStep;
  index: number;
  isMobile?: boolean;
}

function StepContent({ step, index, isMobile }: StepContentProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      className={cn(isMobile ? "pt-2" : "text-center")}
      initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
      animate={isInView && shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={shouldAnimate ? { ...getSpring(spring.default), delay: index * 0.15 + 0.2 } : undefined}
    >
      <h3 className={cn(
        "font-display font-semibold mb-2",
        step.color,
        isMobile ? "text-lg" : "text-xl"
      )}>
        {step.title}
      </h3>
      <p className={cn(
        "font-body font-medium text-text-primary mb-1",
        isMobile ? "text-sm" : "text-base"
      )}>
        {step.description}
      </p>
      <p className={cn(
        "font-body text-text-muted",
        isMobile ? "text-xs" : "text-sm"
      )}>
        {step.detail}
      </p>
    </motion.div>
  );
}

// ============================================
// MAIN TIMELINE COMPONENT
// ============================================

export function Timeline({
  steps = defaultSteps,
  title = "Order in 4 Simple Steps",
  subtitle = "From browsing our menu to receiving your meal at your doorstep, we've made ordering authentic Burmese cuisine as easy as possible.",
  className,
}: TimelineProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-100px" });

  // Scroll progress for the timeline
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end center"],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <section
      ref={sectionRef}
      className={cn(
        "py-16 md:py-24 px-4 bg-gradient-to-b from-surface-secondary/50 to-surface-primary overflow-hidden",
        className
      )}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          ref={headerRef}
          className="text-center mb-12 md:mb-16"
          variants={staggerContainer()}
          initial={shouldAnimate ? "hidden" : undefined}
          animate={headerInView && shouldAnimate ? "visible" : undefined}
        >
          <motion.div
            variants={staggerItem}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-pill mb-4"
          >
            <CalendarCheck className="w-4 h-4 text-primary" />
            <span className="text-sm font-body font-medium text-primary">
              How It Works
            </span>
          </motion.div>

          <motion.h2
            variants={staggerItem}
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4"
          >
            {title}
          </motion.h2>

          <motion.p
            variants={staggerItem}
            className="font-body text-text-secondary max-w-2xl mx-auto"
          >
            {subtitle}
          </motion.p>
        </motion.div>

        {/* Desktop Timeline (Horizontal) */}
        <div className="hidden md:block">
          <div className="relative">
            {/* Animated Progress Line */}
            <ProgressLine
              progress={shouldAnimate ? smoothProgress.get() : 1}
              orientation="horizontal"
            />

            {/* Steps */}
            <div className="grid grid-cols-4 gap-4">
              {steps.map((step, index) => (
                <div key={step.title} className="relative text-center">
                  <div className="mb-6 flex justify-center">
                    <StepIcon
                      step={step}
                      index={index}
                      isActive={smoothProgress.get() > (index + 0.5) / steps.length}
                    />
                  </div>
                  <StepContent step={step} index={index} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Timeline (Vertical) */}
        <div className="md:hidden">
          <div className="relative">
            {/* Animated Progress Line */}
            <ProgressLine
              progress={shouldAnimate ? smoothProgress.get() : 1}
              orientation="vertical"
            />

            {/* Steps */}
            <div className="space-y-8">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="relative flex gap-6 pl-4"
                >
                  <div className="flex-shrink-0">
                    <StepIcon
                      step={step}
                      index={index}
                      isActive={smoothProgress.get() > (index + 0.5) / steps.length}
                      isMobile
                    />
                  </div>
                  <StepContent step={step} index={index} isMobile />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cutoff Notice with Animation */}
        <motion.div
          className="mt-12 md:mt-16 text-center"
          initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
          whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          viewport={{ once: true }}
          transition={shouldAnimate ? getSpring(spring.default) : undefined}
        >
          <motion.div
            className="inline-flex items-center gap-3 px-6 py-4 bg-surface-primary rounded-card shadow-card border border-border"
            whileHover={shouldAnimate ? {
              scale: 1.02,
              boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
            } : undefined}
            transition={getSpring(spring.snappy)}
          >
            <motion.div
              className="p-2 bg-secondary/20 rounded-full"
              animate={shouldAnimate ? {
                rotate: [0, 10, -10, 0],
              } : undefined}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Clock className="w-5 h-5 text-secondary-hover" />
            </motion.div>
            <div className="text-left">
              <p className="font-body font-semibold text-text-primary flex items-center gap-2">
                Weekly Cutoff: Friday 3:00 PM PT
                <Sparkles className="w-4 h-4 text-secondary" />
              </p>
              <p className="text-sm font-body text-text-muted">
                Orders after cutoff will be delivered next Saturday
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default Timeline;
