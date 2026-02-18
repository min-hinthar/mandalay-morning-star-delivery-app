/**
 * Swipe Gesture System - Swipe Navigation Hook
 * Horizontal swipe navigation for tabs and carousels
 */

import { useState, useCallback, useMemo, useRef } from "react";
import type { PanInfo, MotionProps } from "framer-motion";
import type { SwipeNavigationOptions, SwipeGestureResult } from "./types";
import { SWIPE_THRESHOLDS, VELOCITY_THRESHOLDS } from "./constants";
import { triggerHaptic } from "./utils";

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
      if ((offset.x < -threshold || velocity.x < -velocityThreshold) && !isLast && onNext) {
        if (hapticEnabled) triggerHaptic("light");
        onNext();
        return;
      }

      // Swipe right = previous (positive offset)
      if ((offset.x > threshold || velocity.x > velocityThreshold) && !isFirst && onPrev) {
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
