# Phase 86: Deferred Integration & Tech Debt Cleanup - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Resolve all known deferred integration gaps and documentation tech debt from phases 77-79. Wire remaining `isPastCutoff` callsites to DB-sourced business rules, populate SUMMARY frontmatter for phases 78 and 79, and resolve deliveryRadiusMiles/maxDeliveryDurationMinutes enforcement status. No new features or capabilities.

</domain>

<decisions>
## Implementation Decisions

### Radius/Duration Enforcement
- Document as **intentionally deferred** — do NOT implement enforcement in this phase
- Enforcement naturally fits a future route optimization phase (when geocoding and distance checks are added)
- This satisfies success criteria item 4: "documented as intentionally deferred or implemented"

### Cutoff Wiring
- Both `retry-payment/route.ts` and `orders/[id]/page.tsx` are server-side — call `getBusinessRules()` directly
- Pass DB-sourced `cutoffDay` and `cutoffHour` to `isPastCutoff()` instead of relying on hardcoded defaults
- Pattern matches how checkout session route already wires business rules

### SUMMARY Frontmatter
- Populate `requirements-completed` in frontmatter of all 7 SUMMARY files (4 for phase 78, 3 for phase 79)
- Map requirement IDs from REQUIREMENTS.md traceability table to each plan's completed work

### Claude's Discretion
- Where to place deferred enforcement documentation (inline code comment vs ADR vs both)
- Whether admin settings UI needs hint text for unenforced radius/duration fields
- Exact requirement-to-plan mapping for SUMMARY frontmatter population
- Error handling approach for `getBusinessRules()` failures in cutoff callsites

</decisions>

<specifics>
## Specific Ideas

No specific requirements — all success criteria are concrete and measurable from ROADMAP.md.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getBusinessRules()` in `src/lib/settings/business-rules.ts`: Returns DB-sourced config including cutoffDay, cutoffHour, deliveryRadiusMiles, maxDeliveryDurationMinutes
- `isPastCutoff()` in `src/lib/utils/delivery-dates.ts`: Already accepts optional cutoffDay/cutoffHour params (lines 161-166)

### Established Patterns
- Checkout session route (`src/app/api/checkout/session/route.ts`) already calls `getBusinessRules()` and passes params to delivery date functions — this is the reference pattern
- Server components and API routes can call `getBusinessRules()` directly (async server function)

### Integration Points
- `src/app/api/orders/[id]/retry-payment/route.ts` line 107: `isPastCutoff(deliveryDate)` needs cutoff params
- `src/app/(customer)/orders/[id]/page.tsx` line 336: `isPastCutoff(parseISO(...))` needs cutoff params
- Phase 78 SUMMARY files (4): `78-01-SUMMARY.md` through `78-04-SUMMARY.md`
- Phase 79 SUMMARY files (3): `79-01-SUMMARY.md` through `79-03-SUMMARY.md`

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 86-integration-tech-debt*
*Context gathered: 2026-03-02*
