# Phase 51: Customer Settings - Research

**Researched:** 2026-02-08
**Domain:** Customer-facing settings UI, tabbed navigation, form patterns, localStorage display prefs, Supabase upsert
**Confidence:** HIGH

## Summary

Phase 51 builds a customer-facing settings UI inside the existing account page. The infrastructure is fully in place from Phase 50: `customer_settings` table (migration 019) with RLS, lazy row creation, reusable save components (SaveButton, FloatingUnsavedBar, ToggleSwitch, ConfirmDialog), and the SettingsNudgeBanner on the home page.

The primary work is: (1) restructure AccountClient from 4 tabs to 3 (Profile | Orders | Settings), removing the Payment placeholder and absorbing Addresses into Settings; (2) build a Settings tab with sub-navigation containing dietary picker, delivery instructions + addresses, notification card toggles, and display preferences; (3) create the customer settings API route; (4) add a checkout dietary summary card; (5) implement font-size and sound localStorage preferences.

**Primary recommendation:** Follow the admin SettingsClient pattern (Tabs + forms + FloatingUnsavedBar) but adapt for customer context -- simpler, mobile-first, with sub-tabs inside the Settings tab. Create a single `useCustomerSettings` hook for fetch/save logic to avoid prop drilling. Use `framer-motion` chip toggle animations consistent with the "playful alive" design language.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Settings page placement:** Replace Payment tab with Settings tab. Merge Addresses tab into Settings. Final account tabs: Profile | Orders | Settings (3 tabs, down from 4)
- **Sub-tabs within Settings:** Nested navigation inside the Settings tab
- **Reuse Phase 50 save UX:** Same floating bottom bar + save button morph animation
- **Deep-link from nudge banner:** Home page nudge links directly to Settings tab
- **Mobile-optimized variant:** Full-width sections, larger touch targets, distinct mobile feel
- **No progress indicator:** No completion %, no gamification
- **No reset option:** Customers edit individual fields, no bulk "reset to defaults"
- **Dietary chip style:** Rounded chips with emoji/icon + label, tap to toggle
- **Chip selection feedback:** Fill color change + checkmark icon on selected chips
- **Chip selection animation:** Subtle pop (brief scale-up bounce) on toggle
- **Predefined dietary options:** Vegetarian, Vegan, Gluten-free, Nut allergy, Dairy-free, Halal
- **Custom allergies:** "+Add custom" chip reveals inline text input
- **Dietary effect:** Badge only in settings + included in order notes
- **Checkout integration:** Display selected restrictions as a summary card in checkout review step
- **Delivery instructions:** Already show in checkout separately -- dietary card is additional
- **Notification card layout:** 3 stacked cards, each with distinct icon, title, description, and toggle
- **Notification icons:** Distinct per group (Package for Orders, Megaphone for Marketing, Bell for Reminders)
- **Expandable detail:** Tap card to expand and see sub-categories covered (informational, no per-sub toggles)
- **Toggle component:** Reuse Phase 50 ToggleSwitch
- **No master toggle:** Per-group toggles only
- **Disable warning:** Subtle text appears below card when toggled off
- **Notification groups:** Order updates, Marketing, Reminders -- all default ON (opt-out)
- **Keep existing ThemeToggle style:** Sun/moon animated button in header stays unchanged
- **Settings theme presentation:** Labeled options with color preview swatches
- **Animation toggle:** "Reduce animations" toggle -- separate from sound
- **Sound toggle:** Dedicated "Sound effects" toggle -- independent from animation preference
- **Font size:** Segmented "Aa" buttons at different sizes -- tap to select
- **Display preference persistence:** localStorage only -- NOT synced to database
- **Theme persistence:** Both localStorage + DB sync (local wins on conflict)

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

### Deferred Ideas (OUT OF SCOPE)
- Subtle menu indicators for dietary restrictions on menu items
- Language/locale preference and i18n infrastructure
- Multiple saved addresses
- Per-item notification sub-toggles within groups
</user_constraints>

## Discretion Recommendations

### Sub-tab grouping: 3 sub-tabs
**Recommendation:** 3 sub-tabs within Settings:
1. **Preferences** -- Dietary restrictions + delivery instructions (personal preferences affecting orders)
2. **Notifications** -- 3 notification group cards
3. **Display** -- Theme, font size, animations, sounds

