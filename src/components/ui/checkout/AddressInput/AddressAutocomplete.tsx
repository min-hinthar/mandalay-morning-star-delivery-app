"use client";

/**
 * AddressAutocomplete Component
 *
 * Google Places autocomplete input with animated dropdown.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { MapPin, Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import {
  usePlacesAutocomplete,
  type PlacePrediction,
} from "@/lib/hooks/usePlacesAutocomplete";
import type { AddressAutocompleteResult } from "./types";

interface AddressAutocompleteProps {
  onSelect: (result: AddressAutocompleteResult) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({
  onSelect,
  placeholder = "Search for an address...",
  className,
}: AddressAutocompleteProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const {
    input,
    setInput,
    predictions,
    isLoading,
    isReady,
    getPlaceDetails,
    clearPredictions,
    clearInput,
  } = usePlacesAutocomplete({ debounceMs: 300 });

  const handleSelect = useCallback(
    async (prediction: PlacePrediction) => {
      setInput(prediction.description);
      clearPredictions();

      const details = await getPlaceDetails(prediction.placeId);

      onSelect({
        placeId: prediction.placeId,
        description: prediction.description,
        mainText: prediction.mainText,
        secondaryText: prediction.secondaryText,
        ...(details && { lat: details.lat, lng: details.lng }),
      });
    },
    [setInput, clearPredictions, getPlaceDetails, onSelect]
  );

  const handleClear = useCallback(() => {
    clearInput();
    inputRef.current?.focus();
  }, [clearInput]);

  return (
    <div className={cn("relative", className)}>
      <m.div
        animate={isFocused && shouldAnimate ? {
          scale: 1.01,
          boxShadow: "var(--shadow-focus)",
        } : {
          scale: 1,
          boxShadow: "var(--shadow-none)",
        }}
        transition={getSpring(spring.snappy)}
        className="relative"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
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
          placeholder={isReady ? placeholder : "Loading..."}
          disabled={!isReady}
          className={cn(
            "w-full pl-12 pr-10 py-3",
            "rounded-xl border border-border",
            "bg-surface-primary text-text-primary",
            "placeholder:text-text-muted",
            "focus:outline-none focus:border-primary",
            "transition-colors duration-200",
            !isReady && "opacity-50 cursor-not-allowed"
          )}
        />
        {input && (
          <m.button
            type="button"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </m.button>
        )}
        {isLoading && (
          <m.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: 20, ease: "linear" }}
            className="absolute right-4 top-1/2 -translate-y-1/2"
          >
            <Loader2 className="w-4 h-4 text-primary" />
          </m.div>
        )}
      </m.div>

      <AnimatePresence>
        {predictions.length > 0 && isFocused && (
          <m.div
            initial={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
            exit={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
            transition={getSpring(spring.snappy)}
            className={cn(
              "absolute top-full left-0 right-0 mt-2 z-[9999]",
              "bg-surface-elevated rounded-xl",
              "border border-border",
              "shadow-[0_10px_40px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.05)]",
              "overflow-hidden"
            )}
          >
            {predictions.map((prediction, index) => (
              <m.button
                key={prediction.placeId}
                type="button"
                onClick={() => handleSelect(prediction)}
                initial={shouldAnimate ? { opacity: 0, x: -10 } : undefined}
                animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "w-full text-left px-4 py-3",
                  "bg-surface-elevated",
                  "hover:bg-surface-secondary",
                  "transition-colors duration-150",
                  "flex items-start gap-3",
                  index !== predictions.length - 1 && "border-b border-border/50"
                )}
              >
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-text-primary">{prediction.mainText}</p>
                  <p className="text-sm text-text-secondary">{prediction.secondaryText}</p>
                </div>
              </m.button>
            ))}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
