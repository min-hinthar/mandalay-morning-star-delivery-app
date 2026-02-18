# Phase 60: LCP Optimization - Context

**Gathered:** 2026-02-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Homepage loads with visible content in under 4 seconds on mobile Lighthouse. Hero heading is server-rendered without opacity:0 blocking. LazyMotion uses async domAnimation instead of synchronous domMax. Lighthouse mobile performance score > 70. Optimization scope extends to all public pages (menu, cart) with homepage as the primary target.

</domain>

<decisions>
## Implementation Decisions

### Hero visibility strategy

- Hero text simplification is acceptable — simpler animations are fine
- Keep some subtle motion on the hero (light fade, slight slide) — not fully static
- Optimize full page load, not just hero — below-fold content should lazy load too
- Homepage is the worst offender and primary focus; other public pages also benefit
- Claude should audit hero for images vs text-only and optimize accordingly
- Claude should evaluate data fetching strategy (server-side vs client-side) based on LCP impact
- US-only users, mostly mobile (4G/LTE) — decent connections but mobile optimization matters

### Motion downgrade trade-offs

- **All animations must keep working** after switching from domMax to domAnimation — fix all breakage
- Balance playful feel with performance — keep signature animations, optimize or remove minor ones
- **Signature animations to preserve:** cart bounce/spring, page transitions, all playful animation identity
- Claude audits codebase for domMax-only features (layout animations, drag gestures) and determines approach
- Claude decides whether to split domAnimation/domMax per-route or find CSS alternatives
- Claude decides on CSS vs Framer Motion replacement for individual animations
- Claude determines acceptable animation delay after async load
- Claude checks prefers-reduced-motion support and adds if trivial
- Claude determines progressive loading strategy (fast content first vs complete appearance)

### Fallback & loading states

- Claude determines pre-hydration UX for buttons/interactive elements
- Claude decides motion loading strategy (render without animation vs placeholder)
- Claude uses existing codebase loading patterns or picks best approach for data loading states
- Claude keeps existing error handling unless it interferes with LCP optimization
- Claude determines font loading optimization needs (font-display:swap, preloading)
- Claude audits image lazy loading and adds where missing
- Claude handles FOUC prevention as part of optimization
- Claude checks error boundary placement relative to LCP-critical content
- Claude determines if loading.tsx helps or hurts LCP for homepage route

### Performance budget

- **Firm targets:** LCP < 4000ms, Lighthouse mobile > 70 (from roadmap)
- **Aspirational:** sub-3s LCP and 80+ Lighthouse if achievable without over-engineering
- Third-party scripts on homepage: Sentry + Vercel Speed Insights (Phase 59) — Claude ensures these are deferred/non-blocking
- Claude determines if JS bundle size budget is needed based on analysis
- Claude optimizes all Core Web Vitals as needed to hit Lighthouse > 70 (LCP + CLS + INP)
- Claude evaluates SSR vs SSG rendering strategy change if it meaningfully improves LCP
- Claude determines code splitting scope beyond LazyMotion based on impact analysis
- Verification: Claude decides between manual Lighthouse and lightweight CI check

### Claude's Discretion

- Hero entrance animation approach (visible-with-delayed-animation vs instant)
- Which hero elements are server-visible (all vs just heading)
- Visual transition smoothness between static and animated states
- Hero background optimization scope
- Data fetching strategy changes
- domMax per-route vs full domAnimation with CSS alternatives
- Bundle size limits
- CLS/INP optimization scope
- Code splitting aggressiveness
- Render mode (SSR vs SSG) evaluation
- Verification approach (manual vs CI)
- Font loading optimization
- Image lazy loading audit
- Error boundary / loading.tsx decisions

</decisions>

<specifics>
## Specific Ideas

- Cart bounce/spring and page transitions are explicitly called out as signature animations that define the app's personality
- "All playful animation" is important — the v1.2 Playful UI Overhaul identity must be preserved
- Simpler hero animations are acceptable — function over form for the hero specifically
- User prefers aspirational sub-3s LCP and 80+ Lighthouse if achievable
- Current LCP is 8-11s (from STATE.md) — root cause is domMax synchronous import + opacity:0 animations blocking hero render

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 60-lcp-optimization_
_Context gathered: 2026-02-14_
