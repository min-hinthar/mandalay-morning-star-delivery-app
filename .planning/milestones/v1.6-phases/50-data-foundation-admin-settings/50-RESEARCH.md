# Phase 50: Data Foundation & Admin Settings - Research

**Researched:** 2026-02-08
**Domain:** Supabase migrations, RLS policies, admin settings UI, save animations (Framer Motion)
**Confidence:** HIGH

## Summary

This phase builds on existing admin settings infrastructure (migration 010, API routes, 3-tab UI) to:

1. Create a `customer_settings` table with JSONB columns and RLS policies
2. Expand admin settings with new keys (time windows, zones, store hours, capacity, alerts, daily summary)
3. Upgrade the admin settings UX with a morphing save button, floating unsaved-changes bar, and confirmation dialogs

The codebase already has strong patterns for all three areas. The `app_settings` table uses key-value JSONB storage with category-based grouping. Framer Motion v12 with the project's motion-tokens system provides all animation primitives needed. The `SuccessCheckmark` component and `celebration.success` effect already exist for the checkmark animation.

**Primary recommendation:** Use migration 019 for the new `customer_settings` table and admin settings expansion. Leverage existing `SuccessCheckmark` component (minimal variant) for the save button morph. Use the existing `overlay.bottomSheet` variant as the base for the floating unsaved-changes bar.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Customer settings table:** Single row per customer with typed columns (not key-value). Columns: dietary_restrictions (JSONB), delivery_instructions (TEXT), default_address (JSONB), notification_prefs (JSONB), theme (TEXT), updated_at (timestamp)
- **Dietary restrictions:** Predefined list + custom free-text. Options: vegetarian, vegan, gluten-free, nut allergy, dairy-free, halal, plus custom. Badge only -- no menu filtering
- **Notification preferences:** 3 grouped categories (Order updates, Marketing, Reminders) -- not per-type toggles
- **RLS policies:** Customer reads/writes own row + admin can read all customer settings
- **Row creation:** Lazy -- row created with defaults on first settings visit. No row = use application defaults
- **Theme storage:** Both localStorage + DB sync. Local wins on conflict
- **Save animation:** Button morphs to checkmark -- subtle scale down, text fades to checkmark icon, brief green pulse, reverts after ~1.5s
- **Save timing:** Optimistic update -- UI updates immediately, rolls back on server failure
- **Error recovery:** Keep user's changes in form + persistent error banner at top with retry button
- **Unsaved changes:** Floating bottom bar with Save + Discard buttons, slides up from bottom with spring animation
- **Discard confirmation:** "Discard unsaved changes?" dialog before reverting
- **Restore defaults:** Confirmation dialog: "Restore all settings to defaults? This can't be undone."
- **Tab switching:** Warn about unsaved changes before switching tabs
- **Changed fields:** Subtle left border accent on modified fields
- **Shared component:** Build reusable save animation component for both admin and customer settings (Phase 51)
- **No keyboard shortcuts** -- click-only save
- **New migration file** (019+) for new settings keys -- existing 010 stays untouched
- **Delivery tab additions:** Delivery time windows + delivery zones (with per-zone fees)
- **Operations tab additions:** Store hours (simple open/close per day, toggle for closed days) + capacity limits (max orders per time slot)
- **Notifications tab additions:** Low stock alerts (global threshold) + daily summary email toggle
- **Customer dietary defaults:** All empty (opt-in)
- **Customer notification defaults:** All on (opt-out)
- **Admin settings defaults:** Pre-populated using existing business logic
- **Customer nudge:** One-time dismissible branded card on home page with mascot, warm colors
- **Nudge behavior:** Mini-preview with 3 quick toggles (dietary, address, notifications) that save inline. "See all settings" link
- **Preference counter:** Simple aggregate counts on admin side (e.g., "12 customers with nut allergy")
- **Language/locale:** Skipped entirely
- **No multiple saved addresses** -- single address in settings
- **Store hours:** Simple open/close per day -- NO breaks/lunch gaps
- **Capacity limits:** Tied to delivery time slots, not per-hour

### Claude's Discretion

