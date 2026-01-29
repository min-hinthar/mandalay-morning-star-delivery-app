"use client";

import { useMemo, useState, useEffect, useCallback } from "react";

type LuminanceResult = "light" | "dark";

interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Parse various CSS color formats to RGB values (0-255 range)
 */
function parseColorToRGB(color: string): RGB | null {
  if (!color || typeof color !== "string") return null;

  const trimmed = color.trim().toLowerCase();

  // Handle hex colors (#RGB, #RRGGBB, #RRGGBBAA)
  if (trimmed.startsWith("#")) {
    const hex = trimmed.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    }
    if (hex.length === 6 || hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    }
    return null;
  }

  // Handle rgb/rgba
  const rgbMatch = trimmed.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+)?\s*\)/
  );
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  // Handle hsl/hsla
  const hslMatch = trimmed.match(
    /hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*[\d.]+)?\s*\)/
  );
  if (hslMatch) {
    const h = parseFloat(hslMatch[1]) / 360;
    const s = parseFloat(hslMatch[2]) / 100;
    const l = parseFloat(hslMatch[3]) / 100;
    return hslToRGB(h, s, l);
  }

  // Common named colors
  const namedColors: Record<string, RGB> = {
    white: { r: 255, g: 255, b: 255 },
    black: { r: 0, g: 0, b: 0 },
    red: { r: 255, g: 0, b: 0 },
    green: { r: 0, g: 128, b: 0 },
    blue: { r: 0, g: 0, b: 255 },
    cream: { r: 255, g: 254, b: 247 },
    charcoal: { r: 26, g: 26, b: 26 },
  };

  if (namedColors[trimmed]) {
    return namedColors[trimmed];
  }

  return null;
}

/**
 * Convert HSL to RGB
 */
function hslToRGB(h: number, s: number, l: number): RGB {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Calculate relative luminance per WCAG 2.0
 * Formula: L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * Where R, G, B are linearized sRGB values
 */
function calculateLuminance(rgb: RGB): number {
  const linearize = (value: number): number => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };

  const rLinear = linearize(rgb.r);
  const gLinear = linearize(rgb.g);
  const bLinear = linearize(rgb.b);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate weighted average luminance for gradients
 */
function calculateGradientLuminance(colors: string[]): number {
  const luminances = colors
    .map(parseColorToRGB)
    .filter((rgb): rgb is RGB => rgb !== null)
    .map(calculateLuminance);

  if (luminances.length === 0) return 0;

  // Weight toward darker colors (more important for contrast)
  const sorted = luminances.sort((a, b) => a - b);
  const weights = sorted.map((_, i) => sorted.length - i);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  return sorted.reduce((sum, lum, i) => sum + lum * weights[i], 0) / totalWeight;
}

// WCAG contrast threshold
// If luminance > 0.179, background is "light" and needs dark text
const LUMINANCE_THRESHOLD = 0.179;

/**
 * Determine if a background color is light or dark
 */
export function getTextColorForBackground(color: string): LuminanceResult {
  const rgb = parseColorToRGB(color);
  if (!rgb) return "dark"; // Default to assuming dark background

  const luminance = calculateLuminance(rgb);
  return luminance > LUMINANCE_THRESHOLD ? "light" : "dark";
}

/**
 * Determine text color for gradient backgrounds
 */
export function getTextColorForGradient(colors: string[]): LuminanceResult {
  const luminance = calculateGradientLuminance(colors);
  return luminance > LUMINANCE_THRESHOLD ? "light" : "dark";
}

/**
 * Hook to determine text color based on a static color value
 */
export function useLuminance(color: string): LuminanceResult {
  return useMemo(() => getTextColorForBackground(color), [color]);
}

/**
 * Hook to determine text color based on gradient colors
 */
export function useGradientLuminance(colors: string[]): LuminanceResult {
  return useMemo(() => getTextColorForGradient(colors), [colors]);
}

interface DynamicLuminanceResult {
  luminance: LuminanceResult;
  isReady: boolean;
}

/**
 * Hook to sample background color from a DOM element
 * Useful for dynamic/animated backgrounds
 */
export function useDynamicLuminance(
  elementRef: React.RefObject<HTMLElement | null>,
  defaultResult: LuminanceResult = "dark"
): DynamicLuminanceResult {
  const [result, setResult] = useState<LuminanceResult>(defaultResult);
  const [isReady, setIsReady] = useState(false);

  const sampleBackground = useCallback(() => {
    if (!elementRef.current) return;

    const computedStyle = window.getComputedStyle(elementRef.current);
    const bgColor = computedStyle.backgroundColor;
    const bgImage = computedStyle.backgroundImage;

    // If there's a solid background color
    if (bgColor && bgColor !== "rgba(0, 0, 0, 0)" && bgColor !== "transparent") {
      setResult(getTextColorForBackground(bgColor));
      setIsReady(true);
      return;
    }

    // If there's a gradient, try to extract colors
    if (bgImage && bgImage.includes("gradient")) {
      const colorMatches = bgImage.match(
        /#[a-fA-F0-9]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)/g
      );
      if (colorMatches && colorMatches.length > 0) {
        setResult(getTextColorForGradient(colorMatches));
        setIsReady(true);
        return;
      }
    }

    // Default fallback
    setResult(defaultResult);
    setIsReady(true);
  }, [elementRef, defaultResult]);

  useEffect(() => {
    // Initial sample
    sampleBackground();

    // Re-sample on resize (in case of responsive changes)
    window.addEventListener("resize", sampleBackground);
    return () => window.removeEventListener("resize", sampleBackground);
  }, [sampleBackground]);

  return { luminance: result, isReady };
}

/**
 * Get CSS classes for text based on background luminance
 *
 * Note: drop-shadow values are dynamic based on background luminance.
 * Values range from ~--text-shadow-sm (normal) to ~--text-shadow-md (strong).
 * Kept as arbitrary values since shadow intensity adapts to image/background content,
 * and the light vs dark text shadows require different base colors (white vs black).
 *
 * @example
 * // For light backgrounds: dark text with light drop-shadow for legibility
 * // For dark backgrounds: light text with dark drop-shadow for legibility
 */
export function getContrastTextClasses(
  luminance: LuminanceResult,
  options?: {
    withShadow?: boolean;
    intensity?: "normal" | "strong";
  }
): string {
  const { withShadow = false, intensity = "normal" } = options || {};

  const textColor =
    luminance === "light"
      ? "text-[var(--color-charcoal)]"
      : "text-[var(--color-cream)]";

  if (!withShadow) return textColor;

  // Dynamic drop-shadow based on luminance - cannot use single token as
  // light backgrounds need white-tinted shadows and dark need black-tinted
  const shadow =
    luminance === "light"
      ? intensity === "strong"
        ? "drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]" // ~--text-shadow-md for light bg
        : "drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]" // ~--text-shadow-sm for light bg
      : intensity === "strong"
        ? "drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" // ~--text-shadow-md for dark bg
        : "drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"; // ~--text-shadow-sm for dark bg

  return `${textColor} ${shadow}`;
}

export default useLuminance;