**Rationale:** Groups related content logically. "Preferences" combines the two order-affecting settings. "Notifications" is self-contained. "Display" isolates the localStorage-only settings from the DB-synced ones. Addresses stay in the Addresses sub-section of Preferences (merged per decision) OR remain as their own separate section within Preferences since it's already a fully built component.

**Confidence:** HIGH -- mirrors admin 3-tab pattern, natural grouping

### Deep-link implementation: URL search params
**Recommendation:** Use `?tab=settings&section=preferences` query parameters. AccountClient reads `searchParams` on mount to set initial tab/sub-tab. SettingsNudgeBanner links to `/account?tab=settings`.

**Rationale:** Query params are shareable, bookmarkable, and work with browser back/forward. The existing AccountClient uses local `useState` for tab selection -- adding `useSearchParams` from `next/navigation` is trivial. State-based approaches (passing through context) add complexity without benefit.

**Confidence:** HIGH -- standard Next.js pattern

### Mobile sub-tab navigation: Horizontal pill strip (reuse Tabs component)
**Recommendation:** Reuse the existing `<Tabs>` component for sub-tabs within Settings. On mobile, the Tabs component already scrolls horizontally with fade indicators. Use a smaller `layoutId` like `"settingsSubTab"` to avoid collision with the parent `"accountTab"`.

**Rationale:** The Tabs component already handles mobile scroll, active pill animation, and accessibility (role="tablist"). No need for a different pattern. The sub-tabs are compact enough (3 items) to fit on most screens without scrolling.

**Confidence:** HIGH -- component already exists and handles mobile

### Custom allergy: Single text field producing multiple chips
**Recommendation:** Single text input that creates chips on Enter/comma. Display custom entries as removable chips below the predefined ones. Max 5 custom entries, max 50 chars each.

**Rationale:** Multiple separate inputs add UI complexity. A single field with chip creation is the standard pattern (similar to email tag inputs). Comma-separated or Enter-key creation is intuitive. Limit prevents abuse.

**Confidence:** HIGH

### Checkout dietary card: Informational only
**Recommendation:** Display-only summary card in checkout review step. Show selected dietary restrictions as a read-only list with a "Edit in Settings" link. Do NOT make it editable inline.

**Rationale:** Editing dietary restrictions during checkout is a rare need and adds form state complexity to an already multi-step flow. Checkout should be fast and focused. An "Edit in Settings" link covers the edge case without bloating the checkout.

**Confidence:** HIGH -- keeps checkout clean per decision "keep checkout flow clean"

### Notification expanded view: Bulleted list
**Recommendation:** Bulleted list of sub-categories when card is expanded.

Example for "Order Updates":
- Order confirmation
- Delivery status changes
- Driver assignment
- Delivery completion

**Rationale:** Concise, scannable, and doesn't need much vertical space. Descriptive text would be longer without adding value since users understand these categories.

**Confidence:** MEDIUM -- either format works; bullets are faster to scan

### System theme option: Yes, include
**Recommendation:** Add "System" as a third theme option alongside Light and Dark. The ThemeProvider already has `enableSystem` set. The `customer_settings.theme` column already defaults to `'system'`. The DynamicThemeProvider already supports `ThemeMode = "light" | "dark" | "auto"`.

**Rationale:** All infrastructure supports it. Excluding it would mean removing an already-working feature. Most modern apps offer system theme. The column default is already `'system'`.

**Confidence:** HIGH -- infrastructure already supports it

### Theme/font size apply timing: Instant preview
**Recommendation:** Apply theme changes and font size changes instantly (no on-save). These are localStorage-only display preferences -- they should feel immediate. The existing ThemeToggle already applies instantly.

**Rationale:** Display preferences are device-local and non-destructive. Requiring a save step for visual preferences feels sluggish and doesn't match the existing ThemeToggle behavior (which is instant). Theme DB sync happens separately as a background operation.

**Confidence:** HIGH -- consistent with existing ThemeToggle behavior

### Font size preview: Live WYSIWYG
**Recommendation:** Apply the selected font size to the entire page immediately when tapping an "Aa" button. The settings page itself serves as the preview. No separate preview text needed.

