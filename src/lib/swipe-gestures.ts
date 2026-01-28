/**
 * V5 Sprint 5: Mobile Swipe Gesture System
 *
 * Production-grade swipe gesture hooks for Framer Motion.
 * Supports delete, close, and navigation patterns with haptic feedback.
 *
 * @example
 * // Swipe to delete cart item
 * const { motionProps, isRevealed, deleteButtonProps } = useSwipeToDelete({
 *   onDelete: () => removeItem(id),
 *   onRevealChange: (revealed) => setShowDelete(revealed),
 * });
 *
 * @example
 * // Swipe to close modal
 * const { motionProps, dragOffset } = useSwipeToClose({
 *   onClose: closeModal,
 *   direction: 'down',
 * });
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { PanInfo, MotionProps } from "framer-motion";

// ============================================
// CONSTANTS
// ============================================

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
const HAPTIC_DURATIONS = {
  light: 10,
  medium: 25,
  heavy: 40,
  success: [10, 50, 10] as number[],
  warning: [30, 50, 30] as number[],
  error: [50, 100, 50] as number[],
} as const;

// ============================================
// TYPES
// ============================================

export type HapticType = "light" | "medium" | "heavy" | "success" | "warning" | "error";

export interface SwipeToDeleteOptions {
  /** Threshold to reveal delete button (default: 80) */
  revealThreshold?: number;
  /** Threshold for auto-delete (default: 200) */
  autoDeleteThreshold?: number;
  /** Velocity threshold for quick swipe delete */
  velocityThreshold?: number;
  /** Callback when delete is triggered */
  onDelete: () => void;
  /** Callback when reveal state changes */
  onRevealChange?: (revealed: boolean) => void;
  /** Callback during drag with progress (0-1) */
  onProgress?: (progress: number) => void;
  /** Whether the gesture is disabled */
  disabled?: boolean;
  /** Enable haptic feedback (default: true) */
  hapticEnabled?: boolean;
}

export interface SwipeToCloseOptions {
  /** Threshold to trigger close (default: 100) */
  threshold?: number;
  /** Velocity threshold for quick swipe close */
  velocityThreshold?: number;
  /** Callback when close is triggered */
  onClose: () => void;
  /** Callback during drag with offset */
  onDrag?: (offset: number) => void;
  /** Whether the gesture is disabled */
  disabled?: boolean;
  /** Direction of swipe: 'down' for modals, 'left'/'right' for drawers */
  direction?: "down" | "left" | "right";
  /** Enable haptic feedback at threshold (default: true) */
  hapticEnabled?: boolean;
}

export interface SwipeNavigationOptions {
  /** Threshold to trigger navigation (default: 50) */
  threshold?: number;
  /** Velocity threshold for quick swipe */
  velocityThreshold?: number;
  /** Callback for next item */
  onNext?: () => void;
  /** Callback for previous item */
  onPrev?: () => void;
  /** Whether at first item (adds resistance) */
  isFirst?: boolean;
  /** Whether at last item (adds resistance) */
  isLast?: boolean;
  /** Whether the gesture is disabled */
  disabled?: boolean;
  /** Enable haptic feedback (default: true) */
  hapticEnabled?: boolean;
  /** Callback during drag with direction hint */
  onDragHint?: (direction: "next" | "prev" | null) => void;
}

export interface SwipeGestureResult {
  /** Props to spread on motion element */
  motionProps: Partial<MotionProps>;
  /** Whether currently dragging */
  isDragging: boolean;
  /** Current drag offset (for UI feedback) */
  dragOffset: number;
  /** Progress toward threshold (0-1) */
  progress: number;
}

export interface SwipeToDeleteResult extends SwipeGestureResult {
  /** Whether delete button is revealed */
  isRevealed: boolean;
  /** Props for delete button styling based on drag */
  deleteButtonProps: {
    opacity: number;
    scale: number;
    /** Whether delete is imminent (past auto-delete threshold) */
    isImminent: boolean;
  };
  /** Reset the revealed state */
  reset: () => void;
}

export interface SwipeToCloseResult extends SwipeGestureResult {
  /** Whether close threshold is reached */
  willClose: boolean;
  /** Opacity for backdrop based on drag (1 = fully visible, 0 = hidden) */
  backdropOpacity: number;
}

// ============================================
// SWIPE TO DELETE HOOK
// ============================================

