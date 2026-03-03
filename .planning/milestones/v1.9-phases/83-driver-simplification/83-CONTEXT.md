# Phase 83: Driver Simplification - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

A non-technical family member completes a delivery route without any verbal instructions. Simple mode strips the driver app to essentials: customer name, address (tap opens Maps), phone (tap calls), and a large "Mark Delivered" button. Complex UI sections are hidden. Preference persists server-side. Offline instructions display when connectivity is lost.

</domain>

<decisions>
## Implementation Decisions

### Simple mode activation
- Both admin and driver can toggle simple mode (admin pre-sets for family drivers, driver can also change it themselves)
- On by default for new drivers — reduces onboarding friction for non-technical users
- Toggle lives on the existing driver profile page (`/driver/profile`)
- Mode switch takes effect instantly — UI morphs without page reload
- Preference stored server-side (new column on `drivers` table), not localStorage

### Simplified route view
- Bare minimum per stop: customer name, address (tap → Maps), phone (tap → call), and a big "Mark Delivered" button
- No order items, no delivery window, no timeline, no photo capture
- Single-stop focus: only the current (next undelivered) stop is shown — no scrollable stop list
- After marking delivered: brief success animation ("Delivered!"), then auto-slide to next stop
- Progress counter visible: "3 of 7 done"
- Final stop: "All done!" celebration screen
- Confirmation dialog on "Mark Delivered": "Mark as delivered at [address]?" (DRV-02)
- Problem handling: single "Call for help" button that dials the operator/admin — no exception forms or modals in simple mode

### Navigation scope
- Simple mode shows 2 bottom nav tabs: Home + Route
- Hides Earnings, Schedule, History tabs entirely
- Same bottom nav bar style (teal active indicator, same height), just fewer tabs
- Simplified Home: greeting ("Hello, [Name]!") + today's date + big "Start Today's Route" button (or "No route today" message)
- No stats, badges, streaks, earnings, profile completeness, onboarding walkthrough on simple home
- Avatar/icon in top-right header for accessing profile page (where mode toggle lives)

### Offline experience
- Full-screen overlay when connectivity drops: "No internet — don't worry! Your route is saved. Deliveries will sync when you're back online." Dismissible to continue working offline.
- Drivers can mark stops as delivered while offline — queued locally, synced when back online
- Small "will sync" indicator on locally-marked deliveries
- Brief green toast on reconnect: "Back online — syncing deliveries..." then "All synced!"
- Auto-cache route data with indicator: when driver opens route, all stop data cached in IndexedDB/service worker, brief "Route saved for offline use" message shown

### Claude's Discretion
- Exact animation for delivery celebration and auto-advance transition
- Loading skeleton design for simple mode views
- Error state handling for failed syncs
- Exact layout/sizing of the simplified stop card
- How to handle edge case: driver has no route assigned in simple mode

</decisions>

<specifics>
## Specific Ideas

- Single-stop focus means the driver never has to think about which stop is next — the app always shows them exactly what to do now
- "Call for help" replaces all exception handling — operator is the safety net for non-technical drivers
- The mode toggle should be clearly labeled with a brief explanation so drivers understand what changes

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DriverNav` (`src/components/ui/driver/DriverNav.tsx`): Hardcoded 5-tab nav — needs conditional rendering based on simple mode
- `DriverDashboard` (`src/components/ui/driver/DriverDashboard/`): Full dashboard with 10+ sub-components — simple mode replaces with minimal home
- `StopDetailView` (`src/components/ui/driver/StopDetailView.tsx`): V8 animated stop detail — simple mode needs a stripped-down alternative
- `StopDetail` (`src/components/ui/driver/StopDetail.tsx`): Core stop info display — can extract address/phone/name rendering
- `DeliveryActions` (`src/components/ui/driver/DeliveryActions.tsx`): Status progression buttons — simple mode needs just "Mark Delivered"
- `ExceptionModal` (`src/components/ui/driver/ExceptionModal.tsx`): Exception reporting — hidden in simple mode, replaced by "Call for help"
- `OfflineBanner` (`src/components/ui/driver/OfflineBanner.tsx`): Existing offline indicator — needs upgrade to full-screen overlay for simple mode
- `useOfflineSync` hook: Queues photos/actions offline — extend for delivery marking
- `DriverShell` (`src/components/ui/driver/DriverShell.tsx`): Shell wrapper — can provide simple mode context
- `ProfilePageClient` (`src/app/(driver)/driver/profile/ProfilePageClient.tsx`): Profile page — add toggle here

### Established Patterns
- Server components fetch data, pass to client components
- Framer Motion animations via `useAnimationPreference` hook
- `useOfflineSync` for offline queueing with IndexedDB
- Supabase RLS for data access control
- Design tokens: `accent-teal`, `surface-primary`, `text-primary`, etc.
- 56px min touch targets on driver nav

### Integration Points
- `drivers` table: needs new `simple_mode` boolean column (server-side persistence)
- Driver layout (`src/app/(driver)/driver/layout.tsx`): reads driver record — can include simple_mode flag
- `DriverAvatarProvider` context: could be extended or paralleled with a SimpleModeProvider
- API routes at `/api/driver/routes/`: used for start/status changes — offline queue targets these
- Serwist PWA service worker: route data pre-caching via `scripts/build-sw.mjs`

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 83-driver-simplification*
*Context gathered: 2026-03-02*
