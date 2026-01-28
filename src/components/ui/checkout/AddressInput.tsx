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
  Navigation,
  Loader2,
  Plus,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerContainer, staggerItem, routeDraw } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { Button } from "@/components/ui/button";
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
  const { shouldAnimate, getSpring } = useAnimationPreference();
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
      transition={getSpring(spring.default)}
      className={cn(
        "relative rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-surface-secondary to-surface-tertiary",
        "border border-border",
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
          transition={{ ...getSpring(spring.ultraBouncy), delay: 0.2 }}
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
              className="absolute -inset-3 bg-primary rounded-full"
            />
            <div className="relative w-8 h-8 rounded-full bg-primary text-text-inverse flex items-center justify-center shadow-lg">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-text-muted mt-1 text-center whitespace-nowrap">
            Kitchen
          </p>
        </motion.div>

        {/* Delivery marker */}
        {address && (
          <motion.div
            className="absolute bottom-1/3 right-1/3"
            initial={shouldAnimate ? { scale: 0, y: -20 } : undefined}
            animate={shouldAnimate ? { scale: 1, y: 0 } : undefined}
            transition={{ ...getSpring(spring.ultraBouncy), delay: 0.4 }}
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
                  coverageResult?.isValid ? "bg-green" : "bg-status-error"
                )}
              />
              <div className={cn(
                "relative w-8 h-8 rounded-full text-text-inverse flex items-center justify-center shadow-lg",
                coverageResult?.isValid ? "bg-green" : "bg-status-error"
              )}>
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-text-muted mt-1 text-center whitespace-nowrap">
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
              variants={routeDraw.path}
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
            className="text-center text-text-muted"
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
            "bg-surface-primary/90 backdrop-blur-sm",
            "flex items-center justify-between text-sm"
          )}
        >
          <span className="font-medium text-text-primary">
            {coverageResult.distanceMiles.toFixed(1)} miles
          </span>
          <span className="text-text-secondary">
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
        transition={getSpring(spring.snappy)}
        className="relative"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
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
            "rounded-xl border border-border",
            "bg-surface-primary text-text-primary",
            "placeholder:text-text-muted",
            "focus:outline-none focus:border-primary",
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
        {results.length > 0 && isFocused && (
          <motion.div
            initial={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
            exit={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
            transition={getSpring(spring.snappy)}
            className={cn(
              "absolute top-full left-0 right-0 mt-2 z-10",
              "bg-surface-primary rounded-xl",
              "border border-border shadow-elevated",
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
                  "hover:bg-surface-secondary",
                  "transition-colors duration-150",
                  "flex items-start gap-3",
                  index !== results.length - 1 && "border-b border-border"
                )}
              >
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-text-primary">
                    {result.mainText}
                  </p>
                  <p className="text-sm text-text-secondary">
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
