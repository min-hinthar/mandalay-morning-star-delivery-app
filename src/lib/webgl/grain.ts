/**
 * V7 Film Grain Effect
 * Adds subtle animated noise overlay for premium texture
 *
 * Features:
 * - Canvas-based noise generation
 * - Configurable intensity and speed
 * - Performance-optimized
 * - CSS-based fallback option
 */

import { getAnimationPreference } from "../hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export interface GrainConfig {
  /** Canvas element to render to */
  canvas: HTMLCanvasElement;
  /** Grain intensity (0-1) */
  intensity?: number;
  /** Animation speed (frames per second) */
  fps?: number;
  /** Whether to animate the grain */
  animate?: boolean;
  /** Grain size (pixel size) */
  size?: number;
  /** Whether to auto-start */
  autoStart?: boolean;
}

// ============================================
// DEFAULT CONFIG
// ============================================

const DEFAULT_CONFIG: Required<Omit<GrainConfig, "canvas">> = {
  intensity: 0.08,
  fps: 24,
  animate: true,
  size: 1,
  autoStart: true,
};

// ============================================
// GRAIN EFFECT CLASS
// ============================================

export class GrainEffect {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: Required<Omit<GrainConfig, "canvas">>;
  private animationId: number | null = null;
  private lastFrameTime = 0;
  private isRunning = false;
  private noiseData: ImageData | null = null;

  constructor(config: GrainConfig) {
    this.canvas = config.canvas;
    const ctx = this.canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      throw new Error("Could not get 2D context from canvas");
    }
    this.ctx = ctx;
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Set canvas size
    this.resize();

    // Generate initial noise
    this.generateNoise();

    // Auto-start if configured
    if (this.config.autoStart && getAnimationPreference() === "full") {
      this.start();
    } else if (this.config.autoStart) {
      // Show static grain for reduced motion
      this.drawNoise();
    }
  }

  /**
   * Resize canvas to match container
   */
  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance
    const rect = this.canvas.getBoundingClientRect();

    // Use smaller resolution for grain (doesn't need to be crisp)
    this.canvas.width = Math.ceil(rect.width / this.config.size) * dpr;
    this.canvas.height = Math.ceil(rect.height / this.config.size) * dpr;

    this.ctx.scale(dpr, dpr);

    // Regenerate noise at new size
    this.generateNoise();
  }

  /**
   * Generate noise texture
   */
  private generateNoise(): void {
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.noiseData = this.ctx.createImageData(width, height);
    this.updateNoiseData();
  }

  /**
   * Update noise pixel data
   */
  private updateNoiseData(): void {
    if (!this.noiseData) return;

    const data = this.noiseData.data;
    const intensity = Math.floor(this.config.intensity * 255);

    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * intensity;
      data[i] = value; // R
      data[i + 1] = value; // G
      data[i + 2] = value; // B
      data[i + 3] = Math.random() * intensity; // A
    }
  }

  /**
   * Draw noise to canvas
   */
  private drawNoise(): void {
    if (!this.noiseData) return;
    this.ctx.putImageData(this.noiseData, 0, 0);
  }

  /**
   * Start the grain animation
   */
  start(): void {
    if (this.isRunning) return;
    if (getAnimationPreference() === "none") return;

    this.isRunning = true;
    this.lastFrameTime = performance.now();

    if (this.config.animate && getAnimationPreference() === "full") {
      this.animate();
    } else {
      this.drawNoise();
    }
  }

  /**
   * Stop the grain animation
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Clear the canvas
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Destroy the effect
   */
  destroy(): void {
    this.stop();
    this.clear();
    this.noiseData = null;
  }

  /**
   * Set intensity dynamically
   */
  setIntensity(intensity: number): void {
    this.config.intensity = Math.max(0, Math.min(1, intensity));
    this.updateNoiseData();
    if (!this.config.animate) {
      this.drawNoise();
    }
  }

  /**
   * Main animation loop
   */
  private animate = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    const frameInterval = 1000 / this.config.fps;

    if (now - this.lastFrameTime >= frameInterval) {
      this.updateNoiseData();
      this.drawNoise();
      this.lastFrameTime = now;
    }

    this.animationId = requestAnimationFrame(this.animate);
  };
}

// ============================================
// REACT HOOK
// ============================================

import { useEffect, useRef } from "react";

export function useGrainEffect(config: Omit<GrainConfig, "canvas"> = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const effectRef = useRef<GrainEffect | null>(null);

  // Initialize once on mount - config is intentionally not in deps to avoid re-creating WebGL context
  useEffect(() => {
    if (!canvasRef.current) return;

    effectRef.current = new GrainEffect({
      ...config,
      canvas: canvasRef.current,
    });

    const handleResize = () => {
      effectRef.current?.resize();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      effectRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    canvasRef,
    setIntensity: (intensity: number) => effectRef.current?.setIntensity(intensity),
    start: () => effectRef.current?.start(),
    stop: () => effectRef.current?.stop(),
  };
}

// ============================================
// CSS GRAIN OVERLAY COMPONENT
// Lighter alternative using CSS
// ============================================

export const cssGrainStyles = {
  /** Base grain overlay styles */
  overlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none" as const,
    zIndex: 9999,
    opacity: 0.05,
    mixBlendMode: "overlay" as const,
  },

  /** CSS-based noise filter */
  filter: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,

  /** Animation keyframes (add to global CSS) */
  keyframes: `
    @keyframes grain {
      0%, 100% { transform: translate(0, 0); }
      10% { transform: translate(-5%, -10%); }
      20% { transform: translate(-15%, 5%); }
      30% { transform: translate(7%, -25%); }
      40% { transform: translate(-5%, 25%); }
      50% { transform: translate(-15%, 10%); }
      60% { transform: translate(15%, 0%); }
      70% { transform: translate(0%, 15%); }
      80% { transform: translate(3%, 35%); }
      90% { transform: translate(-10%, 10%); }
    }
  `,
};

// ============================================
// TAILWIND CSS UTILITY CLASSES
// Add these to your tailwind.config.js
// ============================================

export const tailwindGrainConfig = `
// Add to tailwind.config.js theme.extend:
animation: {
  grain: 'grain 8s steps(10) infinite',
},
keyframes: {
  grain: {
    '0%, 100%': { transform: 'translate(0, 0)' },
    '10%': { transform: 'translate(-5%, -10%)' },
    '20%': { transform: 'translate(-15%, 5%)' },
    '30%': { transform: 'translate(7%, -25%)' },
    '40%': { transform: 'translate(-5%, 25%)' },
    '50%': { transform: 'translate(-15%, 10%)' },
    '60%': { transform: 'translate(15%, 0%)' },
    '70%': { transform: 'translate(0%, 15%)' },
    '80%': { transform: 'translate(3%, 35%)' },
    '90%': { transform: 'translate(-10%, 10%)' },
  },
},
`;
