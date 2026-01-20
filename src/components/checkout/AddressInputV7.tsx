"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Search,
  Check,
  X,
  AlertCircle,
  Home,
  Briefcase,
  Navigation,
  Loader2,
  Plus,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { v7Spring, v7StaggerContainer, v7StaggerItem, v7RouteDraw } from "@/lib/motion-tokens-v7";
import { useAnimationPreferenceV7 } from "@/lib/hooks/useAnimationPreferenceV7";
import { Button } from "@/components/ui/button";
import type { Address, CoverageResult } from "@/types/address";
import { KITCHEN_LOCATION, COVERAGE_LIMITS } from "@/types/address";

// ============================================
// TYPES
// ============================================

export interface AddressInputV7Props {
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
}

// ============================================
// ADDRESS CARD
// ============================================

interface AddressCardV7Props {
  address: Address;
  isSelected: boolean;
  coverageStatus?: CoverageResult | null;
  onSelect: () => void;
  index: number;
}

function AddressCardV7({
  address,
  isSelected,
  coverageStatus,
  onSelect,
}: AddressCardV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();

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
      variants={shouldAnimate ? v7StaggerItem : undefined}
      whileHover={shouldAnimate ? { scale: 1.02, y: -2 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
      transition={getSpring(v7Spring.snappy)}
      className={cn(
        "w-full text-left p-4 rounded-xl",
        "border-2 transition-colors duration-200",
        isSelected
          ? "border-v6-primary bg-v6-primary-light/30"
          : "border-v6-border bg-v6-surface-primary hover:border-v6-primary/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v6-primary focus-visible:ring-offset-2"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Selection indicator */}
        <motion.div
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
            isSelected
              ? "bg-v6-primary text-white"
              : "bg-v6-surface-tertiary text-v6-text-muted"
          )}
          animate={isSelected && shouldAnimate ? {
            scale: [1, 1.2, 1],
          } : undefined}
          transition={getSpring(v7Spring.ultraBouncy)}
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
            <span className="font-semibold text-v6-text-primary">
              {address.label}
            </span>
            {address.isDefault && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-v6-secondary/20 text-v6-secondary-hover font-medium">
                Default
              </span>
            )}
          </div>

          <p className="text-sm text-v6-text-secondary line-clamp-2">
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
                  ? "text-v6-green"
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
          "w-5 h-5 text-v6-text-muted transition-transform",
          isSelected && "text-v6-primary rotate-90"
        )} />
      </div>
    </motion.button>
  );
}

// ============================================
// ANIMATED MAP PREVIEW
// ============================================

interface MapPreviewV7Props {
  address: Address | null;
  coverageResult?: CoverageResult | null;
  className?: string;
}