**Rationale:** WYSIWYG is more intuitive than a sample text box. The user sees the effect on real content. Implementation is simpler (just set a CSS variable or class). The "Aa" buttons at different sizes already communicate what they do visually.

**Confidence:** HIGH

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| next-themes | existing | Theme switching | Already configured with `enableSystem`, `attribute="class"` |
| framer-motion | v12 | Animations | Already using `m`, `AnimatePresence`, spring tokens |
| @supabase/ssr | existing | DB client | Browser client for settings CRUD |
| zod | existing | Validation | For API route input validation |
| lucide-react | existing | Icons | Package, Megaphone, Bell, Leaf, Wheat, etc. |
| zustand | existing | State management | Not needed -- use local state + API |

### No New Dependencies
No new packages needed. Everything required is already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (customer)/account/page.tsx       # Already exists -- no changes needed
│   └── api/account/settings/
│       └── route.ts                       # NEW: GET + PATCH customer_settings
├── components/ui/account/
│   ├── AccountClient.tsx                  # MODIFY: 3 tabs, query param routing
│   ├── SettingsTab/
│   │   ├── index.tsx                      # Barrel exports
│   │   ├── SettingsTab.tsx                # Sub-tab container with Tabs
│   │   ├── useCustomerSettings.ts         # Fetch/save hook
│   │   ├── settings-types.ts              # TypeScript interfaces
│   │   ├── PreferencesSection.tsx          # Dietary + delivery instructions
│   │   ├── DietaryChipPicker.tsx           # Chip-based dietary selector
│   │   ├── CustomAllergyInput.tsx          # "+Add custom" with chip creation
│   │   ├── NotificationsSection.tsx        # 3 expandable notification cards
│   │   ├── NotificationCard.tsx            # Single expandable card
│   │   ├── DisplaySection.tsx              # Theme + font + animation + sound
│   │   ├── ThemeSelector.tsx               # Light/Dark/System with swatches
│   │   ├── FontSizeSelector.tsx            # Segmented "Aa" buttons
│   │   └── AddressesInSettings.tsx         # Wraps existing AddressesTab
│   ├── AddressesTab/                       # KEEP -- reused inside Settings
│   ├── ProfileTab/                         # KEEP unchanged
│   └── OrdersTab/                          # KEEP unchanged
├── components/ui/checkout/
│   └── DietarySummaryCard.tsx              # NEW: checkout review card
└── lib/
    ├── hooks/
    │   ├── useAnimationPreference.ts       # EXISTING -- no changes
    │   ├── useSoundPreference.ts           # NEW: localStorage sound toggle
    │   └── useFontSize.ts                  # NEW: localStorage font size
    └── validations/
        └── customer-settings.ts            # NEW: Zod schemas for API
```

### Pattern 1: Customer Settings Hook (useCustomerSettings)
**What:** Centralized hook for fetching and saving customer settings to/from the API route.
**When to use:** In all Settings sub-tab components.
**Example:**
```typescript
// useCustomerSettings.ts
interface CustomerSettings {
  dietaryRestrictions: string[];
  deliveryInstructions: string;
  notificationPrefs: {
    order_updates: boolean;
    marketing: boolean;
    reminders: boolean;
  };
  theme: string;
}

export function useCustomerSettings() {
  const [settings, setSettings] = useState<CustomerSettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<CustomerSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch on mount
  useEffect(() => {
    fetch("/api/account/settings").then(/* ... */);
  }, []);

  // Computed hasChanges
  const hasChanges = useMemo(() =>
    JSON.stringify(settings) !== JSON.stringify(originalSettings),
    [settings, originalSettings]
  );

  // Save handler -- partial updates
  const save = useCallback(async () => {
    // PATCH /api/account/settings with only changed fields
    // On success, update originalSettings
  }, [settings, originalSettings]);

  // Discard handler
  const discard = useCallback(() => {
    setSettings(originalSettings);
  }, [originalSettings]);

  return { settings, setSettings, originalSettings, isLoading, isSaving, hasChanges, save, discard };
}
```
**Source:** Based on existing admin SettingsClient pattern in `src/components/ui/admin/settings/SettingsClient/SettingsClient.tsx`

### Pattern 2: API Route (GET + PATCH)
**What:** Server-side route for reading and writing customer_settings.
**When to use:** Customer settings CRUD.
**Example:**
```typescript
// GET /api/account/settings
// Uses lazy row creation: if no row exists, return defaults
// PATCH /api/account/settings
// Upsert pattern: INSERT ON CONFLICT DO UPDATE

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  // Lazy row creation
  await supabase.from("customer_settings")
    .insert({ user_id: user.id })
    .select()
    .single();
  // ON CONFLICT DO NOTHING is handled by DB constraint

  const { data } = await supabase.from("customer_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ data: transformRow(data) });
}

