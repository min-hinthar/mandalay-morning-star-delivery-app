"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Search,
  Check,
  X,
  AlertCircle,
  Home,
  Briefcase,
  Loader2,
  Plus,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import {
  usePlacesAutocomplete,
  type PlacePrediction,
} from "@/lib/hooks/usePlacesAutocomplete";
import { Button } from "@/components/ui/button";
import { CoverageRouteMap } from "@/components/ui/coverage/CoverageRouteMap";
import type { Address, CoverageResult } from "@/types/address";
import { KITCHEN_LOCATION, COVERAGE_LIMITS } from "@/types/address";

// ============================================
// TYPES
// ============================================

export interface AddressInputProps {
  /** List of saved addresses */
  savedAddresses?: Address[];
  /** Currently selected address */
  selectedAddress: Address | null;
  /** Callback when address is selected */
  onAddressSelect: (address: Address) => void;
  /** Callback when new address is added */
  onAddAddress?: (address: Omit<Address, "id" | "userId" | "createdAt" | "updatedAt">) => void;
  /** Whether to show add new address form */
  showAddForm?: boolean;
  /** Additional className */
  className?: string;
}

export interface AddressAutocompleteResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  lat?: number;
  lng?: number;
}

// ============================================
// ADDRESS CARD
// ============================================

interface AddressCardProps {
  address: Address;
  isSelected: boolean;
  coverageStatus?: CoverageResult | null;
  onSelect: () => void;
  index: number;
}

function AddressCard({
  address,
  isSelected,
  coverageStatus,
  onSelect,
}: AddressCardProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const labelIcon = address.label === "Home" ? (
    <Home className="w-4 h-4" />
  ) : address.label === "Work" ? (
    <Briefcase className="w-4 h-4" />
  ) : (
    <MapPin className="w-4 h-4" />
  );

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      variants={shouldAnimate ? staggerItem : undefined}
      whileHover={shouldAnimate ? { scale: 1.02, y: -2 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
      transition={getSpring(spring.snappy)}
      className={cn(
        "w-full text-left p-4 rounded-xl",
        "border-2 transition-colors duration-200",
        isSelected
          ? "border-primary bg-primary-light/30"
          : "border-border bg-surface-primary hover:border-primary/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Selection indicator */}
        <motion.div
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
            isSelected
              ? "bg-primary text-text-inverse"
              : "bg-surface-tertiary text-text-muted"
          )}
          animate={isSelected && shouldAnimate ? {
            scale: [1, 1.2, 1],
          } : undefined}
          transition={getSpring(spring.ultraBouncy)}
        >
          {isSelected ? (
            <Check className="w-4 h-4" />
          ) : (
            labelIcon
          )}
        </motion.div>

        {/* Address details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-text-primary">
              {address.label}
            </span>
            {address.isDefault && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary-hover font-medium">
                Default
              </span>
            )}
          </div>

          <p className="text-sm text-text-secondary line-clamp-2">
            {address.formattedAddress || `${address.line1}, ${address.city}, ${address.state} ${address.postalCode}`}
          </p>

          {/* Coverage status */}
          {coverageStatus && (
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 5 } : undefined}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
              className={cn(
                "mt-2 flex items-center gap-2 text-xs",
                coverageStatus.isValid
                  ? "text-green"
                  : "text-red-500"
              )}
            >
              {coverageStatus.isValid ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>
                    {coverageStatus.distanceMiles.toFixed(1)} mi • ~{coverageStatus.durationMinutes} min
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3" />
                  <span>Outside delivery area</span>
                </>
              )}
            </motion.div>
          )}
        </div>

        <ChevronRight className={cn(
          "w-5 h-5 text-text-muted transition-transform",
          isSelected && "text-primary rotate-90"
        )} />
      </div>
    </motion.button>
  );
}

// ============================================
// ANIMATED MAP PREVIEW
// ============================================

interface MapPreviewProps {
  address: Address | null;
  coverageResult?: CoverageResult | null;
  className?: string;
}

export function MapPreview({ address, coverageResult, className }: MapPreviewProps) {
  // Always render interactive Google Map by default
  // Pass destination props only when address and coverage are available
  const hasDestination = address && coverageResult && address.lat && address.lng;

  return (
    <CoverageRouteMap
      {...(hasDestination && {
        destinationLat: address.lat,
        destinationLng: address.lng,
        encodedPolyline: coverageResult.encodedPolyline,
        durationMinutes: coverageResult.durationMinutes,
        distanceMiles: coverageResult.distanceMiles,
        isValid: coverageResult.isValid,
      })}
      className={cn("h-48", className)}
    />
  );
}

