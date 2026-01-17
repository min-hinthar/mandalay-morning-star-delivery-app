import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type { MenuItem, MenuSearchResponse, ModifierGroup } from "@/types/menu";

const searchSchema = z.object({
  q: z.string().trim().min(1).max(100),
});

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = searchSchema.safeParse({ q: searchParams.get("q") });

    if (!result.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", details: result.error.issues } },
        { status: 400 }
      );
    }

    const query = result.data.q;
    const supabase = createPublicClient();

    const { data: items, error } = await supabase
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
      .or(
        `name_en.ilike.%${query}%,name_my.ilike.%${query}%,description_en.ilike.%${query}%`
      )
      .order("name_en")
      .returns<MenuItemRow[]>();

    if (error) {
      throw error;
    }

    const menuItems: MenuItem[] = (items || []).map((item) => {
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

      return {
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
    });

    const response: MenuSearchResponse = {
      data: {
        items: menuItems,
        query,
        count: menuItems.length,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.exception(error, { api: "menu/search" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to search menu" } },
      { status: 500 }
    );
  }
}
