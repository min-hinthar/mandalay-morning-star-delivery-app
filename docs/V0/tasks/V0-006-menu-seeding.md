# Task: V0-006 — Menu Data Model & Seeding

> **Priority**: P1
> **Milestone**: V0 — Skeleton
> **Depends On**: V0-002 (Database Schema)
> **Branch**: `project-init`

---

## Objective

Import the complete menu data from `data/menul.seed.yaml` into the Supabase database. This includes 8 categories, 47 menu items, 7 modifier groups, and their options. The seed script should be idempotent and preserve bilingual names.

---

## Acceptance Criteria

- [ ] Seed script parses `data/menul.seed.yaml` correctly
- [ ] All 8 categories inserted with correct sort order
- [ ] All 47 menu items inserted with correct prices
- [ ] All 7 modifier groups inserted with options
- [ ] Item-modifier group relationships created
- [ ] Bilingual names (name_en, name_my) preserved
- [ ] Allergen arrays populated correctly
- [ ] Script is idempotent (can run multiple times safely)
- [ ] Verification query confirms all data present

---

## Technical Specification

### 1. Install YAML Parser

```bash
pnpm add yaml
pnpm add -D @types/node
```

### 2. Create Seed Script

Create `scripts/seed-menu.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import { parse } from "yaml";
import { readFileSync } from "fs";
import { join } from "path";

// Use service role for seeding (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

async function seedMenu() {
  console.log("Starting menu seed...\n");

  // Read and parse YAML
  const yamlPath = join(process.cwd(), "data", "menul.seed.yaml");
  const yamlContent = readFileSync(yamlPath, "utf-8");
  const data: SeedData = parse(yamlContent);

  console.log(`Parsed: ${data.categories.length} categories, ${data.items.length} items, ${data.modifier_groups.length} modifier groups\n`);

  // 1. Seed Categories
  console.log("Seeding categories...");
  const categoryMap = new Map<string, string>(); // slug -> id

  for (const cat of data.categories) {
    const { data: existing } = await supabase
      .from("menu_categories")
      .select("id")
      .eq("slug", cat.slug)
      .single();

    if (existing) {
      // Update existing
      await supabase
        .from("menu_categories")
        .update({ name: cat.name, sort_order: cat.sort_order, is_active: true })
        .eq("slug", cat.slug);
      categoryMap.set(cat.slug, existing.id);
      console.log(`  Updated: ${cat.slug}`);
    } else {
      // Insert new
      const { data: inserted, error } = await supabase
        .from("menu_categories")
        .insert({ slug: cat.slug, name: cat.name, sort_order: cat.sort_order, is_active: true })
        .select("id")
        .single();

      if (error) throw error;
      categoryMap.set(cat.slug, inserted!.id);
      console.log(`  Inserted: ${cat.slug}`);
    }
  }
  console.log(`Categories done: ${categoryMap.size}\n`);

  // 2. Seed Modifier Groups and Options
  console.log("Seeding modifier groups...");
  const modifierGroupMap = new Map<string, string>(); // slug -> id

  for (const group of data.modifier_groups) {
    const { data: existing } = await supabase
      .from("modifier_groups")
      .select("id")
      .eq("slug", group.slug)
      .single();

    let groupId: string;

    if (existing) {
      // Update existing
      await supabase
        .from("modifier_groups")
        .update({
          name: group.name,
          selection_type: group.selection_type,
          min_select: group.min_select,
          max_select: group.max_select,
        })
        .eq("slug", group.slug);
      groupId = existing.id;
      console.log(`  Updated group: ${group.slug}`);
    } else {
      // Insert new
      const { data: inserted, error } = await supabase
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

      if (error) throw error;
      groupId = inserted!.id;
      console.log(`  Inserted group: ${group.slug}`);
    }

    modifierGroupMap.set(group.slug, groupId);

    // Seed options for this group
    for (let i = 0; i < group.options.length; i++) {
      const option = group.options[i];
      const { data: existingOpt } = await supabase
        .from("modifier_options")
        .select("id")
        .eq("slug", option.slug)
        .single();

      if (existingOpt) {
        await supabase
          .from("modifier_options")
          .update({
            name: option.name,
            price_delta_cents: option.price_delta_cents,
            sort_order: i,
          })
          .eq("slug", option.slug);
      } else {
        const { error } = await supabase
          .from("modifier_options")
          .insert({
            group_id: groupId,
            slug: option.slug,
            name: option.name,
            price_delta_cents: option.price_delta_cents,
            sort_order: i,
          });

        if (error) throw error;
      }
    }
    console.log(`    Options: ${group.options.length}`);
  }
  console.log(`Modifier groups done: ${modifierGroupMap.size}\n`);

  // 3. Seed Menu Items
  console.log("Seeding menu items...");
  const itemMap = new Map<string, string>(); // slug -> id

  for (const item of data.items) {
    const categoryId = categoryMap.get(item.category_slug);
    if (!categoryId) {
      console.error(`  ERROR: Category not found for item ${item.slug}: ${item.category_slug}`);
      continue;
    }

    const { data: existing } = await supabase
      .from("menu_items")
      .select("id")
      .eq("slug", item.slug)
      .single();

    let itemId: string;

    const itemData = {
      category_id: categoryId,
      slug: item.slug,
      name_en: item.name_en,
      name_my: item.name_my || null,
      description_en: item.description_en || null,
      base_price_cents: item.base_price_cents,
      is_active: item.is_active,
      is_sold_out: item.is_sold_out,
      allergens: item.allergens,
      tags: item.tags,
    };

    if (existing) {
      await supabase
        .from("menu_items")
        .update(itemData)
        .eq("slug", item.slug);
      itemId = existing.id;
      console.log(`  Updated: ${item.slug}`);
    } else {
      const { data: inserted, error } = await supabase
        .from("menu_items")
        .insert(itemData)
        .select("id")
        .single();

      if (error) throw error;
      itemId = inserted!.id;
      console.log(`  Inserted: ${item.slug}`);
    }

    itemMap.set(item.slug, itemId);

    // Link modifier groups
    if (item.modifier_group_slugs.length > 0) {
      // Delete existing links
      await supabase
        .from("item_modifier_groups")
        .delete()
        .eq("item_id", itemId);

      // Insert new links
      for (const groupSlug of item.modifier_group_slugs) {
        const groupId = modifierGroupMap.get(groupSlug);
        if (!groupId) {
          console.error(`    WARNING: Modifier group not found: ${groupSlug}`);
          continue;
        }

        const { error } = await supabase
          .from("item_modifier_groups")
          .insert({ item_id: itemId, group_id: groupId });

        if (error && !error.message.includes("duplicate")) {
          throw error;
        }
      }
      console.log(`    Linked ${item.modifier_group_slugs.length} modifier groups`);
    }
  }
  console.log(`Menu items done: ${itemMap.size}\n`);

  // 4. Verification
  console.log("Verifying seed...");

  const { count: catCount } = await supabase
    .from("menu_categories")
    .select("*", { count: "exact", head: true });

  const { count: itemCount } = await supabase
    .from("menu_items")
    .select("*", { count: "exact", head: true });

  const { count: groupCount } = await supabase
    .from("modifier_groups")
    .select("*", { count: "exact", head: true });

  const { count: optionCount } = await supabase
    .from("modifier_options")
    .select("*", { count: "exact", head: true });

  const { count: linkCount } = await supabase
    .from("item_modifier_groups")
    .select("*", { count: "exact", head: true });

  console.log(`