// ============================================
// AUTOCOMPLETE INPUT
// ============================================

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

  // Cleanup blur timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  // Real Google Places autocomplete with 300ms debounce
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

      // Get lat/lng from place details
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
      {/* Input */}
      <motion.div
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
          <motion.button
            type="button"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
        {isLoading && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="absolute right-4 top-1/2 -translate-y-1/2"
          >
            <Loader2 className="w-4 h-4 text-primary" />
          </motion.div>
        )}
      </motion.div>

      {/* Results dropdown */}
      <AnimatePresence>
        {predictions.length > 0 && isFocused && (
          <motion.div
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
              <motion.button
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
                  <p className="font-medium text-text-primary">
                    {prediction.mainText}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {prediction.secondaryText}
                  </p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function AddressInput({
  savedAddresses = [],
  selectedAddress,
  onAddressSelect,
  onAddAddress,
  showAddForm = false,
  className,
}: AddressInputProps) {
  const { shouldAnimate } = useAnimationPreference();
  const [isAddingNew, setIsAddingNew] = useState(showAddForm);
  const [coverageResults, setCoverageResults] = useState<Map<string, CoverageResult>>(new Map());
  const checkedIdsRef = useRef<Set<string>>(new Set());

  // Simulate coverage check
  const checkCoverage = useCallback(async (address: Address): Promise<CoverageResult> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Calculate distance (simplified)
    const distance = Math.sqrt(
      Math.pow(address.lat - KITCHEN_LOCATION.lat, 2) +
      Math.pow(address.lng - KITCHEN_LOCATION.lng, 2)
    ) * 69; // Rough miles conversion

    const duration = Math.round(distance * 2); // Rough estimate

    return {
      isValid: distance <= COVERAGE_LIMITS.maxDistanceMiles,
      distanceMiles: Math.round(distance * 10) / 10,
      durationMinutes: duration,
    };
  }, []);

  // Check coverage for all saved addresses
  useEffect(() => {
    const checkAll = async () => {
      const unchecked = savedAddresses.filter(
        (addr) => !checkedIdsRef.current.has(addr.id)
      );

      if (unchecked.length === 0) return;

      // Mark as checking to prevent duplicate calls
      unchecked.forEach((addr) => checkedIdsRef.current.add(addr.id));

      const results = await Promise.all(
        unchecked.map(async (address) => ({
          id: address.id,
          result: await checkCoverage(address),
        }))
      );

      setCoverageResults((prev) => {
        const next = new Map(prev);
        results.forEach(({ id, result }) => next.set(id, result));
        return next;
      });
    };

    checkAll();
  }, [savedAddresses, checkCoverage]);

  const selectedCoverage = selectedAddress
    ? coverageResults.get(selectedAddress.id)
    : null;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Map Preview */}
      <MapPreview
        address={selectedAddress}
        coverageResult={selectedCoverage}
      />

      {/* Saved addresses or autocomplete */}
      {!isAddingNew ? (
        <>
          {/* Saved addresses list */}
          {savedAddresses.length > 0 && (
            <motion.div
              variants={shouldAnimate ? staggerContainer(0.08, 0.1) : undefined}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {savedAddresses.map((address, index) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  isSelected={selectedAddress?.id === address.id}
                  coverageStatus={coverageResults.get(address.id)}
                  onSelect={() => onAddressSelect(address)}
                  index={index}
                />
              ))}
            </motion.div>
          )}

          {/* Add new address button */}
          {onAddAddress && (
            <motion.button
              type="button"
              onClick={() => setIsAddingNew(true)}
              whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
              className={cn(
                "w-full p-4 rounded-xl",
                "border-2 border-dashed border-border",
                "hover:border-primary/50 hover:bg-primary-light/10",
                "transition-colors duration-200",
                "flex items-center justify-center gap-2",
                "text-text-secondary hover:text-primary",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              )}
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add New Address</span>
            </motion.button>
          )}
        </>
      ) : (
        /* Add new address form */
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text-primary">
              Add New Address
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddingNew(false)}
            >
              Cancel
            </Button>
          </div>

          <AddressAutocomplete
            onSelect={(result) => {
              // In real app, geocode and create address
              console.log("Selected:", result);
            }}
          />

          <p className="text-xs text-text-muted text-center">
            Start typing your address to search
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default AddressInput;
