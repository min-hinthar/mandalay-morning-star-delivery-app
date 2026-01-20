"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * V7 Frame Rate Monitor
 * Tracks FPS for performance monitoring and adaptive quality
 *
 * Features:
 * - Real-time FPS tracking
 * - Average FPS calculation
 * - Performance tier detection
 * - Automatic quality adjustment suggestions
 */

// ============================================
// TYPES
// ============================================

export type PerformanceTier = "high" | "medium" | "low";

export interface FrameRateStats {
  /** Current instantaneous FPS */
  fps: number;
  /** Average FPS over sample period */
  averageFps: number;
  /** Minimum FPS recorded */
  minFps: number;
  /** Maximum FPS recorded */
  maxFps: number;
  /** Dropped frames count */
  droppedFrames: number;
  /** Performance tier based on FPS */
  tier: PerformanceTier;
  /** Whether device can handle 120fps */
  supports120fps: boolean;
}

export interface UseFrameRateOptions {
  /** Sample size for average calculation */
  sampleSize?: number;
  /** Update interval in ms */
  updateInterval?: number;
  /** Whether to auto-start monitoring */
  autoStart?: boolean;
  /** Target FPS threshold for 120fps support detection */
  target120Threshold?: number;
}

// ============================================
// DEFAULT OPTIONS
// ============================================

const DEFAULT_OPTIONS: Required<UseFrameRateOptions> = {
  sampleSize: 60,
  updateInterval: 500,
  autoStart: false,
  target120Threshold: 100,
};

// ============================================
// PERFORMANCE TIER THRESHOLDS
// ============================================

const TIER_THRESHOLDS = {
  high: 90, // 90+ FPS = high performance
  medium: 45, // 45-89 FPS = medium
  // Below 45 = low
} as const;

// ============================================
// HOOK
// ============================================

