"use client";

import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useDriverContrast } from "@/contexts/DriverContrastContext";

interface HighContrastToggleProps {
  className?: string;
}

/**
 * Toggle button for driver high-contrast mode
 *
 * Features:
 * - 48px touch target for accessibility
 * - Visual indicator of current mode
 * - Persists preference in localStorage
 */
export function HighContrastToggle({ className }: HighContrastToggleProps) {
  const { isHighContrast, toggleContrast } = useDriverContrast();

  return (
    <button
      onClick={toggleContrast}
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-full",
        "transition-colors",
        isHighContrast
          ? "bg-text-primary text-text-inverse"
          : "bg-surface-tertiary text-text-secondary hover:bg-surface-secondary",
        className
      )}
      aria-label={isHighContrast ? "Switch to standard contrast" : "Switch to high contrast"}
      aria-pressed={isHighContrast}
    >
      {isHighContrast ? (
        <Moon className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Sun className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}