- Address storage architecture (single JSONB column vs separate table)
- Delivery time windows implementation (admin-configurable vs hardcoded)
- Zones management UI placement (inline vs sub-page)
- Tab structure (3 tabs vs 4 tabs)
- Nudge banner persistence strategy
- Preference counter placement (dashboard vs analytics)
- Exact animation timing and easing curves
- Migration numbering

### Deferred Ideas (OUT OF SCOPE)

- Language/locale preference and i18n infrastructure
- Per-item stock alert thresholds
- Customer preference analytics beyond simple counter
- Multiple saved addresses
  </user_constraints>

## Discretion Recommendations

### Address Storage: Single JSONB column in `customer_settings`

**Recommendation:** Use the `default_address` JSONB column already specified in the schema.
**Rationale:** The project already has a separate `addresses` table (migration 000) with full address management for orders. The customer settings `default_address` is a preference pointer -- store as `{ address_id: UUID }` referencing the existing `addresses` table, not a duplicate address copy. This avoids data duplication and leverages existing address CRUD in the AccountClient's AddressesTab.

### Delivery Time Windows: Admin-configurable

**Recommendation:** Admin-configurable time windows stored as JSONB array in `app_settings`.
**Rationale:** The migration 010 already seeds `delivery_time_windows` as `'[]'::jsonb` and the Zod schema already validates `delivery_time_windows` as an array of `{ start, end, label }` objects. The infrastructure exists -- just needs a UI component in the Delivery tab.

### Zones UI: Inline in Delivery tab

**Recommendation:** Inline within Delivery tab as a collapsible section.
**Rationale:** Zones are directly related to delivery settings. A separate sub-page adds navigation complexity for what is a simple list of `{ name, radius_miles, fee_cents }` entries. The Delivery tab currently has 5 fields and plenty of vertical space.

### Tab Structure: Keep 3 tabs, add subsections

**Recommendation:** Keep the existing 3 tabs (Delivery, Operations, Notifications). Add store hours and capacity as subsections within the Operations tab.
**Rationale:** 4 tabs adds visual clutter. Store hours and capacity are operational concerns that naturally group with route/driver settings. The Operations tab currently has only 4 fields. Subsections with headers maintain scannability.

### Nudge Banner Persistence: Show until dismissed OR settings visited

**Recommendation:** Show the nudge card until the user either (a) clicks the dismiss X, or (b) visits their settings page. Persist dismissal in localStorage with key `nudge_settings_dismissed`.
**Rationale:** "Show once" risks missing users who scroll past. "Until dismissed" ensures engagement without being annoying. localStorage is appropriate since this is a non-critical UI preference, and the user can see it again on a new device which is acceptable.

### Preference Counter Placement: Admin dashboard widget

**Recommendation:** Place as a small stat card on the admin dashboard (alongside existing metrics).
**Rationale:** The admin dashboard already has metric cards (MetricCard component). Adding a "Customer Preferences" summary card with counts like "12 nut allergy, 8 vegan" fits the existing pattern. Analytics section doesn't exist as a separate preference analytics page (out of scope).

### Animation Timing

**Recommendation:** Use existing motion tokens:

- Save button morph: `spring.snappyButton` (stiffness 500, damping 30, mass 0.8) for the scale-down
- Checkmark appearance: Reuse `SuccessCheckmark` component with `variant="minimal"` and `size={16}`
- Floating bar slide-up: `spring.default` (stiffness 300, damping 22, mass 0.8) -- matches existing `cartBarSlideUp` pattern
- Green pulse: CSS `animate-pulse` with 1.5s duration then revert

### Migration Numbering: 019

**Recommendation:** Use migration `019_customer_settings_admin_expansion.sql`.
**Rationale:** Last existing migration is 018. Single migration file for both customer_settings table creation and admin settings expansion keeps the change atomic.

## Standard Stack

### Core (already installed -- no new dependencies)

| Library               | Version  | Purpose                       | Why Standard                                  |
| --------------------- | -------- | ----------------------------- | --------------------------------------------- |
| @supabase/ssr         | ^0.8.0   | Server/client Supabase client | Already in use, typed with Database           |
| @supabase/supabase-js | ^2.90.1  | Supabase JS client            | Already in use                                |
| framer-motion         | ^12.26.1 | Animations                    | Already used throughout; motion-tokens system |
| zod                   | ^4.3.5   | Schema validation             | Already used for settings validation          |
| react-hook-form       | ^7.71.1  | Form handling                 | Already installed (not used in settings yet)  |
| lucide-react          | ^0.562.0 | Icons                         | Already used throughout                       |

