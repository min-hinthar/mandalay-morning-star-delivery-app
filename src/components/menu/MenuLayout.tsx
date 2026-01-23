"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { CategoryCarousel } from "./CategoryCarousel";
import { MenuItemCard } from "./MenuItemCard";
import { ItemDetail } from "./ItemDetail";
import type { MenuItem, MenuCategory } from "@/types/menu";

// ============================================
// TYPES
// ============================================

export interface MenuLayoutProps {
  /** Categories with items */
  categories: MenuCategory[];
  /** Callback when adding to cart */
  onAddToCart: (item: MenuItem, quantity: number, modifiers: Record<string, string[]>) => void;
  /** Search query */
  searchQuery?: string;
  /** Callback for search change */
  onSearchChange?: (query: string) => void;
  /** Favorited item IDs */
  favoriteIds?: string[];
  /** Callback for favorite toggle */
  onFavoriteToggle?: (item: MenuItem, isFavorite: boolean) => void;
  /** Additional className */
  className?: string;
}

// ============================================
// SEARCH BAR
// ============================================

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

function SearchBar({ value, onChange, onFocus, onBlur }: SearchBarProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  const handleClear = useCallback(() => {
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);

  return (
    <motion.div
      className={cn(
        "relative flex items-center gap-3 px-4 py-3 rounded-full",
        "bg-surface-secondary border-2 transition-colors",
        isFocused ? "border-primary" : "border-transparent"
      )}
      animate={
        shouldAnimate && isFocused
          ? { scale: 1.02, boxShadow: "0 4px 20px rgba(164, 16, 52, 0.15)" }
          : { scale: 1, boxShadow: "none" }
      }
      transition={getSpring(spring.snappy)}
    >
      <motion.div
        animate={shouldAnimate && isFocused ? { scale: 1.1 } : { scale: 1 }}
        transition={getSpring(spring.snappy)}
      >
        <Search className="w-5 h-5 text-text-muted" />
      </motion.div>

      <input
        ref={inputRef}
        type="text"
        placeholder="Search menu..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          "flex-1 bg-transparent outline-none",
          "font-body text-text-primary placeholder:text-text-muted"
        )}
      />

      <AnimatePresence>
        {value && (
          <motion.button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-full hover:bg-surface-primary"
            initial={shouldAnimate ? { opacity: 0, scale: 0 } : undefined}
            animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
            exit={shouldAnimate ? { opacity: 0, scale: 0 } : undefined}
            transition={getSpring(spring.snappy)}
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-text-muted" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// FILTER BUTTON
// ============================================

interface FilterButtonProps {
  onClick: () => void;
  activeCount?: number;
}

function FilterButton({ onClick, activeCount = 0 }: FilterButtonProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 px-4 py-3 rounded-full",
        "bg-surface-secondary text-text-primary",
        "font-body font-medium",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      )}
      whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
      transition={getSpring(spring.snappy)}
    >
      <SlidersHorizontal className="w-5 h-5" />
      <span>Filter</span>

      <AnimatePresence>
        {activeCount > 0 && (
          <motion.span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold"
            initial={shouldAnimate ? { scale: 0 } : undefined}
            animate={shouldAnimate ? { scale: 1 } : undefined}
            exit={shouldAnimate ? { scale: 0 } : undefined}
            transition={getSpring(spring.rubbery)}
          >
            {activeCount}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ============================================
// CATEGORY SECTION
// ============================================

interface CategorySectionProps {
  category: MenuCategory;
  items: MenuItem[];
  onItemSelect: (item: MenuItem) => void;
  onQuickAdd: (item: MenuItem) => void;
  favoriteIds: string[];
  onFavoriteToggle: (item: MenuItem, isFavorite: boolean) => void;
  sectionRef: (el: HTMLElement | null) => void;
}

function CategorySection({
  category,
  items,
  onItemSelect,
  onQuickAdd,
  favoriteIds,
  onFavoriteToggle,
  sectionRef,
}: CategorySectionProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  if (items.length === 0) return null;

  return (
    <motion.section
      ref={sectionRef}
      id={`category-${category.slug}`}
      className="scroll-mt-32"
      initial={shouldAnimate ? { opacity: 0 } : undefined}
      whileInView={shouldAnimate ? { opacity: 1 } : undefined}
      viewport={{ once: true, margin: "-100px" }}
      transition={getSpring(spring.default)}
    >
      {/* Category header */}
      <motion.div
        className="mb-4"
        initial={shouldAnimate ? { opacity: 0, x: -20 } : undefined}
        whileInView={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
        viewport={{ once: true }}
        transition={getSpring(spring.default)}
      >
        <h2 className="font-display text-2xl font-bold text-text-primary">
          {category.name}
        </h2>
      </motion.div>

      {/* Items grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={shouldAnimate ? staggerContainer() : undefined}
        initial={shouldAnimate ? "hidden" : undefined}
        whileInView={shouldAnimate ? "visible" : undefined}
        viewport={{ once: true, margin: "-50px" }}
      >
        {items.map((item, index) => (
          <motion.div key={item.id} variants={shouldAnimate ? staggerItem : undefined}>
            <MenuItemCard
              item={item}
              onSelect={onItemSelect}
              onQuickAdd={onQuickAdd}
              isFavorite={favoriteIds.includes(item.id)}
              onFavoriteToggle={onFavoriteToggle}
              layoutId={`menu-item-${item.id}`}
              index={index}
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}

// ============================================
// EMPTY STATE
// ============================================

interface EmptyStateProps {
  query: string;
}

function EmptyState({ query }: EmptyStateProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 text-center"
      initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(spring.default)}
    >
      <motion.div
        className="text-6xl mb-4"
        animate={shouldAnimate ? { rotate: [0, 10, -10, 0] } : undefined}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      >
        🔍
      </motion.div>
      <h3 className="font-display text-xl font-semibold text-text-primary mb-2">
        No items found
      </h3>
      <p className="font-body text-text-secondary max-w-sm">
        {query
          ? `We couldn't find any items matching "${query}". Try a different search.`
          : "No items available in this category."}
      </p>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MenuLayout({
  categories,
  onAddToCart,
  searchQuery = "",
  onSearchChange,
  favoriteIds = [],
  onFavoriteToggle,
  className,
}: MenuLayoutProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  // State
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedItemCategorySlug, setSelectedItemCategorySlug] = useState<string | null>(null);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Refs for scroll spy
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Create flat items list with category reference
  const allItems = useMemo(() => {
    const items: Array<MenuItem & { _categorySlug: string }> = [];
    categories.forEach((cat) => {
      cat.items.forEach((item) => {
        items.push({ ...item, _categorySlug: cat.slug });
      });
    });
    return items;
  }, [categories]);

  // Search handling
  const handleSearchChange = useCallback(
    (query: string) => {
      setLocalSearchQuery(query);
      onSearchChange?.(query);
    },
    [onSearchChange]
  );

  // Filter items by search and category
  const filteredItems = useMemo(() => {
    let result = allItems;

    // Filter by search query
    if (localSearchQuery) {
      const query = localSearchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.nameEn.toLowerCase().includes(query) ||
          item.descriptionEn?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (activeCategory) {
      result = result.filter((item) => item._categorySlug === activeCategory);
    }

    return result;
  }, [allItems, localSearchQuery, activeCategory]);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    filteredItems.forEach((item) => {
      const categorySlug = item._categorySlug;
      if (!map.has(categorySlug)) {
        map.set(categorySlug, []);
      }
      map.get(categorySlug)!.push(item);
    });
    return map;
  }, [filteredItems]);

  // Scroll spy for active category
  useEffect(() => {
    if (!shouldAnimate) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !activeCategory) {
            // Future: Extract slug from entry.target.id for scroll spy highlighting
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );

    sectionRefs.current.forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [activeCategory, shouldAnimate]);

  // Handle category click with smooth scroll
  const handleCategoryClick = useCallback((slug: string | null) => {
    setActiveCategory(slug);

    if (slug) {
      const section = sectionRefs.current.get(slug);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      // Scroll to top for "All"
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  // Handle item select (open detail)
  const handleItemSelect = useCallback((item: MenuItem) => {
    setSelectedItem(item);
    // Find the category for this item
    const itemWithCategory = allItems.find((i) => i.id === item.id);
    setSelectedItemCategorySlug(itemWithCategory?._categorySlug ?? null);
  }, [allItems]);

  // Handle quick add
  const handleQuickAdd = useCallback(
    (item: MenuItem) => {
      onAddToCart(item, 1, {});
    },
    [onAddToCart]
  );

  // Handle add to cart from detail
  const handleDetailAddToCart = useCallback(
    (item: MenuItem, quantity: number, modifiers: Record<string, string[]>) => {
      onAddToCart(item, quantity, modifiers);
      setSelectedItem(null);
    },
    [onAddToCart]
  );

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback(
    (item: MenuItem, isFavorite: boolean) => {
      onFavoriteToggle?.(item, isFavorite);
    },
    [onFavoriteToggle]
  );

  // Get related items for detail view
  const relatedItems = useMemo(() => {
    if (!selectedItem || !selectedItemCategorySlug) return [];
    return allItems
      .filter(
        (item) =>
          item.id !== selectedItem.id &&
          item._categorySlug === selectedItemCategorySlug
      )
      .slice(0, 4);
  }, [selectedItem, selectedItemCategorySlug, allItems]);

  // Visible categories (have items after filtering)
  const visibleCategories = useMemo(() => {
    if (localSearchQuery || activeCategory) {
      return categories.filter((cat) => {
        const categoryItems = itemsByCategory.get(cat.slug);
        return categoryItems && categoryItems.length > 0;
      });
    }
    return categories;
  }, [categories, itemsByCategory, localSearchQuery, activeCategory]);

  return (
    <LayoutGroup>
      <div className={cn("min-h-screen bg-surface-primary", className)}>
        {/* Search and filter bar */}
        <motion.div
          className="sticky top-0 z-sticky bg-surface-primary/95 backdrop-blur-lg border-b border-border"
          initial={shouldAnimate ? { y: -20, opacity: 0 } : undefined}
          animate={shouldAnimate ? { y: 0, opacity: 1 } : undefined}
          transition={getSpring(spring.default)}
        >
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <SearchBar
                  value={localSearchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              <FilterButton onClick={() => {}} />
            </div>
          </div>
        </motion.div>

        {/* Category carousel */}
        <CategoryCarousel
          categories={categories}
          activeCategory={activeCategory}
          onCategoryClick={handleCategoryClick}
          showAll
          sticky
        />

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* Results count */}
          <AnimatePresence mode="wait">
            {localSearchQuery && (
              <motion.p
                className="text-sm text-text-muted mb-4 font-body"
                initial={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
                animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
                exit={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
                transition={getSpring(spring.snappy)}
              >
                Found {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} for &ldquo;{localSearchQuery}&rdquo;
              </motion.p>
            )}
          </AnimatePresence>

          {/* Empty state or categories */}
          {filteredItems.length === 0 ? (
            <EmptyState query={localSearchQuery} />
          ) : (
            <div className="space-y-12">
              {visibleCategories.map((category) => (
                <CategorySection
                  key={category.slug}
                  category={category}
                  items={itemsByCategory.get(category.slug) || []}
                  onItemSelect={handleItemSelect}
                  onQuickAdd={handleQuickAdd}
                  favoriteIds={favoriteIds}
                  onFavoriteToggle={handleFavoriteToggle}
                  sectionRef={(el) => {
                    if (el) {
                      sectionRefs.current.set(category.slug, el);
                    } else {
                      sectionRefs.current.delete(category.slug);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </main>

        {/* Item detail overlay */}
        <AnimatePresence>
          {selectedItem && (
            <ItemDetail
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              onAddToCart={handleDetailAddToCart}
              layoutId={`menu-item-${selectedItem.id}`}
              relatedItems={relatedItems}
              isFavorite={favoriteIds.includes(selectedItem.id)}
              onFavoriteToggle={handleFavoriteToggle}
            />
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}

export default MenuLayout;
