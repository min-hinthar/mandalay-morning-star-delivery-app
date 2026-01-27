/**
 * Search Components
 *
 * Command palette and search-related UI components.
 */

export { CommandPalette, type CommandPaletteProps } from "./CommandPalette";
// Note: SearchInput is exported from ui/menu to avoid conflict
export { SearchResults, type SearchResultsProps } from "./CommandPalette/SearchResults";
// Note: SearchEmptyState conflicts with ui/EmptyState - use CommandPalette sub-component
export { SearchEmptyState as CommandPaletteEmptyState } from "./CommandPalette/SearchEmptyState";
export type { SearchEmptyStateProps as CommandPaletteEmptyStateProps } from "./CommandPalette/SearchEmptyState";

// Re-export as default for simpler imports
export { CommandPalette as default } from "./CommandPalette";
