# PWA & Viewport Meta Patterns

## viewport-fit=cover for Notched iOS Devices

**Context:** iOS Safari `env(safe-area-inset-*)` CSS values always returned `0px` despite being used in the bottom tab bar and top nav. Safe-area padding was dead code.

**Learning:** `env(safe-area-inset-*)` only returns non-zero values when the viewport meta includes `viewport-fit=cover`. Without it, the browser defaults to `viewport-fit=contain` which insets content away from the notch/home indicator automatically — making the CSS env vars always zero.

```html
<!-- BAD: env(safe-area-inset-*) always returns 0px -->
<meta name="viewport" content="width=device-width" />

<!-- GOOD: activates env() values, app extends into notch/indicator area -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

Also pair with `black-translucent` status bar style for PWAs:
```html
<!-- Makes PWA status bar transparent so safe-area padding works visually -->
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

Key points:
- `initial-scale=1` prevents iOS auto-zoom that causes JS/CSS breakpoint mismatch
- `viewport-fit=cover` lets your app draw into notch/home-indicator area
- You MUST add your own `env(safe-area-inset-*)` padding or content will be hidden behind system UI
- `black-translucent` makes the PWA status bar transparent; `default` renders a solid bar on top

**Apply when:** Any PWA or mobile-first web app that uses `env(safe-area-inset-*)` for notch/home-indicator padding.

## Next.js Viewport Meta Deduplication

**Context:** Next.js auto-generates `<meta name="viewport" content="width=device-width">` but the app needed `viewport-fit=cover`.

**Learning:** Next.js deduplicates `<meta>` tags by their `name` attribute. Placing a custom viewport meta in `<Head>` within `_document.tsx` replaces the auto-generated default — no conflict or duplicate tags.

```tsx
// _document.tsx — this replaces Next.js auto-generated viewport meta
<Head>
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, viewport-fit=cover"
  />
</Head>
```

**Apply when:** Customizing the viewport meta in any Next.js app (Pages Router or App Router).
