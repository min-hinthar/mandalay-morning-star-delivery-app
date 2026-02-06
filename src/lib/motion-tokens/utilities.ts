/**
 * V7 Motion Token System - Utilities
 * Haptic feedback and other utility functions
 */

/**
 * Trigger haptic feedback if available
 */
export function triggerHaptic(type: "light" | "medium" | "heavy" = "light") {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    const durations = {
      light: 10,
      medium: 20,
      heavy: 30,
    };
    navigator.vibrate(durations[type]);
  }
}
