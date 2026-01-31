"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UtensilsCrossed, ShoppingCart, Search, Star } from "lucide-react";
import {
  ItemDetailSheet,
  UnifiedMenuItemCard,
  MenuCardWrapper,
  FeaturedCarousel,
  CategoryTabs,
} from "@/components/ui/menu";
import { useCart } from "@/lib/hooks/useCart";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import {
  staggerContainer,
  staggerItem,
  spring,
} from "@/lib/motion-tokens";
import type { MenuCategory, MenuItem } from "@/types/menu";
import type { SelectedModifier } from "@/types/cart";

// ============================================
// TYPES
// ============================================

// Extended MenuItem type with category slug for "All" tab
interface MenuItemWithCategory extends MenuItem {
  categorySlug: string;
}

interface HomepageMenuSectionProps {
  categories: MenuCategory[];
}

// ============================================
// FEATURED ITEMS LOGIC
// ============================================

const FEATURED_COUNT = 10;
const FEATURED_TAGS = ["featured", "popular", "best-seller", "chef-special"];

function getFeaturedItems(categories: MenuCategory[]): MenuItem[] {
  // Flatten all items
  const allItems = categories.flatMap((cat) => cat.items);

  // Filter items with featured/popular tags
  const featuredItems = allItems.filter((item) =>
    item.tags.some((tag) =>
      FEATURED_TAGS.includes(tag.toLowerCase())
    )
  );

  // If we have enough featured items, return them
  if (featuredItems.length >= FEATURED_COUNT) {
    return featuredItems.slice(0, FEATURED_COUNT);
  }

  // Pad with non-featured items to reach target count
  const nonFeaturedItems = allItems.filter(
    (item) =>
      !item.tags.some((tag) =>
        FEATURED_TAGS.includes(tag.toLowerCase())
      ) && !item.isSoldOut
  );

  // Sort deterministically by item ID to ensure consistent order between server and client
  // This prevents hydration mismatch caused by Math.random()
  const sorted = [...nonFeaturedItems].sort((a, b) => a.id.localeCompare(b.id));
  const paddingItems = sorted.slice(0, FEATURED_COUNT - featuredItems.length);

  return [...featuredItems, ...paddingItems];
}

// ============================================
// MAIN COMPONENT
// ============================================

