"use client";

import { Command } from "cmdk";
import { Search } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface SearchInputProps {
  /** Placeholder text */
  placeholder?: string;
  /** Additional class names */
  className?: string;
}

/**
 * Styled search input wrapper for the command palette
 *
 * Features:
 * - Search icon on left
 * - ESC keyboard hint on right
 * - Focus ring with primary color
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput({ placeholder = "Search menu items...", className }, ref) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 border-b border-border px-4 py-3",
          className
        )}
      >
        {/* Search icon */}
        <Search className="h-5 w-5 flex-shrink-0 text-text-muted" />

        {/* Input */}
        <Command.Input
          ref={ref}
          placeholder={placeholder}
          className={cn(
            "flex-1 bg-transparent text-base text-text-primary outline-none",
            "placeholder:text-text-muted",
            "focus:outline-none"
          )}
        />

        {/* ESC hint */}
        <kbd
          className={cn(
            "hidden sm:inline-flex",
            "h-6 items-center justify-center rounded border border-border",
            "bg-surface-secondary px-2 text-xs text-text-muted"
          )}
        >
          ESC
        </kbd>
      </div>
    );
  }
);

export default SearchInput;
