"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useMenuSearch } from "@/lib/hooks/useMenu";
import { SearchAutocomplete } from "./SearchAutocomplete";
import type { MenuItem } from "@/types/menu";

// ============================================
// TYPES
// ============================================

export interface SearchInputProps {
  /** Callback when item is selected from autocomplete */
  onSelectItem?: (item: MenuItem) => void;
  /** Callback when search query changes */
  onQueryChange?: (query: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Mobile mode - collapses to icon */
  mobileCollapsible?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================
// CONSTANTS
// ============================================

const DEBOUNCE_MS = 300;

// ============================================
// ANIMATION VARIANTS
// ============================================

const expandVariants = {
  collapsed: {
    width: 44,
    paddingLeft: 0,
    paddingRight: 0,
  },
  expanded: {
    width: "100%",
    paddingLeft: 12,
    paddingRight: 44,
  },
};

const inputVariants = {
  hidden: { opacity: 0, width: 0 },
  visible: { opacity: 1, width: "100%" },
  exit: { opacity: 0, width: 0 },
};

// ============================================
// MAIN COMPONENT
// ============================================

export function SearchInput({
  onSelectItem,
  onQueryChange,
  placeholder = "Search menu...",
  mobileCollapsible = true,
  className,
}: SearchInputProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Timeout refs for cleanup
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
    };
  }, []);

  // Debounced query for API calls
  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);

  // Search API hook
  const { data, isLoading } = useMenuSearch(debouncedQuery);

  // Get search results
  const searchResults = data?.data?.items ?? [];

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Show autocomplete when focused and has query
  const showAutocomplete = isFocused && debouncedQuery.length > 0;

  // Handle query change
  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newQuery = e.target.value;
      setQuery(newQuery);
      onQueryChange?.(newQuery);
    },
    [onQueryChange]
  );

  // Handle item selection
  const handleSelectItem = useCallback(
    (item: MenuItem) => {
      onSelectItem?.(item);
      setQuery("");
      setIsFocused(false);
      setIsExpanded(false);
      inputRef.current?.blur();
    },
    [onSelectItem]
  );

  // Handle clear button
  const handleClear = useCallback(() => {
    setQuery("");
    onQueryChange?.("");
    // Keep focus on input after clear
    inputRef.current?.focus();
  }, [onQueryChange]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  // Handle blur
  const handleBlur = useCallback(() => {
    // Clear any pending blur timeout
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    // Delay blur to allow autocomplete click to register
    blurTimeoutRef.current = setTimeout(() => {
      setIsFocused(false);
      // Collapse on mobile if empty
      if (isMobile && mobileCollapsible && !query) {
        setIsExpanded(false);
      }
    }, 150);
  }, [isMobile, mobileCollapsible, query]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setIsFocused(false);
        setQuery("");
        inputRef.current?.blur();
      }
    },
    []
  );

  // Handle icon click (expand on mobile)
  const handleIconClick = useCallback(() => {
    if (isMobile && mobileCollapsible && !isExpanded) {
      setIsExpanded(true);
      // Focus input after expansion animation
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      inputRef.current?.focus();
    }
  }, [isMobile, mobileCollapsible, isExpanded]);

  // Determine if input should be visible
  const showInput = !isMobile || !mobileCollapsible || isExpanded;

  const springConfig = getSpring(spring.snappy);

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
    >
      {/* Desktop: always visible input */}
      {/* Mobile: expandable from icon */}
      <motion.div
        variants={mobileCollapsible && isMobile && shouldAnimate ? expandVariants : undefined}
        initial={false}
        animate={
          mobileCollapsible && isMobile && shouldAnimate
            ? isExpanded
              ? "expanded"
              : "collapsed"
            : undefined
        }
        transition={springConfig}
        className={cn(
          "flex items-center",
          "bg-surface-secondary rounded-full",
          "border border-border",
          "transition-shadow",
          isFocused && "ring-2 ring-primary/30 border-primary",
          !showInput && "w-11 justify-center"
        )}
      >
        {/* Search icon / expand button */}
        <motion.button
          type="button"
          onClick={handleIconClick}
          className={cn(
            "flex-shrink-0 flex items-center justify-center",
            "w-11 h-11",
            "text-text-muted hover:text-text-primary",
            "transition-colors",
            "focus-visible:outline-none focus-visible:text-primary",
            showInput ? "absolute left-0" : ""
          )}
          whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
          whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
          aria-label={showInput ? "Search" : "Open search"}
        >
          <Search className="w-5 h-5" />
        </motion.button>

        {/* Input field */}
        <AnimatePresence>
          {showInput && (
            <motion.input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleQueryChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              variants={shouldAnimate ? inputVariants : undefined}
              initial={shouldAnimate && isMobile && mobileCollapsible ? "hidden" : undefined}
              animate={shouldAnimate ? "visible" : undefined}
              exit={shouldAnimate ? "exit" : undefined}
              transition={springConfig}
              className={cn(
                "flex-1 bg-transparent",
                "h-11 pl-11 pr-10",
                "text-text-primary placeholder:text-text-muted",
                "focus:outline-none",
                "text-base"
              )}
              aria-label="Search menu"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          )}
        </AnimatePresence>

        {/* Clear button */}
        <AnimatePresence>
          {showInput && query && (
            <motion.button
              type="button"
              onClick={handleClear}
              initial={shouldAnimate ? { opacity: 0, scale: 0.5 } : undefined}
              animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
              exit={shouldAnimate ? { opacity: 0, scale: 0.5 } : undefined}
              transition={getSpring(spring.snappy)}
              className={cn(
                "absolute right-1 flex items-center justify-center",
                "w-9 h-9 rounded-full",
                "text-text-muted hover:text-text-primary",
                "hover:bg-surface-tertiary",
                "transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              )}
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Autocomplete dropdown */}
      <SearchAutocomplete
        items={searchResults}
        isLoading={isLoading && debouncedQuery.length > 0}
        isOpen={showAutocomplete}
        onSelect={handleSelectItem}
        query={debouncedQuery}
      />
    </div>
  );
}

export default SearchInput;
