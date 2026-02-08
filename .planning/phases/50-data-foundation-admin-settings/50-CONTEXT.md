# Phase 50: Data Foundation & Admin Settings - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Database migration for customer settings table + expand admin settings with new fields + upgrade admin settings UX with premium save experience. Existing admin settings infrastructure (migration 010, API routes, tabbed UI) already exists — this phase builds on top of it.

**Existing infrastructure (do not rebuild):**
- `app_settings` table (migration 010) with delivery/operations/notifications categories
- Admin settings API routes (GET/PATCH/restore)
- 3-tab settings UI (DeliverySettingsForm, OperationsSettingsForm, NotificationSettingsForm)
- Zod validation schemas, settings types, skeleton loading state

</domain>

<decisions>
## Implementation Decisions

### Customer Settings Schema
- **Table design:** Single row per customer (typed columns, not key-value pairs)
- **Columns:** dietary_restrictions (JSONB), delivery_instructions (TEXT), default_address (JSONB), notification_prefs (JSONB), theme (TEXT), updated_at (timestamp)
- **Dietary restrictions:** Predefined list + custom free-text field. Options include vegetarian, vegan, gluten-free, nut allergy, dairy-free, halal, plus custom
- **Dietary effect:** Badge only — restrictions show on profile/order notes, do NOT filter or flag menu items
- **Delivery preferences:** Default delivery instructions + saved delivery address
- **Notification preferences:** 3 grouped categories (Order updates, Marketing, Reminders) — not per-type toggles
- **Language/locale:** Skip entirely — no column, no UI
- **Address storage:** Claude's discretion — single address in settings or separate table
- **RLS policies:** Customer reads/writes own row + admin can read all customer settings (for support)
- **Row creation:** Lazy — row created with defaults on first settings visit. No row = use application defaults everywhere
- **Theme storage:** Both localStorage + DB sync. Local wins on conflict (localStorage value synced to DB)

### Save Experience & Feedback
- **Save animation:** Button morphs to checkmark — subtle scale down, text fades to checkmark icon, brief green pulse, reverts after ~1.5s
- **Save timing:** Optimistic update — UI updates immediately, rolls back on server failure
- **Error recovery:** Keep user's changes in form + persistent error banner at top with retry button (no rollback on failure)
- **Unsaved changes:** Upgrade to floating bottom bar with Save + Discard buttons, slides up from bottom with spring animation
- **Discard confirmation:** "Discard unsaved changes?" dialog before reverting
- **Restore defaults:** Add confirmation dialog: "Restore all settings to defaults? This can't be undone."
- **Tab switching:** Warn about unsaved changes before switching tabs ("Discard changes?" dialog)
- **Changed fields:** Subtle highlight on modified fields (e.g., left border accent) — no separate review step
- **Shared component:** Build reusable save animation component for both admin and customer settings (Phase 51)
- **No keyboard shortcuts** — click-only save

### Admin Settings Expansion
- **New migration file** (019+) for new settings keys — existing 010 stays untouched
- **Delivery tab additions:** Delivery time windows + delivery zones (with per-zone fees)
- **Operations tab additions:** Store hours (simple open/close per day, toggle for closed days) + capacity limits (max orders per time slot, tied to delivery time windows)
- **Notifications tab additions:** Low stock alerts (global threshold, not per-item) + daily summary email (configurable toggle, not always-on)
- **Time windows:** Claude's discretion — admin-configurable vs hardcoded slots
- **Zones UI:** Claude's discretion — inline in Delivery tab vs separate sub-page
- **Tab layout:** Claude's discretion — keep 3 tabs or add 4th "Schedule" tab

### Settings Defaults & Onboarding
- **Customer dietary defaults:** All empty (opt-in) — no pre-checked restrictions
- **Customer notification defaults:** All on (opt-out) — all 3 groups enabled by default
- **Admin settings defaults:** Pre-populated using existing business logic (store hours from current operation, zones from current delivery radius, capacity from reasonable defaults)
- **Customer nudge:** One-time dismissible branded card on home page with mascot, warm colors
- **Nudge persistence:** Claude's discretion — show once vs persist until dismissed/visited settings
- **Nudge behavior:** Mini-preview showing 3 quick toggles (dietary restrictions, delivery address, notifications) that save inline without navigating away. "See all settings" link for full page
- **Preference counter:** Simple aggregate counts on admin side (e.g., "12 customers with nut allergy"). Claude's discretion on placement (dashboard widget vs analytics section)

### Claude's Discretion
- Address storage architecture (single JSONB column vs separate table)
- Delivery time windows implementation (admin-configurable vs hardcoded)
- Zones management UI placement (inline vs sub-page)
- Tab structure (3 tabs vs 4 tabs)
- Nudge banner persistence strategy
- Preference counter placement (dashboard vs analytics)
- Exact animation timing and easing curves
- Migration numbering

</decisions>

<specifics>
## Specific Ideas

- Save button animation: "Subtle scale + check" — button gently scales down, text fades to checkmark icon, brief green pulse, then reverts after ~1.5s. NOT confetti.
- Floating unsaved-changes bar should slide up from bottom edge with spring animation — NOT fade in
- Nudge banner is a branded card with mascot — NOT a plain info bar
- Nudge mini-preview saves preferences inline (dietary, address, notifications) without navigating away from home page
- Admin daily summary and low stock alerts are configurable toggles — admin can opt out
- Customer "no row" in database means all notifications enabled (default opt-in)
- Store hours: simple open/close per day of week — NO support for breaks/lunch gaps
- Capacity limits tied to delivery time slots, not per-hour

</specifics>

<deferred>
## Deferred Ideas

- Language/locale preference and i18n infrastructure — future milestone
- Per-item stock alert thresholds — could enhance in future phase
- Customer preference analytics beyond simple counter — future analytics phase
- Multiple saved addresses — could be added if single address proves insufficient

</deferred>

---

*Phase: 50-data-foundation-admin-settings*
*Context gathered: 2026-02-08*
