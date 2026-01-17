import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type {
  MenuCategory,
  MenuItem,
  MenuResponse,
  ModifierGroup,
} from "@/types/menu";

export const revalidate = 300;

type MenuCategoryRow = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
};

type ModifierOptionRow = {
  id: string;
  slug: string;
  name: string;
  price_delta_cents: number;
  is_active: boolean;
  sort_order: number;
};

type ModifierGroupRow = {
  id: string;
  slug: string;
  name: string;
  selection_type: "single" | "multiple";
  min_select: number;
  max_select: number;
  modifier_options: ModifierOptionRow[] | null;
};

type ItemModifierGroupRow = {
  modifier_groups: ModifierGroupRow | null;
};

type MenuItemRow = {
  id: string;
  slug: string;
  name_en: string;
  name_my: string | null;
  description_en: string | null;
  image_url: string | null;
  base_price_cents: number;
  is_active: boolean;
  is_sold_out: boolean;
  tags: string[] | null;
  allergens: string[] | null;
  category_id: string;
  item_modifier_groups: ItemModifierGroupRow[] | null;
};

export async function GET() {
  try {
    const supabase = createPublicClient();

    const { data: categories, error: catError } = await supabase
      .from("menu_categories")
      .select("id, slug, name, sort_order")
      .eq("is_active", true)
      .order("sort_order")
      .returns<MenuCategoryRow[]>();

    if (catError) {
      throw catError;
    }

    const { data: items, error: itemError } = await supabase
      .from("menu_items")
      .select(
        `
        id,
        slug,
        name_en,
        name_my,
        description_en,
        image_url,
        base_price_cents,
        is_active,
        is_sold_out,
        tags,
        allergens,
        category_id,
        item_modifier_groups (
          modifier_groups (
            id,
            slug,
            name,
            selection_type,
            min_select,
            max_select,
            modifier_options (
              id,
              slug,
              name,
              price_delta_cents,
              is_active,
              sort_order
            )
          )
        )
      `
      )
      .eq("is_active", true)
      .order("name_en")
      .returns<MenuItemRow[]>();

    if (itemError) {
      throw itemError;
    }

    const categoryMap = new Map<string, MenuCategory>();

    for (const cat of categories || []) {
      categoryMap.set(cat.id, {
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        sortOrder: cat.sort_order,
        items: [],
      });
    }

    for (const item of items || []) {
      const category = categoryMap.get(item.category_id);
      if (!category) {
        continue;
      }

      const modifierGroups: ModifierGroup[] = (item.item_modifier_groups || [])
        .map((img) => img.modifier_groups)
        .filter((mg): mg is ModifierGroupRow => Boolean(mg))
        .map((mg) => ({
          id: mg.id,
          slug: mg.slug,
          name: mg.name,
          selectionType: mg.selection_type,
          minSelect: mg.min_select,
          maxSelect: mg.max_select,
          options: (mg.modifier_options || [])
            .filter((opt) => opt.is_active)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((opt) => ({
              id: opt.id,
              slug: opt.slug,
              name: opt.name,
              priceDeltaCents: opt.price_delta_cents,
              isActive: opt.is_active,
              sortOrder: opt.sort_order,
            })),
        }));

      const menuItem: MenuItem = {
        id: item.id,
        slug: item.slug,
        nameEn: item.name_en,
        nameMy: item.name_my,
        descriptionEn: item.description_en,
        imageUrl: item.image_url,
        basePriceCents: item.base_price_cents,
        isActive: item.is_active,
        isSoldOut: item.is_sold_out,
        tags: item.tags || [],
        allergens: item.allergens || [],
        modifierGroups,
      };

      category.items.push(menuItem);
    }

    const response: MenuResponse = {
      data: {
        categories: Array.from(categoryMap.values()).sort(
          (a, b) => a.sortOrder - b.sortOrder
        ),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.exception(error, { api: "menu" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch menu" } },
      { status: 500 }
    );
  }
}
