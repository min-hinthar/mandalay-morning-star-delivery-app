"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  MapPin,
  UtensilsCrossed,
  Truck,
  Sparkles,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Clock,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { AnimatedSection, itemVariants } from "@/components/ui/scroll";
import { spring } from "@/lib/motion-tokens";
import { useCoverageCheck } from "@/lib/hooks/useCoverageCheck";
import {
  usePlacesAutocomplete,
  type PlacePrediction,
} from "@/lib/hooks/usePlacesAutocomplete";
import { CoverageRouteMap } from "@/components/ui/coverage/CoverageRouteMap";

// Dropdown item animation variants
const dropdownItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  }),
};

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
// INTERACTIVE COVERAGE CHECKER WITH MAP
// ============================================

interface InteractiveCoverageCheckerProps {
  className?: string;
}

function InteractiveCoverageChecker({ className }: InteractiveCoverageCheckerProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [isFocused, setIsFocused] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<{
    description: string;
    lat: number;
    lng: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Places autocomplete with 300ms debounce
  const {
    input,
    setInput,
    predictions,
    isLoading: isLoadingPlaces,
    isReady,
    getPlaceDetails,
    clearPredictions,
    clearInput,
  } = usePlacesAutocomplete({ debounceMs: 300 });

  // Coverage check mutation
  const { mutate, data: coverageData, isPending: isCheckingCoverage, reset } = useCoverageCheck();

  // Handle address selection from autocomplete
  const handleSelectAddress = useCallback(
    async (prediction: PlacePrediction) => {
      setInput(prediction.description);
      clearPredictions();
      setIsFocused(false);

      const details = await getPlaceDetails(prediction.placeId);
      if (details) {
        setSelectedAddress({
          description: prediction.description,
          lat: details.lat,
          lng: details.lng,
        });
        mutate({ lat: details.lat, lng: details.lng });
      }
    },
    [setInput, clearPredictions, getPlaceDetails, mutate]
  );

  // Handle clear
  const handleClear = useCallback(() => {
    clearInput();
    setSelectedAddress(null);
    reset();
    inputRef.current?.focus();
  }, [clearInput, reset]);

  return (
    <motion.div
      className={cn("w-full max-w-lg mt-8", className)}
      initial={shouldAnimate ? { opacity: 0, y: 30 } : undefined}
      whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, margin: "-50px" }}
      transition={getSpring(spring.gentle)}
    >
      {/* Map Container */}
      <motion.div
        initial={shouldAnimate ? { opacity: 0, scale: 0.95 } : undefined}
        whileInView={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
        viewport={{ once: true }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="mb-4"
      >
        <CoverageRouteMap
          {...(selectedAddress && coverageData && {
            destinationLat: selectedAddress.lat,
            destinationLng: selectedAddress.lng,
            encodedPolyline: coverageData.encodedPolyline,
            durationMinutes: coverageData.durationMinutes,
            distanceMiles: coverageData.distanceMiles,
            isValid: coverageData.isValid,
          })}
          className="h-52 md:h-64"
        />
      </motion.div>

      {/* Search Input */}
      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
        whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="relative"
      >
        <motion.div
          animate={isFocused && shouldAnimate ? { scale: 1.01 } : { scale: 1 }}
          transition={getSpring(spring.snappy)}
          className={cn(
            "relative rounded-2xl transition-shadow duration-300",
            "ring-2",
            isFocused
              ? "ring-primary shadow-lg shadow-primary/20"
              : "ring-border/50 shadow-md"
          )}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={isReady ? "Type your address to check coverage..." : "Loading..."}
            disabled={!isReady || isCheckingCoverage}
            className={cn(
              "w-full pl-12 pr-12 py-4 rounded-2xl",
              "bg-surface-primary",
              "font-body text-base text-text-primary placeholder:text-text-muted",
              "focus:outline-none",
              "transition-all duration-200",
              (!isReady || isCheckingCoverage) && "opacity-60 cursor-not-allowed"
            )}
          />

          {/* Clear / Loading */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {isLoadingPlaces || isCheckingCoverage ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-5 h-5 text-primary" />
              </motion.div>
            ) : input ? (
              <motion.button
                type="button"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClear}
                className="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-all"
              >
                <X className="w-5 h-5" />
              </motion.button>
            ) : null}
          </div>
        </motion.div>

        {/* Autocomplete Dropdown */}
        <AnimatePresence>
          {predictions.length > 0 && isFocused && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={getSpring(spring.snappy)}
              className={cn(
                "absolute top-full left-0 right-0 mt-2 z-20",
                "bg-surface-primary rounded-2xl",
                "border-2 border-primary/20 shadow-xl",
                "overflow-hidden backdrop-blur-sm"
              )}
            >
              {predictions.map((prediction, index) => (
                <motion.button
                  key={prediction.placeId}
                  type="button"
                  custom={index}
                  variants={shouldAnimate ? dropdownItemVariants : undefined}
                  initial="hidden"
                  animate="visible"
                  onClick={() => handleSelectAddress(prediction)}
                  whileHover={shouldAnimate ? { backgroundColor: "rgba(164, 16, 52, 0.08)", x: 4 } : undefined}
                  className={cn(
                    "w-full text-left px-4 py-3",
                    "transition-colors duration-150",
                    "flex items-start gap-3",
                    index !== predictions.length - 1 && "border-b border-border/50"
                  )}
                >
                  <motion.div
                    animate={shouldAnimate ? { scale: [1, 1.2, 1] } : undefined}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  </motion.div>
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary truncate">
                      {prediction.mainText}
                    </p>
                    <p className="text-sm text-text-muted truncate">
                      {prediction.secondaryText}
                    </p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Coverage Result - Animated card */}
      <AnimatePresence mode="wait">
        {coverageData && selectedAddress && (
          <motion.div
            key={coverageData.isValid ? "success" : "error"}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={getSpring(spring.ultraBouncy)}
            className={cn(
              "mt-4 p-4 rounded-2xl",
              "flex items-center gap-3",
              "shadow-lg",
              coverageData.isValid
                ? "bg-gradient-to-r from-green/20 to-green/10 border-2 border-green/40"
                : "bg-gradient-to-r from-status-error/20 to-status-error/10 border-2 border-status-error/40"
            )}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                coverageData.isValid ? "bg-green/30" : "bg-status-error/30"
              )}
            >
              {coverageData.isValid ? (
                <CheckCircle className="w-6 h-6 text-green" />
              ) : (
                <XCircle className="w-6 h-6 text-status-error" />
              )}
            </motion.div>

            <div className="flex-1 min-w-0">
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className={cn(
                  "font-display font-bold text-lg",
                  coverageData.isValid ? "text-green" : "text-status-error"
                )}
              >
                {coverageData.isValid ? "We deliver here! 🎉" : "Outside our area"}
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="flex items-center gap-3 text-sm text-text-secondary mt-1"
              >
                {coverageData.distanceMiles !== undefined && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {coverageData.distanceMiles.toFixed(1)} mi
                  </span>
                )}
                {coverageData.durationMinutes !== undefined && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    ~{coverageData.durationMinutes} min
                  </span>
                )}
              </motion.div>
            </div>

            <motion.button
              type="button"
              onClick={handleClear}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium",
                "bg-surface-primary/80 text-text-secondary",
                "hover:bg-surface-primary hover:text-text-primary",
                "transition-colors"
              )}
            >
              Try another
            </motion.button>
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
      {showCoverageChecker && <InteractiveCoverageChecker />}
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
