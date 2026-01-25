/**
 * V8 Menu Components
 * Complete menu system with GSAP animations, skeleton states, and responsive overlays
 */

// ============================================
// CATEGORY NAVIGATION
// ============================================

export { CategoryTabsV8 } from "./CategoryTabsV8";
export type { CategoryTabsV8Props, Category } from "./CategoryTabsV8";

export { MenuSectionV8 } from "./MenuSectionV8";
export type { MenuSectionV8Props, MenuSectionCategory } from "./MenuSectionV8";

// ============================================
// ITEM DISPLAY
// ============================================

export { MenuGridV8 } from "./MenuGridV8";
export type { MenuGridV8Props } from "./MenuGridV8";

export { BlurImage, BlurImageMenuCard, BlurImageCartItem } from "./BlurImage";
export type { BlurImageProps } from "./BlurImage";

export { FavoriteButton, FavoriteButtonSkeleton } from "./FavoriteButton";
export type { FavoriteButtonProps } from "./FavoriteButton";

export { EmojiPlaceholder, getCategoryEmoji, CATEGORY_EMOJI_MAP } from "./EmojiPlaceholder";
export type { EmojiPlaceholderProps } from "./EmojiPlaceholder";

// ============================================
// SEARCH
// ============================================

export { SearchInputV8 } from "./SearchInputV8";
export type { SearchInputV8Props } from "./SearchInputV8";

export { SearchAutocomplete } from "./SearchAutocomplete";
export type { SearchAutocompleteProps } from "./SearchAutocomplete";

// ============================================
// ITEM DETAIL
// ============================================

export { ItemDetailSheetV8 } from "./ItemDetailSheetV8";
export type { ItemDetailSheetV8Props } from "./ItemDetailSheetV8";

// ============================================
// LOADING STATES
// ============================================

export {
  MenuSkeletonV8,
  MenuItemCardV8Skeleton,
  SearchSkeletonV8,
} from "./MenuSkeletonV8";
export type {
  MenuSkeletonV8Props,
  MenuItemCardV8SkeletonProps as MenuSkeletonCardProps,
} from "./MenuSkeletonV8";

// ============================================
// FULL COMPOSITION
// ============================================

export { MenuContentV8 } from "./MenuContentV8";
export type { MenuContentV8Props } from "./MenuContentV8";
