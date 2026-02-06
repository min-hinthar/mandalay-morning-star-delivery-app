"use client";

/**
 * Fly To Cart Animation
 *
 * GSAP-powered celebration animation when items are added to cart.
 * Creates a thumbnail element that flies from the source button to the cart badge.
 *
 * Features:
 * - Arc trajectory animation using GSAP
 * - Shrinks while flying for depth effect
 * - Triggers badge pulse on completion
 * - Sound effect (cartPop) and haptic feedback
 * - Supports multiple simultaneous flying thumbnails
 * - Respects reduced motion preference
 * - Portal-rendered to avoid z-index issues
 */

import { useCallback, useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "@/lib/gsap";
import { useCartAnimationStore } from "@/lib/stores/cart-animation-store";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { usePlaySound } from "@/lib/hooks/useSoundEffect";
import { triggerHaptic } from "@/lib/motion-tokens";
import { zIndex } from "@/lib/design-system/tokens/z-index";

// ============================================
// TYPES
// ============================================

export interface FlyToCartOptions {
  /** Source element to fly from */
  sourceElement: HTMLElement;
  /** Optional thumbnail image URL (uses amber circle fallback if not provided) */
  imageUrl?: string;
  /** Size of flying element in pixels (default: 48) */
  size?: number;
  /** Callback when animation starts (for checkmark state) */
  onAnimationStart?: () => void;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
}

// ============================================
// HOOK
// ============================================

/**
 * Hook for triggering fly-to-cart animations
 *
 * @example
 * const { fly, isAnimating } = useFlyToCart();
 *
 * const handleAddToCart = () => {
 *   fly({ sourceElement: buttonRef.current });
 *   addItem(item);
 * };
 */
export function useFlyToCart() {
  // IMPORTANT: Use individual selectors to prevent re-renders when unrelated state changes.
  // Subscribing to entire store (useCartAnimationStore()) causes cascading re-renders
  // when ANY state changes (badgeRef, flyingElement, shouldPulseBadge, etc.).
  // This was causing app freezes on page load, sheet close, and drawer close.
  const badgeRef = useCartAnimationStore((s) => s.badgeRef);
  const flyingCount = useCartAnimationStore((s) => s.flyingCount);
  const incrementFlying = useCartAnimationStore((s) => s.incrementFlying);
  const decrementFlying = useCartAnimationStore((s) => s.decrementFlying);
  const setFlyingElement = useCartAnimationStore((s) => s.setFlyingElement);
  const triggerBadgePulse = useCartAnimationStore((s) => s.triggerBadgePulse);
  const { shouldAnimate } = useAnimationPreference();
  const playSound = usePlaySound();

  // Track active timelines for cleanup (supports multiple simultaneous animations)
  const timelinesRef = useRef<Set<gsap.core.Timeline>>(new Set());

  // Cleanup on unmount - kill all GSAP timelines, remove flying elements, reset animation state
  // IMPORTANT: Use getState() to access both state AND actions without subscribing to store changes.
  // This prevents infinite re-render loops when cleanup calls state-updating functions.
  useEffect(() => {
    // Capture ref at effect setup time for cleanup
    const timelines = timelinesRef;
    return () => {
      // Get state AND actions via getState() to avoid triggering re-renders from this cleanup
      const {
        flyingElement,
        setIsAnimating: resetAnimating,
        setFlyingElement: resetFlying,
        cancelPendingPulse: cancelPulse,
      } = useCartAnimationStore.getState();

      // Kill all active GSAP timelines to prevent callbacks on unmounted component
      timelines.current.forEach((tl) => tl.kill());
      timelines.current.clear();
      // Reset both isAnimating and flyingCount when killing timelines
      // flyingCount must be reset to 0 because useFlyToCart returns flyingCount > 0 as isAnimating
      resetAnimating(false);
      useCartAnimationStore.setState({ flyingCount: 0 });

      // Remove flying element if it exists (stored in Zustand store, not ref)
      if (flyingElement) {
        flyingElement.remove();
        resetFlying(null);
      }
      // Cancel any pending pulse timeout to prevent state update after unmount
      cancelPulse();
    };
  }, []); // Empty deps - cleanup only needs to run on unmount, actions accessed via getState()

  const fly = useCallback(
    ({
      sourceElement,
      imageUrl,
      size = 48,
      onAnimationStart,
      onAnimationComplete,
    }: FlyToCartOptions) => {
      // Skip if animations disabled or badge not available
      // NOTE: Multiple rapid clicks are allowed - no isAnimating check
      if (!shouldAnimate || !badgeRef?.current) {
        return false;
      }

      const badgeElement = badgeRef.current;
      const sourceRect = sourceElement.getBoundingClientRect();
      const badgeRect = badgeElement.getBoundingClientRect();

      // Increment flying count for multiple simultaneous animations
      incrementFlying();

      // Trigger haptic feedback immediately (user interaction context)
      triggerHaptic("light");

      // Play pop sound
      playSound("cartPop");

      // Notify animation start callback
      onAnimationStart?.();

      // Wrap animation setup in try-catch to ensure flyingCount is decremented on any error
      let flyingEl: HTMLDivElement | null = null;
      try {
        // Create flying element
        flyingEl = document.createElement("div");
        flyingEl.style.cssText = `
          position: fixed;
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          pointer-events: none;
          z-index: ${zIndex.popover};
          left: ${sourceRect.left + sourceRect.width / 2 - size / 2}px;
          top: ${sourceRect.top + sourceRect.height / 2 - size / 2}px;
          will-change: transform, opacity;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;

        if (imageUrl) {
          flyingEl.style.backgroundImage = `url(${imageUrl})`;
          flyingEl.style.backgroundSize = "cover";
          flyingEl.style.backgroundPosition = "center";
        } else {
          // Amber circle fallback
          flyingEl.style.background =
            "linear-gradient(135deg, var(--color-secondary), var(--color-accent-orange))";
        }

        document.body.appendChild(flyingEl);
        setFlyingElement(flyingEl);

        // Calculate path
        const startX = sourceRect.left + sourceRect.width / 2 - size / 2;
        const startY = sourceRect.top + sourceRect.height / 2 - size / 2;
        const endX = badgeRect.left + badgeRect.width / 2 - size / 2;
        const endY = badgeRect.top + badgeRect.height / 2 - size / 2;

        // Calculate control point for arc (above midpoint)
        const arcHeight = Math.min(startY, endY) - 80;
        const midX = (startX + endX) / 2;

        // Capture flyingEl for use in onComplete (avoid closure issues)
        const animatedEl = flyingEl;

        // Animate with GSAP using bezier-like curve via keyframes
        const tl = gsap.timeline({
          onComplete: () => {
            animatedEl.remove();
            setFlyingElement(null);
            decrementFlying();
            // Notify animation complete callback before badge pulse
            onAnimationComplete?.();
            triggerBadgePulse();
            // Remove timeline from tracking set
            timelinesRef.current.delete(tl);
          },
        });

        // Track timeline for cleanup on unmount
        timelinesRef.current.add(tl);

        // Keyframes for arc trajectory
        tl.to(animatedEl, {
          duration: 0.5,
          ease: "power2.inOut",
          keyframes: [
            {
              x: (midX - startX) * 0.5,
              y: (arcHeight - startY) * 0.8,
              scale: 0.7,
              duration: 0.25,
            },
            {
              x: endX - startX,
              y: endY - startY,
              scale: 0.3,
              opacity: 0.6,
              duration: 0.25,
            },
          ],
        });

        return true;
      } catch {
        // If anything fails during animation setup, clean up and reset state
        if (flyingEl) {
          flyingEl.remove();
          setFlyingElement(null);
        }
        decrementFlying();
        return false;
      }
    },
    [
      badgeRef,
      incrementFlying,
      decrementFlying,
      setFlyingElement,
      triggerBadgePulse,
      shouldAnimate,
      playSound,
    ]
  );

  return { fly, isAnimating: flyingCount > 0 };
}

// ============================================
// COMPONENT
// ============================================

export interface FlyToCartProps {
  /** Optional className for container */
  className?: string;
}

/**
 * FlyToCart container component
 *
 * Renders a Portal for the flying element.
 * Include once in your app (e.g., in layout or providers).
 *
 * Note: The actual flying element is created dynamically in the hook
 * for better control over the animation lifecycle.
 *
 * @example
 * // In layout.tsx
 * <FlyToCart />
 */
export function FlyToCart({ className }: FlyToCartProps) {
  // Use state-based mounting to prevent hydration mismatch
  // Server returns null, client initial render also returns null
  // Only render portal after hydration is complete
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // flyingElement is managed imperatively via the hook
  // This component is primarily a placeholder for potential future enhancements
  // The actual flying animation is handled imperatively via the hook
  // to ensure proper GSAP timeline control

  // Return null on server AND during initial client render to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  // Container for debugging/styling purposes
  return createPortal(
    <div
      data-testid="fly-to-cart-container"
      className={className}
      style={{
        position: "fixed",
        pointerEvents: "none",
        zIndex: zIndex.popover,
        inset: 0,
      }}
      aria-hidden="true"
    />,
    document.body
  );
}

export default FlyToCart;
