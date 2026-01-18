"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Home,
  Building2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

interface SavedAddress {
  id: string;
  label: "Home" | "Work" | "Other";
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
}

interface AddressInputProps {
  savedAddresses?: SavedAddress[];
  selectedAddressId?: string | null;
  onAddressSelect: (address: SavedAddress | null) => void;
  onAddNewAddress?: () => void;
  coverageStatus?: "idle" | "checking" | "valid" | "invalid";
  className?: string;
}

// Mock suggestions for demo - in production, use Google Places API
const MOCK_SUGGESTIONS = [
  { id: "1", description: "123 Main Street, Covina, CA 91723" },
  { id: "2", description: "456 Oak Avenue, Pomona, CA 91766" },
  { id: "3", description: "789 Palm Drive, West Covina, CA 91790" },
  { id: "4", description: "321 Maple Lane, Glendora, CA 91741" },
];

const LABEL_ICONS = {
  Home: Home,
  Work: Building2,
  Other: MapPin,
};

export function AddressInput({
  savedAddresses = [],
  selectedAddressId,
  onAddressSelect,
  onAddNewAddress,
  coverageStatus = "idle",
  className,
}: AddressInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isNewAddressMode, setIsNewAddressMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = inputValue.length >= 3
    ? MOCK_SUGGESTIONS.filter((s) =>
        s.description.toLowerCase().includes(inputValue.toLowerCase())
      )
    : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(e.target.value.length >= 3);
  };

  const handleSuggestionClick = (suggestion: typeof MOCK_SUGGESTIONS[0]) => {
    setInputValue(suggestion.description);
    setShowSuggestions(false);
    // In production, parse the address and trigger coverage check
  };

  const handleSavedAddressClick = (address: SavedAddress) => {
    setIsNewAddressMode(false);
    onAddressSelect(address);
  };

  const handleAddNewClick = () => {
    setIsNewAddressMode(true);
    onAddressSelect(null);
    setTimeout(() => inputRef.current?.focus(), 100);
    if (onAddNewAddress) {
      onAddNewAddress();
    }
  };

  const handleClearInput = () => {
    setInputValue("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className={cn("space-y-4", className)} ref={containerRef}>
      {/* Section Label */}
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-[var(--color-interactive-primary)]" />
        <h3 className="font-semibold text-[var(--color-text-primary)]">
          Delivery Address
        </h3>
      </div>

      {/* Saved Addresses */}
      {savedAddresses.length > 0 && !isNewAddressMode && (
        <div className="space-y-3">
          {savedAddresses.map((address) => {
            const Icon = LABEL_ICONS[address.label] || MapPin;
            const isSelected = selectedAddressId === address.id;

            return (
              <motion.button
                key={address.id}
                type="button"
                onClick={() => handleSavedAddressClick(address)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive-primary)]",
                  isSelected
                    ? "border-[var(--color-interactive-primary)] bg-[var(--color-interactive-primary-light)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-interactive-primary)]/50"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Radio indicator */}
                  <div
                    className={cn(
                      "mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      isSelected
                        ? "border-[var(--color-interactive-primary)] bg-[var(--color-interactive-primary)]"
                        : "border-[var(--color-border)]"
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="h-2 w-2 rounded-full bg-white"
                      />
                    )}
                  </div>

                  {/* Address content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {address.label}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      {address.line1}
                      {address.line2 && `, ${address.line2}`}
                      <br />
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Add New Address Button */}
      {!isNewAddressMode && (
        <button
          type="button"
          onClick={handleAddNewClick}
          className={cn(
            "w-full p-4 rounded-xl border-2 border-dashed",
            "border-[var(--color-border)] hover:border-[var(--color-interactive-primary)]/50",
            "bg-transparent hover:bg-[var(--color-interactive-primary-light)]/30",
            "text-[var(--color-text-secondary)] hover:text-[var(--color-interactive-primary)]",
            "flex items-center justify-center gap-2 transition-all duration-200"
          )}
        >
          <Plus className="h-5 w-5" />
          <span className="font-semibold">Add New Address</span>
        </button>
      )}

      {/* New Address Input */}
      {isNewAddressMode && (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-secondary)]" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => inputValue.length >= 3 && setShowSuggestions(true)}
              placeholder="Enter your address..."
              className={cn(
                "w-full h-12 pl-12 pr-12 rounded-xl",
                "border-2 border-[var(--color-border)]",
                "bg-[var(--color-surface)] text-[var(--color-text-primary)]",
                "placeholder:text-[var(--color-text-secondary)]",
                "focus:outline-none focus:border-[var(--color-interactive-primary)]",
                "transition-colors duration-200"
              )}
            />
            {inputValue && (
              <button
                type="button"
                onClick={handleClearInput}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--color-surface-muted)] transition-colors"
              >
                <X className="h-4 w-4 text-[var(--color-text-secondary)]" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {showSuggestions && filteredSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "absolute z-10 w-full mt-2 py-2 rounded-xl",
                  "bg-[var(--color-surface)] border border-[var(--color-border)]",
                  "shadow-[var(--shadow-lg)]"
                )}
              >
                {filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={cn(
                      "w-full px-4 py-3 text-left flex items-center gap-3",
                      "hover:bg-[var(--color-surface-muted)] transition-colors"
                    )}
                  >
                    <MapPin className="h-4 w-4 text-[var(--color-text-secondary)] flex-shrink-0" />
                    <span className="text-sm text-[var(--color-text-primary)]">
                      {suggestion.description}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back to saved addresses */}
          {savedAddresses.length > 0 && (
            <button
              type="button"
              onClick={() => setIsNewAddressMode(false)}
              className="mt-3 text-sm text-[var(--color-interactive-primary)] hover:underline"
            >
              ← Use saved address instead
            </button>
          )}
        </div>
      )}

      {/* Coverage Status */}
      <AnimatePresence mode="wait">
        {coverageStatus === "checking" && (
          <motion.div
            key="checking"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-surface-muted)]"
          >
            <Loader2 className="h-5 w-5 text-[var(--color-interactive-primary)] animate-spin" />
            <span className="text-sm text-[var(--color-text-secondary)]">
              Checking delivery coverage...
            </span>
          </motion.div>
        )}

        {coverageStatus === "valid" && (
          <motion.div
            key="valid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-status-success-bg)] border border-[var(--color-accent-secondary)]/20"
          >
            <div className="h-8 w-8 rounded-full bg-[var(--color-accent-secondary)] flex items-center justify-center flex-shrink-0">
              <Check className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-[var(--color-accent-secondary)]">
              Address is in our delivery area
            </span>
          </motion.div>
        )}

        {coverageStatus === "invalid" && (
          <motion.div
            key="invalid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-[var(--color-status-error)]/20 bg-[var(--color-status-error-bg)] overflow-hidden"
          >
            <div className="flex items-center gap-3 p-4 border-b border-[var(--color-status-error)]/10">
              <AlertTriangle className="h-5 w-5 text-[var(--color-status-error)]" />
              <span className="font-semibold text-[var(--color-status-error)]">
                Outside Delivery Area
              </span>
            </div>

            {/* Coverage Map Placeholder */}
            <div className="h-40 bg-[var(--color-surface-muted)] flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-[var(--color-text-secondary)] mx-auto mb-2" />
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Coverage map placeholder
                </p>
              </div>
            </div>

            <div className="p-4">
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                We deliver within 50 miles of our Covina kitchen.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearInput}
                className="w-full border-[var(--color-status-error)]/30 text-[var(--color-status-error)] hover:bg-[var(--color-status-error)]/10"
              >
                Try a different address
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