### Supporting (already installed)

| Library  | Version | Purpose          | When to Use                                    |
| -------- | ------- | ---------------- | ---------------------------------------------- |
| zustand  | ^5.0.10 | State management | If nudge dismissal needs cross-component state |
| date-fns | ^4.1.0  | Date formatting  | Store hours display                            |

**Installation:** No new packages needed.

## Architecture Patterns

### Recommended File Structure

```
supabase/migrations/
  019_customer_settings_admin_expansion.sql  # New migration

src/
  lib/validations/
    settings.ts                              # Expand existing schemas
    customer-settings.ts                     # New customer settings schemas

  components/ui/admin/settings/
    settings-types.ts                        # Expand with new fields
    DeliverySettingsForm.tsx                  # Add time windows + zones sections
    OperationsSettingsForm.tsx               # Add store hours + capacity sections
    NotificationSettingsForm.tsx             # Add low stock + daily summary sections
    SettingsClient/
      SettingsClient.tsx                     # Upgrade save UX
      SettingsSkeleton.tsx                   # Existing
      index.tsx                             # Existing
    SaveButton/                             # New reusable save animation component
      SaveButton.tsx
      index.tsx
    UnsavedChangesBar/                      # New floating bar component
      UnsavedChangesBar.tsx
      index.tsx

  types/database.ts                         # Add CustomerSettingsRow types
```

### Pattern 1: Key-Value Settings with Category Grouping

**What:** The existing `app_settings` table stores settings as key-value pairs with JSONB values and category grouping. New admin settings follow this same pattern.
**When to use:** All admin settings (delivery zones, time windows, store hours, capacity, alerts, daily summary).
**Example:**

```sql
-- New admin settings keys follow existing pattern
INSERT INTO app_settings (key, value, category) VALUES
  ('delivery_zones', '[]'::jsonb, 'delivery'),
  ('store_hours', '{}'::jsonb, 'operations'),
  ('max_orders_per_slot', '20'::jsonb, 'operations'),
  ('low_stock_threshold', '10'::jsonb, 'notifications'),
  ('daily_summary_enabled', 'false'::jsonb, 'notifications')
ON CONFLICT (key) DO NOTHING;
```

### Pattern 2: Customer Settings as Single-Row Typed Columns

**What:** Unlike app_settings (key-value), customer_settings uses typed columns for a single row per customer. This provides better type safety and simpler queries.
**When to use:** Customer preferences that are always read/written together.
**Example:**

```sql
CREATE TABLE customer_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  dietary_restrictions JSONB NOT NULL DEFAULT '[]'::jsonb,
  delivery_instructions TEXT DEFAULT '',
  default_address JSONB DEFAULT NULL,
  notification_prefs JSONB NOT NULL DEFAULT '{"order_updates": true, "marketing": true, "reminders": true}'::jsonb,
  theme TEXT DEFAULT 'system',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Pattern 3: RLS for Self-Service + Admin Read

**What:** Customer reads/writes own row, admin can read all. Follows existing `profiles` and `addresses` RLS patterns.
**Example:**

```sql
-- Source: Existing project pattern from 002_rls_policies.sql
ALTER TABLE customer_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_settings_select" ON customer_settings
  FOR SELECT USING (user_id = (select auth.uid()) OR public.is_admin());

CREATE POLICY "customer_settings_insert" ON customer_settings
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "customer_settings_update" ON customer_settings
  FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));
```

### Pattern 4: Save Button Morph Animation

**What:** Button text fades to checkmark icon with scale animation, green pulse, then reverts.
**When to use:** Save actions in settings forms.
**Example:**

```tsx
// Uses existing SuccessCheckmark (minimal variant) + AnimatePresence
<AnimatePresence mode="wait">
  {showSuccess ? (
    <m.span
      key="check"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={spring.snappyButton}
    >
      <SuccessCheckmark show size={16} variant="minimal" />
    </m.span>
  ) : (
    <m.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      Save Changes
    </m.span>
  )}
