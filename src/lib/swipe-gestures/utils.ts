/**
 * Swipe Gesture System - Utility Functions
 * Haptic feedback, device detection, scroll prevention, and math utilities
 */

import { useEffect } from "react";
import type { HapticType } from "./types";
import { HAPTIC_DURATIONS } from "./constants";

/**
 * Trigger haptic feedback if available.
 * Supports simple and pattern-based feedback.
 *
 * @example
 * triggerHaptic('light');   // Quick tap
 * triggerHaptic('success'); // Pattern: tap-pause-tap
 */
export function triggerHaptic(type: HapticType = "light"): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) {
    return;
  }

  const duration = HAPTIC_DURATIONS[type];
  try {
    navigator.vibrate(duration);
  } catch {
    // Silently fail if vibration is not supported
  }
}

/**
 * Check if the device supports touch input.
 */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

/**
 * Check if user prefers reduced motion.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Prevent native scroll during swipe gestures.
 * Use in useEffect to manage body scroll lock.
 *
 * @example
 * useEffect(() => {
 *   preventScrollDuringSwipe(isDragging);
 * }, [isDragging]);
 */
export function preventScrollDuringSwipe(isDragging: boolean): void {
  if (typeof document === "undefined") return;

  if (isDragging) {
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";
  } else {
    const scrollY = document.body.style.top;
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.overflow = "";
    if (scrollY) {
      window.scrollTo(0, parseInt(scrollY, 10) * -1);
    }
  }
}

/**
 * Hook to manage scroll prevention during swipe.
 * Automatically cleans up on unmount.
 */
export function usePreventScroll(isDragging: boolean): void {
  useEffect(() => {
    preventScrollDuringSwipe(isDragging);
    return () => {
      preventScrollDuringSwipe(false);
    };
  }, [isDragging]);
}

/**
 * Calculate resistance factor based on boundary proximity.
 * Returns a value between 0.2 (max resistance) and 1 (no resistance).
 *
 * @param offset - Current drag offset
 * @param isAtBoundary - Whether at a boundary (first/last item)
 * @param maxOffset - Maximum offset before full resistance (default: 100)
 */
export function getResistanceFactor(
  offset: number,
  isAtBoundary: boolean,
  maxOffset: number = 100
): number {
  if (!isAtBoundary) return 1;
  const progress = Math.min(Math.abs(offset) / maxOffset, 1);
  // Quadratic easing for more natural feel
  return 1 - progress * progress * 0.8;
}

/**
 * Calculate spring animation config based on velocity.
 * Higher velocity = snappier animation.
 */
export function getVelocitySpring(velocity: number): {
  stiffness: number;
  damping: number;
} {
  const absVelocity = Math.abs(velocity);
  const stiffness = Math.min(400 + absVelocity * 0.5, 600);
  const damping = Math.max(25 - absVelocity * 0.01, 15);
  return { stiffness, damping };
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values.
 */
export function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * clamp(progress, 0, 1);
}