export async function PATCH(request: NextRequest) {
  // Validate with Zod, upsert to customer_settings
}
```
**Source:** Based on existing `src/app/api/account/profile/route.ts` pattern

### Pattern 3: Dietary Chip with Pop Animation
**What:** Framer Motion chip toggle with scale-up bounce.
**When to use:** Dietary restriction picker.
**Example:**
```typescript
<m.button
  onClick={() => toggle(option)}
  animate={{
    scale: isSelected ? [1, 1.15, 1] : 1,
    backgroundColor: isSelected ? "var(--color-amber-600)" : "var(--color-surface-primary)",
  }}
  transition={spring.bouncyToggle}
  className="px-3 py-1.5 rounded-pill text-sm font-medium"
>
  {emoji} {label} {isSelected && <Check className="h-3 w-3" />}
</m.button>
```
**Source:** Project motion tokens (`spring.bouncyToggle`), existing DietaryPills in SettingsNudgeBanner

### Pattern 4: Expandable Notification Card
**What:** Card with toggle + expandable detail area.
**When to use:** Notification preference cards.
**Example:**
```typescript
<Card onClick={() => setExpanded(!expanded)}>
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Icon />
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
    <ToggleSwitch checked={enabled} onChange={onToggle} />
  </div>
  <AnimatePresence>
    {expanded && (
      <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}>
        <ul className="list-disc pl-5 text-sm text-text-secondary">
          {subCategories.map(s => <li key={s}>{s}</li>)}
        </ul>
      </m.div>
    )}
  </AnimatePresence>
  {!enabled && (
    <p className="text-sm text-status-warning mt-2">{warningText}</p>
  )}
</Card>
```

### Pattern 5: Font Size Preference (localStorage)
**What:** CSS custom property approach for scalable font size.
**When to use:** Display preferences section.
**Example:**
```typescript
// useFontSize.ts
const FONT_SIZES = { small: 14, medium: 16, large: 18, xlarge: 20 } as const;
type FontSize = keyof typeof FONT_SIZES;