export function MapPreviewV7({ address, coverageResult, className }: MapPreviewV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();
  const [showRoute, setShowRoute] = useState(false);

  useEffect(() => {
    if (address && coverageResult?.isValid) {
      const timer = setTimeout(() => setShowRoute(true), 500);
      return () => clearTimeout(timer);
    }
    setShowRoute(false);
  }, [address, coverageResult]);

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, scale: 0.95 } : undefined}
      animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
      transition={getSpring(v7Spring.default)}
      className={cn(
        "relative rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-v6-surface-secondary to-v6-surface-tertiary",
        "border border-v6-border",
        "h-48",
        className
      )}
    >
      {/* Placeholder map with styled markers */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Kitchen marker */}
        <motion.div
          className="absolute top-1/3 left-1/3"
          initial={shouldAnimate ? { scale: 0, y: -20 } : undefined}
          animate={shouldAnimate ? { scale: 1, y: 0 } : undefined}
          transition={{ ...getSpring(v7Spring.ultraBouncy), delay: 0.2 }}
        >
          <div className="relative">
            <motion.div
              animate={shouldAnimate ? {
                scale: [1, 1.5, 1],
                opacity: [0.5, 0.2, 0.5],
              } : undefined}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              className="absolute -inset-3 bg-v6-primary rounded-full"
            />
            <div className="relative w-8 h-8 rounded-full bg-v6-primary text-white flex items-center justify-center shadow-lg">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-v6-text-muted mt-1 text-center whitespace-nowrap">
            Kitchen
          </p>
        </motion.div>

        {/* Delivery marker */}
        {address && (
          <motion.div
            className="absolute bottom-1/3 right-1/3"
            initial={shouldAnimate ? { scale: 0, y: -20 } : undefined}
            animate={shouldAnimate ? { scale: 1, y: 0 } : undefined}
            transition={{ ...getSpring(v7Spring.ultraBouncy), delay: 0.4 }}
          >
            <div className="relative">
              <motion.div
                animate={shouldAnimate && coverageResult?.isValid ? {
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0.2, 0.5],
                } : undefined}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: 0.5,
                }}
                className={cn(
                  "absolute -inset-3 rounded-full",
                  coverageResult?.isValid ? "bg-v6-green" : "bg-red-500"
                )}
              />
              <div className={cn(
                "relative w-8 h-8 rounded-full text-white flex items-center justify-center shadow-lg",
                coverageResult?.isValid ? "bg-v6-green" : "bg-red-500"
              )}>
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-v6-text-muted mt-1 text-center whitespace-nowrap">
              {address.label}
            </p>
          </motion.div>
        )}

        {/* Animated route line */}
        {showRoute && coverageResult?.isValid && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <motion.path
              d="M 33% 33% Q 50% 20% 67% 67%"
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="3"
              strokeDasharray="8 4"
              variants={v7RouteDraw.path}
              initial="initial"
              animate="animate"
            />
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A41034" />
                <stop offset="100%" stopColor="#52A52E" />
              </linearGradient>
            </defs>
          </svg>
        )}

        {/* Empty state */}
        {!address && (
          <motion.div
            initial={shouldAnimate ? { opacity: 0 } : undefined}
            animate={shouldAnimate ? { opacity: 1 } : undefined}
            className="text-center text-v6-text-muted"
          >
            <Navigation className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select an address to see delivery route</p>
          </motion.div>
        )}
      </div>

      {/* Distance indicator */}
      {coverageResult && address && (
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.6 }}
          className={cn(
            "absolute bottom-3 left-3 right-3",
            "p-2 rounded-lg",
            "bg-white/90 backdrop-blur-sm",
            "flex items-center justify-between text-sm"
          )}
        >
          <span className="font-medium text-v6-text-primary">
            {coverageResult.distanceMiles.toFixed(1)} miles
          </span>
          <span className="text-v6-text-secondary">
            ~{coverageResult.durationMinutes} min delivery
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================
// AUTOCOMPLETE INPUT
// ============================================

