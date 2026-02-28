# Phase 42: Dynamic Import Heavy Libraries - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove ~300KB from initial bundle by code-splitting Recharts (180KB) and Google Maps (120KB) behind dynamic imports and viewport-based loading triggers. Skeleton loading states prevent layout shift. Places Autocomplete stays eager (checkout critical path). This phase does NOT add new analytics features, new map functionality, or change existing data flows.

</domain>

<decisions>
## Implementation Decisions

### Skeleton loading states

- **Chart skeleton:** Faux chart shapes (gray bars/lines mimicking chart layout), generic shape for all chart types (not per-chart-type)
- **Chart skeleton detail:** Chart shape only — no axis labels or gridline placeholders
- **Map skeleton:** Static map image placeholder with centered muted map pin icon overlay
- **Map placeholder source:** Claude's discretion (local static image or CSS-only approach)
- **Skeleton sizing:** Claude's discretion — pick based on existing layout patterns
- **Pulse animation:** Match existing loading state animation patterns in the app
- **Skeleton labels:** Subtle muted text below skeleton (e.g., "Loading revenue chart...") — specific per chart, not generic
- **Labels accessible:** Both visual text AND aria-label/role="status" for screen readers
- **Skeleton-to-real transition:** Brief fade-in (~200ms), not instant swap
- **Multi-chart stagger:** Charts appear with cascading fade (overlapping animations, wave effect), not all at once

### Map loading trigger

- **Default behavior:** Viewport-based — load only when map enters viewport (no preload margin)
- **Tracking page exception:** Load map eagerly on tracking page (delivery location is primary content)
- **Checkout page:** Load map eagerly alongside Places Autocomplete
- **Admin pages:** Same viewport-based pattern as other pages
- **IntersectionObserver fallback:** Fall back to eager loading on unsupported browsers
- **Load persistence:** Once loaded, map stays in memory — no unload on scroll away
- **Map skeleton context:** Show delivery address text below map skeleton while loading
- **Mobile maps:** Smaller map container height on mobile to save rendering resources

### Chart loading experience

- **Page-level loading:** Page layout (header/nav) renders instantly; chart areas show skeletons (progressive)
- **Data priority:** Summary numbers/KPIs load first, charts load after — admin sees key info fast
- **Controls timing:** Date range filters and controls are interactive immediately, even before charts load
- **Date range switch:** Keep old chart data visible with loading indicator while new data fetches — don't re-show skeletons
- **Module caching:** Recharts cached after first load — instant on return to analytics
- **Slow load timeout:** After 10 seconds, show "Charts taking longer than expected" message with retry option
- **Chart labels:** Specific per chart (e.g., "Loading revenue chart...", "Loading order chart...")

### Error & slow-load handling

- **Chart/map failure:** Error card with [Retry] button — consistent pattern for both
- **Error styling:** Match existing RouteError/error boundary styling in the app
- **Retry strategy:** 3 retries with exponential backoff (1s, 2s, 4s), then permanent error
- **Final error state:** "Unable to load. Please refresh the page." after 3 failed retries
- **Timeout thresholds:** Different for charts vs maps — maps get longer timeout (mobile network awareness)
- **Error logging:** Log dynamic import failures to Sentry for monitoring

### Claude's Discretion

- Map placeholder implementation (local image vs CSS approach)
- Skeleton container sizing strategy
- Exact timeout thresholds for maps (longer than charts' 10s)
- Fade-in animation implementation details
- Cascading fade timing between charts

</decisions>

<specifics>
## Specific Ideas

- Chart skeletons should feel like a preview of what's coming — faux bar shapes with pulse
- Map skeleton with static image + pin icon communicates "map is loading" clearly
- Staggered chart appearance with cascading fade creates a polished, alive feel
- Admin sees KPI numbers first, then charts fill in — prioritize actionable data
- Tracking page map is eager because that's the whole point of the page
- Old chart data stays visible during date range changes — less jarring than re-showing skeletons

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 42-dynamic-import-heavy-libraries_
_Context gathered: 2026-02-05_