</AnimatePresence>
```

### Pattern 5: Floating Unsaved Changes Bar

**What:** Fixed bottom bar that slides up with spring animation when form has unsaved changes.
**When to use:** Settings pages with Save + Discard actions.
**Example:**

```tsx
// Uses existing overlay.bottomSheet variant pattern
<AnimatePresence>
  {hasChanges && (
    <m.div
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={spring.default}
      className="fixed bottom-0 left-0 right-0 z-40 ..."
    >
      <Button onClick={handleSave}>Save</Button>
      <Button variant="ghost" onClick={handleDiscard}>
        Discard
      </Button>
    </m.div>
  )}
</AnimatePresence>
```

### Pattern 6: Optimistic Update with Rollback

**What:** UI updates immediately on save, reverts on server failure. Keeps user's changes in form on error.
**When to use:** Settings save operations.
**Example:**

```tsx
const handleSave = async () => {
  const previousSettings = { ...originalSettings };
  setOriginalSettings(settings); // Optimistic: mark as saved
  setShowSuccess(true);

  try {
    await saveToServer(settings);
  } catch (error) {
    setOriginalSettings(previousSettings); // Rollback
    setShowError(true); // Persistent banner
  }
};
```

### Anti-Patterns to Avoid

- **Rebuilding existing infrastructure:** The `app_settings` table, API routes, and Tabs component already exist. Extend, don't rebuild.
- **Duplicating address data:** Don't copy address fields into `customer_settings`. Reference the existing `addresses` table by ID.
- **Duplicating ToggleSwitch:** The Operations and Notifications forms both define their own ToggleSwitch. Extract to shared component during this phase.
- **Using `confirm()` for dialogs:** The existing codebase uses `confirm()` for restore defaults. Upgrade to a proper Modal component (already have `Modal` and `DiscardChangesModal`).

## Don't Hand-Roll

| Problem                     | Don't Build                | Use Instead                                    | Why                                            |
| --------------------------- | -------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| Success checkmark animation | Custom SVG animation       | `SuccessCheckmark` component (minimal variant) | Already built, reduced-motion support included |
| Discard changes dialog      | New modal from scratch     | `DiscardChangesModal` component                | Already exists with Save/Discard/Cancel        |
| Modal UI                    | Custom overlay             | `Modal` component                              | Already exists with proper z-index, a11y       |
| Toggle switches             | Inline in each form        | Extract shared `ToggleSwitch` component        | Currently duplicated across 2 forms            |
| Spring animations           | Custom timing calculations | `spring.*` presets from motion-tokens          | Consistent with design system                  |
| Form validation             | Custom validation logic    | Zod schemas (extend existing `settings.ts`)    | Already used in settings API                   |
| Bottom sheet slide          | Custom position/animation  | `overlay.bottomSheet` variant pattern          | Matches existing cart bar pattern              |
| Tab navigation              | Custom tab system          | `Tabs` component                               | Already used in settings                       |

**Key insight:** Nearly everything needed for animations, modals, and form components already exists in the codebase. The main work is wiring new fields and upgrading the save flow.

## Common Pitfalls

### Pitfall 1: camelCase/snake_case Mismatch

**What goes wrong:** The API route converts between camelCase (frontend) and snake_case (database). New settings keys must follow this convention consistently.
**Why it happens:** The existing `route.ts` does manual conversion with regex. New keys like `deliveryZones` must map to `delivery_zones`.
**How to avoid:** Ensure all new settings keys are added to both the Zod schemas (camelCase) and migration defaults (snake_case). Test the conversion with keys containing multiple capital letters.
**Warning signs:** Settings save silently but values don't persist.

### Pitfall 2: Lazy Row Creation Race Condition

**What goes wrong:** Two concurrent requests for a user's first visit both try to INSERT, one fails with unique constraint violation.
**Why it happens:** No row exists yet, both requests check, both find nothing, both INSERT.
**How to avoid:** Use `INSERT ... ON CONFLICT (user_id) DO NOTHING` (upsert pattern) when creating the initial row. Return the row with a second SELECT if needed.
**Warning signs:** Intermittent errors on first settings visit.

### Pitfall 3: JSONB Default Value Handling

**What goes wrong:** Frontend receives `null` for JSONB fields when no customer_settings row exists, causing runtime errors.
**Why it happens:** Lazy row creation means no row = no data, not default data.
**How to avoid:** Define application-level defaults in the frontend. When fetching, merge server data with defaults: `{ ...DEFAULTS, ...serverData }`. The existing SettingsClient already does this with `??` operators.
**Warning signs:** `Cannot read property of null` errors on customer settings page.

### Pitfall 4: Optimistic Update State Desync

**What goes wrong:** After a failed save, the UI shows "saved" state but the server has old data.
**Why it happens:** The optimistic update sets `originalSettings = settings` before the server confirms.
**How to avoid:** Only mark as saved after server success. Show success animation optimistically, but keep `originalSettings` unchanged until server confirms. On failure, revert the success state and show error banner.
**Warning signs:** User sees "Saved!" but refreshing shows old values.

### Pitfall 5: Floating Bar Z-Index Conflicts

**What goes wrong:** The floating unsaved changes bar appears behind the header, modals, or toast notifications.
**Why it happens:** Multiple z-index layers (header, modals, toasts, floating bar) compete.
**How to avoid:** The existing unsaved changes indicator uses `z-50`. Keep the floating bar at `z-40` (below modals/toasts at z-50) and ensure `fixed` positioning. Check against existing stacking: header, cart bar, toast provider.
**Warning signs:** Floating bar hidden behind other UI elements.

### Pitfall 6: Migration Dependency on `is_admin()` Function

**What goes wrong:** RLS policies reference `public.is_admin()` which is defined in migration 001.
**Why it happens:** Forgetting that helper functions must exist before policies reference them.
**How to avoid:** Migration 019 only creates tables and policies; it depends on functions from 001 which already exist. No action needed, but document the dependency.
**Warning signs:** Migration fails with "function is_admin() does not exist".

## Code Examples

### Migration 019: Customer Settings Table + Admin Settings Expansion

```sql
-- Source: Follows pattern from 010_app_settings.sql and 002_rls_policies.sql

