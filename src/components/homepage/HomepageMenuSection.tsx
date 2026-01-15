"use client";

import { useState, useRef, useCallback } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { UtensilsCrossed, ShoppingCart, Search } from "lucide-react";
import { ItemCard } from "@/components/menu/ItemCard";
import { ItemDetailModal } from "@/components/menu/item-detail-modal";
import { CategoryTabs } from "@/components/menu/category-tabs";
import { useCart } from "@/lib/hooks/useCart";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import { staggerContainer, fadeInUp, viewportSettings } from "@/lib/animations/variants";
import type { MenuCategory, MenuItem } from "@/types/menu";
import type { SelectedModifier } from "@/types/cart";

interface HomepageMenuSectionProps {
  categories: MenuCategory[];
}

export function HomepageMenuSection({ categories }: HomepageMenuSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const { addItem } = useCart();
  const { open: openCart } = useCartDrawer();

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

  // Get all items for "All" tab
  const allItems = categories.flatMap((cat) => cat.items);
  const filteredAllItems = allItems.filter(
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
            behavior: shouldReduceMotion ? "auto" : "smooth",
          });
        }
      }
    }
  }, [categories, shouldReduceMotion]);

  // Handle item click
  const handleItemClick = useCallback((item: MenuItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  }, []);

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

      setIsModalOpen(false);
      setSelectedItem(null);
      openCart();
    },
    [addItem, openCart]
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

  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-background via-cream/30 to-background" id="menu">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          variants={staggerContainer}
          initial={shouldReduceMotion ? undefined : "hidden"}
          whileInView={shouldReduceMotion ? undefined : "visible"}
          viewport={viewportSettings}
          className="text-center mb-12"
        >
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-full mb-4"
          >
            <UtensilsCrossed className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-gold-dark">Our Menu</span>
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            className="font-display text-3xl md:text-4xl lg:text-5xl text-brand-red mb-4"
          >
            Authentic Burmese Cuisine
          </motion.h2>

          <motion.p variants={fadeInUp} className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Handcrafted dishes from traditional Burmese recipes, prepared fresh for Saturday delivery.
            Browse our full menu and add your favorites to cart.
          </motion.p>

          {/* Search Bar */}
          <motion.div variants={fadeInUp} className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-border bg-white focus:border-gold focus:ring-0 outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Category Tabs */}
        <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 mb-8">
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
                // Show all items in a single grid
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {displayItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.05, 0.5) }}
                    >
                      <ItemCard
                        item={item}
                        onSelect={handleItemClick}
                      />
                    </motion.div>
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
                        <h3 className="font-display text-2xl text-brand-red">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {category.items.length} items
                        </p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {category.items.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index * 0.05, 0.5) }}
                          >
                            <ItemCard
                              item={item}
                              onSelect={handleItemClick}
                            />
                          </motion.div>
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
              <UtensilsCrossed className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-display text-xl text-muted-foreground mb-2">
                No dishes found
              </h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or browse all categories
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory(null);
                }}
                className="mt-4 px-6 py-2 bg-brand-red text-white rounded-lg font-medium hover:bg-brand-red-light transition-colors"
              >
                View All Dishes
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Item Detail Modal */}
        <ItemDetailModal
          item={selectedItem}
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedItem(null);
          }}
          onAddToCart={handleAddToCart}
        />

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportSettings}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-4 glass rounded-2xl shadow-lg">
            <ShoppingCart className="w-5 h-5 text-jade" />
            <span className="text-foreground">
              <strong className="text-jade">Free delivery</strong> on orders over $100!
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default HomepageMenuSection;
