/**
 * CommandPalette - Linear-style search for menu items
 *
 * Usage:
 * ```tsx
 * import { CommandPalette } from "@/components/ui/search";
 * import { useCommandPalette, useMenu } from "@/lib/hooks";
 *
 * function App() {
 *   const { isOpen, close, toggle } = useCommandPalette();
 *   const { data } = useMenu();
 *   const menuItems = data?.categories.flatMap(c => c.items) ?? [];
 *
 *   return (
 *     <>
 *       <button onClick={toggle}>Search (Cmd+K)</button>
 *       <CommandPalette
 *         open={isOpen}
 *         onOpenChange={(open) => !open && close()}
 *         menuItems={menuItems}
 *       />
 *     </>
 *   );
 * }
 * ```
 */

export { CommandPalette, type CommandPaletteProps } from "./CommandPalette";
export { SearchInput, type SearchInputProps } from "./SearchInput";
export { SearchResults, type SearchResultsProps } from "./SearchResults";
export { SearchEmptyState, type SearchEmptyStateProps } from "./SearchEmptyState";

// Re-export as default for simpler imports
export { CommandPalette as default } from "./CommandPalette";
