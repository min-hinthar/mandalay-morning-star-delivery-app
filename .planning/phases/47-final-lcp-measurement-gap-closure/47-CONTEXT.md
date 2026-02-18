# Phase 47: Final LCP Measurement & Gap Closure - Context

**Gathered:** 2026-02-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify cumulative LCP improvements from Phases 40-44, confirm bundle savings from Phase 43, close 3 deferred manual cart tests (REQ-43.4/43.8/43.9), and document final performance state. This is a measurement/verification phase — no new features or optimizations.

</domain>

<decisions>
## Implementation Decisions

### Measurement approach

- Run Lighthouse on **both** local production build (`pnpm build && pnpm start`) and deployed Vercel URLs
- Deployed: measure both fresh preview deployment AND existing production URL
- **3 runs per page**, take median
- Measure **all 4 customer routes**: homepage, menu, checkout, order tracking
- **Both profiles**: mobile throttled (Lighthouse default) for official score, desktop for comparison
- Bundle analysis: report **current sizes only** (no Phase 40 baseline comparison)
- Capture **summary scores only** in PERFORMANCE.md (no HTML reports saved)
- If Google Fonts 403 build issue recurs: **fix the root cause** (don't skip font optimization)

### Pass/fail criteria

- **Revised LCP target: < 4s** (adjusted from original 2.5s based on realistic assessment)
- If LCP is 4-6s: document gap, add follow-up optimization phase to **v1.6 backlog**
- Bundle analysis success criteria: **Claude's discretion** — determine appropriate metric based on what's measurable
- Per-route thresholds: **Claude's discretion** — set reasonable targets based on page complexity (homepage/menu vs checkout/tracking with maps)

### Cart flow verification

- Tests performed via **Playwright automation** (not manual)
- Results recorded as **written checklist in VERIFICATION.md** (no screenshots)
- REQ-47.5 (cart on customer routes): **full journey with edge cases** — happy path + empty cart, quantity changes, remove item, cart persistence across navigation
- REQ-47.6 (deep links): test **all cart-adjacent routes** — /cart, /checkout, /menu/[id], and any route with cart interaction
- REQ-47.7 (cart regression / no-cart on admin): **Claude's discretion** on whether to verify admin/driver routes lack cart components
- Playwright is **already set up** in the project
- Cart tests **kept as permanent E2E suite** in CI going forward

### Documentation & next steps

- PERFORMANCE.md update: **summary table with before/after** (concise, quick reference)
- If LCP misses <4s: **identify top 3 bottlenecks** with specific files/resources, actionable for v1.6
- Milestone close: **auto-close v1.5 if LCP < 4s**, pause for user review if target missed
- STATE.md and ROADMAP.md updates: **leave for milestone close ceremony**, not Phase 47

### Claude's Discretion

- Bundle analysis success criteria for Phase 43 savings
- Per-route LCP thresholds (tiered based on page complexity)
- Whether to verify admin/driver routes lack cart components in Playwright
- Technical approach to fixing Google Fonts 403 issue

</decisions>

<specifics>
## Specific Ideas

- Revised LCP target from 2.5s to 4s reflects realistic assessment after 6 phases of optimization
- If LCP still >4s, create specific v1.6 optimization phase with identified bottlenecks
- Playwright cart tests become permanent regression suite — not throwaway verification
- Conditional milestone close: auto if passing, human review if not

</specifics>

<deferred>
## Deferred Ideas

- Further LCP optimization beyond Phase 47 → v1.6 backlog (if target missed)
- CDN/hosting-level performance optimization → future consideration

</deferred>

---

_Phase: 47-final-lcp-measurement-gap-closure_
_Context gathered: 2026-02-06_
