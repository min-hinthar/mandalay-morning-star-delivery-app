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

## Google Maps AdvancedMarkerElement Requires Map ID

Needs `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`. Implement fallback to legacy `Marker` if unavailable.

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
