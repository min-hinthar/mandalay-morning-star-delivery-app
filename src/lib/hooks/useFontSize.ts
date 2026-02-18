"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Font size presets mapped to pixel values.
 * Applied via CSS custom property --font-size-base on <html>.
 */
export const FONT_SIZES = {
  small: 14,
  medium: 16,
  large: 18,
} as const;

export type FontSize = keyof typeof FONT_SIZES;

const STORAGE_KEY = "font-size";
const CSS_PROPERTY = "--font-size-base";

function isValidFontSize(value: string | null): value is FontSize {
  return value === "small" || value === "medium" || value === "large";
}

/**
 * Hook to manage base font size via CSS custom property.
 * Persists to localStorage. Hydration-safe (renders default until mounted).
 *
 * @example
 * const { size, setFontSize, sizes } = useFontSize();
 * <button onClick={() => setFontSize("large")}>Large</button>
 */
export function useFontSize() {
  const [size, setSize] = useState<FontSize>("medium");

  // Read stored preference on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const validated = isValidFontSize(stored) ? stored : "medium";
    setSize(validated);
    document.documentElement.style.setProperty(CSS_PROPERTY, FONT_SIZES[validated] + "px");
  }, []);

  const setFontSize = useCallback((newSize: FontSize) => {
    localStorage.setItem(STORAGE_KEY, newSize);
    setSize(newSize);
    document.documentElement.style.setProperty(CSS_PROPERTY, FONT_SIZES[newSize] + "px");
  }, []);

  return { size, setFontSize, sizes: FONT_SIZES };
}
