/**
 * V3 Sprint 6: Micro-interactions Library
 *
 * Framer Motion variants for subtle interaction feedback.
 * Button hovers, card lifts, toggles, favorites, and more.
 */

export * from "./timing";
export * from "./buttons";
export * from "./cards";
export * from "./controls";
export * from "./feedback";
export * from "./stagger";

// ============================================
// HAPTIC FEEDBACK (re-export from gestures)
// ============================================

export { triggerHaptic } from "../swipe-gestures";
