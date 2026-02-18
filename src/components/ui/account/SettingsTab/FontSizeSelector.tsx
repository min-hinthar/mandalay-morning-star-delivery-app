"use client";

/**
 * FontSizeSelector — Segmented "Aa" buttons at different sizes.
 * Instant WYSIWYG apply via useFontSize hook (CSS custom property).
 */

import { useFontSize, type FontSize } from "@/lib/hooks/useFontSize";
import { cn } from "@/lib/utils/cn";

const OPTIONS: { key: FontSize; label: string; displaySize: number }[] = [
  { key: "small", label: "Small", displaySize: 13 },
  { key: "medium", label: "Medium", displaySize: 16 },
  { key: "large", label: "Large", displaySize: 19 },
];

export function FontSizeSelector() {
  const { size, setFontSize } = useFontSize();

  return (
    <div className="flex gap-2">
      {OPTIONS.map((opt) => {
        const isSelected = size === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => setFontSize(opt.key)}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 rounded-card-sm border-2 py-3 px-2 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              isSelected
                ? "bg-primary text-text-inverse border-primary"
                : "bg-surface-primary text-text-secondary border-border hover:border-primary/50"
            )}
          >
            <span
              className="font-semibold leading-none"
              style={{ fontSize: opt.displaySize + "px" }}
            >
              Aa
            </span>
            <span className="text-2xs leading-none opacity-80">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
