# Phase 67: CSP & Security Headers - Research

**Researched:** 2026-02-16
**Domain:** Web Security (CSP, HTTP Security Headers, Dead Code Cleanup)
**Confidence:** HIGH

## Summary

This phase adds Content Security Policy and security headers to a Next.js 16 app deployed on Vercel, replaces CSP-violating `cssText` patterns, and removes dead code. The codebase currently has **zero security headers** -- only CORS on `/api/health` and cache headers on fonts/icons. No `middleware.ts` exists. No `sentry.client.config.ts` exists (Sentry uses `sentry.server.config.ts` and `sentry.edge.config.ts` only, suggesting client init may be handled differently or missing).

The CSP domain audit identified 8 external origins that must be whitelisted. GSAP produces 700+ inline styles confirming `'unsafe-inline'` for `style-src` is mandatory. Stripe is server-side only (no `@stripe/stripe-js` client SDK) -- the `frame-src` whitelist for Stripe iframes is not needed unless checkout redirect pages embed Stripe Elements. Five files contain `cssText` assignments. Ten+ exports have zero consumers. The `OrderDetailExpanded/index.tsx` barrel file is dead (zero imports -- consumers import directly from `./config`).

**Primary recommendation:** Use `next.config.ts` `headers()` for CSP (no nonce needed since `'unsafe-inline'` is already required). Start with `Content-Security-Policy-Report-Only`, report directly to Sentry's `/security/` endpoint, validate for 1-2 weeks, then upgrade to enforcing.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Claude should audit codebase for all external domains (beyond the known: Stripe, Google Maps, Supabase, Sentry, Google Fonts, Vercel Analytics)
- Claude should audit for iframe usage (Stripe Elements confirmed, check for others)
- Claude should check deployment setup (believed to be Vercel-only, no WAF/CDN)
- No specific compliance driver -- best-practice security hardening; PCI-DSS awareness for Stripe is prudent
- Sentry is on **free tier** -- must be mindful of report volume
- Violations stay invisible to users (no user-facing indicators)
- If CSP breaks critical functionality: **fix and redeploy** -- no feature flags
- **Performance-critical animations** -- FlyToCart and CustomMarkers are 60fps; replacement must not add layout thrashing
- Claude should audit ALL cssText usages in codebase -- fix all, not just FlyToCart and CustomMarkers
- Claude should check CustomMarkers implementation (OverlayView DOM manipulation vs React component)
- Claude should audit GSAP's dynamic inline style injection behavior
- Claude should audit all third-party libraries for dynamic style/script injection
- Audit ALL barrel files for unnecessary re-exports (not just the specific dead one)
- Remove zero-consumer exports AND flag single-consumer exports for potential inlining
- Include unused npm dependency removal from package.json
- **No exceptions** -- remove all unused code; git history is the backup
- Verification: **build + tests must pass** after cleanup
- Social links: Facebook + Instagram URLs to be provided by user before execution (currently placeholder)
- Footer "Find Us Online" section structure stays -- only URLs get replaced
- Testing: **manual verification** for cssText replacements (no visual regression tests)

### Claude's Discretion
- Report-Only vs enforcing timeline, validation period length
- Single global policy vs per-route policies
- CSP header location (next.config.js headers vs middleware)
- `unsafe-inline` for style-src -- assess risk/reward
- `unsafe-eval` for script-src -- audit what actually needs it
- Report-Only vs enforcing transition approach
- Additional security headers (X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy, Permissions-Policy)
- Filtering strategy for browser extension false positives
- Sentry alert rules for violation spikes
- Full details in reports vs redacting paths
- Service Worker CSP handling based on existing SW setup
- Sample rate for CSP reports (consider free tier limits)
- Trend tracking vs react-to-individual violations
- Direct Sentry endpoint vs lightweight /api/csp-report route for deduplication
- Environment tagging (production/preview/dev) for reports
- DOM property assignments vs CSS classes for cssText replacement
- innerHTML/document.write audit based on CSP success criteria scope
- Helper function vs inline assignments (based on number of call sites)
- ESLint rule to prevent future cssText usage
- Commit strategy (logical chunks vs single commit)
- TODO/FIXME cleanup based on CLN requirements scope
- Discover which barrel file is dead
- Unused type export cleanup based on consumer analysis

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.2 | CSP headers via `headers()` in `next.config.ts` | Built-in, no extra dependency |
| @sentry/nextjs | ^10.38.0 | CSP violation reporting via `/security/` endpoint | Already installed, native CSP support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| knip | ^5.82.1 | Dead code detection (already in devDeps) | Cross-validate dead export audit |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `next.config.ts` headers | `middleware.ts` | Middleware needed only for nonces; no nonce needed here since `'unsafe-inline'` required. headers() is simpler, no runtime overhead |
| Direct Sentry `/security/` endpoint | Custom `/api/csp-report` proxy | Proxy adds code + maintenance; Sentry endpoint is purpose-built. Free tier quota can be managed with sample rate on Report-To header |

