/**
 * V8 Cart Components
 *
 * Exports:
 * - CartButtonV8: Cart button with animated badge for header integration
 * - CartItemV8: Cart item with swipe-to-delete and animated quantity
 * - QuantitySelector: Animated quantity controls with haptic feedback
 * - CartDrawerV8: Responsive cart drawer (BottomSheet on mobile, Drawer on desktop)
 * - CartBarV8: Fixed bottom cart bar with delivery progress and animations
 * - CartSummary: Order summary with animated free delivery progress
 * - CartEmptyState: Friendly empty cart state with animation
 * - FlyToCart: GSAP fly-to-cart celebration animation
 * - AddToCartButton: Add-to-cart button with fly animation integration
 * - ClearCartConfirmation: Modal to confirm cart clearing
 */

export { CartButtonV8 } from "./CartButtonV8";
export { CartItemV8 } from "./CartItemV8";
export { QuantitySelector } from "./QuantitySelector";
export { CartDrawerV8 } from "./CartDrawerV8";
export { CartBarV8 } from "./CartBarV8";
export { CartSummary } from "./CartSummary";
export { CartEmptyState } from "./CartEmptyState";
export { FlyToCart, useFlyToCart } from "./FlyToCart";
export { AddToCartButton } from "./AddToCartButton";
export {
  ClearCartConfirmation,
  useClearCartConfirmation,
} from "./ClearCartConfirmation";

// Re-export types
export type { CartButtonV8Props } from "./CartButtonV8";
export type { CartItemV8Props } from "./CartItemV8";
export type { QuantitySelectorProps } from "./QuantitySelector";
export type { CartDrawerV8Props } from "./CartDrawerV8";
export type { CartBarV8Props } from "./CartBarV8";
export type { CartSummaryProps } from "./CartSummary";
export type { CartEmptyStateProps } from "./CartEmptyState";
export type { FlyToCartProps, FlyToCartOptions } from "./FlyToCart";
export type { AddToCartButtonProps, AddToCartItem } from "./AddToCartButton";
export type { ClearCartConfirmationProps } from "./ClearCartConfirmation";