Verification Results:
  Categories: ${catCount} (expected: ${data.categories.length})
  Items: ${itemCount} (expected: ${data.items.length})
  Modifier Groups: ${groupCount} (expected: ${data.modifier_groups.length})
  Modifier Options: ${optionCount}
  Item-Modifier Links: ${linkCount}
`);

  if (catCount !== data.categories.length) {
    throw new Error("Category count mismatch!");
  }
  if (itemCount !== data.items.length) {
    throw new Error("Item count mismatch!");
  }

  console.log("Menu seed completed successfully!");
}

// Run the seed
seedMenu().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
```

### 3. Add NPM Script

Update `package.json`:

```json
{
  "scripts": {
    "seed:menu": "npx tsx scripts/seed-menu.ts"
  }
}
```

### 4. Install tsx for running TypeScript

```bash
pnpm add -D tsx
```

### 5. Create Verification Query

Create `scripts/verify-menu.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyMenu() {
  console.log("Verifying menu data...\n");

  // Categories
  const { data: categories } = await supabase
    .from("menu_categories")
    .select("slug, name, sort_order")
    .order("sort_order");

  console.log("Categories:");
  categories?.forEach((c) => console.log(`  ${c.sort_order}. ${c.name} (${c.slug})`));

  // Items per category
  console.log("\nItems by category:");
  for (const cat of categories || []) {
    const { count } = await supabase
      .from("menu_items")
      .select("*", { count: "exact", head: true })
      .eq("category_id", cat.slug);

    // Actually need to join - let's just count all items
  }

  const { data: itemCounts } = await supabase
    .from("menu_items")
    .select("category_id, menu_categories(name)")
    .order("category_id");

  const countByCategory = new Map<string, number>();
  itemCounts?.forEach((item) => {
    const catName = (item.menu_categories as any)?.name || "Unknown";
    countByCategory.set(catName, (countByCategory.get(catName) || 0) + 1);
  });

  countByCategory.forEach((count, name) => {
    console.log(`  ${name}: ${count} items`);
  });

  // Sample items
  console.log("\nSample items:");
  const { data: sampleItems } = await supabase
    .from("menu_items")
    .select("slug, name_en, name_my, base_price_cents, allergens")
    .limit(5);

  sampleItems?.forEach((item) => {
    console.log(`  ${item.name_en} / ${item.name_my || "N/A"} - $${(item.base_price_cents / 100).toFixed(2)}`);
    if (item.allergens?.length) {
      console.log(`    Allergens: ${item.allergens.join(", ")}`);
    }
  });

  // Modifier groups
  console.log("\nModifier groups:");
  const { data: groups } = await supabase
    .from("modifier_groups")
    .select("slug, name, selection_type, modifier_options(name, price_delta_cents)");

  groups?.forEach((g) => {
    console.log(`  ${g.name} (${g.selection_type}):`);
    (g.modifier_options as any[])?.forEach((opt) => {
      const delta = opt.price_delta_cents > 0 ? ` +$${(opt.price_delta_cents / 100).toFixed(2)}` : "";
      console.log(`    - ${opt.name}${delta}`);
    });
  });

  console.log("\nVerification complete!");
}

verifyMenu().catch(console.error);
```

