/**
 * Menu Components
 * Complete menu system with animations, skeleton states, and responsive overlays
 */

// ============================================
// CATEGORY NAVIGATION
// ============================================

export { CategoryTabs } from "./CategoryTabs";
export type { CategoryTabsProps, Category } from "./CategoryTabs";

export { MenuSection } from "./MenuSection";
export type { MenuSectionProps, MenuSectionCategory } from "./MenuSection";

// ============================================
// ITEM DISPLAY
// ============================================

export { MenuGrid } from "./MenuGrid";
export type { MenuGridProps } from "./MenuGrid";

export { BlurImage, BlurImageMenuCard, BlurImageCartItem } from "./BlurImage";
export type { BlurImageProps } from "./BlurImage";

export { FavoriteButton, FavoriteButtonSkeleton } from "./FavoriteButton";
export type { FavoriteButtonProps } from "./FavoriteButton";

export { EmojiPlaceholder, getCategoryEmoji, CATEGORY_EMOJI_MAP } from "./EmojiPlaceholder";
export type { EmojiPlaceholderProps } from "./EmojiPlaceholder";

export { UnifiedMenuItemCard } from "./UnifiedMenuItemCard";
export type { UnifiedMenuItemCardProps } from "./UnifiedMenuItemCard";

export { MenuCardWrapper } from "./MenuCardWrapper";
export type { MenuCardWrapperProps } from "./MenuCardWrapper";

export { FeaturedCarousel, CarouselControls } from "./FeaturedCarousel";
export type { FeaturedCarouselProps, CarouselControlsProps } from "./FeaturedCarousel";

export { MenuEmptyState } from "./MenuEmptyState";

export { SearchResultsGrid } from "./SearchResultsGrid";

export { MenuHeader } from "./MenuHeader";

export { MenuAccordion } from "./MenuAccordion";
export type { MenuAccordionProps } from "./MenuAccordion";

export { ModifierGroup } from "./ModifierGroup";

// Note: QuantitySelector not exported to avoid conflict with cart/QuantitySelector
// Import directly from "./QuantitySelector" if needed for menu item detail use case

// ============================================
// SEARCH
// ============================================

export { SearchInput } from "./SearchInput";
export type { SearchInputProps } from "./SearchInput";

export { SearchAutocomplete } from "./SearchAutocomplete";
export type { SearchAutocompleteProps } from "./SearchAutocomplete";

// ============================================
// ITEM DETAIL
// ============================================

export { ItemDetailSheet } from "./ItemDetailSheet";
export type { ItemDetailSheetProps } from "./ItemDetailSheet";

// ============================================
// LOADING STATES
// ============================================

export {
  MenuSkeleton,
  MenuItemCardSkeleton,
  SearchSkeleton,
} from "./MenuSkeleton";
export type {
  MenuSkeletonProps,
  MenuItemCardSkeletonProps,
} from "./MenuSkeleton";

// ============================================
// FULL COMPOSITION
// ============================================

export { MenuContent } from "./MenuContent";
export type { MenuContentProps } from "./MenuContent";