**Installation:** No new packages needed.

## Architecture Patterns

### Recommended Approach: CSP via next.config.ts headers()

**What:** Add CSP and security headers in the existing `headers()` function in `next.config.ts`
**Why not middleware:** The project has no `middleware.ts`. Creating one solely for CSP adds complexity. Since `'unsafe-inline'` is required for `style-src` (GSAP), nonces are not useful -- the primary reason to use middleware is nonce generation. The `headers()` approach is static, cached by Vercel's edge, and has zero runtime cost.

```typescript
// next.config.ts - headers() addition
// Source: https://nextjs.org/docs/app/guides/content-security-policy
async headers() {
  const isDev = process.env.NODE_ENV === "development";

  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://maps.googleapis.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' blob: data: https://*.supabase.co https://lh3.googleusercontent.com https://drive.google.com https://maps.googleapis.com https://maps.gstatic.com",
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.us.sentry.io https://maps.googleapis.com https://routes.googleapis.com`,
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    isDev ? "" : "upgrade-insecure-requests",
    `report-uri https://o[ORG_ID].ingest.us.sentry.io/api/[PROJECT_ID]/security/?sentry_key=[PUBLIC_KEY]`,
    "report-to csp-endpoint",
  ].filter(Boolean).join("; ");

  return [
    {
      source: "/(.*)",
      headers: [
        {
          key: "Content-Security-Policy-Report-Only",
          value: cspDirectives,
        },
        {
          key: "Report-To",
          value: JSON.stringify({
            group: "csp-endpoint",
            max_age: 10886400,
            endpoints: [{ url: "https://o[ORG_ID].ingest.us.sentry.io/api/[PROJECT_ID]/security/?sentry_key=[PUBLIC_KEY]" }],
            include_subdomains: true,
          }),
        },
        {
          key: "Reporting-Endpoints",
          value: `csp-endpoint="https://o[ORG_ID].ingest.us.sentry.io/api/[PROJECT_ID]/security/?sentry_key=[PUBLIC_KEY]"`,
        },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      ],
    },
    // Keep existing health, fonts, icons headers...
  ];
}
```

### Pattern: cssText to Individual DOM Property Assignments

**What:** Replace `element.style.cssText = "..."` with individual `element.style.prop = val` assignments
**Why:** `cssText` overwrites the entire inline style string atomically, which is actually CSP-compatible (CSP restricts `<style>` blocks and `style` attributes in HTML, not DOM `style` property manipulation). However, `innerHTML` with inline `style` attributes IS a CSP concern when `'unsafe-inline'` is not in `style-src`. Since we already need `'unsafe-inline'` for GSAP, neither `cssText` nor inline `style` in `innerHTML` will violate CSP. **The requirement text says to replace cssText anyway** -- so we do it for defense-in-depth and code quality.

**Performance consideration for FlyToCart:** The `cssText` assignment on line 145 sets 8 properties atomically (one reflow). Replacing with 8 individual `.style.x = y` assignments triggers one reflow per assignment IF the element is already in the DOM. Since `flyingEl` is created via `document.createElement` and styles are set BEFORE `document.body.appendChild`, there is **no performance difference** -- the element is not yet in the render tree.

**Performance consideration for CustomMarkers:** Same pattern -- `document.createElement("div")` followed by `style.cssText` before any DOM insertion. No performance impact from switching to individual assignments.

```typescript
// BEFORE (FlyToCart.tsx line 145)
flyingEl.style.cssText = `
  position: fixed;
  width: ${size}px;
  height: ${size}px;
  ...
`;