interface AddressAutocompleteV7Props {
  onSelect: (result: AddressAutocompleteResult) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocompleteV7({
  onSelect,
  placeholder = "Search for an address...",
  className,
}: AddressAutocompleteV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AddressAutocompleteResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Simulated autocomplete - in real app, use Google Places API
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Mock results
    const mockResults: AddressAutocompleteResult[] = [
      {
        placeId: "1",
        description: `${searchQuery}, Covina, CA, USA`,
        mainText: searchQuery,
        secondaryText: "Covina, CA, USA",
      },
      {
        placeId: "2",
        description: `${searchQuery}, West Covina, CA, USA`,
        mainText: searchQuery,
        secondaryText: "West Covina, CA, USA",
      },
    ];

    setResults(mockResults);
    setIsLoading(false);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const handleSelect = useCallback((result: AddressAutocompleteResult) => {
    setQuery(result.description);
    setResults([]);
    onSelect(result);
  }, [onSelect]);

  return (
    <div className={cn("relative", className)}>
      {/* Input */}
      <motion.div
        animate={isFocused && shouldAnimate ? {
          scale: 1.01,
          boxShadow: "0 0 0 3px rgba(164, 16, 52, 0.1)",
        } : {
          scale: 1,
          boxShadow: "0 0 0 0px rgba(164, 16, 52, 0)",
        }}
        transition={getSpring(v7Spring.snappy)}
        className="relative"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-v6-text-muted" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          className={cn(
            "w-full pl-12 pr-10 py-3",
            "rounded-xl border border-v6-border",
            "bg-v6-surface-primary text-v6-text-primary",
            "placeholder:text-v6-text-muted",
            "focus:outline-none focus:border-v6-primary",
            "transition-colors duration-200"
          )}
        />
        {query && (
          <motion.button
            type="button"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => {
              setQuery("");
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-v6-text-muted hover:text-v6-text-primary"
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
            <Loader2 className="w-4 h-4 text-v6-primary" />
          </motion.div>
        )}
      </motion.div>

      {/* Results dropdown */}
      <AnimatePresence>
        {results.length > 0 && isFocused && (
          <motion.div
            initial={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
            exit={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
            transition={getSpring(v7Spring.snappy)}
            className={cn(
              "absolute top-full left-0 right-0 mt-2 z-50",
              "bg-v6-surface-primary rounded-xl",
              "border border-v6-border shadow-v6-elevated",
              "overflow-hidden"
            )}
          >
            {results.map((result, index) => (
              <motion.button
                key={result.placeId}
                type="button"
                onClick={() => handleSelect(result)}
                initial={shouldAnimate ? { opacity: 0, x: -10 } : undefined}
                animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "w-full text-left px-4 py-3",
                  "hover:bg-v6-surface-secondary",
                  "transition-colors duration-150",
                  "flex items-start gap-3",
                  index !== results.length - 1 && "border-b border-v6-border"
                )}
              >
                <MapPin className="w-5 h-5 text-v6-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-v6-text-primary">
                    {result.mainText}
                  </p>
                  <p className="text-sm text-v6-text-secondary">
                    {result.secondaryText}
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

export function AddressInputV7({
  savedAddresses = [],
  selectedAddress,
  onAddressSelect,
  onAddAddress,
  showAddForm = false,
  className,
}: AddressInputV7Props) {
  const { shouldAnimate } = useAnimationPreferenceV7();
  const [isAddingNew, setIsAddingNew] = useState(showAddForm);
  const [coverageResults, setCoverageResults] = useState<Map<string, CoverageResult>>(new Map());

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
    savedAddresses.forEach(async (address) => {
      if (!coverageResults.has(address.id)) {
        const result = await checkCoverage(address);
        setCoverageResults((prev) => new Map(prev).set(address.id, result));
      }
    });
  }, [savedAddresses, checkCoverage, coverageResults]);

  const selectedCoverage = selectedAddress
    ? coverageResults.get(selectedAddress.id)
    : null;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Map Preview */}
      <MapPreviewV7
        address={selectedAddress}
        coverageResult={selectedCoverage}
      />

      {/* Saved addresses or autocomplete */}
      {!isAddingNew ? (
        <>
          {/* Saved addresses list */}
          {savedAddresses.length > 0 && (
            <motion.div
              variants={shouldAnimate ? v7StaggerContainer(0.08, 0.1) : undefined}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {savedAddresses.map((address, index) => (
                <AddressCardV7
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
                "border-2 border-dashed border-v6-border",
                "hover:border-v6-primary/50 hover:bg-v6-primary-light/10",
                "transition-colors duration-200",
                "flex items-center justify-center gap-2",
                "text-v6-text-secondary hover:text-v6-primary",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v6-primary"
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
            <h3 className="font-semibold text-v6-text-primary">
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

          <AddressAutocompleteV7
            onSelect={(result) => {
              // In real app, geocode and create address
              console.log("Selected:", result);
            }}
          />

          <p className="text-xs text-v6-text-muted text-center">
            Start typing your address to search
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default AddressInputV7;
