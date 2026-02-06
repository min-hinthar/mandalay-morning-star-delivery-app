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

export * from './types';
export * from './constants';
export * from './utils';
export * from './useSwipeToDelete';
export * from './useSwipeToClose';
export * from './useSwipeNavigation';
