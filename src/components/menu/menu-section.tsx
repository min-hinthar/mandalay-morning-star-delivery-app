"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import type { MenuCategory, MenuItem } from "@/types/menu";
import { UnifiedMenuItemCard } from "./UnifiedMenuItemCard";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

interface MenuSectionProps {
  category: MenuCategory;
  id?: string;
  onItemSelect: (item: MenuItem) => void;
}

export const MenuSection = forwardRef<HTMLElement, MenuSectionProps>(
  function MenuSection({ category, id, onItemSelect }, ref) {
    const { shouldAnimate } = useAnimationPreference();

    return (
      <section
        ref={ref}
        id={id ?? category.slug}
        className="scroll-mt-32 pt-6"
      >
        <div className="sticky top-[120px] z-10 -mx-4 border-b border-border/50 bg-background/95 py-3 backdrop-blur-sm">
          <h2 className="px-4 text-xl font-display text-brand-red">
            {category.name}
            <span className="ml-2 text-sm font-normal text-muted">
              ({category.items.length}{" "}
              {category.items.length === 1 ? "item" : "items"})
            </span>
          </h2>
        </div>

        {/* Responsive grid: 1 col mobile, 2 cols tablet, 3 cols desktop */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {category.items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={shouldAnimate ? { opacity: 0, y: 18 } : undefined}
              whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                delay: Math.min(index * 0.08, 0.64),
                duration: 0.55,
              }}
            >
              <UnifiedMenuItemCard
                item={item}
                variant="menu"
                categorySlug={category.slug}
                onSelect={onItemSelect}
                priority={index < 4}
              />
            </motion.div>
          ))}
        </div>
      </section>
    );
  }
);

MenuSection.displayName = "MenuSection";
