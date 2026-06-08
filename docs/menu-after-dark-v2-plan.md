# Menu "After Dark" v2 — epic plan

Owner-approved maximalist redesign of the public menu, layered on top of the
After Dark theming already in PR #150 (branch `claude/homepage-menu-dark-theme-ux-SeSs2`).
Built as sequential, individually-verified pushes on the same branch (owner is
driving this as one continuous effort; harness pins this branch).

## Status (2026-06-07) — shipped in #150/#151/#152

- ✅ **C. Layered dish sheet** — photo-first, un-clipped close, single-scroll
  layered modifiers, floating glass title plate, live rolling total.
- ✅ **D. Dietary filters** — allergen-derived **fail-safe** model
  (`lib/menu/dietary-filters.ts`): empty allergens = _unknown_ → excluded unless
  tagged `allergen-reviewed`; per-filter counts; "confirm with us" disclaimer.
- ✅ **Beyond the plan** (owner-driven): **"Vegan on request"** toggle +
  bilingual kitchen note (`lib/menu/vegan-request.ts`); full **allergen audit**
  (#152); **iOS hardening** (live map desktop-only, `--sheet-max-h` sheets,
  swipe-to-close via `DomMaxProvider` on `PublicShell`, no input auto-zoom,
  baseline rolling digits); hero carousel opens the dish modal; warm-paper cards
  everywhere.
- ⏳ **B. Two-pane index rail + filmstrip nav** — NOT built yet.
- ⏳ **A. ⌘K command palette search** — NOT built yet.

## Status (2026-06-08) — top-region redesign shipped in #155