-- 1. CUSTOMER SETTINGS TABLE
CREATE TABLE IF NOT EXISTS customer_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  dietary_restrictions JSONB NOT NULL DEFAULT '[]'::jsonb,
  delivery_instructions TEXT DEFAULT '',
  default_address JSONB DEFAULT NULL,
  notification_prefs JSONB NOT NULL DEFAULT '{"order_updates": true, "marketing": true, "reminders": true}'::jsonb,
  theme TEXT DEFAULT 'system',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. UPDATED_AT TRIGGER
DROP TRIGGER IF EXISTS update_customer_settings_updated_at ON customer_settings;
CREATE TRIGGER update_customer_settings_updated_at
  BEFORE UPDATE ON customer_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. RLS POLICIES
ALTER TABLE customer_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_settings_select" ON customer_settings
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()) OR public.is_admin());

CREATE POLICY "customer_settings_insert" ON customer_settings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "customer_settings_update" ON customer_settings
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- No DELETE policy -- settings row should persist

-- 4. NEW ADMIN SETTINGS KEYS
INSERT INTO app_settings (key, value, category) VALUES
  ('delivery_zones', '[]'::jsonb, 'delivery'),
  ('store_hours', '{"monday":{"open":"09:00","close":"17:00","closed":false},"tuesday":{"open":"09:00","close":"17:00","closed":false},"wednesday":{"open":"09:00","close":"17:00","closed":false},"thursday":{"open":"09:00","close":"17:00","closed":false},"friday":{"open":"09:00","close":"17:00","closed":false},"saturday":{"open":"10:00","close":"15:00","closed":false},"sunday":{"open":"00:00","close":"00:00","closed":true}}'::jsonb, 'operations'),
  ('max_orders_per_slot', '20'::jsonb, 'operations'),
  ('low_stock_threshold', '10'::jsonb, 'notifications'),
  ('daily_summary_enabled', 'false'::jsonb, 'notifications')
ON CONFLICT (key) DO NOTHING;
```

### Zod Schema for Customer Settings

```typescript
// Source: Extends pattern from src/lib/validations/settings.ts
import { z } from "zod";

