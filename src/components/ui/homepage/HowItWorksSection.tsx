"use client";

import { useRef, useState, useCallback, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, useInView, AnimatePresence, type Variants } from "framer-motion";
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
import { AnimatedSection } from "@/components/ui/scroll";
import { spring } from "@/lib/motion-tokens";
import { useCoverageCheck } from "@/lib/hooks/useCoverageCheck";
import {
  usePlacesAutocomplete,
  type PlacePrediction,
} from "@/lib/hooks/usePlacesAutocomplete";
import { CoverageRouteMap } from "@/components/ui/coverage/CoverageRouteMap";

// ============================================
// ANIMATION VARIANTS
// ============================================

// Step card entrance - playful + bold
const stepCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 60,
    scale: 0.9,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      mass: 1,
      delay: i * 0.12,
    },
  }),
};

// Dropdown item animation variants
const dropdownItemVariants: Variants = {
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
  iconBg: string;
  iconBorder: string;
  glowColor: string;
}

// ============================================
// STEP DATA
// ============================================

const steps: Step[] = [
  {
    icon: MapPin,
    title: "Check Coverage",
    description: "Enter your address to see if we deliver to you",
    color: "text-rose-500",
    iconBg: "bg-rose-500/25",
    iconBorder: "border-rose-400/50",
    glowColor: "rgba(244,63,94,0.5)",
  },
  {
    icon: UtensilsCrossed,
    title: "Order",
    description: "Browse our menu and add favorites to cart",
    color: "text-amber-500",
    iconBg: "bg-amber-500/25",
    iconBorder: "border-amber-400/50",
    glowColor: "rgba(251,191,36,0.5)",
  },
  {
    icon: Truck,
    title: "Track",
    description: "Real-time updates on your order status",
    color: "text-emerald-500",
    iconBg: "bg-emerald-500/25",
    iconBorder: "border-emerald-400/50",
    glowColor: "rgba(52,211,153,0.5)",
  },
  {
    icon: Sparkles,
    title: "Enjoy",
    description: "Fresh Burmese cuisine delivered to your door",
    color: "text-orange-500",
    iconBg: "bg-orange-500/25",
    iconBorder: "border-orange-400/50",
    glowColor: "rgba(251,146,60,0.5)",
  },
];

// ============================================
// STEP ICON WITH ENHANCED ANIMATIONS
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
        // Larger size
        "relative w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center",
        "border-2 backdrop-blur-lg",
        // Gradient background for depth
        "bg-gradient-to-br from-surface-primary/60 to-surface-primary/40",
        step.iconBorder,
        // Enhanced shadow
        "shadow-[0_4px_16px_rgba(0,0,0,0.1),0_8px_32px_rgba(0,0,0,0.08)]"
      )}
      // Hover: gentle scale
      whileHover={
        shouldAnimate
          ? {
              scale: 1.1,
              transition: spring.snappy,
            }
          : undefined
      }
      whileTap={shouldAnimate ? { scale: 0.95, transition: spring.snappy } : undefined}
    >
      {/* Background glow */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl",
          step.iconBg,
          "opacity-40"
        )}
      />

      {/* Larger icon */}
      <Icon className={cn("w-9 h-9 md:w-10 md:h-10 relative z-10", step.color)} strokeWidth={2} />

      {/* Enhanced step number badge */}
      <span
        className={cn(
          "absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center",
          "font-display font-black text-sm",
          "bg-surface-primary text-text-primary",
          "border-2 border-white/60",
          "shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
        )}
      >
        {index + 1}
      </span>
    </motion.div>
  );
}

// ============================================
// CONNECTOR LINE WITH TRAVELING LIGHT
// ============================================

interface ConnectorProps {
  index: number;
  orientation: "horizontal" | "vertical";
}

