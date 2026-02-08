# Phase 51: Customer Settings - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Customer-facing settings UI within the existing account page. Customers set dietary restrictions, default delivery instructions, notification preferences, and display preferences (theme, font size, animations, sounds). All settings persist to the `customer_settings` table (created in Phase 50), except display preferences which are localStorage-only. No new database columns needed beyond what Phase 50 created (dietary_restrictions JSONB, delivery_instructions TEXT, notification_prefs JSONB, theme TEXT).

**Existing infrastructure (do not rebuild):**
- `customer_settings` table (migration 019 from Phase 50) with RLS policies
- Lazy row creation pattern (INSERT ON CONFLICT DO NOTHING)
- SaveButton, FloatingUnsavedBar, ToggleSwitch, ConfirmDialog from Phase 50
- ThemeToggle component with sun/moon animation + sound effects
- AccountClient with tabbed interface (Profile, Orders, Addresses, Payment)
- SettingsNudgeBanner on home page (Phase 50)

</domain>

<decisions>
## Implementation Decisions

### Settings page placement
- **Replace Payment tab** with Settings tab — Payment was a placeholder, remove it entirely
- **Merge Addresses tab** into Settings — delivery address + instructions both live under Settings
- **Final account tabs:** Profile | Orders | Settings (3 tabs, down from 4)
- **Sub-tabs within Settings** — nested navigation inside the Settings tab
- **Sub-tab grouping:** Claude's discretion — group logically by content volume and UX flow
- **Reuse Phase 50 save UX** — same floating bottom bar + save button morph animation
- **Deep-link from nudge banner** — home page nudge links directly to Settings tab (implementation approach at Claude's discretion)
- **Mobile-optimized variant** — full-width sections, larger touch targets, distinct mobile feel
- **Mobile sub-tab navigation:** Claude's discretion — pick best mobile nav for the content
- **No progress indicator** — no completion %, no gamification, keep it clean
- **No reset option** — customers edit individual fields, no bulk "reset to defaults"

### Dietary & allergy picker
- **Chip style with emoji/icon + label** — rounded chips with emoji + text, tap to toggle
- **Selection feedback:** Fill color change + checkmark icon on selected chips
- **Selection animation:** Subtle pop (brief scale-up bounce) on toggle
- **Predefined options:** Core 6 from Phase 50 — Vegetarian, Vegan, Gluten-free, Nut allergy, Dairy-free, Halal
- **Custom allergies:** "+Add custom" chip reveals inline text input — Claude decides single vs multiple custom entries
- **Effect:** Badge only in settings + included in order notes (Phase 50 decision unchanged)
- **Checkout integration:** Display selected restrictions as a summary card in checkout review step
- **Checkout card:** Claude decides if informational-only or editable (keep checkout flow clean)
- **Delivery instructions:** Already show in checkout separately — dietary card is additional

### Notification toggle layout
- **Card per group** — 3 stacked cards, each with distinct icon, title, description, and toggle
- **Icons:** Distinct per group (e.g., Package for Orders, Megaphone for Marketing, Bell for Reminders)
- **Expandable detail** — tap card to expand and see sub-categories covered (informational, no per-sub toggles)
- **Expanded format:** Claude's discretion (bulleted list vs descriptive text)
- **Toggle component:** Reuse Phase 50 ToggleSwitch — consistent across app
- **No master toggle** — per-group toggles only, user manages each individually
- **Disable warning:** Subtle text appears below card when toggled off (e.g., "You won't receive order tracking updates")
- **Groups (from Phase 50):** Order updates, Marketing, Reminders — all default ON (opt-out)

### Theme & display preferences
- **Keep existing ThemeToggle style** — sun/moon animated button in header stays unchanged
- **Settings presentation:** Labeled options with color preview swatches (more descriptive than icon-only)
- **System theme option:** Claude's discretion whether to add a System (follow OS) option
- **Theme apply timing:** Claude's discretion (instant preview vs on-save)
- **Animation toggle:** "Reduce animations" toggle — separate from sound
- **Sound toggle:** Dedicated "Sound effects" toggle — independent from animation preference
- **Font size:** Segmented "Aa" buttons at different sizes — tap to select
- **Font size preview:** Claude's discretion (live WYSIWYG vs sample text preview)
- **Display preference persistence:** localStorage only — NOT synced to database (device-specific)
- **Theme persistence:** Both localStorage + DB sync (unchanged from Phase 50 decision — local wins on conflict)

### Claude's Discretion
- Sub-tab grouping within Settings tab
- Deep-link implementation (query param vs state-based)
- Mobile sub-tab navigation style
- Custom allergy: single text field vs multiple chip entries
- Checkout dietary card: informational vs editable
- Notification expanded view format
- System theme option inclusion
- Theme/font size apply timing (instant vs on-save)
- Font size preview approach

</decisions>

<specifics>
## Specific Ideas

- Dietary chips should have emoji icons (e.g., leaf for vegetarian, wheat-crossed for gluten-free) — feels playful and scannable
- Chip selection pop animation matches the app's "playful alive" design language
- Notification cards with expandable detail avoids overwhelming new users while giving power users full info
- Font size "Aa" buttons show actual size difference — intuitive, no slider abstraction
- Settings replaces both Payment (placeholder) AND Addresses (merged) — net reduction from 4 tabs to 3
- Floating unsaved bar + save morph gives consistent premium save experience matching admin settings

</specifics>

<deferred>
## Deferred Ideas

- Subtle menu indicators for dietary restrictions on menu items — requires menu item dietary tagging (data model change beyond settings UI)
- Language/locale preference and i18n infrastructure — deferred per Phase 50 decision
- Multiple saved addresses — Phase 50 noted as future enhancement if single address insufficient
- Per-item notification sub-toggles within groups — keep simple for now

</deferred>

---

*Phase: 51-customer-settings*
*Context gathered: 2026-02-08*
