/**
 * V7 Component Library Index
 * Maximum playfulness, 120fps animations, accordion-free
 *
 * @example
 * import {
 *   FlipCard,
 *   ExpandingCard,
 *   CarouselV7,
 *   MorphingMenu,
 *   AnimatedLink,
 *   ToggleV7,
 *   PriceTicker,
 *   SkeletonV7,
 * } from '@/components/ui/v7-index';
 */

// ============================================
// FLIP CARD (Accordion Replacement)
// 3D flip animation for FAQs, info cards
// ============================================
export {
  FlipCard,
  FAQFlipCard,
  type FlipCardProps,
  type FAQFlipCardProps,
} from "./FlipCard";

// ============================================
// EXPANDING CARD (Accordion Replacement)
// FLIP layout animation for expandable content
// ============================================
export {
  ExpandingCard,
  ExpandingCardGroup,
  MenuExpandingCard,
  type ExpandingCardProps,
  type ExpandingCardGroupProps,
  type MenuExpandingCardProps,
} from "./ExpandingCard";

// ============================================
// CAROUSEL V7
// Touch-first swipe with momentum physics
// ============================================
export {
  CarouselV7,
  CategoryCarousel,
  type CarouselV7Props,
  type CategoryCarouselProps,
} from "./CarouselV7";

// ============================================
// MORPHING MENU
// Animated hamburger icon with multiple variants
// ============================================
export {
  MorphingMenu,
  MorphingMenuWithLabel,
  MorphingCloseButton,
  type MorphingMenuProps,
  type MorphingMenuWithLabelProps,
  type MorphingCloseButtonProps,
} from "./MorphingMenu";

// ============================================
// ANIMATED LINK
// Playful underline animations for navigation
// ============================================
export {
  AnimatedLink,
  NavLink,
  FooterLink,
  BreadcrumbLink,
  type AnimatedLinkProps,
  type NavLinkProps,
  type FooterLinkProps,
  type BreadcrumbLinkProps,
} from "./AnimatedLink";

// ============================================
// TOGGLE V7
// Bounce physics toggle with multiple variants
// ============================================
export {
  ToggleV7,
  ToggleGroup,
  AnimatedCheckbox,
  type ToggleV7Props,
  type ToggleGroupProps,
  type AnimatedCheckboxProps,
} from "./ToggleV7";

// ============================================
// PRICE TICKER
// Rolling digit animation for prices/numbers
// ============================================
export {
  PriceTicker,
  PriceChangeBadge,
  CounterTicker,
  type PriceTickerProps,
  type PriceChangeBadgeProps,
  type CounterTickerProps,
} from "./PriceTicker";

// ============================================
// SKELETON V7
// Shimmer/pulse/grain loading states
// ============================================
export {
  SkeletonV7,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonMenuItem,
  SkeletonTableRow,
  type SkeletonV7Props,
  type SkeletonTextProps,
  type SkeletonAvatarProps,
  type SkeletonCardProps,
  type SkeletonTableRowProps,
} from "./SkeletonV7";
