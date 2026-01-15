import { forwardRef } from "react";
import type { MenuCategory, MenuItem } from "@/types/menu";
import { ItemCard } from "./ItemCard";

interface MenuSectionProps {
  category: MenuCategory;
  id?: string;
  onItemSelect: (item: MenuItem) => void;
}

export const MenuSection = forwardRef<HTMLElement, MenuSectionProps>(
  function MenuSection({ category, id, onItemSelect }, ref) {
    return (
      <section
        ref={ref}
        id={id ?? category.slug}
        className="scroll-mt-32 pt-6"
      >
        <div className="sticky top-[120px] z-[5] -mx-4 border-b border-border/50 bg-background/95 py-3 backdrop-blur-sm">
          <h2 className="px-4 text-xl font-display text-brand-red">
            {category.name}
            <span className="ml-2 text-sm font-normal text-muted">
              ({category.items.length}{" "}
              {category.items.length === 1 ? "item" : "items"})
            </span>
          </h2>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {category.items.map((item) => (
            <ItemCard key={item.id} item={item} onSelect={onItemSelect} />
          ))}
        </div>
      </section>
    );
  }
);

MenuSection.displayName = "MenuSection";