export function useFontSize() {
  const [size, setSize] = useState<FontSize>("medium");

  useEffect(() => {
    const stored = localStorage.getItem("font-size") as FontSize | null;
    if (stored && stored in FONT_SIZES) setSize(stored);
  }, []);

  const setFontSize = (newSize: FontSize) => {
    localStorage.setItem("font-size", newSize);
    setSize(newSize);
    document.documentElement.style.setProperty("--font-size-base", `${FONT_SIZES[newSize]}px`);
  };

  return { size, setFontSize, sizes: FONT_SIZES };
}
```

### Anti-Patterns to Avoid
- **Don't create a new store for settings:** Local state + API route is sufficient. Zustand store would add complexity for data that only lives on the settings page.
- **Don't duplicate AddressesTab:** Wrap the existing component, don't rebuild it.
- **Don't save display prefs to DB:** Font size, animations, sounds are explicitly localStorage-only per decision.
- **Don't use client-side Supabase for settings CRUD:** Use the API route pattern (Next.js server actions or route handlers) for consistency with profile/addresses. The nudge banner uses client Supabase, but the full settings page should use API routes for validation and error handling.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Theme switching | Custom theme context | `next-themes` + existing ThemeProvider | Already configured, handles SSR, system detection |
| Toggle switches | Custom toggle | Phase 50 ToggleSwitch component | Consistent, accessible, already styled |
| Save UX | Custom save flow | Phase 50 SaveButton + FloatingUnsavedBar | Shared component designed for reuse |
| Tab navigation | Custom tabs | Existing Tabs component | Handles mobile scroll, animations, a11y |
| Confirm dialogs | Custom modal | Phase 50 ConfirmDialog | Uses existing Modal component |
| Animations | CSS keyframes | Framer Motion + motion-tokens | Project standard, animation preference aware |
| Sound effects | Custom audio | Existing theme-sounds.ts pattern | Already handles AudioContext, user preference |

## Common Pitfalls

### Pitfall 1: Hydration Mismatch with localStorage Preferences
**What goes wrong:** Reading localStorage during SSR/initial render causes hydration mismatch since server has no localStorage.
**Why it happens:** React server-renders with default values, but client has stored preferences.
**How to avoid:** Always use `useEffect` for localStorage reads. Use `isHydrated` state flag. Render skeleton/default until hydrated.
**Warning signs:** Console warnings about hydration mismatch, flash of wrong theme/size on load.

### Pitfall 2: Stale Settings After Nudge Banner Save
**What goes wrong:** User saves dietary restrictions via nudge banner, opens settings page, sees stale data.
**Why it happens:** Nudge banner uses client Supabase directly; settings page fetches via API route.
**How to avoid:** Always fetch fresh on settings page mount. Don't cache aggressively. The API route GET always reads from DB.
**Warning signs:** Settings showing empty after nudge banner interactions.

### Pitfall 3: Race Condition on Tab Switch During Save
**What goes wrong:** User saves, then immediately switches tabs. Save completes but `originalSettings` update targets unmounted sub-tab.
**Why it happens:** Async save completes after component unmount.
**How to avoid:** Lift save state to the SettingsTab container (not sub-tabs). Use the admin SettingsClient pattern where all settings are managed at the container level and passed down.
**Warning signs:** Unsaved changes bar flickers, settings revert after tab switch.

### Pitfall 4: Font Size CSS Variable Not Applied on Load
**What goes wrong:** Page loads with default font size, then jumps to user's preference after hydration.
**Why it happens:** CSS variable is only set in useEffect, after initial render.
**How to avoid:** Add a `<script>` tag in `layout.tsx` that reads localStorage and sets the CSS variable before React hydrates. Or use a CSS `@media` approach. Alternatively, accept the brief flash and focus on making it smooth with a transition.
**Warning signs:** Text size jumps on page load.

### Pitfall 5: Multiple Tabs Components with Same layoutId
**What goes wrong:** Account tab pill animation interferes with settings sub-tab pill animation.
**Why it happens:** Both Tabs instances use the same default `layoutId="activeTab"`.
**How to avoid:** Always pass unique `layoutId` props: `layoutId="accountTab"` (already done) and `layoutId="settingsSubTab"` for the nested tabs.
**Warning signs:** Pill indicator flies between parent and child tabs.

### Pitfall 6: ToggleSwitch Click Propagation in Expandable Card
**What goes wrong:** Clicking the toggle also triggers card expand/collapse.
**Why it happens:** Click event bubbles from toggle to card container.
**How to avoid:** `e.stopPropagation()` on the toggle click handler. Or make only the non-toggle area clickable for expand.
**Warning signs:** Card collapses when toggling a notification on/off.

## Code Examples

### Dietary Emoji Map
```typescript
const DIETARY_EMOJIS: Record<string, string> = {
  "Vegetarian": "\u{1F331}",    // Seedling
  "Vegan": "\u{1F33F}",         // Herb
  "Gluten-free": "\u{1F33E}",   // Ear of rice (with cross in UI)
  "Nut allergy": "\u{1F95C}",   // Peanuts (with warning)
  "Dairy-free": "\u{1F95B}",    // Glass of milk (with cross)
  "Halal": "\u{2728}",          // Sparkles (neutral)
};
```

### Notification Group Config
```typescript
const NOTIFICATION_GROUPS = [
  {
    key: "order_updates" as const,
    title: "Order Updates",
    description: "Stay informed about your delivery status",
    icon: Package,
    subCategories: [
      "Order confirmation",
      "Delivery status changes",
      "Driver assignment",
      "Delivery completion",
    ],
    warningText: "You won't receive order tracking updates",
  },
  {
    key: "marketing" as const,
    title: "Promotions & Deals",
    description: "Special offers and seasonal menus",
    icon: Megaphone,
    subCategories: [
      "Weekly deals",
      "New menu items",
      "Seasonal specials",
      "Loyalty rewards",
    ],
    warningText: "You'll miss out on exclusive deals and offers",
  },
  {
    key: "reminders" as const,
    title: "Reminders",
    description: "Helpful nudges for your orders",
    icon: Bell,
    subCategories: [
      "Reorder suggestions",
      "Delivery window reminders",
      "Cart abandonment",
      "Review requests",
    ],
    warningText: "You won't receive helpful order reminders",
  },
] as const;
```

### Query Param Tab Routing
```typescript
// In AccountClient.tsx
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const searchParams = useSearchParams();
const router = useRouter();
const pathname = usePathname();

