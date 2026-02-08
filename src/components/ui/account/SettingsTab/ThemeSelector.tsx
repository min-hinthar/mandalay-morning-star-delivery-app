"use client";

/**
 * ThemeSelector — Light / Dark / System selector with color preview swatches.
 * Uses next-themes for instant apply. Optional onThemeChange callback for DB sync.
 */

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface ThemeSelectorProps {
  onThemeChange?: (theme: string) => void;
}

const THEME_OPTIONS = [
  {
    key: "light",
    label: "Light",
    colors: ["#FFFFFF", "#F3F4F6", "#F59E0B", "#1F2937"],
  },
  {
    key: "dark",
    label: "Dark",
    colors: ["#1E293B", "#334155", "#F59E0B", "#F8FAFC"],
  },
  {
    key: "system",
    label: "System",
    colors: ["#FFFFFF", "#1E293B", "#F59E0B", "#6B7280"],
  },
] as const;

export function ThemeSelector({ onThemeChange }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — render neutral state until mounted
  useEffect(() => setMounted(true), []);

  function handleSelect(key: string) {
    setTheme(key);
    onThemeChange?.(key);
  }

  if (!mounted) {
    // Skeleton placeholder matching layout dimensions
    return (
      <div className="flex gap-3">
        {THEME_OPTIONS.map((opt) => (
          <div
            key={opt.key}
            className="flex-1 rounded-card-sm border border-border bg-surface-secondary p-3 h-[72px]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {THEME_OPTIONS.map((opt) => {
        const isSelected = theme === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => handleSelect(opt.key)}
            className={cn(
              "flex-1 rounded-card-sm border-2 p-3 transition-colors",
              "flex flex-col items-center gap-2",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              isSelected
                ? "border-primary bg-surface-primary"
                : "border-border bg-surface-secondary hover:border-primary/50",
            )}
          >
            {/* Color swatches */}
            <div className="flex gap-1.5">
              {opt.colors.map((color, i) => (
                <span
                  key={i}
                  className="h-5 w-5 rounded-full border border-border/30"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            {/* Label */}
            <span
              className={cn(
                "text-xs font-medium",
                isSelected ? "text-primary" : "text-text-secondary",
              )}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