const DIETARY_OPTIONS = [
  "vegetarian",
  "vegan",
  "gluten-free",
  "nut-allergy",
  "dairy-free",
  "halal",
] as const;

export const customerSettingsSchema = z.object({
  dietary_restrictions: z
    .array(
      z.object({
        type: z.enum(DIETARY_OPTIONS).or(z.literal("custom")),
        custom_label: z.string().max(50).optional(),
      })
    )
    .default([]),
  delivery_instructions: z.string().max(500).default(""),
  default_address: z
    .object({
      address_id: z.string().uuid(),
    })
    .nullable()
    .default(null),
  notification_prefs: z
    .object({
      order_updates: z.boolean().default(true),
      marketing: z.boolean().default(true),
      reminders: z.boolean().default(true),
    })
    .default({ order_updates: true, marketing: true, reminders: true }),
  theme: z.enum(["light", "dark", "system"]).default("system"),
});
```

### Admin Settings Expansion Types

```typescript
// Source: Extends src/components/ui/admin/settings/settings-types.ts

export interface DeliveryZone {
  id: string;
  name: string;
  radius_miles: number;
  fee_cents: number;
}

export interface StoreHoursDay {
  open: string; // HH:MM
  close: string; // HH:MM
  closed: boolean;
}

export type StoreHours = Record<
  "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
  StoreHoursDay
>;

// Extended DeliverySettings
export interface DeliverySettings {
  deliveryRadiusMiles: number;
  minimumOrderCents: number;
  freeDeliveryThresholdCents: number;
  baseDeliveryFeeCents: number;
  deliveryCutoffTime: string;
  deliveryTimeWindows: Array<{ start: string; end: string; label?: string }>;
  deliveryZones: DeliveryZone[];
}

// Extended OperationsSettings
export interface OperationsSettings {
  maxStopsPerRoute: number;
  autoAssignEnabled: boolean;
  routeOptimizationEnabled: boolean;
  defaultVehicleType: "car" | "motorcycle" | "bicycle" | "van" | "truck";
  storeHours: StoreHours;
  maxOrdersPerSlot: number;
}

// Extended NotificationSettings
export interface NotificationSettings {
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  notifyOnOrderPlaced: boolean;
  notifyOnOrderStatusChange: boolean;
  lowStockThreshold: number;
  dailySummaryEnabled: boolean;
}
```

### Save Button Morph Component

```tsx
// Source: Uses existing SuccessCheckmark + motion-tokens

"use client";
import { m, AnimatePresence } from "framer-motion";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SuccessCheckmark } from "@/components/ui/success-checkmark";
import { spring } from "@/lib/motion-tokens";

interface SaveButtonProps {
  hasChanges: boolean;
  saving: boolean;
  showSuccess: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function SaveButton({
  hasChanges,
  saving,
  showSuccess,
  disabled,
  onClick,
}: SaveButtonProps) {
  return (
    <Button
      variant={showSuccess ? "success" : "primary"}
      onClick={onClick}
      disabled={!hasChanges || saving || disabled || showSuccess}
    >
      <AnimatePresence mode="wait">
        {saving ? (
          <m.span
            key="saving"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="h-4 w-4 animate-spin" />
          </m.span>
        ) : showSuccess ? (
          <m.span
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: [0.8, 1.1, 1] }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={spring.snappyButton}
          >
            <SuccessCheckmark show size={16} variant="minimal" />
          </m.span>
        ) : (
          <m.span
            key="save"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Save className="h-4 w-4" />
          </m.span>
        )}
      </AnimatePresence>
      <span className="ml-2">{saving ? "Saving..." : showSuccess ? "Saved!" : "Save Changes"}</span>
    </Button>
  );
}
```

### Floating Unsaved Changes Bar

```tsx
// Source: Uses overlay.bottomSheet pattern from motion-tokens/variants.ts

