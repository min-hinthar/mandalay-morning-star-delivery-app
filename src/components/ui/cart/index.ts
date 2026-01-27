/**
 * Cart Components
 *
 * Exports:
 * - CartButton: Cart button with animated badge for header integration
 * - CartItem: Cart item with swipe-to-delete and animated quantity
 * - QuantitySelector: Animated quantity controls with haptic feedback
 * - CartDrawer: Responsive cart drawer (BottomSheet on mobile, Drawer on desktop)
 * - CartBar: Fixed bottom cart bar with delivery progress and animations
 * - CartSummary: Order summary with animated free delivery progress
 * - CartEmptyState: Friendly empty cart state with animation
 * - FlyToCart: GSAP fly-to-cart celebration animation
 * - AddToCartButton: Add-to-cart button with fly animation integration
 * - ClearCartConfirmation: Modal to confirm cart clearing
 */

export { CartButton } from "./CartButton";
export { CartItem } from "./CartItem";
export { QuantitySelector } from "./QuantitySelector";
export { CartDrawer } from "./CartDrawer";
export { CartBar } from "./CartBar";
export { CartSummary } from "./CartSummary";
export { CartEmptyState } from "./CartEmptyState";
export { FlyToCart, useFlyToCart } from "./FlyToCart";
export { AddToCartButton } from "./AddToCartButton";
export {
  ClearCartConfirmation,
  useClearCartConfirmation,
} from "./ClearCartConfirmation";

// Re-export types
export type { CartButtonProps } from "./CartButton";
export type { CartItemProps } from "./CartItem";
export type { QuantitySelectorProps } from "./QuantitySelector";
export type { CartDrawerProps } from "./CartDrawer";
export type { CartBarProps } from "./CartBar";
export type { CartSummaryProps } from "./CartSummary";
export type { CartEmptyStateProps } from "./CartEmptyState";
export type { FlyToCartProps, FlyToCartOptions } from "./FlyToCart";
export type { AddToCartButtonProps, AddToCartItem } from "./AddToCartButton";
export type { ClearCartConfirmationProps } from "./ClearCartConfirmation";
