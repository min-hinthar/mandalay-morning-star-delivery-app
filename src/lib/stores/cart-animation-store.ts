import { create } from "zustand";
import type { RefObject } from "react";

/**
 * Cart Animation Store
 *
 * Coordinates fly-to-cart animation by:
 * - Storing the badge element ref as animation target
 * - Tracking animation state to prevent overlapping animations
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
}

export const useCartAnimationStore = create<CartAnimationStore>((set) => ({
  badgeRef: null,
  setBadgeRef: (ref) => set({ badgeRef: ref }),
  isAnimating: false,
  setIsAnimating: (isAnimating) => set({ isAnimating }),
}));
