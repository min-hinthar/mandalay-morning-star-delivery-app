import type { FeaturedSectionsRow, MenuItemsRow } from "@/types/database";

export interface SectionWithItems extends FeaturedSectionsRow {
  featured_section_items: {
    item_id: string;
    sort_order: number;
    menu_items: Pick<
      MenuItemsRow,
      | "id"
      | "name_en"
      | "name_my"
      | "description_en"
      | "image_url"
      | "base_price_cents"
      | "is_active"
      | "is_sold_out"
    >;
  }[];
}

export interface SectionWithItemIds extends FeaturedSectionsRow {
  featured_section_items: {
    item_id: string;
    sort_order: number;
  }[];
}
