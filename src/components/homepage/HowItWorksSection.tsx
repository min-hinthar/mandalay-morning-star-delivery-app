"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MapPin, UtensilsCrossed, Truck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { AnimatedSection, itemVariants } from "@/components/scroll/AnimatedSection";
import { spring } from "@/lib/motion-tokens";

// ============================================
// TYPES
// ============================================

interface Step {
  icon: typeof MapPin;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

// ============================================
// STEP DATA
// ============================================

const steps: Step[] = [
  {
    icon: MapPin,
    title: "Check Coverage",
    description: "Enter your address to see if we deliver",
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
  },
  {
    icon: UtensilsCrossed,
    title: "Order",
    description: "Browse menu and add favorites to cart",
    color: "text-secondary-hover",
    bgColor: "bg-secondary/10",
    borderColor: "border-secondary/30",
  },
  {
    icon: Truck,
    title: "Track",
    description: "Real-time updates on your order",
    color: "text-green",
    bgColor: "bg-green/10",
    borderColor: "border-green/30",
  },
  {
    icon: Sparkles,
    title: "Enjoy",
    description: "Fresh Burmese cuisine at your door",
    color: "text-accent-orange",
    bgColor: "bg-accent-orange/10",
    borderColor: "border-accent-orange/30",
  },
];

// ============================================
// STEP ICON WITH FLOATING ANIMATION
// ============================================

interface StepIconProps {
  step: Step;
  index: number;
}

function StepIcon({ step, index }: StepIconProps) {
  const { shouldAnimate } = useAnimationPreference();
  const Icon = step.icon;

  return (
    <motion.div
      className={cn(
        "relative w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center",
        "border-2",
        step.bgColor,
        step.borderColor
      )}
      // Continuous floating animation
      animate={
        shouldAnimate
          ? {
              y: [0, -8, 0],
              rotate: [0, 2, 0],
            }
          : undefined
      }
      transition={{
        duration: 4 + index * 0.5,
        repeat: Infinity,
        ease: "easeInOut",
        delay: index * 0.3,
      }}
    >
      <Icon className={cn("w-8 h-8 md:w-10 md:h-10", step.color)} strokeWidth={1.5} />

      {/* Step number badge */}
      <span
        className={cn(
          "absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center",
          "font-display font-bold text-sm text-white shadow-md",
          index === 0 && "bg-primary",
          index === 1 && "bg-secondary text-text-primary",
          index === 2 && "bg-green",
          index === 3 && "bg-accent-orange"
        )}
      >
        {index + 1}
      </span>
    </motion.div>
  );
}

// ============================================
// CONNECTOR LINE
// ============================================

interface ConnectorProps {
  index: number;
  orientation: "horizontal" | "vertical";
}

function Connector({ index, orientation }: ConnectorProps) {
  const { shouldAnimate } = useAnimationPreference();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.5 });

  const gradients = [
    "from-primary to-secondary",
    "from-secondary to-green",
    "from-green to-accent-orange",
  ];

  if (orientation === "horizontal") {
    return (
      <div ref={ref} className="hidden md:block flex-1 h-1 mx-4 bg-border/30 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full bg-gradient-to-r rounded-full", gradients[index])}
          initial={{ scaleX: 0 }}
          animate={isInView && shouldAnimate ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.2 }}
          style={{ transformOrigin: "left" }}
        />
      </div>
    );
  }

  // Vertical connector for mobile
  return (
    <div ref={ref} className="md:hidden w-1 h-12 mx-auto bg-border/30 rounded-full overflow-hidden my-2">
      <motion.div
        className={cn("w-full bg-gradient-to-b rounded-full", gradients[index])}
        initial={{ scaleY: 0 }}
        animate={isInView && shouldAnimate ? { scaleY: 1 } : { scaleY: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.15 }}
        style={{ transformOrigin: "top", height: "100%" }}
      />
    </div>
  );
}

// ============================================
// STEP CARD
// ============================================

interface StepCardProps {
  step: Step;
  index: number;
}

function StepCard({ step, index }: StepCardProps) {
  return (
    <motion.div variants={itemVariants} className="flex flex-col items-center text-center">
      <StepIcon step={step} index={index} />
      <h3 className={cn("font-display font-semibold text-lg md:text-xl mt-4 mb-2", step.color)}>
        {step.title}
      </h3>
      <p className="font-body text-text-secondary text-sm md:text-base max-w-[200px]">
        {step.description}
      </p>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export interface HowItWorksSectionProps {
  className?: string;
  id?: string;
}

export function HowItWorksSection({ className, id = "how-it-works" }: HowItWorksSectionProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <AnimatedSection
      id={id}
      className={cn(
        "py-16 md:py-24 px-4 bg-gradient-to-b from-surface-secondary/50 to-surface-primary",
        className
      )}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-12 md:mb-16">
          <motion.span
            className="inline-block px-4 py-2 bg-primary/10 rounded-pill text-sm font-body font-medium text-primary mb-4"
            initial={shouldAnimate ? { scale: 0.9, opacity: 0 } : undefined}
            whileInView={shouldAnimate ? { scale: 1, opacity: 1 } : undefined}
            viewport={{ once: false }}
            transition={getSpring(spring.default)}
          >
            How It Works
          </motion.span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4">
            Order in 4 Simple Steps
          </h2>
          <p className="font-body text-text-secondary max-w-2xl mx-auto">
            From checking delivery coverage to enjoying fresh Burmese cuisine at your door
          </p>
        </motion.div>

        {/* Desktop Layout - Horizontal */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.title} className="flex items-center flex-1 last:flex-none">
                <StepCard step={step} index={index} />
                {index < steps.length - 1 && <Connector index={index} orientation="horizontal" />}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Layout - Vertical */}
        <div className="md:hidden">
          <div className="flex flex-col">
            {steps.map((step, index) => (
              <div key={step.title}>
                <StepCard step={step} index={index} />
                {index < steps.length - 1 && <Connector index={index} orientation="vertical" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

export default HowItWorksSection;