The owner-driven menu **top-region** rework landed on `main` (merged #155),
superseding the "two-pane rail / filmstrip" idea (B) with a cleaner single-rail
model and resolving A via the global header's ⌘K:

- ✅ **Single pinned `MenuRail` toolbar** — replaces the old stacked
  header+banners+tabs chrome: expand-on-tap search (on-page live filter) +
  scroll-spy `CategoryTabs` + live `RailCutoffChip` + Filters→`MenuFiltersSheet`
  bottom sheet. Pins below the global `AppHeader` and slides in sync with it
  (`useHeaderVisibility`); publishes `--menu-rail-height` so section `scroll-mt`
  and the scroll-spy both clear it.
- ✅ **De-dup** — cart + ⌘K search are the global `AppHeader`'s; the menu no
  longer duplicates them (was "two carts / two searches"). So **A. ⌘K palette**
  is satisfied by the existing global command palette, not a menu-local one.
- ✅ **Editorial scroll-away masthead** + full-page **fixed photo backdrop**
  (`MenuPageAmbient`) behind a transparent, non-isolating `<main>`.
- ✅ **Pills** — active `.menu-tab-active` (self-contained gold→clay; root-fixes
  the dark-on-dark active-tab bug); inactive **vellum ghost** `.menu-tab-ghost`.
- ✅ **Token audit** — `.menu-paper` over-photo chrome melds + the bright-yellow
  `text-secondary`-on-light melds (homepage/checkout) fixed.
- ❌ **B. Two-pane index rail / filmstrip** — intentionally NOT pursued; the
  single rail proved cleaner and de-duplicated against the global header.

> Next direction (owner): extend "After Dark" to the rest of the **customer
> surfaces** (checkout first) — see
> [`customer-surfaces-after-dark.md`](./customer-surfaces-after-dark.md).

## Locked decisions (via AskUserQuestion, 2026-06-06)

| Surface        | Direction                                                           |
| -------------- | ------------------------------------------------------------------- |
| Search/header  | **⌘K command palette** — expand search into a full-screen overlay   |
| Category nav   | **Two-pane index rail (desktop) + reinvented filmstrip (mobile)**   |
| Detail modal   | **Layered editorial dish sheet**                                    |
| Dietary filter | **Re-vocabulary + matching fix + data enrichment (migration/seed)** |

## Baseline bugs (fold the fix into the relevant feature, not separate PRs)

1. **Dietary filter dead** — chips use the account vocabulary (`"Vegetarian"`,
   capitalized, 6 opts from `settings-types.ts`) but items are tagged lowercase
   (`"vegetarian"`, `"spicy"`); `useMenuFilters` does exact `tags.includes(f)`
   → never matches. Also ~95% of seed items have empty `tags`. → Feature D.
2. **Dietary chips hide behind tabs on scroll** — `--tabs-offset` is hardcoded
   `calc(64px + offline-banner)` and ignores the dietary row height, so
   `CategoryTabs` (sticky) sits over the chips. → Feature B (offset model).
3. **Tab text meld (dark)** — inactive labels `text-text-secondary` on
   `dark:surface-elevated` low-contrast; bar reads flat. → Feature B.
4. **Modal close button clipped** — `absolute top-3 right-3` INSIDE the
   `overflow-hidden` Ken-Burns image container → corner clips it; modal lacks
   depth. → Feature C.

## Build order (isolated/high-impact first)

### C. Layered editorial dish sheet (modal) — FIRST

- File: `src/components/ui/menu/ItemDetailSheet.tsx` (+ `ItemDetailSheet/helpers`).
- Move close button OUT of the image `overflow-hidden` into the modal root
  (safe insets, glass button, ≥44px).
- Full-bleed parallax image + gradient scrim; floating glass title plate that
  overlaps the image (depth); dot-grid texture; bilingual type; clay accents;
  modifier rows tactile press states; sticky footer with live rolling price reel
  (reuse `RollingDigits`).
- Mobile = Drawer (keep drag handle; don't collide with close).
- Guardrails: no new mobile `backdrop-filter`/large blur; reduced-motion safe;
  Modal test (`CheckoutClient.test` analog) — don't add a nested LazyMotion.

### D. Dietary re-vocab + matching + data enrichment

- Menu filter vocabulary = menu tags (vegetarian, vegan, gluten-free, spicy,
  contains-nuts/dairy, halal…), NOT the account `DietaryOption` set.
- `src/lib/hooks/useMenuFilters.ts` — normalize matching (case-insensitive,
  token map); add per-filter counts + empty state.
- New menu-specific dietary chip control (don't reuse account `DietaryChipPicker`).
- Data: migration/seed pass so items carry real dietary tags. Seed YAML
  `data/menul.seed.yaml` + `scripts/seed-menu.ts`. If DB-only, add a migration
  `<timestamp>_menu_dietary_tags.sql` then `pnpm gen:types`. Tiers/loyalty
  untouched. Watch: `DietaryBadges` reads `item.tags` (display must still work).

### B. Two-pane index rail + filmstrip nav

- Desktop: sticky vertical category index beside the grid (scrollspy, counts,
  draw-on accent). Mobile: horizontal filmstrip — morphing `layoutId` active
  pill, high-contrast cream label (fix dark meld), magnetic hover, scroll
  progress. domMax note: `layout`/`layoutId` need DomMaxProvider — NOT present
  on public pages (PublicShell only loads domAnimation). Use a measured-position
  pill (current approach) or a CSS-transform morph, NOT framer `layoutId`.
- Fix `--tabs-offset` to include the dietary/filter row height (measure or token).

### A. ⌘K command palette search

- Expand `SearchInput` into a full-screen overlay: live bilingual results,
  category jumps, recent/popular, dietary quick-filters inside. Header condenses
  to a slim bar. Keyboard: ⌘K/Ctrl-K open, Esc close, ↑/↓ navigate, ⏎ select.
- Reuse `useMenuSearch`/`useMenuFilters`. a11y: focus trap, aria-activedescendant.

## Global guardrails (from CLAUDE.md)

- Token-pure (no raw white/black/hex/z-index in JSX); add `@theme` map + utility.
- Mobile GPU budget: opaque surfaces, gate heavy decorative layers `md:`+,
  radial-gradient glows over `blur()`.
- 60fps (transform/opacity only), rAF-throttle pointer, reduced-motion honored.
- Verify before every push: lint · lint:css · format:check · typecheck · test · build.
- Adversarial self-review once owner is satisfied, before merge.