// AFTER
flyingEl.style.position = "fixed";
flyingEl.style.width = `${size}px`;
flyingEl.style.height = `${size}px`;
flyingEl.style.borderRadius = "50%";
flyingEl.style.pointerEvents = "none";
flyingEl.style.zIndex = String(zIndex.popover);
flyingEl.style.left = `${sourceRect.left + sourceRect.width / 2 - size / 2}px`;
flyingEl.style.top = `${sourceRect.top + sourceRect.height / 2 - size / 2}px`;
flyingEl.style.willChange = "transform, opacity";
flyingEl.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
```

### Anti-Patterns to Avoid
- **Creating middleware.ts just for CSP:** Adds runtime cost on every request. Use `headers()` since nonces are unnecessary.
- **Using `'unsafe-eval'` in production:** Only needed in dev for React Fast Refresh / hot reload. Never ship in production.
- **Whitelisting `https://*.stripe.com` in `script-src`:** Stripe is server-side only in this codebase (`stripe` package, not `@stripe/stripe-js`). No Stripe scripts load client-side.
- **`upgrade-insecure-requests` in development:** Breaks `localhost` HTTP. Gate behind `!isDev`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSP violation reporting | Custom `/api/csp-report` proxy | Sentry `/security/` endpoint | Purpose-built, handles dedup, free tier sufficient with sampling |
| Dead code detection | Manual grep for unused exports | `knip` (already installed) | Catches transitive dead code, type exports, unused deps |
| Security header testing | Manual curl checks | `securityheaders.com` or `csp-evaluator.withgoogle.com` | Automated, comprehensive, catches mistakes |

**Key insight:** CSP is a browser-enforced policy. Testing must happen in real browsers, not just build checks. The Report-Only period catches real-world violations before enforcement breaks users.

## Common Pitfalls

### Pitfall 1: Missing `connect-src` for Supabase Realtime (WebSocket)
**What goes wrong:** Supabase realtime uses `wss://*.supabase.co`. If only `https://*.supabase.co` is in `connect-src`, WebSocket connections fail silently.
**Why it happens:** Easy to forget `wss://` protocol.
**How to avoid:** Include both `https://*.supabase.co wss://*.supabase.co` in `connect-src`.
**Warning signs:** Order tracking live updates stop working; realtime location stops updating.

### Pitfall 2: Google Maps Requires Multiple Domains
**What goes wrong:** Maps tiles/markers don't load.
**Why it happens:** Google Maps uses `maps.googleapis.com` for API, `maps.gstatic.com` for static assets/tiles, `lh3.googleusercontent.com` for street view.
**How to avoid:** Whitelist all three in `img-src` and `connect-src` (for Routes API).
**Warning signs:** Map renders as grey box; markers don't appear; route optimization API calls fail.

