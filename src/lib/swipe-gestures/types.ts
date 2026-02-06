/**
 * Swipe Gesture System - Types
 * Type definitions for swipe gesture hooks
 */

import type { MotionProps } from "framer-motion";

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
