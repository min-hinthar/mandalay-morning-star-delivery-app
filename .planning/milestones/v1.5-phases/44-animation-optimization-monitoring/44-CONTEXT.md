# Phase 44: Animation Optimization & Monitoring - Context

**Gathered:** 2026-02-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Lock in LCP < 2.5s by enabling React Compiler, reducing Framer Motion bundle via LazyMotion, auditing GSAP imports for modularity, and setting up Lighthouse CI as a performance regression gate on PRs. No new features — this phase optimizes existing animations and adds monitoring infrastructure.

</domain>

<decisions>
## Implementation Decisions

### React Compiler rollout

- Enable globally all at once in next.config.ts (not incremental)
- Already on React 19.2.3 + Next.js 16.1.2 — no upgrade needed
- If compiler breaks specific components, Claude picks opt-out strategy (e.g., "use no memo" or config exclude)
- If compiler causes significant animation issues across GSAP/Framer Motion, disable compiler entirely (fallback)
- Verification: automated tests only — no manual visual spot-check required
- No specific animation pages flagged as higher risk; just enable and fix whatever breaks
- No separate bundle measurement for compiler impact — LCP is the goal metric

### Framer Motion reduction

- Feature bundle: Claude decides (audit actual feature usage, pick minimal set — domAnimation vs domMax)
- Loading strategy: Claude decides (lazy dynamic import vs eager tree-shaken)
- Convert ALL motion.div → m.div across entire codebase (full migration)
- Complex components that can't easily migrate to m.\* (AnimatePresence edge cases): keep as-is, pragmatic approach
- LazyMotion provider placement: Claude decides based on animation distribution across routes
- Enable strict mode on LazyMotion — force errors for any remaining motion.\* usage inside LazyMotion
- All existing animations must survive optimization — no visual degradation acceptable

### Lighthouse CI thresholds

- Warn only (not block) when metrics drop below threshold
- Test all customer routes: homepage, menu, cart, checkout, tracking
- Track full Lighthouse Performance score (not just LCP)
- Warning threshold: Performance score < 90
- Results storage: Claude decides (temporary CI artifacts vs LHCI server)
- Run trigger: Claude decides (every push vs PR creation only)
- PR comment: only when a metric drops below threshold (not on every run)

### GSAP import audit

- Claude audits codebase to find all GSAP imports and plugins in use (user unsure of current state)
- Claude decides whether any GSAP animations are removable based on usage analysis
- Claude decides whether to enforce modular imports via ESLint rule or just document
- Claude decides whether GSAP components should be dynamically imported based on bundle size analysis
- Keep GSAP consistency — don't replace GSAP usage with CSS animations even if minimally used
- Centralize GSAP plugin registration — single registration point, eliminate duplicate registrations across files
- Shared GSAP config/setup file: Claude decides based on current codebase pattern

### Claude's Discretion

- React Compiler opt-out strategy per-file (use no memo vs config exclude)
- Framer Motion feature bundle selection (domAnimation vs domMax)
- LazyMotion loading strategy (lazy vs eager)
- LazyMotion provider placement (root vs per-route-group)
- GSAP dynamic import decision
- GSAP ESLint rule vs documentation-only
- GSAP shared config file pattern
- Lighthouse CI results storage approach
- Lighthouse CI run trigger frequency

</decisions>

<specifics>
## Specific Ideas

- "Every UI element is reliably clickable and the app feels delightfully alive with motion" — core project value; animation quality must not degrade
- All existing animations (hero parallax, cart fly-to-cart, page transitions, scroll triggers) must remain visually identical post-optimization
- LazyMotion strict mode as the enforcement mechanism for full m.\* migration

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 44-animation-optimization-monitoring_
_Context gathered: 2026-02-06_
