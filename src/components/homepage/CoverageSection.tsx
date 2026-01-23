"use client";

import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useLoadScript } from "@react-google-maps/api";
import {
  CheckCircle,
  XCircle,
  MapPin,
  Clock,
  Ruler,
  Sparkles,
  Navigation,
  Target,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useCoverageCheck } from "@/lib/hooks/useCoverageCheck";
import { PlacesAutocomplete } from "@/components/map/PlacesAutocomplete";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  spring,
  staggerContainer,
  staggerItem,
} from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { COVERAGE_LIMITS } from "@/types/address";
import { BrandMascot } from "@/components/mascot/BrandMascot";

// Dynamically import map to avoid SSR issues
const CoverageMap = dynamic(
  () => import("@/components/map/CoverageMap").then((mod) => mod.CoverageMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[300px] md:h-[400px] bg-surface-secondary rounded-2xl animate-pulse flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <MapPin className="w-8 h-8 text-primary/50" />
          <span className="text-text-muted font-body">Loading map...</span>
        </motion.div>
      </div>
    ),
  }
);

const libraries: ("places")[] = ["places"];

// ============================================
// TYPES
// ============================================

export interface CoverageSectionProps {
  /** Section title */
  title?: string;
  /** Section subtitle */
  subtitle?: string;
  /** Additional className */
  className?: string;
}

interface UserLocation {
  lat: number;
  lng: number;
  formattedAddress: string;
}

// ============================================
// ANIMATED INPUT WRAPPER
// ============================================

interface AnimatedInputProps {
  children: React.ReactNode;
  isFocused: boolean;
}

