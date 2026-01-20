/**
 * V7 Animated Gradient System
 * Dynamic, time-based gradient backgrounds
 *
 * Features:
 * - Smooth color transitions
 * - Time-of-day awareness
 * - Performance-optimized CSS variable updates
 * - Multiple gradient styles (linear, radial, mesh)
 */

import { getAnimationPreferenceV7 } from "../hooks/useAnimationPreferenceV7";

// ============================================
// TYPES
// ============================================

export interface GradientColor {
  r: number;
  g: number;
  b: number;
}

export interface GradientStop {
  color: GradientColor;
  position: number; // 0-100
}

export interface AnimatedGradientConfig {
  /** Colors to cycle through */
  colors: string[];
  /** Animation duration in ms */
  duration?: number;
  /** Gradient angle (for linear) */
  angle?: number;
  /** Gradient type */
  type?: "linear" | "radial" | "conic";
  /** CSS variable name to update */
  cssVariable?: string;
  /** Whether to auto-start */
  autoStart?: boolean;
}

// ============================================
// V7 COLOR PALETTES
// ============================================

export const v7Palettes = {
  /** Pepper brand colors */
  brand: [
    "#A41034", // Deep Red
    "#EBCD00", // Golden Yellow
    "#52A52E", // Vibrant Green
    "#E87D1E", // Warm Orange
  ],

  /** Warm sunset tones */
  sunset: [
    "#FF6B6B",
    "#FFA07A",
    "#FFD93D",
    "#FF8C00",
  ],

  /** Cool ocean tones */
  ocean: [
    "#00979D",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
  ],

  /** Burmese gold accents */
  gold: [
    "#D4A017",
    "#EBCD00",
    "#FFD700",
    "#DAA520",
  ],

  /** Night mode */
  night: [
    "#1a1a2e",
    "#16213e",
    "#0f3460",
    "#1a1a2e",
  ],

  /** Morning dawn */
  dawn: [
    "#FFE5D9",
    "#FFCAD4",
    "#F4ACB7",
    "#FFB5A7",
  ],
} as const;

// ============================================
// TIME-OF-DAY PALETTES
// ============================================

export function getTimeOfDayPalette(): string[] {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 8) {
    // Dawn (5-8am)
    return [...v7Palettes.dawn];
  } else if (hour >= 8 && hour < 12) {
    // Morning (8am-12pm)
    return ["#FFF9F5", "#FFE8D6", "#EBCD00", "#FFD93D"];
  } else if (hour >= 12 && hour < 17) {
    // Afternoon (12-5pm)
    return [...v7Palettes.brand];
  } else if (hour >= 17 && hour < 20) {
    // Evening (5-8pm)
    return [...v7Palettes.sunset];
  } else {
    // Night (8pm-5am)
    return [...v7Palettes.night];
  }
}

// ============================================
// ANIMATED GRADIENT CLASS
// ============================================

export class AnimatedGradient {
  private config: Required<AnimatedGradientConfig>;
  private animationId: number | null = null;
  private startTime = 0;
  private isRunning = false;
  private element: HTMLElement | null = null;

  constructor(config: AnimatedGradientConfig) {
    this.config = {
      colors: config.colors,
      duration: config.duration ?? 10000,
      angle: config.angle ?? 135,
      type: config.type ?? "linear",
      cssVariable: config.cssVariable ?? "--gradient-bg",
      autoStart: config.autoStart ?? true,
    };

    if (this.config.autoStart && getAnimationPreferenceV7() !== "none") {
      this.start();
    }
  }

  /**
   * Attach to a DOM element
   */
  attach(element: HTMLElement): void {
    this.element = element;
    this.updateGradient(0);
  }

  /**
   * Start the animation
   */
  start(): void {
    if (this.isRunning) return;
    if (getAnimationPreferenceV7() === "none") return;

    this.isRunning = true;
    this.startTime = performance.now();
    this.animate();
  }

  /**
   * Stop the animation
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Destroy the gradient
   */
  destroy(): void {
    this.stop();
    this.element = null;
  }

  /**
   * Set new colors
   */
  setColors(colors: string[]): void {
    this.config.colors = colors;
  }

