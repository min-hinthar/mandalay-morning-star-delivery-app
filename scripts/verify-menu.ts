import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";

type CategoryRow = Pick<
  Database["public"]["Tables"]["menu_categories"]["Row"],
  "id" | "slug" | "name" | "sort_order"
>;

type SampleItemRow = Pick<
  Database["public"]["Tables"]["menu_items"]["Row"],
  "slug" | "name_en" | "name_my" | "base_price_cents" | "allergens"
>;

interface ItemCategoryCountRow {
  category_id: string;
  menu_categories: { name: string } | { name: string }[] | null;
}

interface ModifierOptionRow {
  name: string;
  price_delta_cents: number;
}

interface ModifierGroupWithOptions {
  slug: string;
  name: string;
  selection_type: string;
  modifier_options: ModifierOptionRow[] | null;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createSupabaseClient(): SupabaseClient<Database> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY);
}

function resolveCategoryName(category: ItemCategoryCountRow["menu_categories"]): string {
  if (!category) {
    return "Unknown";
  }

  if (Array.isArray(category)) {
    return category[0]?.name ?? "Unknown";
  }

  return category.name;
}

async function verifyMenu(): Promise<void> {
  console.log("Verifying menu data...\n");

  const supabase = createSupabaseClient();

  const { data: categories, error: categoryError } = await supabase
    .from("menu_categories")
    .select("id, slug, name, sort_order")
    .order("sort_order");

  if (categoryError) throw categoryError;

  const categoryRows = (categories ?? []) as CategoryRow[];

  console.log("Categories:");
  categoryRows.forEach((category) => {
    console.log(`  ${category.sort_order}. ${category.name} (${category.slug})`);
  });

  console.log("\nItems by category:");
  const { data: itemCounts, error: itemCountsError } = await supabase
    .from("menu_items")
    .select("category_id, menu_categories(name)");

  if (itemCountsError) throw itemCountsError;

  const countRows = (itemCounts ?? []) as unknown as ItemCategoryCountRow[];
  const countByCategory = new Map<string, number>();

  countRows.forEach((row) => {
    const name = resolveCategoryName(row.menu_categories);
    countByCategory.set(name, (countByCategory.get(name) ?? 0) + 1);
  });

  countByCategory.forEach((count, name) => {
    console.log(`  ${name}: ${count} items`);
  });

  console.log("\nSample items:");
  const { data: sampleItems, error: sampleError } = await supabase
    .from("menu_items")
    .select("slug, name_en, name_my, base_price_cents, allergens")
    .limit(5);

  if (sampleError) throw sampleError;

  const sampleRows = (sampleItems ?? []) as SampleItemRow[];

  sampleRows.forEach((item) => {
    console.log(
      `  ${item.name_en} / ${item.name_my ?? "N/A"} - $${(
        item.base_price_cents / 100
      ).toFixed(2)}`
    );
    if (item.allergens?.length) {
      console.log(`    Allergens: ${item.allergens.join(", ")}`);
    }
  });

  console.log("\nModifier groups:");
  const { data: groups, error: groupsError } = await supabase
    .from("modifier_groups")
    .select("slug, name, selection_type, modifier_options(name, price_delta_cents)");

  if (groupsError) throw groupsError;

  const groupRows = (groups ?? []) as unknown as ModifierGroupWithOptions[];

  groupRows.forEach((group) => {
    console.log(`  ${group.name} (${group.selection_type}):`);
    (group.modifier_options ?? []).forEach((option) => {
      const delta =
        option.price_delta_cents > 0
          ? ` +$${(option.price_delta_cents / 100).toFixed(2)}`
          : "";
      console.log(`    - ${option.name}${delta}`);
    });
  });

  console.log("\nVerification complete!");
}

verifyMenu().catch((error: Error) => {
  console.error("Verification failed:", error);
  process.exit(1);
});
