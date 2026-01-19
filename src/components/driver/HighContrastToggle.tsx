/**
 * V6 High Contrast Toggle - Pepper Aesthetic
 *
 * Toggle button for driver high-contrast mode with V6 styling.
 * 56px touch target for accessibility, persists preference.
 */

"use client";

import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useDriverContrast } from "@/contexts/DriverContrastContext";

interface HighContrastToggleProps {
  className?: string;
}

export function HighContrastToggle({ className }: HighContrastToggleProps) {
  const { isHighContrast, toggleContrast } = useDriverContrast();

  return (
    <button
      onClick={toggleContrast}
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-full",
        "transition-all duration-v6-fast",
        isHighContrast
          ? "bg-v6-text-primary text-white"
          : "bg-v6-surface-tertiary text-v6-text-secondary hover:bg-v6-surface-secondary",
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
