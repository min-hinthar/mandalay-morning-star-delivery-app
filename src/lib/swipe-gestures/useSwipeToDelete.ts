/**
 * Swipe Gesture System - Swipe to Delete Hook
 * Production-grade swipe-to-delete with haptic feedback
 */

import { useState, useCallback, useMemo, useRef } from "react";
import type { PanInfo, MotionProps } from "framer-motion";
import type { SwipeToDeleteOptions, SwipeToDeleteResult } from "./types";
import { SWIPE_THRESHOLDS, VELOCITY_THRESHOLDS } from "./constants";
import { triggerHaptic } from "./utils";

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
        info.offset.x < -autoDeleteThreshold || info.velocity.x < -velocityThreshold;

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
