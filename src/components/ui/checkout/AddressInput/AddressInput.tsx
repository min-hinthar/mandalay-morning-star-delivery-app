"use client";

/**
 * AddressInput Component
 *
 * Main address selector with saved address list, coverage checking,
 * and new address autocomplete form.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { m } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { staggerContainer } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { Button } from "@/components/ui/button";
import type { Address, CoverageResult } from "@/types/address";
import { KITCHEN_LOCATION, COVERAGE_LIMITS } from "@/types/address";
import type { AddressInputProps } from "./types";
import { AddressCard } from "./AddressCard";
import { MapPreview } from "./MapPreview";
import { AddressAutocomplete } from "./AddressAutocomplete";

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

  const checkCoverage = useCallback(async (address: Address): Promise<CoverageResult> => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const distance = Math.sqrt(
      Math.pow(address.lat - KITCHEN_LOCATION.lat, 2) +
      Math.pow(address.lng - KITCHEN_LOCATION.lng, 2)
    ) * 69;

    const duration = Math.round(distance * 2);

    return {
      isValid: distance <= COVERAGE_LIMITS.maxDistanceMiles,
      distanceMiles: Math.round(distance * 10) / 10,
      durationMinutes: duration,
    };
  }, []);

  useEffect(() => {
    const checkAll = async () => {
      const unchecked = savedAddresses.filter(
        (addr) => !checkedIdsRef.current.has(addr.id)
      );

      if (unchecked.length === 0) return;

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
      <MapPreview address={selectedAddress} coverageResult={selectedCoverage} />

      {!isAddingNew ? (
        <>
          {savedAddresses.length > 0 && (
            <m.div
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
            </m.div>
          )}

          {onAddAddress && (
            <m.button
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
            </m.button>
          )}
        </>
      ) : (
        <m.div
          initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text-primary">Add New Address</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsAddingNew(false)}>
              Cancel
            </Button>
          </div>

          <AddressAutocomplete
            onSelect={(result) => {
              console.log("Selected:", result);
            }}
          />

          <p className="text-xs text-text-muted text-center">
            Start typing your address to search
          </p>
        </m.div>
      )}
    </div>
  );
}

export default AddressInput;
