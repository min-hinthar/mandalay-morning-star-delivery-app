"use client";

import { Command } from "cmdk";
import { AnimatePresence, m } from "framer-motion";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface SearchInputProps {
  /** Placeholder text */
  placeholder?: string;
  /** Current search value */
  value?: string;
  /** Callback when value changes */
  onValueChange?: (value: string) => void;
  /** Callback when clear button is pressed */
  onClear?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * Styled search input wrapper for the command palette
 *
 * Features:
 * - Search icon on left
 * - Clear (X) button when text is present
 * - ESC keyboard hint on right (desktop)
 * - Focus ring with primary color
 */
export function SearchInput({
  placeholder = "Search menu items...",
  value,
  onValueChange,
  onClear,
  className,
}: SearchInputProps) {
  const hasValue = Boolean(value?.trim());

  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-border/50 px-4 py-3",
        className
      )}
    >
      {/* Search icon */}
      <Search className="h-5 w-5 flex-shrink-0 text-text-muted" />

      {/* Input */}
      <Command.Input
        placeholder={placeholder}
        value={value}
        onValueChange={onValueChange}
        className={cn(
          "flex-1 bg-transparent text-base text-text-primary outline-none",
          "placeholder:text-text-muted",
          "focus:outline-none"
        )}
      />

      {/* Clear button - appears when text is present */}
      <AnimatePresence>
        {hasValue && onClear && (
          <m.button
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.12 }}
            onClick={onClear}
            className={cn(
              "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full",
              "bg-surface-secondary/80 hover:bg-surface-secondary",
              "text-text-muted hover:text-text-primary",
              "transition-colors duration-150"
            )}
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </m.button>
        )}
      </AnimatePresence>

      {/* ESC hint - visible on desktop alongside clear button */}
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

export default SearchInput;
