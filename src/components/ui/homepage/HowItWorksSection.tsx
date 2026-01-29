"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { MapPin, UtensilsCrossed, Truck, Sparkles, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { AnimatedSection, itemVariants } from "@/components/ui/scroll";
import { spring } from "@/lib/motion-tokens";
import { useCoverageCheck } from "@/lib/hooks/useCoverageCheck";

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
    color: "text-primary-hover",
    bgColor: "bg-primary/15",
    borderColor: "border-primary/40",
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
        "border-2 backdrop-blur-md",
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
          "font-display font-bold text-sm text-text-inverse shadow-md",
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
// INLINE COVERAGE CHECKER
// ============================================

interface InlineCoverageCheckerProps {
  className?: string;
}

function InlineCoverageChecker({ className }: InlineCoverageCheckerProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [address, setAddress] = useState("");
  const { mutate, data, isPending, reset } = useCoverageCheck();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!address.trim() || isPending) return;
      reset();
      mutate({ address: address.trim() });
    },
    [address, isPending, mutate, reset]
  );

  const handleClear = useCallback(() => {
    setAddress("");
    reset();
  }, [reset]);

  return (
    <motion.div
      className={cn("w-full max-w-xs mt-4", className)}
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true }}
      transition={getSpring(spring.gentle)}
    >
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter your address..."
          disabled={isPending}
          className={cn(
            "w-full px-4 py-3 pr-12 rounded-full",
            "border-2 border-primary/30 bg-surface-primary",
            "font-body text-sm text-text-primary placeholder:text-text-muted",
            "focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none",
            "transition-all duration-200",
            isPending && "opacity-70"
          )}
        />
        <button
          type="submit"
          disabled={!address.trim() || isPending}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2",
            "w-8 h-8 rounded-full flex items-center justify-center",
            "bg-primary text-text-inverse",
            "hover:bg-primary-hover transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
        </button>
      </form>

      {/* Result */}
      <AnimatePresence mode="wait">
        {data && (
          <motion.div
            key={data.isValid ? "success" : "error"}
            initial={shouldAnimate ? { opacity: 0, scale: 0.95, y: -5 } : undefined}
            animate={shouldAnimate ? { opacity: 1, scale: 1, y: 0 } : undefined}
            exit={shouldAnimate ? { opacity: 0, scale: 0.95, y: -5 } : undefined}
            transition={getSpring(spring.snappy)}
            className={cn(
              "mt-3 p-3 rounded-xl flex items-center gap-2",
              data.isValid
                ? "bg-green/10 border border-green/30"
                : "bg-status-error/10 border border-status-error/30"
            )}
          >
            {data.isValid ? (
              <>
                <CheckCircle className="w-5 h-5 text-green flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green">We deliver here!</p>
                  <p className="text-xs text-text-muted truncate">
                    {data.distanceMiles?.toFixed(1)} miles • ~{data.durationMinutes} min
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-status-error flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-status-error">Outside delivery area</p>
                  <p className="text-xs text-text-muted">
                    {data.distanceMiles ? `${data.distanceMiles.toFixed(1)} miles away` : "Try another address"}
                  </p>
                </div>
              </>
            )}
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// STEP CARD
// ============================================

interface StepCardProps {
  step: Step;
  index: number;
  showCoverageChecker?: boolean;
}

function StepCard({ step, index, showCoverageChecker = false }: StepCardProps) {
  return (
    <motion.div variants={itemVariants} className="flex flex-col items-center text-center">
      <StepIcon step={step} index={index} />
      <h3 className={cn("font-display font-bold text-2xl md:text-3xl mt-4 mb-2", step.color)}>
        {step.title}
      </h3>
      <p className="font-body text-hero-text/80 text-base md:text-lg font-medium max-w-[220px]">
        {step.description}
      </p>
      {showCoverageChecker && <InlineCoverageChecker />}
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
        "relative py-16 md:py-24 px-4 overflow-hidden",
        className
      )}
    >
      {/* Background Image */}
      <Image
        src="/images/sunset_ubein.png"
        alt="U Bein Bridge sunset"
        fill
        sizes="100vw"
        className="object-cover object-center"
        priority
      />
      {/* Light overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
      {/* Top gradient for seamless blend with hero */}
      <div
        className="absolute -top-1 left-0 right-0 h-40 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgb(251, 146, 60) 0%, rgb(251, 146, 60) 10%, transparent 100%)",
        }}
      />
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-12 md:mb-16">
          <motion.span
            className={cn(
              "relative inline-block overflow-hidden px-6 py-3 rounded-full text-base font-body font-bold mb-6",
              "bg-gradient-to-r from-primary via-primary-hover to-primary",
              "text-text-inverse shadow-lg shadow-primary/30"
            )}
            initial={shouldAnimate ? { scale: 0.9, opacity: 0 } : undefined}
            whileInView={shouldAnimate ? { scale: 1, opacity: 1 } : undefined}
            viewport={{ once: false }}
            transition={getSpring(spring.default)}
          >
            <span className="relative z-10">How It Works</span>
            {/* Reverse shimmer effect */}
            <motion.span
              className="absolute inset-0 bg-gradient-to-l from-white/0 via-white/25 to-white/0"
              animate={shouldAnimate ? { x: ["100%", "-100%"] } : undefined}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                repeatDelay: 4,
                ease: "easeInOut",
              }}
            />
          </motion.span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-hero-text mb-6 leading-tight">
            Order in 4 Simple Steps
          </h2>
          <p className="font-body text-hero-text/80 max-w-2xl mx-auto text-lg md:text-xl font-medium">
            From checking delivery coverage to enjoying fresh Burmese cuisine at your door
          </p>
        </motion.div>

        {/* Desktop Layout - Horizontal */}
        <div className="hidden md:block">
          <div className="flex items-start justify-between">
            {steps.map((step, index) => (
              <div key={step.title} className="flex items-start flex-1 last:flex-none">
                <StepCard step={step} index={index} showCoverageChecker={index === 0} />
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
                <StepCard step={step} index={index} showCoverageChecker={index === 0} />
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
