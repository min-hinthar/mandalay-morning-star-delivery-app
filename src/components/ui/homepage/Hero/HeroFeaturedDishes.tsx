"use client";

/**
 * HeroFeaturedDishes — appetite carousel inside the hero
 *
 * Reuses the existing FeaturedCarousel (the same warm-paper menu cards used
 * elsewhere), fed with dishes aggregated across featured sections (popular,
 * new, etc.). Tapping a card opens the item detail modal to order in place —
 * same as the menu page / homepage section — instead of jumping to /menu.
 */

import { useState, useRef, useCallback, useEffect, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FeaturedCarousel } from "@/components/ui/menu/FeaturedCarousel";
import { ItemDetailSheet } from "@/components/ui/menu";
import { HeroSunburst } from "./HeroSunburst";
import { useCart } from "@/lib/hooks/useCart";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import type { MenuItem } from "@/types/menu";
import type { SelectedModifier } from "@/types/cart";

interface HeroFeaturedDishesProps {
  dishes: MenuItem[];
  menuHref?: string;
}

export function HeroFeaturedDishes({ dishes, menuHref = "/menu" }: HeroFeaturedDishesProps) {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addItem } = useCart();
  const { open: openCart } = useCartDrawer();

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const handleItemClick = useCallback((item: MenuItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  }, []);

  // Delay clearing the item so the close animation can finish.
  const handleClose = useCallback(() => {
    setIsModalOpen(false);
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => setSelectedItem(null), 300);
  }, []);

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
      handleClose();
      openCart();
    },
    [addItem, handleClose, openCart]
  );

  if (dishes.length === 0) return null;

  return (
    <div className="relative w-full">
      {/* Subtle Anthropic dot-grid wash behind the cards (radial-masked, faint) */}
      <div
        aria-hidden="true"
        className="hero-dotgrid pointer-events-none absolute inset-x-0 top-12 bottom-8 opacity-[0.16]"
        style={
          {
            "--dot-color": "rgba(20, 20, 19, 0.5)",
            "--dot-gap": "22px",
            "--dot-r": "1px",
            maskImage: "radial-gradient(120% 90% at 50% 50%, #000 30%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(120% 90% at 50% 50%, #000 30%, transparent 78%)",
          } as CSSProperties
        }
      />

      {/* Header */}
      <div className="relative mb-1 flex items-end justify-between gap-3 px-4 md:px-6">
        <div className="text-left">
          <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-hero-text/70">
            <HeroSunburst className="h-3.5 w-3.5 text-hero-clay" rays={8} />
            Straight from our kitchen
            <span className="text-hero-text/40" aria-hidden="true">
              ·
            </span>
            <span className="font-bold text-hero-clay">{dishes.length} picks</span>
          </p>
          <h2 className="font-display text-xl font-bold text-hero-text hero-text-glow md:text-2xl">
            Crave-worthy right now{" "}
            <span className="font-body text-sm text-hero-text/60">· စားချင်စဖွယ်</span>
          </h2>
        </div>
        <Link
          href={menuHref}
          className="group inline-flex shrink-0 items-center gap-1 rounded-full hero-surface-paper px-3 py-1.5 text-sm font-semibold text-hero-ink transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-clay/50"
        >
          Full menu
          <ArrowRight className="h-4 w-4 text-hero-clay transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </div>

      <FeaturedCarousel
        className="relative"
        items={dishes}
        autoScrollInterval={5000}
        onItemSelect={handleItemClick}
      />

      {/* Detail modal — order in place instead of jumping to the menu page */}
      <ItemDetailSheet
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={handleClose}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
