import { forwardRef } from "react";
import { MenuCategory } from "@/lib/queries/menu";
import { MenuItemCard } from "./menu-item-card";

interface MenuSectionProps {
  category: MenuCategory;
}

export const MenuSection = forwardRef<HTMLElement, MenuSectionProps>(
  function MenuSection({ category }, ref) {
    return (
      <section ref={ref} id={category.slug} className="pt-6">
        <h2 className="text-xl font-display text-brand-red mb-4 sticky top-[60px] bg-background py-2 z-[5]">
          {category.name}
          <span className="text-sm font-normal text-muted ml-2">
            ({category.items.length})
          </span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {category.items.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    );
  }
);

MenuSection.displayName = "MenuSection";
