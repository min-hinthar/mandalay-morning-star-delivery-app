import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { parse } from "yaml";
import { readFileSync } from "fs";
import { join } from "path";
import type { Database } from "../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPTION_SLUG_SEPARATOR = "__";

interface SeedCategory {
  slug: string;
  name: string;
  sort_order: number;
}

interface SeedModifierOption {
  slug: string;
  name: string;
  price_delta_cents: number;
}

interface SeedModifierGroup {
  slug: string;
  name: string;
  selection_type: "single" | "multiple";
  min_select: number;
  max_select: number;
  options: SeedModifierOption[];
}

interface SeedItem {
  slug: string;
  category_slug: string;
  name_en: string;
  name_my?: string;
  description_en?: string;
  base_price_cents: number;
  is_active: boolean;
  is_sold_out: boolean;
  tags: string[];
  allergens: string[];
  modifier_group_slugs: string[];
}

interface SeedData {
  version: number;
  currency: string;
  allergens_enum: string[];
  categories: SeedCategory[];
  modifier_groups: SeedModifierGroup[];
  items: SeedItem[];
}

function createSupabaseClient(): SupabaseClient<Database> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY);
}

function loadSeedData(): SeedData {
  const yamlPath = join(process.cwd(), "data", "menul.seed.yaml");
  const yamlContent = readFileSync(yamlPath, "utf-8");
  const parsed = parse(yamlContent) as unknown;
  return parsed as SeedData;
}

function buildOptionSlug(groupSlug: string, optionSlug: string): string {
  // Ensure uniqueness across groups while preserving original slugs in the YAML.
  return `${groupSlug}${OPTION_SLUG_SEPARATOR}${optionSlug}`;
}

