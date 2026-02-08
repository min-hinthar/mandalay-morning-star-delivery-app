# Phase 48: Error Boundaries & Loading States - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Every route segment gets error recovery and loading feedback. No white screens anywhere. Uses existing RouteError/RouteLoading components and skeleton library. ~13 new files, each 3-6 lines. CSS-only animations in error.tsx files (no Framer Motion).

</domain>

<decisions>
## Implementation Decisions

### Error recovery behavior
- Two actions on error: **retry** (primary button) and **go home** (secondary/ghost button)
- After 2+ retry failures, emphasize the "go home" action more prominently
- Show technical error details (message, stack trace) in **development mode only**; production stays clean
- Light personality tone: friendly but brief ("Oops, we hit a bump!" style, not generic "Something went wrong")
- Same error boundary style for all roles (admin, customer, driver) — no role-specific differences
- Log errors to **Sentry** in production
- Error boundary mounts with **subtle CSS fade-in** animation
- Nested layout error handling: Claude's discretion on section-only vs full-page based on Next.js hierarchy

### Loading state style
- **Reuse existing** skeleton components and RouteLoading component for all new loading states
- All missing loading.tsx files get **generic RouteLoading** — no custom skeletons per page
- **CSS-only for error files, Framer Motion allowed for loading files** (if already imported)
- App shell (nav, sidebar) stays visible during loading — **only content area shows loading state**

### Error visual presentation
- **Lightly branded** — uses app colors, Morning Star logo, friendly tone. Not as elaborate as Phase 49 branded 404 pages
- **Logo + icon**: Morning Star logo at top, alert icon near the message
- **Soft red/orange** color scheme — traditional error colors but softened, not aggressive
- Button hierarchy: **retry is primary**, go home is secondary/ghost
- Error card **vertically centered** in the content area

### Claude's Discretion
- Exact skeleton component selection per loading.tsx
- Nested error boundary hierarchy decisions (section vs full-page per route)
- Exact error messages and wording (within "light personality" constraint)
- Sentry integration approach (existing setup vs new)
- CSS fade-in timing and easing

</decisions>

<specifics>
## Specific Ideas

- Existing infrastructure: 8 error.tsx files, 4 loading.tsx files, RouteError + RouteLoading components, skeleton library (card/table/text skeletons)
- Gap to fill: remaining route segments without error/loading coverage
- Phase 49 handles branded 404 pages — this phase is the safety net infrastructure underneath

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 48-error-boundaries-loading-states*
*Context gathered: 2026-02-07*
