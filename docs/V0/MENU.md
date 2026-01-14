# docs/05-menu.md (v1.1) — Menu System + Seed Spec (A La Carte)

## Goals
- Represent a full categorized Burmese menu with Panda Express–style ordering UX:
  - Sticky category tabs + search
  - Item card grid/list
  - Item detail modal (modifiers, quantity, notes)
  - Cart drawer with subtotal + delivery fee rule ($15 under $100, free over $100)
- Support bilingual display (English + Burmese) and stable slugs for URLs/analytics.
- Support modifiers (variants, protein choices, add-ons) with price deltas.
- Preserve historical pricing via snapshots in `order_items` & `order_item_modifiers`.

## Sources / Canonical Truth
- Canonical seed = **your collected dataset** (this repo).
- Public cross-check:
  - Your website menu has descriptions + prices for many dishes. :contentReference[oaicite:1]{index=1}
  - DoorDash shows category taxonomy + featured items (useful for sanity checks). :contentReference[oaicite:2]{index=2}
- Note: UberEats/DoorDash full menus are often JS-rendered and not reliably extractable without authenticated browsing; treat them as secondary references.

---

## Category Taxonomy (v1)

> Keep categories stable; items can move but slugs should not change once live.

1) `all-day-breakfast`
2) `rice-noodles-soups` (your “Breakfast / Rice / Soups on menu page”)
3) `sides`
4) `curries-a-la-carte`
5) `vegetables`
6) `seafood-curries`
7) `appetizers-salads`
8) `drinks`

Mapping to DoorDash-style tabs (optional display layer):
- Noodles → all-day-breakfast (noodles) + soups/noodles
- Salads → appetizers-salads
- Curries / Seafood Curries → curries-a-la-carte / seafood-curries
- Carbs → sides (+ some rice/noodle mains)
- Soups → rice-noodles-soups
- Drinks → drinks :contentReference[oaicite:3]{index=3}

---

## Item Data Model Requirements (for seed/import)

Each menu item must include:
- `slug` (unique, stable)
- `name_en`, `name_my` (Burmese)
- `description_en` (short, 1–2 sentences)
- `base_price_cents` (int)
- `is_active`, `is_sold_out`
- `tags[]` (e.g., spicy, contains_peanuts, contains_shrimp, contains_egg, gluten)
- `allergens[]` (structured; see list below)
- `modifier_group_slugs[]` (optional)

Allergens enum (suggested):
- `peanuts`, `tree_nuts`, `egg`, `shellfish`, `fish`, `soy`, `gluten_wheat`, `sesame`, `dairy`

---

## Modifier System (v1)

### Modifier group patterns
- **Variant (single)**: e.g., “Original / Offal”, “Rice / Noodles”, “Original / Masala / Coconut”
- **Protein (single)**: chicken / fish / pork / beef (only where applicable)
- **Add-ons (multi)**: extra egg, brains add-on, etc.
- **Spice level (single)**: mild/medium/spicy (optional; only if you want it)

### Required groups (based on your menu descriptions)
- `kyay_o_style` (single): `soup`, `si_chat` (optional if you split Kyay-O + SiChat into one item)
- `kyay_o_protein` (single): `pork_default`, `chicken_plus_egg` (if you want that as a selectable)
- `kyay_o_addons` (multi): `brains +$2.00` :contentReference[oaicite:4]{index=4}
- `goat_curry_cut` (single): `original`, `offal`
- `beef_curry_style` (single): `spiced`, `non_spicy_braised`
- `chicken_curry_style` (single): `original`, `masala`, `coconut`
- `tom_yum_base` (single): `fried_rice`, `fried_noodles`

---

## Seed Strategy (recommended)
- Authoritative seed lives in `data/menu.seed.yaml`.
- Admin “Import Menu” tool reads YAML (or converted CSV) and upserts:
  - categories → items → modifier groups/options → item↔group joins
- Items in orders are always snapshotted (name + prices + modifier deltas) to preserve history.

---

## Quality Bar (UI copy + naming)
- Display format:
  - Primary: English
  - Secondary: Burmese in lighter text (or toggle)
- Add “Popular” badges to a curated list (config field `is_featured` in seed later if desired).
- Cart shows clear fee rule:
  - “Delivery $15 under $100 • Free delivery $100+”

---

## Seed Completeness Checklist
Before you go live, ensure:
- Every item has: slug, bilingual name, price cents, category, active flag
- All allergen tags are consistent
- Modifier groups are attached where variants exist (curries, Kyay-O, Tom Yum base)