export function useSwipeToDelete(options: SwipeToDeleteOptions): SwipeToDeleteResult {
  const {
    revealThreshold = SWIPE_THRESHOLDS.delete.reveal,
    autoDeleteThreshold = SWIPE_THRESHOLDS.delete.auto,
    velocityThreshold = VELOCITY_THRESHOLDS.delete,
    onDelete,
    onRevealChange,
    onProgress,
    disabled = false,
    hapticEnabled = true,
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const hapticTriggeredRef = useRef(false);

  const reset = useCallback(() => {
    setIsRevealed(false);
    setDragOffset(0);
    onRevealChange?.(false);
  }, [onRevealChange]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    hapticTriggeredRef.current = false;
  }, []);

  const handleDrag = useCallback(
    (_: unknown, info: PanInfo) => {
      // Defensive check for malformed event info
      if (!info?.offset) return;

      const offset = info.offset.x;
      setDragOffset(offset);

      // Calculate progress for visual feedback
      const progress = Math.min(Math.abs(offset) / autoDeleteThreshold, 1);
      onProgress?.(progress);

      // Handle reveal state change
      const revealed = offset < -revealThreshold;
      if (revealed !== isRevealed) {
        setIsRevealed(revealed);
        onRevealChange?.(revealed);

        // Haptic feedback at reveal threshold
        if (hapticEnabled && revealed && !hapticTriggeredRef.current) {
          triggerHaptic("light");
          hapticTriggeredRef.current = true;
        }
      }

      // Haptic feedback approaching delete threshold
      if (hapticEnabled && offset < -autoDeleteThreshold * 0.9 && !hapticTriggeredRef.current) {
        triggerHaptic("medium");
      }
    },
    [revealThreshold, autoDeleteThreshold, isRevealed, onRevealChange, onProgress, hapticEnabled]
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      setIsDragging(false);

      // Defensive check for malformed event info
      if (!info?.offset || !info?.velocity) {
        setDragOffset(0);
        setIsRevealed(false);
        onRevealChange?.(false);
        return;
      }

      const shouldDelete =
        info.offset.x < -autoDeleteThreshold ||
        info.velocity.x < -velocityThreshold;

      if (shouldDelete) {
        if (hapticEnabled) triggerHaptic("success");
        onDelete();
      } else {
        setDragOffset(0);
        setIsRevealed(false);
        onRevealChange?.(false);
      }
    },
    [autoDeleteThreshold, velocityThreshold, onDelete, onRevealChange, hapticEnabled]
  );

  const motionProps: Partial<MotionProps> = useMemo(
    () =>
      disabled
        ? {}
        : {
            drag: "x" as const,
            dragConstraints: { left: -autoDeleteThreshold - 50, right: 0 },
            dragElastic: { left: 0.15, right: 0 },
            dragMomentum: false,
            onDragStart: handleDragStart,
            onDrag: handleDrag,
            onDragEnd: handleDragEnd,
            style: { touchAction: "pan-y" },
          },
    [disabled, autoDeleteThreshold, handleDragStart, handleDrag, handleDragEnd]
  );

  const progress = Math.min(Math.abs(dragOffset) / autoDeleteThreshold, 1);

  const deleteButtonProps = useMemo(() => {
    const revealProgress = Math.min(Math.abs(dragOffset) / revealThreshold, 1);
    return {
      opacity: revealProgress,
      scale: 0.6 + revealProgress * 0.4,
      isImminent: Math.abs(dragOffset) > autoDeleteThreshold * 0.9,
    };
  }, [dragOffset, revealThreshold, autoDeleteThreshold]);

  return {
    motionProps,
    isDragging,
    dragOffset,
    progress,
    isRevealed,
    deleteButtonProps,
    reset,
  };
}

// ============================================
// SWIPE TO CLOSE HOOK
// ============================================

export function useSwipeToClose(options: SwipeToCloseOptions): SwipeToCloseResult {
  const {
    threshold = SWIPE_THRESHOLDS.close.default,
    velocityThreshold = VELOCITY_THRESHOLDS.close,
    onClose,
    onDrag,
    disabled = false,
    direction = "down",
    hapticEnabled = true,
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const hapticTriggeredRef = useRef(false);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    hapticTriggeredRef.current = false;
  }, []);

  const handleDrag = useCallback(
    (_: unknown, info: PanInfo) => {
      // Defensive check for malformed event info
      if (!info?.offset) return;

      const offset = direction === "down" ? info.offset.y : info.offset.x;
      setDragOffset(offset);
      onDrag?.(offset);

      // Haptic at threshold
      const reachedThreshold =
        direction === "left"
          ? offset < -threshold
          : offset > threshold;

      if (hapticEnabled && reachedThreshold && !hapticTriggeredRef.current) {
        triggerHaptic("light");
        hapticTriggeredRef.current = true;
      }
    },
    [direction, threshold, onDrag, hapticEnabled]
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      setIsDragging(false);
      setDragOffset(0);

      // Defensive check for malformed event info
      if (!info?.offset || !info?.velocity) return;

      const offset = direction === "down" ? info.offset.y : info.offset.x;
      const velocity = direction === "down" ? info.velocity.y : info.velocity.x;

      // For down/right, positive offset closes
      // For left, negative offset closes
      const shouldClose =
        direction === "left"
          ? offset < -threshold || velocity < -velocityThreshold
          : offset > threshold || velocity > velocityThreshold;

      if (shouldClose) {
        if (hapticEnabled) triggerHaptic("light");
        onClose();
      }
    },
    [direction, threshold, velocityThreshold, onClose, hapticEnabled]
  );

  const motionProps: Partial<MotionProps> = useMemo(() => {
    if (disabled) return {};

    const dragDirection = direction === "down" ? "y" : "x";

    // Configure constraints based on direction
    const constraints =
      direction === "down"
        ? { top: 0, bottom: 0 }
        : direction === "left"
          ? { left: 0, right: 0 }
          : { left: 0, right: 0 };

    // Configure elasticity - more resistance going against intended direction
    const elastic =
      direction === "down"
        ? { top: 0.1, bottom: 0.6 }
        : direction === "left"
          ? { left: 0.6, right: 0.1 }
          : { left: 0.1, right: 0.6 };

    return {
      drag: dragDirection,
      dragConstraints: constraints,
      dragElastic: elastic,
      dragMomentum: false,
      onDragStart: handleDragStart,
      onDrag: handleDrag,
      onDragEnd: handleDragEnd,
      style: {
        touchAction: direction === "down" ? "pan-x" : "pan-y",
      },
    };
  }, [disabled, direction, handleDragStart, handleDrag, handleDragEnd]);

  const progress = Math.min(Math.abs(dragOffset) / threshold, 1);

  const willClose =
    direction === "left"
      ? dragOffset < -threshold
      : dragOffset > threshold;

  // Calculate backdrop opacity (inverse of progress)
  const backdropOpacity = Math.max(1 - progress * 0.5, 0.5);

  return {
    motionProps,
    isDragging,
    dragOffset,
    progress,
    willClose,
    backdropOpacity,
  };
}