async function seedCategories(
  supabase: SupabaseClient<Database>,
  categories: SeedCategory[]
): Promise<Map<string, string>> {
  console.log("Seeding categories...");
  const categoryMap = new Map<string, string>();

  for (const category of categories) {
    const { data: existing, error: lookupError } = await supabase
      .from("menu_categories")
      .select("id")
      .eq("slug", category.slug)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (existing) {
      const { error: updateError } = await supabase
        .from("menu_categories")
        .update({
          name: category.name,
          sort_order: category.sort_order,
          is_active: true,
        })
        .eq("slug", category.slug);

      if (updateError) throw updateError;
      categoryMap.set(category.slug, existing.id);
      console.log(`  Updated: ${category.slug}`);
      continue;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("menu_categories")
      .insert({
        slug: category.slug,
        name: category.name,
        sort_order: category.sort_order,
        is_active: true,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;
    if (!inserted) throw new Error(`Failed to insert category ${category.slug}`);

    categoryMap.set(category.slug, inserted.id);
    console.log(`  Inserted: ${category.slug}`);
  }

  console.log(`Categories done: ${categoryMap.size}\n`);
  return categoryMap;
}

async function seedModifierGroups(
  supabase: SupabaseClient<Database>,
  modifierGroups: SeedModifierGroup[]
): Promise<Map<string, string>> {
  console.log("Seeding modifier groups...");
  const modifierGroupMap = new Map<string, string>();

  for (const group of modifierGroups) {
    const { data: existing, error: lookupError } = await supabase
      .from("modifier_groups")
      .select("id")
      .eq("slug", group.slug)
      .maybeSingle();

    if (lookupError) throw lookupError;

    let groupId: string;

    if (existing) {
      const { error: updateError } = await supabase
        .from("modifier_groups")
        .update({
          name: group.name,
          selection_type: group.selection_type,
          min_select: group.min_select,
          max_select: group.max_select,
        })
        .eq("slug", group.slug);

      if (updateError) throw updateError;
      groupId = existing.id;
      console.log(`  Updated group: ${group.slug}`);
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("modifier_groups")
        .insert({
          slug: group.slug,
          name: group.name,
          selection_type: group.selection_type,
          min_select: group.min_select,
          max_select: group.max_select,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;
      if (!inserted) throw new Error(`Failed to insert modifier group ${group.slug}`);
      groupId = inserted.id;
      console.log(`  Inserted group: ${group.slug}`);
    }

    modifierGroupMap.set(group.slug, groupId);

    for (let index = 0; index < group.options.length; index += 1) {
      const option = group.options[index];
      const optionSlug = buildOptionSlug(group.slug, option.slug);

      const { data: existingOption, error: optionLookupError } = await supabase
        .from("modifier_options")
        .select("id")
        .eq("slug", optionSlug)
        .maybeSingle();

      if (optionLookupError) throw optionLookupError;

      if (existingOption) {
        const { error: updateError } = await supabase
          .from("modifier_options")
          .update({
            group_id: groupId,
            name: option.name,
            price_delta_cents: option.price_delta_cents,
            sort_order: index,
          })
          .eq("slug", optionSlug);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("modifier_options")
          .insert({
            group_id: groupId,
            slug: optionSlug,
            name: option.name,
            price_delta_cents: option.price_delta_cents,
            sort_order: index,
          });

        if (insertError) throw insertError;
      }
    }

    console.log(`    Options: ${group.options.length}`);
  }

  console.log(`Modifier groups done: ${modifierGroupMap.size}\n`);
  return modifierGroupMap;
}

async function seedMenuItems(
  supabase: SupabaseClient<Database>,
  items: SeedItem[],
  categoryMap: Map<string, string>,
  modifierGroupMap: Map<string, string>
): Promise<Map<string, string>> {
  console.log("Seeding menu items...");
  const itemMap = new Map<string, string>();

  for (const item of items) {
    const categoryId = categoryMap.get(item.category_slug);

    if (!categoryId) {
      throw new Error(`Category not found for item ${item.slug}: ${item.category_slug}`);
    }

    const { data: existing, error: lookupError } = await supabase
      .from("menu_items")
      .select("id")
      .eq("slug", item.slug)
      .maybeSingle();

    if (lookupError) throw lookupError;

    const itemData = {
      category_id: categoryId,
      slug: item.slug,
      name_en: item.name_en,
      name_my: item.name_my ?? null,
      description_en: item.description_en ?? null,
      base_price_cents: item.base_price_cents,
      is_active: item.is_active,
      is_sold_out: item.is_sold_out,
      allergens: item.allergens ?? [],
      tags: item.tags ?? [],
    };

    let itemId: string;

    if (existing) {
      const { error: updateError } = await supabase
        .from("menu_items")
        .update(itemData)
        .eq("slug", item.slug);

      if (updateError) throw updateError;
      itemId = existing.id;
      console.log(`  Updated: ${item.slug}`);
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("menu_items")
        .insert(itemData)
        .select("id")
        .single();

      if (insertError) throw insertError;
      if (!inserted) throw new Error(`Failed to insert item ${item.slug}`);
      itemId = inserted.id;
      console.log(`  Inserted: ${item.slug}`);
    }

    itemMap.set(item.slug, itemId);

    const { error: deleteError } = await supabase
      .from("item_modifier_groups")
      .delete()
      .eq("item_id", itemId);

    if (deleteError) throw deleteError;

    for (const groupSlug of item.modifier_group_slugs) {
      const groupId = modifierGroupMap.get(groupSlug);

      if (!groupId) {
        console.warn(`    WARNING: Modifier group not found: ${groupSlug}`);
        continue;
      }

      const { error: linkError } = await supabase
        .from("item_modifier_groups")
        .insert({ item_id: itemId, group_id: groupId });

      if (linkError) throw linkError;
    }

    if (item.modifier_group_slugs.length > 0) {
      console.log(`    Linked ${item.modifier_group_slugs.length} modifier groups`);
    }
  }

  console.log(`Menu items done: ${itemMap.size}\n`);
  return itemMap;
}

async function verifySeed(
  supabase: SupabaseClient<Database>,
  data: SeedData
): Promise<void> {
  console.log("Verifying seed...");

  const { count: categoryCount, error: categoryError } = await supabase
    .from("menu_categories")
    .select("*", { count: "exact", head: true });

  if (categoryError) throw categoryError;

  const { count: itemCount, error: itemError } = await supabase
    .from("menu_items")
    .select("*", { count: "exact", head: true });

  if (itemError) throw itemError;

  const { count: groupCount, error: groupError } = await supabase
    .from("modifier_groups")
    .select("*", { count: "exact", head: true });

  if (groupError) throw groupError;

  const { count: optionCount, error: optionError } = await supabase
    .from("modifier_options")
    .select("*", { count: "exact", head: true });

  if (optionError) throw optionError;

  const { count: linkCount, error: linkError } = await supabase
    .from("item_modifier_groups")
    .select("*", { count: "exact", head: true });

  if (linkError) throw linkError;

  console.log(`\nVerification Results:\n  Categories: ${categoryCount} (expected: ${data.categories.length})\n  Items: ${itemCount} (expected: ${data.items.length})\n  Modifier Groups: ${groupCount} (expected: ${data.modifier_groups.length})\n  Modifier Options: ${optionCount}\n  Item-Modifier Links: ${linkCount}\n`);

  if (categoryCount !== data.categories.length) {
    throw new Error("Category count mismatch!");
  }

  if (itemCount !== data.items.length) {
    throw new Error("Item count mismatch!");
  }

  console.log("Menu seed completed successfully!");
}

async function seedMenu(): Promise<void> {
  console.log("Starting menu seed...\n");

  const data = loadSeedData();
  console.log(
    `Parsed: ${data.categories.length} categories, ${data.items.length} items, ${data.modifier_groups.length} modifier groups\n`
  );

  const supabase = createSupabaseClient();
  const categoryMap = await seedCategories(supabase, data.categories);
  const modifierGroupMap = await seedModifierGroups(supabase, data.modifier_groups);
  await seedMenuItems(supabase, data.items, categoryMap, modifierGroupMap);
  await verifySeed(supabase, data);
}

seedMenu().catch((error: Error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
