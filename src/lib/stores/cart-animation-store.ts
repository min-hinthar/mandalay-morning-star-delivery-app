import { create } from "zustand";
import type { RefObject } from "react";

/**
 * Cart Animation Store
 *
 * Coordinates fly-to-cart animation by:
 * - Storing the badge element ref as animation target
 * - Tracking animation state to prevent overlapping animations
 * - Managing flying element state for GSAP Flip animation
 * - Triggering badge pulse after fly animation completes
 */
interface CartAnimationStore {
  /** Ref to the cart badge element (animation target) */
  badgeRef: RefObject<HTMLSpanElement | null> | null;
  /** Set the badge ref (called on mount) */
  setBadgeRef: (ref: RefObject<HTMLSpanElement | null> | null) => void;
  /** Whether a fly-to-cart animation is currently running */
  isAnimating: boolean;
  /** Set animation state */
  setIsAnimating: (isAnimating: boolean) => void;
  /** Currently flying element (cloned for animation) */
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
  isAnimating: false,
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