// ============================================
// SWIPE NAVIGATION HOOK
// ============================================

export function useSwipeNavigation(options: SwipeNavigationOptions): SwipeGestureResult & {
  /** Current direction hint based on drag */
  directionHint: "next" | "prev" | null;
} {
  const {
    threshold = SWIPE_THRESHOLDS.navigation.default,
    velocityThreshold = VELOCITY_THRESHOLDS.navigation,
    onNext,
    onPrev,
    isFirst = false,
    isLast = false,
    disabled = false,
    hapticEnabled = true,
    onDragHint,
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [directionHint, setDirectionHint] = useState<"next" | "prev" | null>(null);
  const hapticTriggeredRef = useRef(false);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    hapticTriggeredRef.current = false;
    setDirectionHint(null);
  }, []);

  const handleDrag = useCallback(
    (_: unknown, info: PanInfo) => {
      // Defensive check for malformed event info
      if (!info?.offset) return;

      setDragOffset(info.offset.x);

      // Determine direction hint
      let hint: "next" | "prev" | null = null;
      if (info.offset.x < -threshold * 0.5 && !isLast) {
        hint = "next";
      } else if (info.offset.x > threshold * 0.5 && !isFirst) {
        hint = "prev";
      }

      if (hint !== directionHint) {
        setDirectionHint(hint);
        onDragHint?.(hint);

        // Haptic at hint threshold
        if (hapticEnabled && hint && !hapticTriggeredRef.current) {
          triggerHaptic("light");
          hapticTriggeredRef.current = true;
        }
      }
    },
    [threshold, isFirst, isLast, directionHint, onDragHint, hapticEnabled]
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      setIsDragging(false);
      setDragOffset(0);
      setDirectionHint(null);
      onDragHint?.(null);

      // Defensive check for malformed event info
      if (!info?.offset || !info?.velocity) return;

      const { offset, velocity } = info;

      // Swipe left = next (negative offset)
      if (
        (offset.x < -threshold || velocity.x < -velocityThreshold) &&
        !isLast &&
        onNext
      ) {
        if (hapticEnabled) triggerHaptic("light");
        onNext();
        return;
      }

      // Swipe right = previous (positive offset)
      if (
        (offset.x > threshold || velocity.x > velocityThreshold) &&
        !isFirst &&
        onPrev
      ) {
        if (hapticEnabled) triggerHaptic("light");
        onPrev();
      }
    },
    [threshold, velocityThreshold, isFirst, isLast, onNext, onPrev, hapticEnabled, onDragHint]
  );

  const motionProps: Partial<MotionProps> = useMemo(() => {
    if (disabled) return {};

    // Reduced drag range at boundaries
    const leftConstraint = isLast ? -30 : -120;
    const rightConstraint = isFirst ? 30 : 120;

    return {
      drag: "x" as const,
      dragConstraints: {
        left: leftConstraint,
        right: rightConstraint,
      },
      dragElastic: {
        left: isLast ? 0.15 : 0.4,
        right: isFirst ? 0.15 : 0.4,
      },
      dragMomentum: false,
      onDragStart: handleDragStart,
      onDrag: handleDrag,
      onDragEnd: handleDragEnd,
      style: { touchAction: "pan-y" },
    };
  }, [disabled, isFirst, isLast, handleDragStart, handleDrag, handleDragEnd]);

  const progress = Math.min(Math.abs(dragOffset) / threshold, 1);

  return {
    motionProps,
    isDragging,
    dragOffset,
    progress,
    directionHint,
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

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
