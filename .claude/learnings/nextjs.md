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

## External `<img>` + Google Referrer Policy

`Referrer-Policy: strict-origin-when-cross-origin` blocks Google images on plain `<img>`. Add `referrerPolicy="no-referrer"`. Use `**.googleusercontent.com` wildcard in `remotePatterns`. `next/image` unaffected (server-side fetch).

---

## beforeunload Must Check Ref

`beforeunload` fires on `window.location.href` set to external URL. Use `enabledRef.current` check, not state. Set ref to false before programmatic navigation (Stripe, OAuth).