  /**
   * Parse hex color to RGB
   */
  private hexToRgb(hex: string): GradientColor {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  /**
   * Interpolate between two colors
   */
  private interpolateColor(
    color1: GradientColor,
    color2: GradientColor,
    factor: number
  ): string {
    const r = Math.round(color1.r + (color2.r - color1.r) * factor);
    const g = Math.round(color1.g + (color2.g - color1.g) * factor);
    const b = Math.round(color1.b + (color2.b - color1.b) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Get current gradient value
   */
  private getGradientValue(progress: number): string {
    const { colors, angle, type } = this.config;
    const colorCount = colors.length;

    // Calculate current color indices
    const scaledProgress = progress * colorCount;
    const index1 = Math.floor(scaledProgress) % colorCount;
    const index2 = (index1 + 1) % colorCount;
    const factor = scaledProgress - Math.floor(scaledProgress);

    const color1 = this.hexToRgb(colors[index1]);
    const color2 = this.hexToRgb(colors[index2]);
    const color3 = this.hexToRgb(colors[(index2 + 1) % colorCount]);

    const currentColor1 = this.interpolateColor(color1, color2, factor);
    const currentColor2 = this.interpolateColor(color2, color3, factor);

    switch (type) {
      case "radial":
        return `radial-gradient(circle at 50% 50%, ${currentColor1} 0%, ${currentColor2} 100%)`;
      case "conic":
        return `conic-gradient(from ${angle}deg, ${currentColor1}, ${currentColor2}, ${currentColor1})`;
      case "linear":
      default:
        return `linear-gradient(${angle}deg, ${currentColor1} 0%, ${currentColor2} 100%)`;
    }
  }

  /**
   * Update the gradient
   */
  private updateGradient(progress: number): void {
    const gradient = this.getGradientValue(progress);

    if (this.element) {
      this.element.style.setProperty(this.config.cssVariable, gradient);
    } else {
      document.documentElement.style.setProperty(this.config.cssVariable, gradient);
    }
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    if (!this.isRunning) return;

    const elapsed = performance.now() - this.startTime;
    const progress = (elapsed % this.config.duration) / this.config.duration;

    this.updateGradient(progress);

    this.animationId = requestAnimationFrame(this.animate);
  };
}

// ============================================
// REACT HOOK
// ============================================

import { useEffect, useRef, useCallback } from "react";

export function useAnimatedGradient(
  config: Partial<Omit<AnimatedGradientConfig, "autoStart">> = {}
) {
  const gradientRef = useRef<AnimatedGradient | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  // Initialize once on mount - config is intentionally not in deps to avoid re-creating WebGL context
  useEffect(() => {
    gradientRef.current = new AnimatedGradient({
      ...config,
      colors: config.colors ?? [...v7Palettes.brand],
      autoStart: true,
    });

    if (elementRef.current) {
      gradientRef.current.attach(elementRef.current);
    }

    return () => {
      gradientRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const attachTo = useCallback((element: HTMLElement | null) => {
    elementRef.current = element;
    if (element && gradientRef.current) {
      gradientRef.current.attach(element);
    }
  }, []);

  return {
    attachTo,
    setColors: (colors: string[]) => gradientRef.current?.setColors(colors),
    start: () => gradientRef.current?.start(),
    stop: () => gradientRef.current?.stop(),
  };
}

// ============================================
// GRADIENT MESH (CSS-based)
// For complex multi-point gradients
// ============================================

export interface MeshGradientConfig {
  colors: string[];
  complexity?: number; // 1-5
}

export function generateMeshGradient(config: MeshGradientConfig): string {
  const { colors, complexity = 3 } = config;
  const gradients: string[] = [];

  for (let i = 0; i < Math.min(colors.length, complexity); i++) {
    const x = 20 + (i * 60) / complexity + Math.random() * 20;
    const y = 20 + (i * 60) / complexity + Math.random() * 20;
    const size = 40 + Math.random() * 40;

    gradients.push(
      `radial-gradient(circle at ${x}% ${y}%, ${colors[i]} 0%, transparent ${size}%)`
    );
  }

  return gradients.join(", ");
}

// ============================================
// PRESET GRADIENTS
// ============================================

export const v7GradientPresets = {
  /** Hero section gradient */
  hero: `linear-gradient(135deg, #A41034 0%, #D4A017 50%, #EBCD00 100%)`,

  /** Warm surface gradient */
  warmSurface: `linear-gradient(180deg, #FFF9F5 0%, #FFE8D6 100%)`,

  /** Card highlight */
  cardHighlight: `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)`,

  /** Button shine */
  buttonShine: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)`,

  /** Gold accent */
  goldAccent: `linear-gradient(135deg, #D4A017 0%, #EBCD00 100%)`,

  /** Deep red accent */
  redAccent: `linear-gradient(135deg, #A41034 0%, #C9006B 100%)`,

  /** Glass effect */
  glass: `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)`,
} as const;

// ============================================
// CSS VARIABLE UTILITIES
// ============================================

export function setCSSGradient(name: string, value: string): void {
  document.documentElement.style.setProperty(`--${name}`, value);
}

export function getCSSGradient(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`);
}
