"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 50,
  disabled = false,
}: QuantitySelectorProps) {
  const canDecrement = value > min && !disabled;
  const canIncrement = value < max && !disabled;

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(value - 1)}
        disabled={!canDecrement}
        aria-label="Decrease quantity"
        className="h-10 w-10"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <span
        className={cn(
          "w-12 text-center text-lg font-semibold tabular-nums",
          disabled && "text-muted-foreground"
        )}
        aria-live="polite"
        aria-atomic="true"
      >
        {value}
      </span>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(value + 1)}
        disabled={!canIncrement}
        aria-label="Increase quantity"
        className="h-10 w-10"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