function AnimatedInput({ children, isFocused }: AnimatedInputProps) {
  const { shouldAnimate } = useAnimationPreference();

  return (
    <motion.div
      className={cn(
        "relative rounded-input transition-shadow duration-300",
        isFocused && "ring-4 ring-primary/20"
      )}
      animate={shouldAnimate && isFocused ? {
        boxShadow: [
          "0 0 0 0 rgba(164, 16, 52, 0)",
          "0 0 20px 5px rgba(164, 16, 52, 0.2)",
          "0 0 0 0 rgba(164, 16, 52, 0)",
        ],
      } : undefined}
      transition={{ duration: 1.5, repeat: isFocused ? Infinity : 0 }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// SUCCESS RESULT CARD
// ============================================

interface SuccessResultProps {
  result: {
    formattedAddress?: string;
    distanceMiles: number;
    durationMinutes: number;
  };
}

function SuccessResult({ result }: SuccessResultProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [showConfetti, setShowConfetti] = useState(true);

  return (
    <motion.div
      className="p-6 rounded-card-sm bg-gradient-to-br from-green/10 to-green/5 border-2 border-green/30 relative overflow-hidden"
      initial={shouldAnimate ? { opacity: 0, scale: 0.9, y: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, scale: 1, y: 0 } : undefined}
      transition={getSpring(spring.rubbery)}
    >
      {/* Confetti burst */}
      <AnimatePresence>
        {showConfetti && shouldAnimate && (
          <>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-lg"
                style={{
                  left: "50%",
                  top: "50%",
                }}
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i / 12) * Math.PI * 2) * 100,
                  y: Math.sin((i / 12) * Math.PI * 2) * 100,
                  opacity: [0, 1, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, delay: i * 0.05 }}
                onAnimationComplete={() => i === 11 && setShowConfetti(false)}
              >
                {["🎉", "✨", "🎊", "⭐"][i % 4]}
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      <div className="flex items-start gap-4 relative z-dropdown">
        <motion.div
          className="p-2 bg-green/20 rounded-full"
          animate={shouldAnimate ? {
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0],
          } : undefined}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <CheckCircle className="w-6 h-6 text-green" />
        </motion.div>

        <div className="flex-1">
          <motion.h3
            className="font-display text-xl text-green font-semibold mb-2"
            initial={shouldAnimate ? { opacity: 0, x: -20 } : undefined}
            animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
            transition={{ delay: 0.1 }}
          >
            Great News! We Deliver Here 🎉
          </motion.h3>

          <motion.p
            className="font-body text-text-secondary text-sm mb-4"
            initial={shouldAnimate ? { opacity: 0 } : undefined}
            animate={shouldAnimate ? { opacity: 1 } : undefined}
            transition={{ delay: 0.2 }}
          >
            {result.formattedAddress}
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-4"
            initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 text-sm font-body">
              <Ruler className="w-4 h-4 text-green" />
              <span className="font-medium text-text-primary">
                {result.distanceMiles.toFixed(1)} miles
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm font-body">
              <Clock className="w-4 h-4 text-green" />
              <span className="font-medium text-text-primary">
                ~{result.durationMinutes} min drive
              </span>
            </div>
          </motion.div>

          <motion.div
            className="mt-4 pt-4 border-t border-green/20"
            initial={shouldAnimate ? { opacity: 0 } : undefined}
            animate={shouldAnimate ? { opacity: 1 } : undefined}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 text-green">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-body font-medium">
                Free delivery on orders over $100!
              </span>
            </div>
          </motion.div>
        </div>

        {/* Mascot celebration */}
        <motion.div
          className="hidden md:block"
          initial={shouldAnimate ? { scale: 0, rotate: -180 } : undefined}
          animate={shouldAnimate ? { scale: 1, rotate: 0 } : undefined}
          transition={getSpring(spring.rubbery)}
        >
          <BrandMascot size="sm" expression="celebrating" />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ============================================
// ERROR RESULT CARD
// ============================================

interface ErrorResultProps {
  result: {
    formattedAddress?: string;
    distanceMiles: number;
    reason?: string;
  };
}

function ErrorResult({ result }: ErrorResultProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <motion.div
      className="p-6 rounded-card-sm bg-gradient-to-br from-status-error/10 to-status-error/5 border-2 border-status-error/30"
      initial={shouldAnimate ? { opacity: 0, scale: 0.9, y: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, scale: 1, y: 0 } : undefined}
      transition={getSpring(spring.default)}
    >
      <div className="flex items-start gap-4">
        <motion.div
          className="p-2 bg-status-error/20 rounded-full"
          animate={shouldAnimate ? {
            rotate: [0, -5, 5, -5, 0],
          } : undefined}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <XCircle className="w-6 h-6 text-status-error" />
        </motion.div>

        <div className="flex-1">
          <h3 className="font-display text-xl text-status-error font-semibold mb-2">
            Outside Delivery Area
          </h3>
          <p className="font-body text-text-secondary text-sm mb-2">
            {result.formattedAddress || "This address is outside our delivery zone."}
          </p>
          <p className="text-sm font-body text-status-error">
            {result.reason === "DISTANCE_EXCEEDED" &&
              `This location is ${result.distanceMiles.toFixed(1)} miles away (max ${COVERAGE_LIMITS.maxDistanceMiles} miles).`}
            {result.reason === "DURATION_EXCEEDED" &&
              `The drive time exceeds our maximum of ${COVERAGE_LIMITS.maxDurationMinutes} minutes.`}
            {result.reason === "GEOCODE_FAILED" &&
              "We couldn't find this address. Please try a different address."}
            {result.reason === "INVALID_ADDRESS" &&
              "Please enter a valid street address."}
          </p>
        </div>

        {/* Mascot sad */}
        <motion.div
          className="hidden md:block"
          initial={shouldAnimate ? { scale: 0 } : undefined}
          animate={shouldAnimate ? { scale: 1 } : undefined}
          transition={getSpring(spring.default)}
        >
          <BrandMascot size="sm" expression="thinking" />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ============================================
// PULSING ZONE INDICATOR
// ============================================

function ZoneIndicator() {
  const { shouldAnimate } = useAnimationPreference();

  return (
    <motion.div
      className="flex items-center gap-2 text-sm text-primary font-medium"
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
    >
      <motion.div
        className="relative"
        animate={shouldAnimate ? {
          scale: [1, 1.2, 1],
        } : undefined}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Target className="w-4 h-4" />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary"
          animate={shouldAnimate ? {
            scale: [1, 2],
            opacity: [0.5, 0],
          } : undefined}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
      <span>50 mile coverage radius from Covina, CA</span>
    </motion.div>
  );
}

// ============================================
// MAIN COVERAGE SECTION COMPONENT
// ============================================

export function CoverageSection({
  title = "Check If We Deliver To You",
  subtitle,
  className,
}: CoverageSectionProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const sectionRef = useRef<HTMLElement>(null);
  const headerInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const [userLocation, setUserLocation] = useState<UserLocation | undefined>();
  const [addressInput, setAddressInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const { mutate, data: coverageResult, isPending, reset } = useCoverageCheck();

  // Load Google Maps script
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  // Handle place selection from autocomplete
  const handlePlaceSelect = useCallback(
    (place: { formattedAddress: string; lat: number; lng: number }) => {
      setUserLocation({
        lat: place.lat,
        lng: place.lng,
        formattedAddress: place.formattedAddress,
      });
      setAddressInput(place.formattedAddress);

      // Trigger coverage check
      reset();
      mutate({ lat: place.lat, lng: place.lng });
    },
    [mutate, reset]
  );

  // Handle manual form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!addressInput.trim()) return;

      reset();
      mutate({ address: addressInput.trim() });
    },
    [addressInput, mutate, reset]
  );

  // Clear results
  const handleClear = useCallback(() => {
    setUserLocation(undefined);
    setAddressInput("");
    reset();
  }, [reset]);

  const defaultSubtitle = `We deliver within ${COVERAGE_LIMITS.maxDistanceMiles} miles of our Covina kitchen every Saturday. Enter your address to see if you're in our delivery zone!`;

  return (
    <section
      ref={sectionRef}
      id="coverage"
      className={cn(
        "py-16 md:py-24 px-4 bg-gradient-to-b from-surface-primary to-surface-secondary/50 overflow-hidden isolate",
        className
      )}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          variants={staggerContainer()}
          initial={shouldAnimate ? "hidden" : undefined}
          animate={headerInView && shouldAnimate ? "visible" : undefined}
        >
          <motion.div
            variants={staggerItem}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-teal/10 rounded-pill mb-4"
          >
            <motion.div
              animate={shouldAnimate ? { rotate: [0, 360] } : undefined}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Navigation className="w-4 h-4 text-accent-teal" />
            </motion.div>
            <span className="text-sm font-body font-medium text-accent-teal">
              Delivery Coverage
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
            {subtitle || defaultSubtitle}
          </motion.p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Side - Form */}
          <motion.div
            initial={shouldAnimate ? { opacity: 0, x: -30 } : undefined}
            whileInView={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
            viewport={{ once: true }}
            transition={getSpring(spring.default)}
          >
            <div className="bg-surface-primary rounded-card p-6 md:p-8 shadow-card border border-border">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-body font-medium text-text-primary mb-2">
                    Your Delivery Address
                  </label>
                  <AnimatedInput isFocused={isFocused}>
                    {isLoaded ? (
                      <div
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                      >
                        <PlacesAutocomplete
                          onPlaceSelect={handlePlaceSelect}
                          value={addressInput}
                          onChange={setAddressInput}
                          placeholder="Start typing your address..."
                          disabled={isPending}
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value)}
                        placeholder="Enter your delivery address"
                        className="w-full px-4 py-4 rounded-input border-2 border-border bg-surface-primary font-body text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors duration-fast"
                        disabled={isPending}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                      />
                    )}
                  </AnimatedInput>
                </div>

                <div className="flex gap-3">
                  <motion.div
                    className="flex-1"
                    whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
                    whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
                  >
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={!addressInput.trim()}
                      isLoading={isPending}
                      loadingText="Checking..."
                      className="w-full h-14 relative overflow-hidden group"
                    >
                      <span className="relative z-dropdown flex items-center justify-center gap-2">
                        <Zap className="w-4 h-4" />
                        Check Coverage
                      </span>
                      {shouldAnimate && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                        />
                      )}
                    </Button>
                  </motion.div>

                  <AnimatePresence>
                    {(coverageResult || userLocation) && (
                      <motion.div
                        initial={shouldAnimate ? { opacity: 0, scale: 0.8, width: 0 } : undefined}
                        animate={shouldAnimate ? { opacity: 1, scale: 1, width: "auto" } : undefined}
                        exit={shouldAnimate ? { opacity: 0, scale: 0.8, width: 0 } : undefined}
                        transition={getSpring(spring.snappy)}
                      >
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleClear}
                          className="h-14 px-6"
                        >
                          Clear
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </form>

              {/* Coverage Result */}
              <AnimatePresence mode="wait">
                {coverageResult && (
                  <motion.div
                    key={coverageResult.isValid ? "success" : "error"}
                    className="mt-6"
                    initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
                    animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
                    exit={shouldAnimate ? { opacity: 0, y: -20 } : undefined}
                  >
                    {coverageResult.isValid ? (
                      <SuccessResult result={coverageResult} />
                    ) : (
                      <ErrorResult result={coverageResult} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Info Box */}
              <motion.div
                className="mt-6 p-4 rounded-card-sm bg-accent-teal/5 border border-accent-teal/20"
                initial={shouldAnimate ? { opacity: 0 } : undefined}
                whileInView={shouldAnimate ? { opacity: 1 } : undefined}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-accent-teal flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-body text-text-secondary">
                      <strong className="text-accent-teal">Delivery Times:</strong> Every Saturday, 11am - 7pm PT.
                      Order by Friday 3pm to get delivery this Saturday!
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Zone indicator */}
              <div className="mt-4">
                <ZoneIndicator />
              </div>
            </div>
          </motion.div>

          {/* Right Side - Map */}
          <motion.div
            className="h-[300px] md:h-[500px] lg:h-full lg:min-h-[500px]"
            initial={shouldAnimate ? { opacity: 0, x: 30 } : undefined}
            whileInView={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
            viewport={{ once: true }}
            transition={{ ...getSpring(spring.default), delay: 0.2 }}
          >
            {isLoaded ? (
              <motion.div
                className="w-full h-full rounded-card overflow-hidden shadow-card border border-border"
                whileHover={shouldAnimate ? {
                  boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
                } : undefined}
                transition={getSpring(spring.snappy)}
              >
                <CoverageMap
                  userLocation={
                    userLocation ||
                    (coverageResult?.lat && coverageResult?.lng
                      ? {
                          lat: coverageResult.lat,
                          lng: coverageResult.lng,
                          formattedAddress: coverageResult.formattedAddress || "",
                        }
                      : undefined)
                  }
                  routeInfo={
                    coverageResult
                      ? {
                          distanceMiles: coverageResult.distanceMiles,
                          durationMinutes: coverageResult.durationMinutes,
                        }
                      : undefined
                  }
                  showRoute={!!coverageResult?.isValid}
                  className="w-full h-full min-h-[300px]"
                />
              </motion.div>
            ) : (
              <div className="w-full h-full min-h-[300px] bg-surface-secondary rounded-card flex items-center justify-center border border-border">
                <motion.div
                  className="text-center"
                  animate={shouldAnimate ? { opacity: [0.5, 1, 0.5] } : undefined}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="font-body text-text-muted">Loading map...</p>
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default CoverageSection;
