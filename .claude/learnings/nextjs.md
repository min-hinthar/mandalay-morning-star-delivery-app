# Next.js Learnings

## Route Groups Not Part of URL Path

Next.js route groups like `(auth)` are **not part of the URL path**. Parentheses are stripped.

```
File:  src/app/(auth)/login/page.tsx
URL:   /login           (correct)
NOT:   /auth/login       (404)
```

**Apply when:** Linking to pages inside route groups.

---

## NEXT_REDIRECT Cannot Be Caught

`redirect()` throws special error that must propagate unhandled.

```javascript
// Creates unhandled rejection
handleClick().catch((e) => {
  throw e;
});
```

**Pattern:** Don't wrap redirect-capable server actions in `.catch()`.

---

## Image Aspect Ratio with Fixed Width

When using Next.js Image with fixed width, add `style={{ height: "auto" }}` to maintain aspect ratio.

```tsx
// Squished - both dimensions fixed
<Image width={48} height={48} className="w-12 h-12" />

// Maintains aspect ratio
<Image width={48} height={48} style={{ height: "auto" }} className="w-12" />
```

**Apply when:** Logos or images where aspect ratio must be preserved.

---

## Google Maps AdvancedMarkerElement Requires Map ID

`AdvancedMarkerElement` requires a Map ID from Google Cloud Console. Without `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`, markers won't render on vector maps.

**Fix:** Implement fallback — `AdvancedMarkerElement` when Map ID available, legacy `Marker` otherwise.

**Apply when:** Using Google Maps with custom markers.

---

## Date String Parsing Timezone Bugs

`new Date("YYYY-MM-DD")` parses as UTC midnight. For Pacific Time (UTC-8), displays as previous day.

```tsx
// Consistent display across timezones
const dayName = dateObj.toLocaleDateString("en-US", {
  weekday: "short",
  timeZone: "America/Los_Angeles",
});
```

**Apply when:** Displaying dates from YYYY-MM-DD strings, especially for business logic tied to specific days.

---

## `revalidatePath` Defaults to `"page"` — Layouts Not Invalidated

`revalidatePath("/some-route")` defaults to `type: "page"`. This only invalidates `/some-route/page.tsx` — **NOT** the layout at that path, and NOT child pages.

```tsx
// BROKEN: layout data stays cached (avatar, nav props, context values)
revalidatePath("/driver");

// WORKING: invalidates layout AND all child pages
revalidatePath("/driver", "layout");
```

When layouts provide data to child components (via context providers or props), stale layout = stale data everywhere.

**Apply when:** Any `revalidatePath` call where the layout fetches data consumed by child pages — especially context providers set in layouts.

---

## External `<img>` Tags Need `referrerPolicy="no-referrer"` for Google Images

Plain `<img>` tags loading from Google domains (`drive.google.com`, `*.googleusercontent.com`) fail silently when the app sets `Referrer-Policy: strict-origin-when-cross-origin`. Google blocks image requests from unknown referrers.

```tsx
// BROKEN — Google sees referrer, blocks image
<img src={googleDriveUrl} alt="product" />

// WORKING — no referrer sent, Google serves image
<img src={googleDriveUrl} alt="product" referrerPolicy="no-referrer" />
```

`next/image` is NOT affected (fetches server-side, no browser referrer). Only plain `<img>` tags.

For `remotePatterns` in `next.config.ts`, use wildcard subdomains — Google CDN uses `lh3`, `lh4`, `lh5`, etc.:
```ts
{ protocol: "https", hostname: "**.googleusercontent.com" }
```

**Apply when:** Loading images from Google Drive, Google OAuth avatars, or any `*.googleusercontent.com` URL via plain `<img>` tags.

---

## beforeunload Handler Must Check Ref

`beforeunload` fires when `window.location.href` is set to external URL. Effect cleanup runs too late.

```tsx
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (!enabledRef.current) return; // Check ref, not state
  e.preventDefault();
};
const disable = useCallback(() => {
  enabledRef.current = false;
}, []);
```

**Apply when:** Navigation guards needing programmatic bypass before external redirect (Stripe, OAuth).