// Initialize from URL params
const initialTab = searchParams.get("tab") || "profile";
const [activeTab, setActiveTab] = useState<AccountTab>(
  ["profile", "orders", "settings"].includes(initialTab)
    ? initialTab as AccountTab
    : "profile"
);

// Update URL on tab change
const handleTabChange = (id: string) => {
  setActiveTab(id as AccountTab);
  const params = new URLSearchParams(searchParams.toString());
  if (id === "profile") params.delete("tab");
  else params.set("tab", id);
  router.replace(`${pathname}?${params.toString()}`, { scroll: false });
};
```

### Customer Settings Zod Schema
```typescript
// customer-settings.ts
import { z } from "zod";

export const dietaryRestrictionSchema = z.string().max(50);

export const notificationPrefsSchema = z.object({
  order_updates: z.boolean(),
  marketing: z.boolean(),
  reminders: z.boolean(),
});

export const updateCustomerSettingsSchema = z.object({
  dietary_restrictions: z.array(dietaryRestrictionSchema).max(20).optional(),
  delivery_instructions: z.string().max(500).optional(),
  notification_prefs: notificationPrefsSchema.optional(),
  theme: z.enum(["system", "light", "dark"]).optional(),
});

export type UpdateCustomerSettingsInput = z.infer<typeof updateCustomerSettingsSchema>;
```

### Font Size Segmented Control
```typescript
const FONT_SIZE_OPTIONS = [
  { key: "small", label: "Aa", size: 13 },
  { key: "medium", label: "Aa", size: 16 },
  { key: "large", label: "Aa", size: 19 },
] as const;