export function HomepageMenuSection({ categories }: HomepageMenuSectionProps) {
  const { shouldAnimate } = useAnimationPreference();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addItem } = useCart();
  const { open: openCart } = useCartDrawer();
  const { favorites, toggleFavorite } = useFavorites();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Create favorites Set for quick lookup
  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  // Memoize featured items (only recalculate if categories change)
  const featuredItems = useMemo(
    () => getFeaturedItems(categories),
    [categories]
  );

  // Filter items based on search query
  const filteredCategories = categories.map((category) => ({
    ...category,
    items: category.items.filter(
      (item) =>
        !searchQuery ||
        item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nameMy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.descriptionEn?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.items.length > 0);

  // Get all items for "All" tab with category slug preserved
  const allItemsWithCategory: MenuItemWithCategory[] = categories.flatMap((cat) =>
    cat.items.map(item => ({ ...item, categorySlug: cat.slug }))
  );
  const filteredAllItems = allItemsWithCategory.filter(
    (item) =>
      !searchQuery ||
      item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameMy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.descriptionEn?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle category change
  const handleCategoryChange = useCallback((categorySlug: string | null) => {
    setActiveCategory(categorySlug);

    if (categorySlug) {
      const category = categories.find((c) => c.slug === categorySlug);
      if (category) {
        const element = sectionRefs.current.get(category.id);
        if (element) {
          const offset = 120; // Account for sticky headers
          const elementPosition = element.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: elementPosition - offset,
            behavior: shouldAnimate ? "smooth" : "auto",
          });
        }
      }
    }
  }, [categories, shouldAnimate]);

  // Handle item click (from both carousel and grid)
  const handleItemClick = useCallback((item: MenuItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  }, []);

  // Handle modal close - delay clearing item to allow exit animation to complete
  const handleCloseDetail = useCallback(() => {
    setIsModalOpen(false);
    // Clear any pending timeout
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    // Delay clearing item to allow close animation to complete
    closeTimeoutRef.current = setTimeout(() => setSelectedItem(null), 300);
  }, []);

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback(
    (item: MenuItem, _isFavorite: boolean) => {
      toggleFavorite(item.id);
    },
    [toggleFavorite]
  );

  // Handle add to cart
  const handleAddToCart = useCallback(
    (item: MenuItem, modifiers: SelectedModifier[], quantity: number, notes: string) => {
      addItem({
        menuItemId: item.id,
        menuItemSlug: item.slug,
        nameEn: item.nameEn,
        nameMy: item.nameMy,
        basePriceCents: item.basePriceCents,
        imageUrl: item.imageUrl,
        quantity,
        modifiers: modifiers.map((m) => ({
          groupId: m.groupId,
          groupName: m.groupName,
          optionId: m.optionId,
          optionName: m.optionName,
          priceDeltaCents: m.priceDeltaCents,
        })),
        notes,
      });

      // Use delayed close to allow exit animation to complete
      handleCloseDetail();
      openCart();
    },
    [addItem, handleCloseDetail, openCart]
  );

  // Set section ref
  const setSectionRef = useCallback((categoryId: string, element: HTMLElement | null) => {
    if (element) {
      sectionRefs.current.set(categoryId, element);
    }
  }, []);

  // Items to display based on active category
  const activeSlug = activeCategory;
  const displayItems = activeSlug === null
    ? filteredAllItems
    : filteredCategories.find((cat) => cat.slug === activeSlug)?.items || [];

  // Hide featured carousel when searching
  const showFeaturedCarousel = !searchQuery && featuredItems.length >= 5;

  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-surface-primary via-surface-secondary/30 to-surface-primary isolate" id="menu">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          variants={staggerContainer()}
          initial={shouldAnimate ? "hidden" : undefined}
          whileInView={shouldAnimate ? "visible" : undefined}
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-12"
        >
          <motion.div
            variants={staggerItem}
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-pill mb-4"
          >
            <UtensilsCrossed className="w-4 h-4 text-secondary" />
            <span className="text-sm font-body font-medium text-secondary-hover">Our Menu</span>
          </motion.div>

          <motion.h2
            variants={staggerItem}
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4"
          >
            Authentic Burmese Cuisine
          </motion.h2>

          <motion.p variants={staggerItem} className="font-body text-text-secondary max-w-2xl mx-auto mb-8">
            Handcrafted dishes from traditional Burmese recipes, prepared fresh for Saturday delivery.
            Browse our full menu and add your favorites to cart.
          </motion.p>

          {/* Search Bar */}
          <motion.div variants={staggerItem} className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes..."
                className="w-full pl-12 pr-4 py-3 rounded-input border-2 border-border bg-surface-primary font-body text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors duration-fast"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors duration-fast"
                >
                  ×
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Featured Dishes Carousel */}
        {showFeaturedCarousel && (
          <motion.div
            initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
            whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
            viewport={{ once: true, margin: "-80px" }}
            transition={spring.gentle}
            className="mb-16"
          >
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-6 px-4 md:px-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/10 rounded-full">
                <Star className="w-4 h-4 text-secondary fill-secondary" />
                <span className="text-sm font-body font-semibold text-secondary">Featured</span>
              </div>
              <h3 className="font-display text-xl md:text-2xl font-bold text-primary">
                Featured Dishes
              </h3>
            </div>

            {/* Carousel */}
            <FeaturedCarousel
              items={featuredItems}
              onItemSelect={handleItemClick}
              favorites={favoritesSet}
              onFavoriteToggle={handleFavoriteToggle}
            />
          </motion.div>
        )}

        {/* Browse All Section Header */}
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 12 } : undefined}
          whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          viewport={{ once: true, margin: "-50px" }}
          transition={spring.gentle}
          className="mb-6"
        >
          <h3 className="font-display text-xl md:text-2xl font-bold text-primary">
            {searchQuery ? "Search Results" : "Browse All Dishes"}
          </h3>
          <p className="text-sm font-body text-text-muted mt-1">
            {searchQuery
              ? `${displayItems.length} items found`
              : `${allItemsWithCategory.length} items across ${categories.length} categories`}
          </p>
        </motion.div>

        {/* Category Tabs */}
        <div className="-mx-4 mb-8">
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onCategoryClick={handleCategoryChange}
          />
        </div>

        {/* Menu Grid */}
        <AnimatePresence mode="wait">
          {displayItems.length > 0 ? (
            <motion.div
              key={activeCategory || "all"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeCategory === null ? (
                // Show all items in a single grid - standardized to 3 cols on lg
                <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {filteredAllItems.map((item, index) => (
                    <MenuCardWrapper
                      key={item.id}
                      itemId={item.id}
                      index={index}
                      animateMode="immediate"
                    >
                      <UnifiedMenuItemCard
                        item={item}
                        variant="menu"
                        categorySlug={item.categorySlug}
                        onSelect={handleItemClick}
                        isFavorite={favoritesSet.has(item.id)}
                        onFavoriteToggle={handleFavoriteToggle}
                        priority={index < 6}
                      />
                    </MenuCardWrapper>
                  ))}
                </div>
              ) : (
                // Show by category
                filteredCategories
                  .filter((cat) => cat.slug === activeCategory)
                  .map((category) => (
                    <div
                      key={category.id}
                      ref={(el) => setSectionRef(category.id, el)}
                    >
                      <div className="mb-6">
                        <h3 className="font-display text-2xl font-bold text-primary">{category.name}</h3>
                        <p className="text-sm font-body text-text-muted">
                          {category.items.length} items
                        </p>
                      </div>
                      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                        {category.items.map((item, index) => (
                          <MenuCardWrapper
                            key={item.id}
                            itemId={item.id}
                            index={index}
                            animateMode="immediate"
                          >
                            <UnifiedMenuItemCard
                              item={item}
                              variant="menu"
                              categorySlug={category.slug}
                              onSelect={handleItemClick}
                              isFavorite={favoritesSet.has(item.id)}
                              onFavoriteToggle={handleFavoriteToggle}
                              priority={index < 6}
                            />
                          </MenuCardWrapper>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <UtensilsCrossed className="w-16 h-16 text-text-muted/30 mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold text-text-muted mb-2">
                No dishes found
              </h3>
              <p className="text-sm font-body text-text-muted">
                Try adjusting your search or browse all categories
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory(null);
                }}
                className="mt-4 px-6 py-3 bg-primary text-text-inverse rounded-pill font-body font-semibold hover:bg-primary-hover transition-colors duration-fast shadow-sm hover:shadow-md"
              >
                View All Dishes
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Item Detail Sheet */}
        <ItemDetailSheet
          item={selectedItem}
          isOpen={isModalOpen}
          onClose={handleCloseDetail}
          onAddToCart={handleAddToCart}
        />

        {/* Footer CTA */}
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 18 } : undefined}
          whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          viewport={{ once: true, margin: "-80px" }}
          transition={spring.gentle}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-surface-primary rounded-card shadow-card border border-border">
            <ShoppingCart className="w-5 h-5 text-green" />
            <span className="font-body text-text-primary">
              <strong className="text-green">Free delivery</strong> on orders over $100!
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default HomepageMenuSection;
