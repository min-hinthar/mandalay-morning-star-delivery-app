"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { m, AnimatePresence } from "framer-motion";
import { MapPin, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCoverageCheck } from "@/lib/hooks/useCoverageCheck";
import {
  usePlacesAutocomplete,
  type PlacePrediction,
} from "@/lib/hooks/usePlacesAutocomplete";
import { CoverageRouteMap } from "@/components/ui/coverage/CoverageRouteMap";
import { CoverageResult } from "./CoverageResult";
import { dropdownItemVariants } from "./variants";

interface InteractiveCoverageCheckerProps {
  className?: string;
}

export function InteractiveCoverageChecker({ className }: InteractiveCoverageCheckerProps) {
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
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track mount state for portal
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cleanup blur timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
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
    <m.div
      className={cn("w-full", className)}
      initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
      whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, margin: "-50px" }}
      transition={getSpring(spring.gentle)}
    >
      {/* Map Container with Ambient Glow */}
      <m.div
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
      </m.div>

      {/* Search Input */}
      <div className="relative" ref={inputWrapperRef}>
        <m.div
          animate={isFocused && shouldAnimate ? { scale: 1.01 } : { scale: 1 }}
          transition={getSpring(spring.snappy)}
          className={cn(
            "relative rounded-xl transition-shadow duration-200",
            "ring-1",
            isFocused ? "ring-primary shadow-md" : "ring-border shadow-sm"
          )}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              if (blurTimeoutRef.current) {
                clearTimeout(blurTimeoutRef.current);
              }
              blurTimeoutRef.current = setTimeout(() => setIsFocused(false), 200);
            }}
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
              <m.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: 20, ease: "linear" }}
              >
                <Loader2 className="w-4 h-4 text-primary" />
              </m.div>
            ) : input ? (
              <m.button
                type="button"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClear}
                className="p-0.5 rounded-full text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </m.button>
            ) : null}
          </div>
        </m.div>

        {/* Autocomplete Dropdown - rendered via portal to escape stacking context */}
        {isMounted && createPortal(
          <AnimatePresence>
            {predictions.length > 0 && isFocused && dropdownPosition && (
              <m.div
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
                  <m.button
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
                  </m.button>
                ))}
              </m.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>

      {/* Coverage Result */}
      <CoverageResult
        coverageData={coverageData}
        selectedAddress={selectedAddress}
        onClear={handleClear}
      />
    </m.div>
  );
}
