# Next.js CSP Patterns

## Nonce-Based CSP Fails in Pages Router on Vercel

**Context:** Phase 13 security hardening implemented nonce-based CSP via middleware → x-nonce header → _document.tsx getInitialProps. Worked locally but failed in Vercel production.

**Learning:** Next.js Pages Router on Vercel runs middleware at the Edge and _document in Node.js. Custom request headers set by middleware (`x-nonce`) are NOT reliably forwarded to `_document.tsx`'s `getInitialProps` across this Edge→Node.js boundary. The nonce never reaches the script tags, so the browser blocks all inline scripts.

**Fix:** Use SHA-256 hash-based CSP instead of nonces for static inline scripts. The browser's CSP violation error message includes the correct hash to use. This works because:
1. The theme script content is hardcoded and deterministic
2. Hash doesn't require per-request coordination between middleware and document
3. Simpler code — function component instead of class component with getInitialProps

**Code pattern:**
```typescript
// middleware.ts
const THEME_SCRIPT_HASH = "'sha256-NKQrmMd/...'";
const scriptSrc = `'self' ${THEME_SCRIPT_HASH}`;
// No nonce generation needed

// _document.tsx — stays as simple function component
<script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
// Comment: update hash in middleware.ts if script content changes
```

**Dev mode:** Add `'unsafe-eval' 'unsafe-inline'` to script-src for webpack HMR + source maps. Also add `ws://localhost:3000` to connect-src for HMR WebSocket.

**Apply when:** Adding CSP to any Next.js Pages Router app deployed on Vercel with inline scripts.

---

## CSP Origin Allowlisting Checklist

**Context:** CSP deployment required 5 iterative fixes as each blocked resource surfaced one at a time.

**Learning:** When adding CSP to a production app, audit ALL third-party integrations upfront. Common origins to allowlist:

| Service | Directives needed |
|---------|------------------|
| Google Maps JS API | script-src (`https://*.googleapis.com https://*.gstatic.com https://*.google.com blob:`), connect-src (`https://*.googleapis.com https://*.google.com https://*.gstatic.com data: blob:`), worker-src (`blob:`), frame-src (`https://*.google.com`), img-src (`https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.googleusercontent.com`) |
| Google Sign-In | script-src, style-src, connect-src, frame-src |
| Supabase | connect-src (`https://*.supabase.co wss://*.supabase.co`) |
| Sentry (with tunnel) | connect-src for report-uri only (`https://*.ingest.us.sentry.io`); SDK errors go through tunnel ('self') |
| Sentry Replay | worker-src (`blob:`) |
| Google Fonts | style-src (`fonts.googleapis.com`), font-src (`fonts.gstatic.com`) |
| PWA Service Worker | worker-src (`'self' blob:`) |
| Audio (blob URLs) | media-src (`'self' blob:`) — **easy to miss**: `media-src` falls back to `default-src` silently |
| Vercel Analytics | Proxied via `/_vercel/` on Vercel ('self'); fallback: connect-src (`https://va.vercel-scripts.com`) |
| Vercel Speed Insights | Proxied via `/_vercel/` on Vercel ('self'); fallback: connect-src (`https://vitals.vercel-insights.com`) |

**Apply when:** Adding Content-Security-Policy to any web app — check the full third-party list before deploying, not after.

---

## Google Maps CSP Is Much Broader Than Expected

**Context:** CSP initially whitelisted only `maps.googleapis.com` for Google Maps. Production showed violations for script-src, worker-src, and connect-src.

**Learning:** Google Maps JS API dynamically loads from multiple domains beyond `maps.googleapis.com`:
- Scripts from `*.gstatic.com` (map renderer), `*.google.com` (tiles)
- Creates `blob:` workers for WebGL rendering
- Fetches tile data via `data:` and `blob:` in connect-src
- Renders map content in iframes requiring `frame-src`

Targeting only `maps.googleapis.com` blocks map tiles, workers, and rendering. The [official Google Maps CSP guide](https://developers.google.com/maps/documentation/javascript/content-security-policy) documents the full allowlist.

**Also:** `frame-src` and `frame-ancestors` are opposites — `frame-ancestors` controls who embeds you, `frame-src` controls what you can embed. Missing `frame-src` defaults to `default-src 'self'` which blocks Google Maps iframes.

**Apply when:** Any project using Google Maps JavaScript API with CSP headers.