// Each button renders "Aa" at its actual size
{FONT_SIZE_OPTIONS.map((option) => (
  <button
    key={option.key}
    onClick={() => setFontSize(option.key)}
    className={cn(
      "px-4 py-2 rounded-lg border transition-colors",
      selectedSize === option.key
        ? "bg-primary text-text-inverse border-primary"
        : "bg-surface-primary text-text-secondary border-border hover:border-primary"
    )}
    style={{ fontSize: `${option.size}px` }}
  >
    {option.label}
  </button>
))}
```

## Key Existing Infrastructure

| Component | Location | Reuse Strategy |
|-----------|----------|----------------|
| SaveButton | `src/components/ui/admin/settings/SaveButton.tsx` | Import directly -- designed for reuse |
| FloatingUnsavedBar | `src/components/ui/admin/settings/FloatingUnsavedBar.tsx` | Import directly |
| ToggleSwitch | `src/components/ui/admin/settings/ToggleSwitch.tsx` | Import directly |
| ConfirmDialog | `src/components/ui/admin/settings/ConfirmDialog.tsx` | Import directly |
| Tabs | `src/components/ui/Tabs.tsx` | Nested with unique layoutId |
| AddressesTab | `src/components/ui/account/AddressesTab/` | Embed inside Settings |
| SettingsNudgeBanner | `src/components/ui/homepage/SettingsNudgeBanner.tsx` | Update link to `/account?tab=settings` |
| theme-sounds.ts | `src/lib/theme-sounds.ts` | Reference for sound toggle pattern |
| useAnimationPreference | `src/lib/hooks/useAnimationPreference.ts` | Use for "reduce animations" toggle |
| ThemeProvider | `src/components/ui/theme/ThemeProvider.tsx` | Already has `enableSystem` |

## Important Implementation Notes

### Shared Component Location
The Phase 50 save components (SaveButton, FloatingUnsavedBar, ToggleSwitch, ConfirmDialog) currently live in `src/components/ui/admin/settings/`. Since Phase 51 reuses them for customer settings, consider one of:
1. **Keep as-is and import from admin path** -- simplest, works fine since they have no admin-specific logic
2. **Move to shared location** like `src/components/ui/settings/` -- cleaner but requires updating admin imports

**Recommendation:** Option 1 (keep as-is). The components are generic despite their path. Moving them is a separate refactor.

### Tab Restructuring Impact
Removing the Payment tab and merging Addresses into Settings affects:
- `AccountClient.tsx` -- tab definitions, imports, rendering logic
- `AddressesTab/` -- no internal changes, just rendered inside SettingsTab instead
- `SettingsNudgeBanner.tsx` -- update "See all settings" link href

### DB Schema Alignment
The `customer_settings` table columns map directly to the UI sections:
- `dietary_restrictions` JSONB -> PreferencesSection (array of strings)
- `delivery_instructions` TEXT -> PreferencesSection (text input)
- `notification_prefs` JSONB -> NotificationsSection (object with 3 booleans)
- `theme` TEXT -> DisplaySection (saved to DB on change)
- `default_address` JSONB -> Not used in Phase 51 (addresses use the separate addresses table)

Display-only preferences (font size, animations, sounds) are **not** in the DB -- localStorage only.

### Checkout Integration
The `PaymentStepV8.tsx` currently shows: address, delivery time, and order notes. The dietary summary card should be added as a new section between the order summary card and the notes input. It reads dietary restrictions from a fresh API call or from a context/store, NOT from the checkout store.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single ThemeToggle only | Settings page with Light/Dark/System | Phase 51 | Users can choose system theme |
| No animation preference | `useAnimationPreference` hook | V7 redesign | Reduce animations toggle in settings |
| No sound preference | `theme-sounds.ts` + localStorage | Phase 50 | Sound toggle in settings |
| No font size preference | CSS variable `--font-size-base` | Phase 51 (NEW) | User-controlled text size |

## Open Questions

1. **SETT-04 Language Preference:** The roadmap lists SETT-04 (language preference) as a requirement, but CONTEXT.md explicitly defers language/locale/i18n. The planner should mark SETT-04 as deferred/out-of-scope for Phase 51 and not include it in tasks.

2. **Addresses sub-section within Settings:** The AddressesTab is a substantial component (243 lines) with its own fetch/save/delete logic. Embedding it in the Preferences sub-tab could make that section very long. Consider: (a) showing it as a collapsed section within Preferences, (b) giving it its own sub-tab (making 4 sub-tabs: Preferences | Addresses | Notifications | Display), or (c) showing a compact address summary with "Manage Addresses" link that expands the full AddressesTab. The 4-sub-tab approach may be cleanest given the AddressesTab's complexity.

3. **Theme DB sync timing:** When the user changes theme in Display settings, should the DB write happen immediately (like display prefs) or on Save button click? Since theme is the only display-adjacent setting that syncs to DB, immediate write (matching the header ThemeToggle behavior) is most consistent. The FloatingUnsavedBar should NOT trigger for theme-only changes since they're already saved.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/components/ui/account/AccountClient.tsx` -- current 4-tab structure
- Codebase analysis: `supabase/migrations/019_customer_settings_admin_expansion.sql` -- table schema
- Codebase analysis: `src/components/ui/admin/settings/SettingsClient/SettingsClient.tsx` -- admin pattern
- Codebase analysis: `src/components/ui/homepage/SettingsNudgeBanner.tsx` -- existing nudge + save helpers
- Codebase analysis: `src/lib/hooks/useAnimationPreference.ts` -- animation pref hook
- Codebase analysis: `src/components/ui/theme/ThemeProvider.tsx` -- next-themes config
- Codebase analysis: `src/components/ui/theme/DynamicThemeProvider.tsx` -- ThemeMode types
- Codebase analysis: `src/lib/theme-sounds.ts` -- sound preference pattern
- Codebase analysis: `src/components/ui/checkout/PaymentStepV8.tsx` -- checkout review step

### Secondary (MEDIUM confidence)
- `.planning/phases/50-data-foundation-admin-settings/50-RESEARCH.md` -- Phase 50 decisions and patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all existing
- Architecture: HIGH -- follows established admin settings pattern
- Pitfalls: HIGH -- based on direct codebase analysis
- Discretion recommendations: HIGH -- grounded in existing patterns

**Research date:** 2026-02-08
**Valid until:** 2026-03-10 (stable -- no external dependencies)