"use client";
import { m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { spring } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils/cn";

interface UnsavedChangesBarProps {
  hasChanges: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

export function UnsavedChangesBar({
  hasChanges,
  saving,
  onSave,
  onDiscard,
}: UnsavedChangesBarProps) {
  return (
    <AnimatePresence>
      {hasChanges && (
        <m.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={spring.default}
          className={cn(
            "fixed bottom-0 left-0 right-0 z-40",
            "bg-surface-primary/95 backdrop-blur-sm border-t border-border",
            "px-4 py-3 flex items-center justify-between gap-4",
            "shadow-lg"
          )}
        >
          <p className="text-sm text-text-secondary font-medium">You have unsaved changes</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onDiscard} disabled={saving}>
              Discard
            </Button>
            <Button variant="primary" size="sm" onClick={onSave} isLoading={saving}>
              Save Changes
            </Button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
```

## State of the Art

| Old Approach                     | Current Approach                               | When Changed | Impact                                         |
| -------------------------------- | ---------------------------------------------- | ------------ | ---------------------------------------------- |
| `confirm()` for restore defaults | Proper Modal component with styled dialog      | This phase   | Better UX, consistent with DiscardChangesModal |
| Toast-only save feedback         | Button morph animation + toast                 | This phase   | More immediate, satisfying feedback            |
| Simple "unsaved changes" text    | Floating action bar with Save/Discard          | This phase   | Actionable, always accessible                  |
| App-level confirm on tab switch  | In-component DiscardChangesModal on tab switch | This phase   | No browser chrome, matches design system       |

## Open Questions

1. **ToggleSwitch extraction timing**
   - What we know: ToggleSwitch is duplicated in OperationsSettingsForm and NotificationSettingsForm (identical code)
   - What's unclear: Whether to extract before or during this phase
   - Recommendation: Extract as first task in this phase to avoid duplicating it again in new notification fields

2. **Preference counter API**
   - What we know: Need aggregate counts of customer dietary restrictions
   - What's unclear: Whether to use a Supabase function or a simple aggregation query in the API route
   - Recommendation: Simple API route with `SELECT dietary_restrictions, COUNT(*) FROM customer_settings GROUP BY dietary_restrictions` -- no need for a database function for this simple query. Use JSON aggregation since dietary_restrictions is JSONB array.

3. **Nudge component placement**
   - What we know: Goes on the home page (`src/app/(public)/page.tsx`) as a branded card
   - What's unclear: Exact position relative to existing sections (after Hero? before Menu?)
   - Recommendation: After Hero, before HowItWorks. This is the highest-visibility position for authenticated users. Show only when authenticated and not dismissed.

## Sources

### Primary (HIGH confidence)

- Codebase: `supabase/migrations/010_app_settings.sql` -- existing settings table pattern
- Codebase: `supabase/migrations/001_functions_triggers.sql` -- `is_admin()` function, `update_updated_at_column()` trigger
- Codebase: `supabase/migrations/002_rls_policies.sql` -- established RLS policy patterns
- Codebase: `src/components/ui/admin/settings/` -- existing settings UI (SettingsClient, 3 form components)
- Codebase: `src/lib/validations/settings.ts` -- existing Zod schemas
- Codebase: `src/lib/motion-tokens/` -- spring presets, variants, effects, celebration
- Codebase: `src/components/ui/success-checkmark.tsx` -- existing SuccessCheckmark component
- Codebase: `src/components/ui/DiscardChangesModal.tsx` -- existing discard dialog
- Codebase: `src/components/ui/brand/BrandMascot/` -- existing mascot component for nudge
- Context7: `/supabase/supabase` -- RLS policy patterns (auth.uid() = user_id)
- Context7: `/websites/motion-dev-docs` -- spring animation API, AnimatePresence

### Secondary (MEDIUM confidence)

- Codebase: `src/types/database.ts` -- Database type structure, AddressesRow interface
- Codebase: `src/components/ui/account/AccountClient.tsx` -- existing customer account tabs (Profile, Orders, Addresses, Payment)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all libraries already in project, no new dependencies
- Architecture: HIGH -- extends existing patterns from migrations, API routes, and UI components
- Pitfalls: HIGH -- based on patterns observed in existing codebase (camelCase conversion, RLS patterns, z-index management)
- Animation: HIGH -- motion-tokens system fully documented, SuccessCheckmark already exists

**Research date:** 2026-02-08
**Valid until:** 2026-03-10 (stable -- no external dependency changes expected)
