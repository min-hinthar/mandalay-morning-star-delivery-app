/**
 * V7 High Contrast Toggle - Pepper Aesthetic with Spring Animation
 *
 * Toggle switch for driver high-contrast mode with bouncy spring physics.
 * Uses AnimatedToggle for satisfying motion feel.
 */

"use client";

import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useDriverContrast } from "@/contexts/DriverContrastContext";
import { AnimatedToggle } from "@/components/ui/animated-toggle";

interface HighContrastToggleProps {
  className?: string;
}

export function HighContrastToggle({ className }: HighContrastToggleProps) {
  const { isHighContrast, toggleContrast } = useDriverContrast();

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="text-text-secondary">
        {isHighContrast ? (
          <Moon className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Sun className="h-5 w-5" aria-hidden="true" />
        )}
      </span>
      <AnimatedToggle
        checked={isHighContrast}
        onCheckedChange={toggleContrast}
        size="md"
        aria-label={isHighContrast ? "Switch to standard contrast" : "Switch to high contrast"}
      />
    </div>
  );
}
