/**
 * V3 Sprint 5: Mobile Swipe Gesture Utilities
 *
 * Reusable swipe gesture hooks for common patterns:
 * - Swipe to delete (cart items)
 * - Swipe to close (modals/drawers)
 * - Swipe navigation (tabs/categories)
 */

import { useState, useCallback, useMemo } from "react";
import type { PanInfo, MotionProps } from "framer-motion";

// ============================================
// CONSTANTS
// ============================================

export const SWIPE_THRESHOLDS = {
  delete: {
    reveal: 80,
    auto: 200,
  },
  close: {
    default: 100,
  },
  navigation: {
    default: 50,
  },
} as const;

export const VELOCITY_THRESHOLDS = {
  delete: 500,
  close: 500,
  navigation: 200,
} as const;

// ============================================
// TYPES
// ============================================

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
  /** Whether the gesture is disabled */
  disabled?: boolean;
}

export interface SwipeToCloseOptions {
  /** Threshold to trigger close (default: 100) */
  threshold?: number;
  /** Velocity threshold for quick swipe close */
  velocityThreshold?: number;
  /** Callback when close is triggered */
  onClose: () => void;
  /** Whether the gesture is disabled */
  disabled?: boolean;
  /** Direction of swipe: 'down' for modals, 'left' for drawers */
  direction?: "down" | "left" | "right";
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
}

export interface SwipeGestureResult {
  /** Props to spread on motion element */
  motionProps: Partial<MotionProps>;
  /** Whether currently dragging */
  isDragging: boolean;
  /** Current drag offset (for UI feedback) */
  dragOffset: number;
}

export interface SwipeToDeleteResult extends SwipeGestureResult {
  /** Whether delete button is revealed */
  isRevealed: boolean;
  /** Props for delete button styling based on drag */
  deleteButtonProps: {
    opacity: number;
    scale: number;
  };
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
    disabled = false,
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDrag = useCallback(
    (_: unknown, info: PanInfo) => {
      setDragOffset(info.offset.x);
      const revealed = info.offset.x < -revealThreshold;
      if (revealed !== isRevealed) {
        setIsRevealed(revealed);
        onRevealChange?.(revealed);
      }
    },
    [revealThreshold, isRevealed, onRevealChange]
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      setIsDragging(false);
      setDragOffset(0);

      const shouldDelete =
        info.offset.x < -autoDeleteThreshold ||
        info.velocity.x < -velocityThreshold;

      if (shouldDelete) {
        onDelete();
      } else {
        setIsRevealed(false);
        onRevealChange?.(false);
      }
    },
    [autoDeleteThreshold, velocityThreshold, onDelete, onRevealChange]
  );

  const motionProps: Partial<MotionProps> = useMemo(
    () =>
      disabled
        ? {}
        : {
            drag: "x" as const,
            dragConstraints: { left: -autoDeleteThreshold, right: 0 },
            dragElastic: { left: 0.1, right: 0 },
            onDragStart: handleDragStart,
            onDrag: handleDrag,
            onDragEnd: handleDragEnd,
          },
    [disabled, autoDeleteThreshold, handleDragStart, handleDrag, handleDragEnd]
  );

  const deleteButtonProps = useMemo(() => {
    const progress = Math.min(Math.abs(dragOffset) / revealThreshold, 1);
    return {
      opacity: progress,
      scale: 0.5 + progress * 0.5,
    };
  }, [dragOffset, revealThreshold]);

  return {
    motionProps,
    isDragging,
    dragOffset,
    isRevealed,
    deleteButtonProps,
  };
}

// ============================================
// SWIPE TO CLOSE HOOK
// ============================================

