"use client";

import { Check, MapPin, Star } from "lucide-react";
import { motion } from "framer-motion";
import type { Address } from "@/types/address";
import { cn } from "@/lib/utils/cn";

interface AddressCardProps {
  address: Address;
  isSelected: boolean;
  onSelect: () => void;
}

export function AddressCard({ address, isSelected, onSelect }: AddressCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative w-full rounded-lg border-2 p-4 text-left transition-all",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2",
        isSelected
          ? "border-brand-red bg-brand-red/5"
          : "border-border hover:border-brand-red/50"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
            isSelected ? "bg-brand-red text-white" : "bg-muted text-muted-foreground"
          )}
        >
          {isSelected ? (
            <Check className="h-4 w-4" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{address.label}</span>
            {address.isDefault && (
              <span className="flex items-center gap-1 text-xs text-amber-600">
                <Star className="h-3 w-3 fill-current" />
                Default
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground truncate">
            {address.line1}
            {address.line2 && `, ${address.line2}`}
          </p>
          <p className="text-sm text-muted-foreground">
            {address.city}, {address.state} {address.postalCode}
          </p>
        </div>
      </div>

      {isSelected && (
        <motion.div
          layoutId="selectedAddress"
          className="absolute inset-0 rounded-lg border-2 border-brand-red"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </motion.button>
  );
}