Add script to `package.json`:

```json
{
  "scripts": {
    "seed:menu": "npx tsx scripts/seed-menu.ts",
    "verify:menu": "npx tsx scripts/verify-menu.ts"
  }
}
```

---

## Test Plan

### Run Seed

```bash
# Ensure env vars are set
export NEXT_PUBLIC_SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...

# Run seed
pnpm seed:menu

# Expected output:
# - 8 categories inserted/updated
# - 47 items inserted/updated
# - 7 modifier groups with options
# - Verification passes
```

### Run Verification

```bash
pnpm verify:menu

# Expected:
# - All 8 categories listed
# - Items distributed correctly across categories
# - Modifier groups with options displayed
```

### Idempotency Test

```bash
# Run twice
pnpm seed:menu
pnpm seed:menu

# Second run should update (not duplicate)
# Item counts should stay the same
```

### Query Test in Supabase Dashboard

```sql
-- Count items per category
SELECT mc.name, COUNT(mi.id) as item_count
FROM menu_categories mc
LEFT JOIN menu_items mi ON mi.category_id = mc.id
GROUP BY mc.id, mc.name
ORDER BY mc.sort_order;

-- Items with modifiers
SELECT mi.name_en, COUNT(img.group_id) as modifier_count
FROM menu_items mi
LEFT JOIN item_modifier_groups img ON img.item_id = mi.id
GROUP BY mi.id, mi.name_en
HAVING COUNT(img.group_id) > 0;
```

### Build Verification

```bash
pnpm lint
pnpm typecheck
pnpm build
```

---

## Definition of Done

1. [ ] Seed script created at `scripts/seed-menu.ts`
2. [ ] YAML parsing works correctly
3. [ ] All 8 categories seeded
4. [ ] All 47 items seeded with bilingual names
5. [ ] All 7 modifier groups with options seeded
6. [ ] Item-modifier relationships created
7. [ ] Allergen arrays populated
8. [ ] Script is idempotent
9. [ ] Verification script confirms data
10. [ ] `pnpm lint` passes
11. [ ] `pnpm typecheck` passes
12. [ ] `pnpm build` succeeds
13. [ ] `docs/project_status.md` updated

---

## Notes for Codex

- Use service role key (not anon key) for seeding to bypass RLS
- The script uses upsert logic: update if exists, insert if not
- Category and modifier slugs must match exactly between YAML and items
- Allergens array is stored as TEXT[] in Postgres
- The `menul.seed.yaml` file has a typo in name (menul vs menu) - use as-is

---

## Data Summary (from menul.seed.yaml)

**Categories (8):**
1. All-Day Breakfast (6 items)
2. Rice / Noodles / Soups (6 items)
3. Sides (4 items)
4. Curries A la Carte (12 items)
5. Vegetables (4 items)
6. Seafood Curries (11 items)
7. Appetizers / Salads (5 items)
8. Drinks (2 items)

**Total: 47 items**

**Modifier Groups (7):**
- kyay_o_style (soup/dry)
- kyay_o_protein (pork/chicken+egg)
- kyay_o_addons (brains +$2)
- goat_curry_cut (original/offal)
- beef_curry_style (spiced/non-spicy)
- chicken_curry_style (original/masala/coconut)
- tom_yum_base (fried rice/noodles)

---

*Task created: 2026-01-12 | Ready for implementation*