export function useFrameRate(options: UseFrameRateOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };

  const [stats, setStats] = useState<FrameRateStats>({
    fps: 0,
    averageFps: 0,
    minFps: Infinity,
    maxFps: 0,
    droppedFrames: 0,
    tier: "high",
    supports120fps: false,
  });

  const [isMonitoring, setIsMonitoring] = useState(config.autoStart);

  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(0);
  const animationIdRef = useRef<number | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const droppedFramesRef = useRef(0);

  /**
   * Calculate performance tier from FPS
   */
  const getTier = useCallback((fps: number): PerformanceTier => {
    if (fps >= TIER_THRESHOLDS.high) return "high";
    if (fps >= TIER_THRESHOLDS.medium) return "medium";
    return "low";
  }, []);

  /**
   * Frame callback
   */
  const measureFrame = useCallback((timestamp: number) => {
    if (lastFrameTimeRef.current) {
      const delta = timestamp - lastFrameTimeRef.current;
      const fps = 1000 / delta;

      // Track dropped frames (>33ms = <30fps)
      if (delta > 33) {
        droppedFramesRef.current++;
      }

      frameTimesRef.current.push(fps);

      // Keep only recent samples
      if (frameTimesRef.current.length > config.sampleSize) {
        frameTimesRef.current.shift();
      }
    }

    lastFrameTimeRef.current = timestamp;
    animationIdRef.current = requestAnimationFrame(measureFrame);
  }, [config.sampleSize]);

  /**
   * Update stats periodically
   */
  const updateStats = useCallback(() => {
    const frames = frameTimesRef.current;
    if (frames.length === 0) return;

    const currentFps = frames[frames.length - 1] || 0;
    const averageFps = frames.reduce((a, b) => a + b, 0) / frames.length;
    const minFps = Math.min(...frames);
    const maxFps = Math.max(...frames);
    const tier = getTier(averageFps);
    const supports120fps = maxFps >= config.target120Threshold;

    setStats({
      fps: Math.round(currentFps),
      averageFps: Math.round(averageFps),
      minFps: Math.round(minFps),
      maxFps: Math.round(maxFps),
      droppedFrames: droppedFramesRef.current,
      tier,
      supports120fps,
    });
  }, [getTier, config.target120Threshold]);

  /**
   * Start monitoring
   */
  const start = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    frameTimesRef.current = [];
    droppedFramesRef.current = 0;
    lastFrameTimeRef.current = 0;

    animationIdRef.current = requestAnimationFrame(measureFrame);
    updateIntervalRef.current = setInterval(updateStats, config.updateInterval);
  }, [isMonitoring, measureFrame, updateStats, config.updateInterval]);

  /**
   * Stop monitoring
   */
  const stop = useCallback(() => {
    setIsMonitoring(false);

    if (animationIdRef.current !== null) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }

    if (updateIntervalRef.current !== null) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  }, []);

  /**
   * Reset stats
   */
  const reset = useCallback(() => {
    frameTimesRef.current = [];
    droppedFramesRef.current = 0;
    setStats({
      fps: 0,
      averageFps: 0,
      minFps: Infinity,
      maxFps: 0,
      droppedFrames: 0,
      tier: "high",
      supports120fps: false,
    });
  }, []);

  /**
   * Toggle monitoring
   */
  const toggle = useCallback(() => {
    if (isMonitoring) {
      stop();
    } else {
      start();
    }
  }, [isMonitoring, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (updateIntervalRef.current !== null) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  // Auto-start if configured
  useEffect(() => {
    if (config.autoStart && !isMonitoring) {
      start();
    }
  }, [config.autoStart, isMonitoring, start]);

  return {
    ...stats,
    isMonitoring,
    start,
    stop,
    toggle,
    reset,
  };
}

// ============================================
// PERFORMANCE DETECTION UTILITIES
// ============================================

/**
 * Quick device capability check (non-reactive)
 */
export function detectDeviceCapability(): {
  hasHighRefreshRate: boolean;
  estimatedMaxFps: number;
  isLowEndDevice: boolean;
} {
  if (typeof window === "undefined") {
    return { hasHighRefreshRate: false, estimatedMaxFps: 60, isLowEndDevice: false };
  }

  // Check for high refresh rate display
  const hasHighRefreshRate =
    window.screen &&
    // @ts-expect-error - refreshRate is non-standard
    (window.screen.refreshRate > 60 ||
     // Check for common high refresh rate resolutions
     (window.devicePixelRatio >= 2 && window.innerWidth >= 1440));

  // Estimate based on hardware concurrency
  const cores = navigator.hardwareConcurrency || 4;
  const isLowEndDevice = cores <= 2;

  // Estimate max FPS based on device characteristics
  let estimatedMaxFps = 60;
  if (hasHighRefreshRate && !isLowEndDevice) {
    estimatedMaxFps = 120;
  } else if (isLowEndDevice) {
    estimatedMaxFps = 30;
  }

  return {
    hasHighRefreshRate,
    estimatedMaxFps,
    isLowEndDevice,
  };
}

/**
 * Get recommended animation settings based on device
 */
export function getRecommendedAnimationSettings(): {
  shouldUse120fps: boolean;
  shouldReduceParticles: boolean;
  shouldDisableWebGL: boolean;
  recommendedSpringStiffness: number;
} {
  const { hasHighRefreshRate, isLowEndDevice } = detectDeviceCapability();

  return {
    shouldUse120fps: hasHighRefreshRate && !isLowEndDevice,
    shouldReduceParticles: isLowEndDevice,
    shouldDisableWebGL: isLowEndDevice,
    recommendedSpringStiffness: isLowEndDevice ? 200 : 300,
  };
}

// ============================================
// FPS DISPLAY COMPONENT HELPER
// ============================================

export function formatFpsDisplay(fps: number): {
  value: string;
  color: string;
} {
  const value = fps.toString().padStart(3, " ");

  let color: string;
  if (fps >= 90) {
    color = "#52A52E"; // Green
  } else if (fps >= 45) {
    color = "#EBCD00"; // Yellow
  } else {
    color = "#A41034"; // Red
  }

  return { value, color };
}
