"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { UtensilsCrossed, ShoppingCart, ArrowRight } from "lucide-react";
import { ItemDetailSheet } from "@/components/ui/menu";
import { FeaturedSections } from "@/components/ui/homepage/FeaturedSections";
import { useCart } from "@/lib/hooks/useCart";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { staggerContainer, staggerItem, spring } from "@/lib/motion-tokens";
import type { MenuItem } from "@/types/menu";
import type { FeaturedSectionWithItems } from "@/types/featured-sections";
import type { SelectedModifier } from "@/types/cart";

// ============================================
// TYPES
// ============================================

interface HomepageMenuSectionProps {
  featuredSections: FeaturedSectionWithItems[];
}

// ============================================
// MAIN COMPONENT
// ============================================

export function HomepageMenuSection({ featuredSections }: HomepageMenuSectionProps) {
  const { shouldAnimate } = useAnimationPreference();
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  return (
    <section
      className="py-16 md:py-24 px-4 bg-gradient-to-b from-surface-primary via-surface-secondary/30 to-surface-primary isolate"
      id="menu"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <m.div
          variants={staggerContainer()}
          initial={shouldAnimate ? "hidden" : undefined}
          whileInView={shouldAnimate ? "visible" : undefined}
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-12"
        >
          <m.div
            variants={staggerItem}
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-pill mb-4"
          >
            <UtensilsCrossed className="w-4 h-4 text-secondary" />
            <span className="text-sm font-body font-medium text-secondary-hover">Our Menu</span>
          </m.div>

          <m.h2
            variants={staggerItem}
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4"
          >
            Authentic Burmese Cuisine
          </m.h2>

          <m.p variants={staggerItem} className="font-body text-text-secondary max-w-2xl mx-auto">
            Handcrafted dishes from traditional Burmese recipes, prepared fresh for Saturday
            delivery.
          </m.p>
        </m.div>

        {/* Dynamic Featured Sections */}
        {featuredSections.length > 0 ? (
          <FeaturedSections
            sections={featuredSections}
            onItemSelect={handleItemClick}
            favorites={favoritesSet}
            onFavoriteToggle={handleFavoriteToggle}
          />
        ) : (
          <m.div
            initial={shouldAnimate ? { opacity: 0 } : undefined}
            whileInView={shouldAnimate ? { opacity: 1 } : undefined}
            viewport={{ once: true }}
            className="text-center py-16"
          >
            <UtensilsCrossed className="w-16 h-16 text-text-muted/30 mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold text-text-muted mb-2">
              Menu Coming Soon
            </h3>
            <p className="text-sm font-body text-text-muted">
              Check back later for our featured dishes.
            </p>
          </m.div>
        )}

        {/* See Full Menu CTA */}
        <m.div
          initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
          whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          viewport={{ once: true, margin: "-50px" }}
          transition={spring.gentle}
          className="text-center mt-12"
        >
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-text-inverse rounded-pill font-body font-semibold hover:bg-primary-hover transition-colors duration-fast shadow-md hover:shadow-lg"
          >
            See Full Menu
            <ArrowRight className="w-5 h-5" />
          </Link>
        </m.div>

        {/* Item Detail Sheet */}
        <ItemDetailSheet
          item={selectedItem}
          isOpen={isModalOpen}
          onClose={handleCloseDetail}
          onAddToCart={handleAddToCart}
        />

        {/* Footer CTA */}
        <m.div
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
        </m.div>
      </div>
    </section>
  );
}

export default HomepageMenuSection;