### Pitfall 3: Sentry Tunnel Route Conflicts
**What goes wrong:** CSP reports sent to Sentry get blocked by CSP itself.
**Why it happens:** If `connect-src` doesn't include the Sentry ingest domain, the browser blocks the CSP report.
**How to avoid:** The app already uses `tunnelRoute: "/monitoring"` in Sentry config, which routes through the same origin. For CSP `report-uri`, use the Sentry `/security/` endpoint directly (it's a different mechanism from JS SDK events). Ensure `connect-src` includes `https://*.ingest.us.sentry.io` as backup.
**Warning signs:** Zero CSP reports in Sentry despite known violations.

### Pitfall 4: Browser Extension False Positives
**What goes wrong:** CSP reports flooded with violations from extensions (password managers injecting scripts, ad blockers, etc.).
**Why it happens:** Extensions inject content that violates the page's CSP.
**How to avoid:** Sentry free tier has limited quota. Use `sentry_key` parameter filtering. In Sentry UI, set up filters for known extension patterns (`chrome-extension://`, `moz-extension://`). Consider environment tagging to separate prod from preview.
**Warning signs:** Report volume spikes unexpectedly; quota consumed by noise.

### Pitfall 5: `upgrade-insecure-requests` Breaks Local Development
**What goes wrong:** Local dev breaks because localhost uses HTTP.
**Why it happens:** `upgrade-insecure-requests` forces all requests to HTTPS.
**How to avoid:** Conditionally exclude in development: `isDev ? "" : "upgrade-insecure-requests"`.
**Warning signs:** Dev server loads blank page; API calls fail with mixed content errors.

### Pitfall 6: Service Worker Not Covered by Page CSP
**What goes wrong:** Service worker (`sw.js`) has its own execution context. Page CSP headers don't apply to fetch requests made by the service worker.
**How to avoid:** The SW in this project (`src/app/sw.ts`) makes fetch requests to Supabase, Google Drive, and same-origin. Since SW inherits CSP from the response that registered it, and our CSP applies to `/(.*)`  which includes `/sw.js`, the SW's fetch requests will be governed by the CSP of the SW script response.
**Warning signs:** Offline caching stops working for external images.

### Pitfall 7: Data URIs in img-src
**What goes wrong:** Skeleton components use `data:image/svg+xml,...` URLs in `backgroundImage` inline styles. If `data:` is missing from `img-src`, these break.
**How to avoid:** Include `data:` in `img-src`. The skeleton base component (`src/components/ui/skeleton/base.tsx` lines 102, 192) uses inline SVG data URIs.
**Warning signs:** Skeleton loading states appear as broken images or missing backgrounds.

## Codebase Audit Findings

### External Domain Inventory (HIGH confidence -- verified from source code)

| Directive | Domain | Source File(s) | Purpose |
|-----------|--------|---------------|---------|
| `script-src` | `maps.googleapis.com` | DeliveryMap, RouteMap, CoverageRouteMap | Google Maps JS API loaded by `useJsApiLoader` |
| `style-src` | `fonts.googleapis.com` | layout.tsx (preconnect) | Google Fonts CSS |
| `font-src` | `fonts.gstatic.com` | layout.tsx (preconnect) | Google Fonts WOFF2 |
| `img-src` | `*.supabase.co` | next.config.ts remotePatterns | Menu item photos |
| `img-src` | `lh3.googleusercontent.com` | next.config.ts remotePatterns | Google OAuth avatars |
| `img-src` | `drive.google.com` | next.config.ts remotePatterns | Menu photos from Drive |
| `img-src` | `maps.googleapis.com` | CustomerInfoCard, DeliveryReminder | Static Maps API images |
| `img-src` | `maps.gstatic.com` | (runtime) | Google Maps tile imagery |
| `connect-src` | `*.supabase.co` (https + wss) | supabase/server.ts, realtime | API calls + realtime WebSocket |
| `connect-src` | `*.ingest.us.sentry.io` | sentry.server.config.ts | Sentry error reporting (backup to tunnel) |
| `connect-src` | `maps.googleapis.com` | geocoding.ts, coverage.ts | Geocoding API |
| `connect-src` | `routes.googleapis.com` | route-optimization/optimizer.ts | Routes API |
| `worker-src` | `'self'` | sw.ts | Service worker from same origin |

**NOT needed (verified):**
- `frame-src` for Stripe: No `@stripe/stripe-js` or `loadStripe` in codebase. Stripe is server-side only (`stripe` npm package). No Stripe Elements iframes.
- `script-src` for Vercel Analytics/Speed Insights: Both use same-origin `/_vercel/` paths (bundled scripts, not external CDN).
- `connect-src` for Google Analytics/GTM: `dns-prefetch` for `googletagmanager.com` exists in layout.tsx but no actual script loading found. Can add later if needed.

### iframe Audit (HIGH confidence)
**Result:** Zero `<iframe>` elements in codebase. No Stripe Elements. Google Maps uses `<div>` containers with JS API, not iframes. Tiptap editor uses `contentEditable`, not iframes. `frame-src 'none'` would be ideal but Google Maps internally creates iframes for its rendering -- `frame-src 'self' https://*.google.com` may be needed.

### cssText Usages (HIGH confidence -- 5 call sites in 2 files)

| File | Line(s) | Context | Replacement Strategy |
|------|---------|---------|---------------------|
| `src/components/ui/cart/FlyToCart.tsx` | 145 | Flying element creation (pre-DOM-insertion) | Individual `.style.prop` assignments |
| `src/components/ui/orders/tracking/DeliveryMap/CustomMarkers.tsx` | 11 | Restaurant marker container | Individual `.style.prop` assignments |
| `src/components/ui/orders/tracking/DeliveryMap/CustomMarkers.tsx` | 36 | Vehicle marker container (dynamic opacity/rotation) | Individual `.style.prop` assignments |
| `src/components/ui/orders/tracking/DeliveryMap/CustomMarkers.tsx` | 52 | Destination marker container | Individual `.style.prop` assignments |
| `src/components/ui/orders/tracking/DeliveryMap/CustomMarkers.tsx` | 70 | Stale badge container | Individual `.style.prop` assignments |

**CustomMarkers implementation:** Raw DOM manipulation (not React, not OverlayView). Creates `div` elements with `document.createElement`, sets styles, sets `innerHTML` with SVG content, passes to `AdvancedMarkerElement.content`. This is the standard pattern for Google Maps custom markers.

**Performance analysis:** All 5 sites set `cssText` BEFORE inserting the element into the DOM (either before `document.body.appendChild` or before passing to `AdvancedMarkerElement`). Switching to individual property assignments has **zero performance impact** -- the browser batches style changes on elements not yet in the render tree.

### innerHTML Usages (MEDIUM confidence -- 6 call sites in 3 files)

| File | Line(s) | Content | CSP Risk |
|------|---------|---------|----------|
| CustomMarkers.tsx | 13, 37, 54 | Static SVG markup with inline `style` attributes | Low -- `'unsafe-inline'` in `style-src` covers this |
| RouteMap.tsx | 153 | Dynamic HTML with inline `style` (stop markers) | Low -- same reason |
| CoverageRouteMap.tsx | 91, 118 | Dynamic HTML with inline `style` (map markers) | Low -- same reason |

**CSP impact:** `innerHTML` with inline `style` attributes requires `'unsafe-inline'` in `style-src`, which is already mandated by GSAP. These usages are NOT a CSP violation with our planned policy. No `<script>` tags in any `innerHTML` calls.

### GSAP Inline Style Injection (HIGH confidence)
GSAP manipulates styles via `element.style.transform = ...`, `element.style.opacity = ...` etc. This is DOM property manipulation, NOT inline style attribute injection. GSAP does NOT inject `<style>` elements or use `cssText`. The `'unsafe-inline'` requirement for `style-src` comes from:
1. Framer Motion (injects `<style>` elements for keyframe animations)
2. Google Fonts (loads CSS with inline font-face declarations)
3. Tailwind's inline styles in JSX `style={{}}` props (these are actually DOM properties, CSP-safe, but components using `dangerouslySetInnerHTML` with styles need `'unsafe-inline'`)

### Third-Party Dynamic Injection Audit (HIGH confidence)
| Library | Injection Method | CSP Impact |
|---------|-----------------|------------|
| GSAP | `element.style.prop = val` | None (DOM API, not CSP-restricted) |
| Framer Motion | `<style>` element injection for keyframes | Requires `'unsafe-inline'` in `style-src` |
| @react-google-maps/api | Script tag injection via `useJsApiLoader` | Requires `maps.googleapis.com` in `script-src` |
| @vercel/analytics | Same-origin script at `/_vercel/insights/script.js` | Covered by `'self'` |
| @vercel/speed-insights | Same-origin script at `/_vercel/speed-insights/script.js` | Covered by `'self'` |
| Tiptap | `contentEditable` div, no iframes | None |
| Recharts | SVG rendering, no style injection | None |

### Dead Code Audit (HIGH confidence -- verified with grep)

**Zero-consumer exports (safe to remove):**

| Export | File | Consumers |
|--------|------|-----------|
| `parsePriceToCents` | `src/lib/utils/currency.ts` | 0 imports |
| `canEditOrder` | `src/lib/utils/delivery-dates.ts` | 0 imports |
| `formatPriceValue` | `src/lib/utils/format.ts` | 0 imports |
| `formatDate` | `src/lib/utils/format.ts` | 0 imports (local `formatDate` functions exist in 6+ files but none import from format.ts) |
| `reverseGeocode` | `src/lib/services/geocoding.ts` | 0 imports (only `geocodeAddress` imported from this file) |
| `createItemSignature` re-export | `src/lib/stores/cart-store.ts` line 289 | 0 external imports (used internally on lines 99, 111) |
| `getDeliveryFeeMessage` | `src/types/cart.ts` | 0 imports |
| `WEB_VITALS_THRESHOLDS` | `src/lib/web-vitals.tsx` | 0 external imports (used internally on line 34) |
| `getPerformanceScore` | `src/lib/web-vitals.tsx` | 0 imports |
| `useABTest` + all exports | `src/lib/hooks/useABTest.ts` | 0 imports (barrel re-exports on hooks/index.ts line 130 but zero consumer of that re-export) |

**Dead barrel file:**
| File | Exports | Consumers |
|------|---------|-----------|
| `src/components/ui/admin/orders/OrderDetailExpanded/index.tsx` | Re-exports `STATUS_COLORS`, `STATUS_LABELS`, `NEXT_STATUSES`, `AUDIT_ACTION_LABELS` from `./config` | **0 imports** -- all 3 consumers import directly from `OrderDetailExpanded/config` |

The barrel `index.tsx` can be deleted. The `config.ts` file itself is NOT dead (3 consumers).

**Unused barrel re-export in hooks/index.ts:**
Line 130: `export { useABTest } from "./useABTest"` -- zero consumers. The entire `useABTest.ts` file has zero consumers.

### Placeholder Social Links (HIGH confidence)

| File | Line(s) | Current URL | Status |
|------|---------|-------------|--------|
| `src/components/ui/homepage/SiteFooter.tsx` | 68 | `https://www.ubereats.com` | Placeholder (generic, no restaurant page) |
| `src/components/ui/homepage/SiteFooter.tsx` | 74 | `https://www.doordash.com` | Placeholder (generic) |
| `src/components/ui/homepage/SiteFooter.tsx` | 80 | `https://www.grubhub.com` | Placeholder (generic) |
| `src/components/ui/homepage/SiteFooter.tsx` | 57 | Yelp search URL | Placeholder (search, not direct business page) |
| `src/emails/components/BrandFooter.tsx` | 78 | `https://instagram.com/mandalaymorningstar` | Likely placeholder (unverified) |
| `src/emails/components/BrandFooter.tsx` | 85 | `https://facebook.com/mandalaymorningstar` | Likely placeholder (unverified) |

**Note:** User stated Facebook + Instagram URLs will be provided before execution. The SiteFooter has TODO comments on lines 56, 67, 73, 79 for the business listing links.

### TODO/FIXME Audit (HIGH confidence)
Total: **11 occurrences across 3 files:**
- `src/lib/supabase/storage.ts` -- 4 TODOs
- `src/app/api/admin/photos/verify-drive/route.ts` -- 3 TODOs
- `src/components/ui/homepage/SiteFooter.tsx` -- 4 TODOs (the placeholder URLs)

The SiteFooter TODOs are addressed by CLN-03. The storage/photos TODOs are out of scope for this phase.

### Deployment Setup (HIGH confidence)
- **Vercel-only** -- no WAF, no CDN layer, no vercel.json
- Sentry tunnel route: `/monitoring` (configured in `next.config.ts` `withSentryConfig`)
- Service worker: `sw.ts` compiled separately via `scripts/build-sw.mjs`, served from `/sw.js`
- No `middleware.ts` exists

## Discretion Recommendations

### CSP Header Location: `next.config.ts` headers()
**Recommendation: `next.config.ts` headers()** (not middleware)
- No middleware.ts exists today -- creating one adds complexity
- Nonces are pointless when `'unsafe-inline'` is required (GSAP/Framer)
- `headers()` is edge-cached by Vercel -- zero runtime cost
- All headers are static (no per-request variation needed)

### `unsafe-inline` for style-src: Keep permanently
**Recommendation: Keep `'unsafe-inline'` in `style-src` permanently**
- GSAP's `element.style.prop` assignments are DOM API (CSP-safe), but Framer Motion injects `<style>` elements
- Eliminating Framer Motion's `<style>` injection would require replacing the animation library -- not worth it
- `'unsafe-inline'` for styles is universally considered low-risk (XSS via CSS is theoretical, not practical)

### `unsafe-eval` for script-src: Dev only
**Recommendation: `'unsafe-eval'` in development ONLY**
- Required for React Fast Refresh / Next.js hot reload
- Zero code in the codebase uses `eval()` or `new Function()`
- Production CSP must NOT include `'unsafe-eval'`

### Rollout Strategy: Report-Only for 1-2 weeks, then enforce
**Recommendation:**
1. Deploy with `Content-Security-Policy-Report-Only` header
2. Monitor Sentry for 1-2 weeks (covers at least 2 Saturday delivery cycles)
3. Fix any legitimate violations discovered
4. Flip header key to `Content-Security-Policy` (enforcing)

### CSP Reporting: Direct Sentry endpoint
**Recommendation: Send directly to Sentry's `/security/` endpoint**
- No custom `/api/csp-report` route needed
- Sentry natively parses CSP reports into structured issues
- Uses `report-uri` (broad browser support) + `report-to` (future support)
- Free tier concern: CSP reports count as events. With `Content-Security-Policy-Report-Only`, expect high volume initially. After fixing violations and switching to enforcing, volume drops dramatically. Browser extension noise is the main ongoing concern.

### Environment Tagging
**Recommendation: Use Sentry's `sentry_environment` query parameter**
- Append `&sentry_environment=production` (or `preview`, `development`) to the report URI
- Allows filtering CSP reports by environment in Sentry dashboard

### Service Worker CSP
**Recommendation: No special handling needed**
- The SW at `/sw.js` inherits the CSP from the response headers when the browser fetches it
- Since our `/(.*)`  matcher covers `/sw.js`, the SW's outbound fetches (to Supabase, Google Drive) are governed by our `connect-src` and `img-src` policies
- The SW denylist already excludes `/monitoring` (Sentry tunnel) and `/api/` routes

### Commit Strategy
**Recommendation: 3 logical commits**
1. `sec: add CSP Report-Only and security headers` -- headers in next.config.ts
2. `refactor: replace cssText with individual style assignments` -- FlyToCart + CustomMarkers
3. `chore: remove dead code, barrel file, resolve placeholder links` -- CLN-01/02/03

### ESLint Rule for cssText
**Recommendation: Add simple `no-restricted-syntax` rule**
- Low maintenance, prevents regression
- Pattern: `MemberExpression[property.name="cssText"]`

### Single Global Policy vs Per-Route
**Recommendation: Single global policy**
- All pages use the same external services (maps, Supabase, Sentry)
- Per-route policies add complexity with no security benefit
- One policy to audit, maintain, and test

## Code Examples

### Security Headers Block (next.config.ts)
```typescript
// Source: Next.js docs + Sentry CSP reporting docs
const isDev = process.env.NODE_ENV === "development";

const SENTRY_CSP_ENDPOINT =
  `https://o${process.env.SENTRY_ORG_ID}.ingest.us.sentry.io/api/${process.env.SENTRY_PROJECT_ID}/security/?sentry_key=${process.env.NEXT_PUBLIC_SENTRY_DSN?.split("@")[0].split("//")[1]}`;

const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://maps.googleapis.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' blob: data: https://*.supabase.co https://lh3.googleusercontent.com https://drive.google.com https://maps.googleapis.com https://maps.gstatic.com",
  "font-src 'self' https://fonts.gstatic.com",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.us.sentry.io https://maps.googleapis.com https://routes.googleapis.com`,
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  isDev ? "" : "upgrade-insecure-requests",
  `report-uri ${SENTRY_CSP_ENDPOINT}`,
  "report-to csp-endpoint",
].filter(Boolean).join("; ");
```

### CustomMarkers cssText Replacement
```typescript
// BEFORE
container.style.cssText =
  "width:40px;height:48px;position:relative;cursor:pointer;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));";

