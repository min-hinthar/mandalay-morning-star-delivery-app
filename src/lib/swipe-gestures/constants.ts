/**
 * Swipe Gesture System - Constants
 * Threshold and haptic configuration constants
 */

export const SWIPE_THRESHOLDS = {
  delete: {
    /** Threshold to reveal delete button */
    reveal: 80,
    /** Threshold for auto-delete */
    auto: 200,
  },
  close: {
    /** Default close threshold for modals/drawers */
    default: 100,
    /** Threshold for bottom sheets */
    bottomSheet: 150,
  },
  navigation: {
    /** Default navigation threshold */
    default: 50,
    /** Threshold for tab switching */
    tabs: 75,
  },
} as const;

export const VELOCITY_THRESHOLDS = {
  /** Velocity for quick delete swipe */
  delete: 500,
  /** Velocity for quick close swipe */
  close: 500,
  /** Velocity for quick navigation swipe */
  navigation: 200,
} as const;

/** Haptic feedback durations in milliseconds */
export const HAPTIC_DURATIONS = {
  light: 10,
  medium: 25,
  heavy: 40,
  success: [10, 50, 10] as number[],
  warning: [30, 50, 30] as number[],
  error: [50, 100, 50] as number[],
} as const;
