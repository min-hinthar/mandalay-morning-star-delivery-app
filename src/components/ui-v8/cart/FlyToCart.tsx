"use client";

/**
 * V8 Fly To Cart Animation
 *
 * GSAP-powered celebration animation when items are added to cart.
 * Creates a thumbnail element that flies from the source button to the cart badge.
 *
 * Features:
 * - Arc trajectory animation using GSAP
 * - Shrinks while flying for depth effect
 * - Triggers badge pulse on completion
 * - Respects reduced motion preference
 * - Portal-rendered to avoid z-index issues
 */

import { useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { gsap } from "@/lib/gsap";
import { useCartAnimationStore } from "@/lib/stores/cart-animation-store";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { zIndex } from "@/design-system/tokens/z-index";

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
}

interface FlyingElement {
  element: HTMLDivElement;
  startRect: DOMRect;
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
  const {
    badgeRef,
    isAnimating,
    setIsAnimating,
    setFlyingElement,
    triggerBadgePulse,
  } = useCartAnimationStore();
  const { shouldAnimate } = useAnimationPreference();

  const flyingRef = useRef<FlyingElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    const currentFlying = flyingRef.current;
    return () => {
      if (currentFlying?.element) {
        currentFlying.element.remove();
      }
    };
  }, []);

  const fly = useCallback(
    ({ sourceElement, imageUrl, size = 48 }: FlyToCartOptions) => {
      // Skip if animations disabled, badge not available, or already animating
      if (!shouldAnimate || !badgeRef?.current || isAnimating) {
        return false;
      }

      const badgeElement = badgeRef.current;
      const sourceRect = sourceElement.getBoundingClientRect();
      const badgeRect = badgeElement.getBoundingClientRect();

      setIsAnimating(true);

      // Create flying element
      const flyingEl = document.createElement("div");
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
        flyingEl.style.background = "linear-gradient(135deg, #f59e0b, #d97706)";
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

      // Animate with GSAP using bezier-like curve via keyframes
      const tl = gsap.timeline({
        onComplete: () => {
          flyingEl.remove();
          setFlyingElement(null);
          setIsAnimating(false);
          triggerBadgePulse();
        },
      });

      // Keyframes for arc trajectory
      tl.to(flyingEl, {
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
    },
    [
      badgeRef,
      isAnimating,
      setIsAnimating,
      setFlyingElement,
      triggerBadgePulse,
      shouldAnimate,
    ]
  );

  return { fly, isAnimating };
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
  // flyingElement is managed imperatively via the hook

  // This component is primarily a placeholder for potential future enhancements
  // The actual flying animation is handled imperatively via the hook
  // to ensure proper GSAP timeline control

  if (typeof window === "undefined") {
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
