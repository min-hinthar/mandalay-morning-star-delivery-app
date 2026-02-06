/**
 * Swipe Gesture System - Swipe to Close Hook
 * Production-grade swipe-to-close for modals and drawers
 */

import { useState, useCallback, useMemo, useRef } from "react";
import type { PanInfo, MotionProps } from "framer-motion";
import type { SwipeToCloseOptions, SwipeToCloseResult } from "./types";
import { SWIPE_THRESHOLDS, VELOCITY_THRESHOLDS } from "./constants";
import { triggerHaptic } from "./utils";

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