export function useSwipeToClose(options: SwipeToCloseOptions): SwipeGestureResult {
  const {
    threshold = SWIPE_THRESHOLDS.close.default,
    velocityThreshold = VELOCITY_THRESHOLDS.close,
    onClose,
    disabled = false,
    direction = "down",
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDrag = useCallback((_: unknown, info: PanInfo) => {
    const offset = direction === "down" ? info.offset.y : info.offset.x;
    setDragOffset(offset);
  }, [direction]);

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      setIsDragging(false);
      setDragOffset(0);

      const offset = direction === "down" ? info.offset.y : info.offset.x;
      const velocity = direction === "down" ? info.velocity.y : info.velocity.x;

      // For down/right, positive offset closes
      // For left, negative offset closes
      const shouldClose =
        direction === "left"
          ? offset < -threshold || velocity < -velocityThreshold
          : offset > threshold || velocity > velocityThreshold;

      if (shouldClose) {
        onClose();
      }
    },
    [direction, threshold, velocityThreshold, onClose]
  );

  const motionProps: Partial<MotionProps> = useMemo(() => {
    if (disabled) return {};

    const dragDirection = direction === "down" ? "y" : "x";
    const constraints =
      direction === "down"
        ? { top: 0, bottom: 0 }
        : direction === "left"
          ? { left: 0, right: 0 }
          : { left: 0, right: 0 };

    const elastic =
      direction === "down"
        ? { top: 0, bottom: 0.5 }
        : direction === "left"
          ? { left: 0.5, right: 0 }
          : { left: 0, right: 0.5 };

    return {
      drag: dragDirection,
      dragConstraints: constraints,
      dragElastic: elastic,
      onDragStart: handleDragStart,
      onDrag: handleDrag,
      onDragEnd: handleDragEnd,
    };
  }, [disabled, direction, handleDragStart, handleDrag, handleDragEnd]);

  return {
    motionProps,
    isDragging,
    dragOffset,
  };
}

// ============================================
// SWIPE NAVIGATION HOOK
// ============================================

export function useSwipeNavigation(options: SwipeNavigationOptions): SwipeGestureResult {
  const {
    threshold = SWIPE_THRESHOLDS.navigation.default,
    velocityThreshold = VELOCITY_THRESHOLDS.navigation,
    onNext,
    onPrev,
    isFirst = false,
    isLast = false,
    disabled = false,
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDrag = useCallback((_: unknown, info: PanInfo) => {
    setDragOffset(info.offset.x);
  }, []);

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      setIsDragging(false);
      setDragOffset(0);

      const { offset, velocity } = info;

      // Swipe left = next (negative offset)
      if (
        (offset.x < -threshold || velocity.x < -velocityThreshold) &&
        !isLast &&
        onNext
      ) {
        onNext();
        triggerHaptic("light");
        return;
      }

      // Swipe right = previous (positive offset)
      if (
        (offset.x > threshold || velocity.x > velocityThreshold) &&
        !isFirst &&
        onPrev
      ) {
        onPrev();
        triggerHaptic("light");
      }
    },
    [threshold, velocityThreshold, isFirst, isLast, onNext, onPrev]
  );

  const motionProps: Partial<MotionProps> = useMemo(() => {
    if (disabled) return {};

    return {
      drag: "x" as const,
      dragConstraints: {
        left: isLast ? 0 : -100,
        right: isFirst ? 0 : 100,
      },
      dragElastic: {
        left: isLast ? 0.1 : 0.5,
        right: isFirst ? 0.1 : 0.5,
      },
      onDragStart: handleDragStart,
      onDrag: handleDrag,
      onDragEnd: handleDragEnd,
    };
  }, [disabled, isFirst, isLast, handleDragStart, handleDrag, handleDragEnd]);

  return {
    motionProps,
    isDragging,
    dragOffset,
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Trigger haptic feedback if available
 */
export function triggerHaptic(type: "light" | "medium" | "heavy" = "light"): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    const durations = {
      light: 10,
      medium: 20,
      heavy: 30,
    };
    navigator.vibrate(durations[type]);
  }
}

/**
 * Check if touch device
 */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

/**
 * Prevent native scroll during swipe
 */
export function preventScrollDuringSwipe(isDragging: boolean): void {
  if (typeof document === "undefined") return;

  if (isDragging) {
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
  } else {
    document.body.style.overflow = "";
    document.body.style.touchAction = "";
  }
}

/**
 * Get resistance factor based on boundary
 * Returns a value between 0 (full resistance) and 1 (no resistance)
 */
export function getResistanceFactor(
  offset: number,
  isAtBoundary: boolean,
  maxOffset: number = 100
): number {
  if (!isAtBoundary) return 1;
  const progress = Math.min(Math.abs(offset) / maxOffset, 1);
  return 1 - progress * 0.8; // Max 80% resistance
}
