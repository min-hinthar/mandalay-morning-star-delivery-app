"use client";

import * as React from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { inputVariants } from "./input";

/**
 * V3 Search Input
 * Search icon on left, clear button on right when has value
 *
 * Height: 44px, matches base Input component
 */
export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** Controlled value */
  value: string;
  /** Callback when value changes */
  onValueChange: (value: string) => void;
  /** Callback when input is cleared */
  onClear?: () => void;
  /** Show loading spinner instead of clear button */
  isLoading?: boolean;
  /** Size variant */
  size?: "default" | "sm" | "lg";
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      value,
      onValueChange,
      onClear,
      isLoading = false,
      size = "default",
      placeholder = "Search...",
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Merge refs
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const handleClear = () => {
      onValueChange("");
      onClear?.();
      inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape" && value) {
        e.preventDefault();
        handleClear();
      }
      props.onKeyDown?.(e);
    };

    const showClearButton = value.length > 0 || isLoading;

    // Adjust padding for icon sizes
    const paddingLeft = size === "sm" ? "pl-9" : "pl-11";
    const paddingRight = showClearButton ? (size === "sm" ? "pr-9" : "pr-11") : "";

    return (
      <div className={cn("relative", className)}>
        {/* Search Icon */}
        <div
          className={cn(
            "absolute left-0 top-0 flex items-center justify-center pointer-events-none",
            "text-[var(--color-charcoal-muted)]",
            size === "sm" ? "h-9 w-9" : "h-11 w-11"
          )}
        >
          <Search className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} aria-hidden="true" />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="search"
          inputMode="search"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            inputVariants({ size }),
            paddingLeft,
            paddingRight,
            // Remove default search input styling
            "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
          )}
          {...props}
        />

        {/* Clear/Loading Button */}
        {showClearButton && (
          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading}
            className={cn(
              "absolute right-0 top-0 flex items-center justify-center",
              "text-[var(--color-charcoal-muted)]",
              "transition-colors hover:text-[var(--color-charcoal)]",
              "focus-visible:outline-none focus-visible:text-[var(--color-primary)]",
              "disabled:pointer-events-none",
              size === "sm" ? "h-9 w-9" : "h-11 w-11"
            )}
            aria-label={isLoading ? "Loading" : "Clear search"}
          >
            {isLoading ? (
              <Loader2
                className={cn("animate-spin", size === "sm" ? "h-4 w-4" : "h-5 w-5")}
                aria-hidden="true"
              />
            ) : (
              <X className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";

export { SearchInput };