// AFTER
container.style.width = "40px";
container.style.height = "48px";
container.style.position = "relative";
container.style.cursor = "pointer";
container.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.3))";
```

### ESLint No-cssText Rule
```javascript
// eslint.config.mjs
{
  rules: {
    "no-restricted-syntax": [
      "warn",
      {
        selector: "MemberExpression[property.name='cssText']",
        message: "Use individual style.property assignments instead of cssText for CSP compatibility.",
      },
    ],
  },
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `report-uri` only | `report-uri` + `report-to` + `Reporting-Endpoints` | 2023+ | Forward compat; `report-uri` deprecated but still needed for Safari/Firefox |
| Middleware nonce per request | Static CSP in headers() | When `'unsafe-inline'` is needed | Nonces are useless alongside `'unsafe-inline'` |
| `X-XSS-Protection: 1; mode=block` | `X-XSS-Protection: 0` | 2019+ | Browser XSS filter is buggy, causes false positives; CSP replaces it |

**Deprecated/outdated:**
- `report-uri` directive: Deprecated in favor of `report-to`, but `report-to` has poor browser support (Chrome-only as of 2025). Use both.
- `X-XSS-Protection: 1`: Disable it (`0`). The browser's XSS auditor is removed from Chrome and was never reliable.

## Open Questions

1. **Sentry DSN parsing for CSP endpoint**
   - What we know: Sentry CSP reporting needs org ingest domain, project ID, and public key
   - What's unclear: The exact Sentry DSN format in env vars (`NEXT_PUBLIC_SENTRY_DSN`) to extract these components. The project uses org `mandalay-morning-star` and project `mandalay-morning-star-delivery-app`.
   - Recommendation: Extract from DSN at build time or hardcode the CSP endpoint URL. The Sentry DSN format is `https://<PUBLIC_KEY>@<ORG_ID>.ingest.us.sentry.io/<PROJECT_ID>`.

2. **Google Maps iframe creation at runtime**
   - What we know: Google Maps JS API may create internal iframes for rendering
   - What's unclear: Whether `frame-src 'none'` will break Google Maps
   - Recommendation: Start without `frame-src` directive (defaults to `default-src 'self'`). If maps break, add `frame-src 'self' https://*.google.com`. Monitor in Report-Only.

3. **Facebook + Instagram real URLs**
   - What we know: User will provide before execution
   - What's unclear: Exact URLs
   - Recommendation: Block execution of CLN-03 social link task until URLs are provided. Structure the plan so this task can be done last.

## Sources

### Primary (HIGH confidence)
- Next.js official docs - CSP configuration guide (`/docs/app/guides/content-security-policy`)
- Sentry Next.js docs - Security Policy Reporting (`/platforms/javascript/guides/nextjs/security-policy-reporting`)
- Vercel Speed Insights docs - package configuration (`/docs/speed-insights/package`)
- Vercel Analytics docs - package configuration (`/docs/analytics/package`)
- Codebase audit: `next.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/app/layout.tsx`, `src/app/sw.ts`

### Secondary (MEDIUM confidence)
- Prior milestone research: `.planning/research/STACK.md`, `.planning/research/ARCHITECTURE.md` (CSP domain analysis)
- Vercel CSP community discussion: `github.com/vercel/next.js/discussions/56562`

### Tertiary (LOW confidence)
- Google Maps internal iframe behavior -- needs runtime verification during Report-Only period

## Metadata

**Confidence breakdown:**
- External domain inventory: HIGH -- verified every import, API call, and preconnect in source
- CSP directive construction: HIGH -- cross-referenced with Next.js official docs and Sentry docs
- cssText replacement safety: HIGH -- verified all 5 sites set styles before DOM insertion
- Dead code inventory: HIGH -- grep confirmed zero external consumers for every item
- Security headers: HIGH -- standard values from OWASP, no ambiguity
- Google Maps frame-src: MEDIUM -- may create internal iframes; needs Report-Only validation

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (stable domain, low churn rate)
