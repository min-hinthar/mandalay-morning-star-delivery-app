import { createClient } from "@/lib/supabase/server";

export interface MenuItem {
  id: string;
  slug: string;
  name_en: string;
  name_my: string | null;
  description_en: string | null;
  base_price_cents: number;
  image_url: string | null;
  is_sold_out: boolean;
  allergens: string[];
  tags: string[];
  category: {
    id: string;
    slug: string;
    name: string;
  };
}

export interface MenuCategory {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  items: MenuItem[];
}

export async function getMenuWithCategories(): Promise<MenuCategory[]> {
  const supabase = await createClient();

  const { data: categories, error: catError } = await supabase
    .from("menu_categories")
    .select("id, slug, name, sort_order")
    .eq("is_active", true)
    .order("sort_order");

  if (catError) throw catError;

  const { data: items, error: itemError } = await supabase
    .from("menu_items")
    .select(
      "id, slug, name_en, name_my, description_en, base_price_cents, image_url, is_sold_out, allergens, tags, category_id"
    )
    .eq("is_active", true)
    .order("name_en");

  if (itemError) throw itemError;

  const categoryMap = new Map<string, MenuCategory>();

  for (const cat of categories || []) {
    categoryMap.set(cat.id, {
      ...cat,
      items: [],
    });
  }

  for (const item of items || []) {
    const { category_id, ...rest } = item;
    const category = categoryMap.get(category_id);
    if (category) {
      category.items.push({
        ...rest,
        category: {
          id: category.id,
          slug: category.slug,
          name: category.name,
        },
      });
    }
  }

  return Array.from(categoryMap.values()).sort(
    (a, b) => a.sort_order - b.sort_order
  );
}
