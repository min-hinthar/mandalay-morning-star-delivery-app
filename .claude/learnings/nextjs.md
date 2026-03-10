# Next.js Learnings

## Route Groups Not in URL

`(auth)` stripped from path. `src/app/(auth)/login/page.tsx` → `/login`, not `/auth/login`.

---

## NEXT_REDIRECT Cannot Be Caught

`redirect()` throws special error. Don't wrap redirect-capable server actions in `.catch()` or async/await try/catch.

---

## Image Aspect Ratio

Add `style={{ height: "auto" }}` with fixed width to preserve aspect ratio in `next/image`.

---

## Google Maps: AdvancedMarkerElement Requires Map ID

Needs `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`. Implement fallback to legacy `Marker` if unavailable.

---

## Google Maps: `@react-google-maps/api` Crashes SSR

`@react-google-maps/api` accesses `window` at import time. Direct imports in `'use client'` components cause silent SSR crashes — the component and its parent tree fail to render.

The existing `CoverageRouteMap` works because it's inside `React.lazy()` (skips SSR). New map components must also skip SSR.

```tsx
// BAD — crashes during SSR
import { DeliveryMapCard } from "./DeliveryMapCard";

// GOOD — loads client-side only
const DeliveryMapCard = dynamic(
  () => import("./DeliveryMapCard").then((m) => ({ default: m.DeliveryMapCard })),
  { ssr: false }
);
```

**Apply when:** Any component importing from `@react-google-maps/api`, `@googlemaps/js-api-loader`, or similar browser-only map libraries.

---

## Date String Timezone Bugs

`new Date("YYYY-MM-DD")` parses as UTC. Use `toLocaleDateString` with explicit `timeZone` for display.

---

## `revalidatePath` Defaults to `"page"`

`revalidatePath("/driver")` only invalidates page, not layout. Use `revalidatePath("/driver", "layout")` when layout provides data via context/props.

---

## Always Use `next/image` for External URLs in PWAs

Plain `<img>` fetches cross-origin URLs directly — browser returns opaque responses (status 0) to the Service Worker. The SW cannot distinguish success from failure, and caches bad opaques permanently. `next/image` proxies through `/_next/image?url=...` (same-origin) with real HTTP status codes — SW caches correctly.

Also: `Referrer-Policy: strict-origin-when-cross-origin` blocks Google images on plain `<img>`. Add `referrerPolicy="no-referrer"` if you must use plain `<img>`. Use `**.googleusercontent.com` wildcard in `remotePatterns`.

**Rule:** In any PWA with a service worker, use `next/image` for all external image URLs. Never use plain `<img>` for cross-origin images.

**Supersedes:** Earlier "referrerPolicy only" fix — that was necessary but insufficient.

---

## beforeunload Must Check Ref

`beforeunload` fires on `window.location.href` set to external URL. Use `enabledRef.current` check, not state. Set ref to false before programmatic navigation (Stripe, OAuth).

---

## Never Internal Fetch from Server Components to Own API Routes

**Context:** Tracking page used `fetch(\`${baseUrl}/api/tracking/${orderId}\`)` from a server component. Failed because: wrong env var (`NEXT_PUBLIC_SITE_URL` vs `NEXT_PUBLIC_APP_URL`), wrong cookie format (`sb-access-token` vs Supabase's actual cookie name), and `baseUrl` can't resolve to `localhost` on Vercel.

**Learning:** Server components can query the database directly — they run on the server. Internal fetch to own API routes adds network hops, auth complexity (cookie forwarding), and env var fragility. Extract the API's DB logic into a shared helper and call it directly.

```typescript
// BAD: internal fetch from server component
const res = await fetch(`${baseUrl}/api/tracking/${id}`, {
  headers: { Cookie: `sb-access-token=${token}` },
});

// GOOD: direct DB query in server component
const data = await fetchTrackingData(supabase, id, user.id);
```

**Apply when:** Server component needs data that an API route already provides. Extract shared logic, don't fetch yourself.

---

## Next.js 16: `middleware.ts` → `proxy.ts`

**Context:** Vercel deploy failed with `ENOENT middleware.js.nft.json`. Next.js 16 renamed the middleware convention to `proxy.ts` running on Node.js runtime (not Edge).

**Learning:** Rename root `middleware.ts` → `proxy.ts` and export `proxy()` instead of `middleware()`. `config.matcher` syntax unchanged.

```typescript
// proxy.ts (root)
export async function proxy(request: NextRequest) {
  return updateSession(request);
}
```

**Apply when:** Upgrading to Next.js 16+ or seeing ENOENT errors for `middleware.js.nft.json` on Vercel.

---

## Vercel Serverless Kills Fire-and-Forget Async

**Context:** `void sendEmail(...)` in 7 API routes — emails never arrived on production. Driver invite (which used `await`) worked fine.

**Learning:** Vercel terminates the serverless function immediately after the response is sent. Any `void asyncFn()` or unawaited promises get killed mid-execution. Two solutions:

1. **`await` before responding** — simplest, but delays response
2. **Next.js `after()` callback** — keeps function alive after response sent (preferred for non-blocking side effects)

```typescript
// BAD: killed before completing
void sendEmail({ to, subject, react });
return NextResponse.json({ ok: true });

// GOOD: await before response
await sendEmail({ to, subject, react });
return NextResponse.json({ ok: true });

// BEST: after() — doesn't delay response
after(async () => {
  await sendEmail({ to, subject, react });
});
return NextResponse.json({ ok: true });
```

**Apply when:** Any async side effect (email, logging, analytics, webhooks) in Vercel serverless API routes.

---

## `process.env.KEY` Inlined at Build Time — Dynamic Access Fails

**Context:** Health check env validation passed `process.env` object to Zod. `STRIPE_SECRET_KEY` reported missing despite working in `server.ts`. Even bracket notation `process.env['KEY']` failed.

**Learning:** Next.js replaces ALL `process.env.KEY` references (not just `NEXT_PUBLIC_`) with their literal values at build time. If a server-side env var isn't set during `next build`, it becomes `undefined` permanently in the bundle — even though it's available in the Vercel runtime. The Stripe client worked because the var WAS set during build (Vercel builds with env vars). But `process.env` as an object doesn't enumerate inlined vars, and bracket notation may also be statically replaced.

**Workaround:** Don't validate server-side secrets via Zod schema parsing `process.env`. Instead, validate at the point of use (like `server.ts` does with its runtime throw) or check service connectivity directly.

**Apply when:** Env var health checks, runtime config validation, or any code that iterates/parses `process.env` as an object.
