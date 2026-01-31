import { createClient } from "@/lib/supabase/server";
import type { FeaturedSection, FeaturedSectionWithItems } from "@/types/featured-sections";
import type { MenuItem, ModifierGroup } from "@/types/menu";

// ============================================
// DATABASE ROW TYPES
// ============================================

interface ModifierOptionRow {
  id: string;
  slug: string;
  name: string;
  price_delta_cents: number;
  is_active: boolean;
  sort_order: number;
}

interface ModifierGroupRow {
  id: string;
  slug: string;
  name: string;
  selection_type: "single" | "multiple";
  min_select: number;
  max_select: number;
  modifier_options: ModifierOptionRow[] | null;
}

interface ItemModifierGroupRow {
  modifier_groups: ModifierGroupRow | null;
}

interface MenuItemRow {
  id: string;
  slug: string;
  name_en: string;
  name_my: string | null;
  description_en: string | null;
  base_price_cents: number;
  image_url: string | null;
  is_active: boolean;
  is_sold_out: boolean;
  allergens: string[] | null;
  tags: string[] | null;
  category_id: string;
  item_modifier_groups: ItemModifierGroupRow[] | null;
  menu_categories: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface FeaturedSectionRow {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  icon: string | null;
  accent_color: string | null;
  sort_order: number;
  item_count: number;
  is_visible: boolean;
  is_predefined: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

interface FeaturedSectionItemRow {
  item_id: string;
  sort_order: number;
}

// ============================================
// HELPERS
// ============================================

function mapSectionRow(row: FeaturedSectionRow): FeaturedSection {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle,
    icon: row.icon,
    accentColor: row.accent_color,
    sortOrder: row.sort_order,
    itemCount: row.item_count,
    isVisible: row.is_visible,
    isPredefined: row.is_predefined,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

function mapMenuItemRow(row: MenuItemRow): MenuItem {
  const modifierGroups: ModifierGroup[] = (row.item_modifier_groups || [])
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
    id: row.id,
    slug: row.slug,
    nameEn: row.name_en,
    nameMy: row.name_my,
    descriptionEn: row.description_en,
    imageUrl: row.image_url,
    basePriceCents: row.base_price_cents,
    isActive: row.is_active,
    isSoldOut: row.is_sold_out,
    tags: row.tags || [],
    allergens: row.allergens || [],
    modifierGroups,
  };
}

// ============================================
// PUBLIC QUERY
// ============================================

/**
 * Get featured sections with their menu items for homepage display.
 * Returns only visible, non-deleted sections with at least one active item.
 * Empty sections are automatically filtered out.
 */
export async function getFeaturedSections(): Promise<FeaturedSectionWithItems[]> {
  const supabase = await createClient();

  // Get visible, non-deleted sections ordered by sort_order
  const { data: sections, error: sectionsError } = await supabase
    .from("featured_sections")
    .select("*")
    .eq("is_visible", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .returns<FeaturedSectionRow[]>();

  if (sectionsError) {
    throw sectionsError;
  }

  if (!sections || sections.length === 0) {
    return [];
  }

  // Get items for each section
  const sectionsWithItems = await Promise.all(
    sections.map(async (section) => {
      // Get junction rows for this section
      const { data: junctionRows } = await supabase
        .from("featured_section_items")
        .select("item_id, sort_order")
        .eq("section_id", section.id)
        .order("sort_order", { ascending: true })
        .limit(section.item_count)
        .returns<FeaturedSectionItemRow[]>();

      if (!junctionRows || junctionRows.length === 0) {
        return { ...mapSectionRow(section), items: [] };
      }

      const itemIds = junctionRows.map((r) => r.item_id);

      // Fetch full menu item data with modifiers
      const { data: items } = await supabase
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
          ),
          menu_categories!inner(id, name, slug)
        `
        )
        .in("id", itemIds)
        .eq("is_active", true)
        .returns<MenuItemRow[]>();

      // Map to MenuItem type and preserve sort order from junction table
      const mappedItems = (items || [])
        .map((item) => mapMenuItemRow(item))
        .sort((a, b) => {
          const aIndex = itemIds.indexOf(a.id);
          const bIndex = itemIds.indexOf(b.id);
          return aIndex - bIndex;
        });

      return { ...mapSectionRow(section), items: mappedItems };
    })
  );

  // Filter out empty sections (no items after filtering inactive)
  return sectionsWithItems.filter((s) => s.items.length > 0);
}