function Connector({ index, orientation }: ConnectorProps) {
  const { shouldAnimate } = useAnimationPreference();
  const ref = useRef<HTMLDivElement>(null);
  // Fixed: once: true to prevent infinite update loops
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  if (orientation === "horizontal") {
    return (
      <div
        ref={ref}
        className="hidden md:flex items-center justify-center w-16 lg:w-20"
      >
        <div className="relative h-1 w-full bg-border/20 rounded-full overflow-hidden">
          {/* Glow effect */}
          <div className="absolute inset-0 blur-sm bg-gradient-to-r from-amber-400/30 to-orange-400/30" />

          {/* Animated fill */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-full"
            initial={{ scaleX: 0 }}
            animate={isInView && shouldAnimate ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 + index * 0.2 }}
            style={{ transformOrigin: "left" }}
          />

          {/* Traveling light dot */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            initial={{ left: "0%", opacity: 0 }}
            animate={
              isInView && shouldAnimate
                ? {
                    left: ["0%", "100%"],
                    opacity: [0, 1, 1, 0],
                  }
                : { opacity: 0 }
            }
            transition={{
              duration: 1.5,
              delay: 0.8 + index * 0.2,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>
    );
  }

  // Vertical connector for mobile
  return (
    <div
      ref={ref}
      className="md:hidden w-1 h-10 mx-auto bg-border/20 rounded-full overflow-hidden my-3 relative"
    >
      {/* Glow effect */}
      <div className="absolute inset-0 blur-sm bg-gradient-to-b from-amber-400/30 to-orange-400/30" />

      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-amber-400 via-orange-400 to-rose-400 rounded-full"
        initial={{ scaleY: 0 }}
        animate={isInView && shouldAnimate ? { scaleY: 1 } : { scaleY: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 + index * 0.1 }}
        style={{ transformOrigin: "top" }}
      />

      {/* Traveling light dot */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
        initial={{ top: "0%", opacity: 0 }}
        animate={
          isInView && shouldAnimate
            ? {
                top: ["0%", "100%"],
                opacity: [0, 1, 1, 0],
              }
            : { opacity: 0 }
        }
        transition={{
          duration: 1,
          delay: 0.6 + index * 0.15,
          ease: "easeInOut",
        }}
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
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Track mount state for portal
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update dropdown position when focused
  useEffect(() => {
    if (isFocused && inputWrapperRef.current) {
      const rect = inputWrapperRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isFocused]);

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
      className={cn("w-full", className)}
      initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
      whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, margin: "-50px" }}
      transition={getSpring(spring.gentle)}
    >
      {/* Map Container with Ambient Glow */}
      <motion.div
        initial={shouldAnimate ? { opacity: 0, scale: 0.95 } : undefined}
        whileInView={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
        viewport={{ once: true }}
        transition={{ ...spring.gentle, delay: 0.1 }}
        className="relative mb-4"
      >
        {/* Ambient glow behind map */}
        <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-amber-400/20 via-orange-400/15 to-rose-400/20 blur-xl" />

        <CoverageRouteMap
          {...(selectedAddress &&
            coverageData && {
              destinationLat: selectedAddress.lat,
              destinationLng: selectedAddress.lng,
              encodedPolyline: coverageData.encodedPolyline,
              durationMinutes: coverageData.durationMinutes,
              distanceMiles: coverageData.distanceMiles,
              isValid: coverageData.isValid,
            })}
          className={cn(
            "h-72 md:h-96 lg:h-[28rem] rounded-2xl relative",
            "shadow-[0_8px_40px_rgba(0,0,0,0.2),0_16px_64px_rgba(0,0,0,0.15)]",
            "border-2 border-white/30"
          )}
        />
      </motion.div>

      {/* Search Input */}
      <div className="relative" ref={inputWrapperRef}>
        <motion.div
          animate={isFocused && shouldAnimate ? { scale: 1.01 } : { scale: 1 }}
          transition={getSpring(spring.snappy)}
          className={cn(
            "relative rounded-xl transition-shadow duration-200",
            "ring-1",
            isFocused
              ? "ring-primary shadow-md"
              : "ring-border shadow-sm"
          )}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={isReady ? "Enter your delivery address..." : "Loading..."}
            disabled={!isReady || isCheckingCoverage}
            className={cn(
              "w-full pl-10 pr-10 py-3 rounded-xl",
              "bg-surface-primary",
              "font-body text-sm text-text-primary",
              "placeholder:text-text-secondary placeholder:font-medium",
              "focus:outline-none",
              "transition-all duration-200",
              (!isReady || isCheckingCoverage) && "opacity-60 cursor-not-allowed"
            )}
          />

          {/* Clear / Loading */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isLoadingPlaces || isCheckingCoverage ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-4 h-4 text-primary" />
              </motion.div>
            ) : input ? (
              <motion.button
                type="button"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClear}
                className="p-0.5 rounded-full text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            ) : null}
          </div>
        </motion.div>

        {/* Autocomplete Dropdown - rendered via portal to escape stacking context */}
        {isMounted && createPortal(
          <AnimatePresence>
            {predictions.length > 0 && isFocused && dropdownPosition && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={getSpring(spring.snappy)}
                style={{
                  position: "absolute",
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  width: dropdownPosition.width,
                  backgroundColor: "var(--color-surface-elevated)",
                  opacity: 1,
                }}
                className={cn(
                  "z-[9999]",
                  "rounded-xl",
                  "border border-border",
                  "shadow-[0_10px_40px_rgba(0,0,0,0.3),0_0_0_1px_rgba(0,0,0,0.08)]",
                  "overflow-hidden"
                )}
              >
                {predictions.map((prediction, idx) => (
                  <motion.button
                    key={prediction.placeId}
                    type="button"
                    custom={idx}
                    variants={shouldAnimate ? dropdownItemVariants : undefined}
                    initial="hidden"
                    animate="visible"
                    onClick={() => handleSelectAddress(prediction)}
                    style={{ backgroundColor: "var(--color-surface-elevated)" }}
                    className={cn(
                      "w-full text-left px-3 py-2.5",
                      "hover:bg-surface-secondary",
                      "transition-colors duration-150",
                      "flex items-start gap-2",
                      idx !== predictions.length - 1 && "border-b border-border/50"
                    )}
                  >
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-text-primary truncate">
                        {prediction.mainText}
                      </p>
                      <p className="text-xs text-text-muted truncate">{prediction.secondaryText}</p>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>

      {/* Coverage Result */}
      <AnimatePresence mode="wait">
        {coverageData && selectedAddress && (
          <motion.div
            key={coverageData.isValid ? "success" : "error"}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={getSpring(spring.snappy)}
            className={cn(
              "mt-4 p-4 rounded-2xl",
              "flex items-center gap-4",
              coverageData.isValid
                ? cn(
                    "bg-gradient-to-r from-emerald-50 to-emerald-100/50",
                    "dark:from-emerald-950/40 dark:to-emerald-900/20",
                    "border-2 border-emerald-300 dark:border-emerald-700",
                    "shadow-[0_4px_20px_rgba(52,211,153,0.2)]"
                  )
                : cn(
                    "bg-gradient-to-r from-rose-50 to-rose-100/50",
                    "dark:from-rose-950/40 dark:to-rose-900/20",
                    "border-2 border-rose-300 dark:border-rose-700",
                    "shadow-[0_4px_20px_rgba(244,63,94,0.2)]"
                  )
            )}
          >
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                coverageData.isValid
                  ? "bg-emerald-100 dark:bg-emerald-900/50"
                  : "bg-rose-100 dark:bg-rose-900/50"
              )}
            >
              {coverageData.isValid ? (
                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "font-display font-bold text-base",
                  coverageData.isValid
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-rose-700 dark:text-rose-300"
                )}
              >
                {coverageData.isValid ? "We deliver here!" : "Outside our area"}
              </p>
              <div className="flex items-center gap-3 text-sm text-text-muted mt-1">
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
              </div>
            </div>

            <button
              type="button"
              onClick={handleClear}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium",
                "bg-surface-primary text-text-secondary border border-border",
                "hover:bg-surface-secondary",
                "transition-colors"
              )}
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
// ENHANCED GLASS CARD WRAPPER
// ============================================

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

function GlassCard({ children, className }: GlassCardProps) {
  const { shouldAnimate } = useAnimationPreference();

  return (
    <motion.div
      whileHover={
        shouldAnimate
          ? {
              y: -8,
              scale: 1.02,
              transition: spring.snappy,
            }
          : undefined
      }
      className={cn(
        "relative rounded-3xl p-6 md:p-8",
        // Stronger glass effect
        "bg-surface-primary/85 dark:bg-surface-primary/70",
        "backdrop-blur-2xl",
        // Thicker white-tinted border
        "border-2 border-white/40 dark:border-white/20",
        // Layered shadows with warm glow
        "shadow-[0_8px_32px_rgba(0,0,0,0.15),0_16px_48px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.6)]",
        "hover:shadow-[0_16px_48px_rgba(0,0,0,0.2),0_24px_64px_rgba(0,0,0,0.15),0_0_60px_rgba(251,191,36,0.15)]",
        "transition-all duration-300",
        className
      )}
    >
      {/* Top highlight - stronger gradient */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent rounded-t-3xl" />
      {/* Inner glow layer */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/15 via-transparent to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
}

// ============================================
// STEP CARD
// ============================================

interface StepCardProps {
  step: Step;
  index: number;
  children?: ReactNode;
}

function StepCard({ step, index, children }: StepCardProps) {
  return (
    <motion.div
      custom={index}
      variants={stepCardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="flex flex-col items-center text-center"
    >
      <GlassCard className="w-full">
        <div className="flex flex-col items-center">
          <StepIcon step={step} index={index} />

          {/* Enhanced title - larger with shadow */}
          <h3
            className={cn(
              "font-display font-extrabold text-xl md:text-2xl mt-4 mb-2",
              step.color,
              "drop-shadow-lg"
            )}
          >
            {step.title}
          </h3>

          {/* Enhanced description - larger, better contrast */}
          <p className="font-body text-text-primary font-medium text-base md:text-lg max-w-[220px] drop-shadow-md">
            {step.description}
          </p>
        </div>

        {children}
      </GlassCard>
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
      className={cn("relative py-16 md:py-24 px-4 overflow-hidden", className)}
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

      {/* Vignette overlay for text readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 30%, transparent 0%, rgba(0,0,0,0.25) 100%)`
        }}
      />

      {/* Top gradient for seamless blend with hero */}
      <div
        className="absolute -top-1 left-0 right-0 h-32 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgb(251, 146, 60) 0%, transparent 100%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
          whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          viewport={{ once: true }}
          transition={getSpring(spring.gentle)}
          className="text-center mb-12 md:mb-16"
        >
          {/* Pill badge */}
          <motion.span
            className={cn(
              "inline-block px-5 py-2.5 rounded-full text-base font-body font-bold mb-6",
              "bg-primary text-text-inverse",
              "shadow-[0_4px_20px_rgba(164,16,52,0.4),0_0_40px_rgba(164,16,52,0.2)]",
              "border border-white/20"
            )}
            initial={shouldAnimate ? { scale: 0.9, opacity: 0 } : undefined}
            whileInView={shouldAnimate ? { scale: 1, opacity: 1 } : undefined}
            viewport={{ once: true }}
            transition={getSpring(spring.default)}
          >
            How It Works
          </motion.span>

          {/* Main title - larger with multi-layer text shadow */}
          <h2
            className={cn(
              "font-display text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight tracking-tight",
              "text-text-primary",
              "[text-shadow:0_2px_4px_rgba(0,0,0,0.4),0_4px_12px_rgba(0,0,0,0.3),0_8px_24px_rgba(0,0,0,0.2)]"
            )}
          >
            Order in 4 Simple Steps
          </h2>

          {/* Subtitle - larger with shadow */}
          <p
            className={cn(
              "font-body max-w-xl mx-auto text-lg md:text-xl font-medium",
              "text-text-primary",
              "[text-shadow:0_1px_3px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)]"
            )}
          >
            From checking delivery coverage to enjoying fresh Burmese cuisine at your door
          </p>
        </motion.div>

        {/* Desktop Layout - Coverage checker prominent on left */}
        <div className="hidden md:block">
          <div className="grid grid-cols-12 gap-6 items-start">
            {/* Step 1 - Coverage Checker - takes more space */}
            <div className="col-span-5">
              <StepCard step={steps[0]} index={0}>
                <div className="mt-4 w-full">
                  <InteractiveCoverageChecker />
                </div>
              </StepCard>
            </div>

            {/* Connector */}
            <div className="col-span-1 flex items-center justify-center pt-24">
              <Connector index={0} orientation="horizontal" />
            </div>

            {/* Steps 2-4 stacked */}
            <div className="col-span-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <StepCard step={steps[1]} index={1} />
                </div>
                <Connector index={1} orientation="horizontal" />
                <div className="flex-1">
                  <StepCard step={steps[2]} index={2} />
                </div>
              </div>
              <div className="flex justify-center">
                <Connector index={2} orientation="vertical" />
              </div>
              <div className="flex justify-center">
                <div className="w-1/2">
                  <StepCard step={steps[3]} index={3} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Vertical */}
        <div className="md:hidden">
          <div className="flex flex-col gap-3">
            {steps.map((step, index) => (
              <div key={step.title}>
                <StepCard step={step} index={index}>
                  {index === 0 && (
                    <div className="mt-4 w-full">
                      <InteractiveCoverageChecker />
                    </div>
                  )}
                </StepCard>
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
