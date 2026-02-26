# Phase 67: CSP & Security Headers - Context

**Gathered:** 2026-02-16
**Status:** Ready for planning

<domain>
## Phase Boundary

All pages served with Content Security Policy and security headers protecting against XSS, clickjacking, and MIME-sniffing. Replace cssText usages that violate CSP. Remove dead code exports, barrel files, and resolve placeholder social links. Does NOT include RLS, rate limiting, or auth redirects (those are Phases 68-70).

</domain>

<decisions>
## Implementation Decisions

### CSP Rollout Strategy

- Claude's Discretion: Report-Only vs enforcing timeline, validation period length
- Claude's Discretion: Single global policy vs per-route policies (analyze complexity vs security tradeoff)
- Claude's Discretion: CSP header location (next.config.js headers vs middleware — decide based on routing/nonce needs)
- Claude's Discretion: `unsafe-inline` for style-src — assess risk/reward, decide whether to keep permanently or plan elimination
- Claude's Discretion: `unsafe-eval` for script-src — audit what actually needs it, avoid if possible
- Claude's Discretion: Report-Only vs enforcing transition — pick safest rollout approach
- Claude should audit codebase for all external domains (beyond the known: Stripe, Google Maps, Supabase, Sentry, Google Fonts, Vercel Analytics)
- Claude should audit for iframe usage (Stripe Elements confirmed, check for others)
- Claude should check deployment setup (believed to be Vercel-only, no WAF/CDN)
- Claude's Discretion: Additional security headers (X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy, Permissions-Policy) — include what the success criteria require
- No specific compliance driver — best-practice security hardening; PCI-DSS awareness for Stripe is prudent

### Violation Handling

- Sentry is on **free tier** — must be mindful of report volume
- Claude's Discretion: Filtering strategy for browser extension false positives
- Violations stay invisible to users (no user-facing indicators)
- Claude's Discretion: Sentry alert rules for violation spikes
- If CSP breaks critical functionality: **fix and redeploy** — no feature flags
- Claude's Discretion: Full details in reports vs redacting paths
- Claude's Discretion: Service Worker CSP handling based on existing SW setup
- Claude's Discretion: Sample rate for CSP reports (consider free tier limits)
- Claude's Discretion: Trend tracking vs react-to-individual violations
- Claude's Discretion: Direct Sentry endpoint vs lightweight /api/csp-report route for deduplication (consider free tier quota)
- Claude's Discretion: Environment tagging (production/preview/dev) for reports

### cssText Replacement

- **Performance-critical animations** — FlyToCart and CustomMarkers are 60fps; replacement must not add layout thrashing
- Claude's Discretion: DOM property assignments vs CSS classes (but must preserve animation performance)
- Claude should audit ALL cssText usages in codebase — fix all, not just FlyToCart and CustomMarkers
- Claude should check CustomMarkers implementation (OverlayView DOM manipulation vs React component)
- Claude should audit GSAP's dynamic inline style injection behavior
- Claude should audit all third-party libraries for dynamic style/script injection
- Claude's Discretion: innerHTML/document.write audit based on CSP success criteria scope
- Claude's Discretion: Helper function vs inline assignments (based on number of call sites)
- Claude's Discretion: ESLint rule to prevent future cssText usage (based on regression risk)
- Testing: **manual verification** for cssText replacements (no visual regression tests)

### Dead Code & Placeholder Cleanup

- Audit ALL barrel files for unnecessary re-exports (not just the specific dead one)
- Remove zero-consumer exports AND flag single-consumer exports for potential inlining
- Include unused npm dependency removal from package.json
- **No exceptions** — remove all unused code; git history is the backup
- Verification: **build + tests must pass** after cleanup
- Social links: Facebook + Instagram URLs to be provided by user before execution (currently placeholder)
- Footer "Find Us Online" section structure stays — only URLs get replaced
- Claude's Discretion: Commit strategy (logical chunks vs single commit)
- Claude's Discretion: TODO/FIXME cleanup based on CLN requirements scope
- Claude should discover which barrel file is dead during research
- Claude's Discretion: Unused type export cleanup based on consumer analysis

</decisions>

<specifics>
## Specific Ideas

- Business has Facebook and Instagram pages — real URLs to be provided before phase execution
- Footer already has "Find Us Online" section with social link structure — just needs real URLs replacing placeholders
- Free Sentry tier constrains CSP report volume strategy
- GSAP has no nonce support, 700+ inline styles → `unsafe-inline` for style-src is a known constraint

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 67-csp-security-headers_
_Context gathered: 2026-02-16_
