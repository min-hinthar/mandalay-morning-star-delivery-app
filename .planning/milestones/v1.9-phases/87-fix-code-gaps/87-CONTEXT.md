# Phase 87: Fix Code Gaps (GATE-03 + DRV-05) - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Cart drawer uses DB-sourced cutoff values (not hardcoded Friday 3PM) and all simple-mode-hidden driver pages are guarded against direct URL access. Two gap closures: GATE-03 (cart drawer cutoff wiring) and DRV-05 (simple mode page enforcement).

</domain>

<decisions>
## Implementation Decisions

### Page guard scope
- Guard ALL hidden pages: /driver/earnings, /driver/schedule, /driver/history, /driver/test-delivery
- /driver/profile stays accessible (mode toggle lives there — blocking it would lock drivers out)
- Extract shared `checkSimpleMode(supabase, userId)` helper — all guarded pages call it (DRY)
- Existing /driver/route/[stopId] guard refactored to use shared helper for consistency

### Guard redirect behavior
- Silent redirect to /driver (no toast, no message) — matches existing stop detail page pattern
- Server-side only (Next.js `redirect()` in page component before render)
- No real-time redirect on admin mode toggle — guard fires on next server navigation
- Shared helper checks driver exists + is_active + simple_mode in one query (defensive, no assumptions about layout middleware)

### Claude's Discretion
- Cart cutoff data flow approach: how DB cutoff values reach CartDrawer (extend DeliverySettingsSync to store vs prop threading through layout — either works)
- Exact refactoring of existing stop detail guard to use shared helper
- Whether shared helper returns the driver record or just redirects (API design)

</decisions>

<specifics>
## Specific Ideas

- Simple-mode drivers won't even notice guarded pages — silent redirect means no confusion
- One query per guarded page: `select id, simple_mode from drivers where user_id = X and is_active = true`
- CartFooter already accepts cutoffDay/cutoffHour as optional props — just need to source them from DB instead of relying on defaults

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getBusinessRules()` (`src/lib/settings/business-rules.ts`): Server-side cached reader for cutoffDay/cutoffHour — the canonical source
- `CartFooter` (`src/components/ui/cart/CartDrawerParts.tsx`): Already accepts optional cutoffDay/cutoffHour props with defaults (5, 15) — needs DB values passed in
- `DeliverySettingsSync` (`src/components/ui/cart/DeliverySettingsSync.tsx`): Syncs delivery fee to cart store at layout level — could be extended for cutoff values
- `useDeliveryGate(cutoffDay, cutoffHour)`: Hook used by CartFooter for countdown computation
- Stop detail page guard (`src/app/(driver)/driver/route/[stopId]/page.tsx`): Existing pattern — fetch driver.simple_mode, redirect if true

### Established Patterns
- Server page components call `getBusinessRules()` and pass to client components as props (checkout, menu, hero all do this)
- Server-side `redirect()` for simple mode (stop detail page pattern)
- `unstable_cache` with tag-based invalidation for business rules
- Driver pages fetch driver record via Supabase client in page component

### Integration Points
- Cart drawer rendered from layout/page contexts — cutoff props need to flow from nearest server component
- Driver page components: /driver/earnings/page.tsx, /driver/schedule/page.tsx, /driver/history/page.tsx, /driver/test-delivery/page.tsx — each needs guard added
- Shared helper location: `src/lib/driver/simple-mode-guard.ts` or similar

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 87-fix-code-gaps*
*Context gathered: 2026-03-02*
