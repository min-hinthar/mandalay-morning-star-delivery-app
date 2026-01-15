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
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative w-full rounded-xl border-2 p-5 text-left transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isSelected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border bg-card hover:border-primary/40 hover:bg-card/80 hover:shadow-sm"
      )}
    >
      <div className="flex items-start gap-4">
        <motion.div
          animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.3 }}
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200",
            isSelected
              ? "bg-primary text-white shadow-sm"
              : "bg-secondary/60 text-muted-foreground"
          )}
        >
          {isSelected ? (
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              <Check className="h-5 w-5" strokeWidth={3} />
            </motion.div>
          ) : (
            <MapPin className="h-5 w-5" />
          )}
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-semibold transition-colors duration-200",
              isSelected ? "text-primary" : "text-foreground"
            )}>
              {address.label}
            </span>
            {address.isDefault && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                <Star className="h-3 w-3 fill-current" />
                Default
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground truncate">
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
          className="absolute inset-0 rounded-xl border-2 border-primary"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </motion.button>
  );
}
