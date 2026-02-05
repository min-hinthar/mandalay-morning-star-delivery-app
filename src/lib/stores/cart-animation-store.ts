import { create } from "zustand";
import type { RefObject } from "react";

/**
 * Cart Animation Store
 *
 * Coordinates fly-to-cart animation by:
 * - Storing the badge element ref as animation target
 * - Tracking animation state via flyingCount (supports multiple simultaneous animations)
 * - Managing flying element state for GSAP Flip animation
 * - Triggering badge pulse after fly animation completes
 */
interface CartAnimationStore {
  /** Ref to the cart badge element (animation target) */
  badgeRef: RefObject<HTMLSpanElement | null> | null;
  /** Set the badge ref (called on mount) */
  setBadgeRef: (ref: RefObject<HTMLSpanElement | null> | null) => void;
  /** Count of currently flying elements (supports multiple simultaneous animations) */
  flyingCount: number;
  /** Increment flying count when animation starts */
  incrementFlying: () => void;
  /** Decrement flying count when animation completes */
  decrementFlying: () => void;
  /** Whether any fly-to-cart animation is currently running (derived from flyingCount) */
  isAnimating: boolean;
  /** Set animation state - DEPRECATED: use incrementFlying/decrementFlying instead */
  setIsAnimating: (isAnimating: boolean) => void;
  /** Currently flying element (cloned for animation) - legacy for cleanup */
  flyingElement: HTMLElement | null;
  /** Set the flying element */
  setFlyingElement: (el: HTMLElement | null) => void;
  /** Whether badge should pulse (triggered after fly completes) */
  shouldPulseBadge: boolean;
  /** Trigger badge pulse animation - returns cleanup function */
  triggerBadgePulse: () => (() => void);
  /** Cancel any pending pulse timeout */
  cancelPendingPulse: () => void;
}

// Track pending pulse timeout for cleanup
let pulseTimeoutId: ReturnType<typeof setTimeout> | null = null;

export const useCartAnimationStore = create<CartAnimationStore>((set) => ({
  badgeRef: null,
  setBadgeRef: (ref) => set({ badgeRef: ref }),
  flyingCount: 0,
  incrementFlying: () => set((s) => ({ flyingCount: s.flyingCount + 1, isAnimating: true })),
  decrementFlying: () => set((s) => {
    const newCount = Math.max(0, s.flyingCount - 1);
    return { flyingCount: newCount, isAnimating: newCount > 0 };
  }),
  isAnimating: false,
  // DEPRECATED: Kept for backwards compatibility, prefer incrementFlying/decrementFlying
  setIsAnimating: (isAnimating) => set({ isAnimating }),
  flyingElement: null,
  setFlyingElement: (el) => set({ flyingElement: el }),
  shouldPulseBadge: false,
  triggerBadgePulse: () => {
    // Clear any existing timeout to prevent overlapping pulses
    if (pulseTimeoutId) {
      clearTimeout(pulseTimeoutId);
      pulseTimeoutId = null;
    }

    set({ shouldPulseBadge: true });

    // Auto-reset after pulse duration with tracked timeout
    pulseTimeoutId = setTimeout(() => {
      pulseTimeoutId = null;
      set({ shouldPulseBadge: false });
    }, 300);

    // Return cleanup function for callers to use
    return () => {
      if (pulseTimeoutId) {
        clearTimeout(pulseTimeoutId);
        pulseTimeoutId = null;
      }
    };
  },
  cancelPendingPulse: () => {
    if (pulseTimeoutId) {
      clearTimeout(pulseTimeoutId);
      pulseTimeoutId = null;
      set({ shouldPulseBadge: false });
    }
  },
}));
