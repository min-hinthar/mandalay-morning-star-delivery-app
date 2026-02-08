# Phase 49: Branded 404 & Error Pages - Research

**Researched:** 2026-02-08
**Domain:** Next.js App Router error handling UI, CSS animations, branded error pages
**Confidence:** HIGH

## Summary

Phase 49 replaces the minimal root `not-found.tsx` (8 lines) with delightful, food-themed branded pages and upgrades the existing `RouteError` component with food personality. The codebase already has strong infrastructure from Phase 48: a CSS-only `RouteError` component (87 lines) used by all 14 `error.tsx` files via delegation pattern, plus existing CSS animation utilities (`animate-float`, `animate-fade-in-up`, `animate-gradient-shift`) and floating emoji patterns from the Hero component.

The primary challenge is creating visually rich pages using **CSS-only animations** (no Framer Motion in error pages -- Phase 48 constraint ERRP-06). The existing `FloatingEmoji.tsx` component uses Framer Motion and cannot be reused directly; a CSS-only version is needed. The Hero's `GradientFallback` component provides the exact sunset gradient pattern (orange -> rose -> violet) that can be adapted.

**Primary recommendation:** Create a shared `ErrorPageShell` component for the full-screen branded background (gradient + floating emojis + mascot), use it in all `not-found.tsx` files, and upgrade `RouteError` with food-themed copy while keeping its current layout (within app shell, not full-screen).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Animated food emoji as mascot -- no illustrated character, uses existing emoji system
- Different emoji per error type via emoji swaps (e.g., 404 = sad face, 500 = explosion, offline = sleeping)
- Balanced sizing (80-100px) -- prominent but shares visual weight with copy and nav
- Gentle floating/bobbing CSS animation -- alive but not distracting
- Animated gradient background (sunset orange -> rose -> violet) with floating food emojis layered on top
- Floating food emojis are purely decorative -- no parallax or interaction, CSS-only
- Navigation via card grid -- small cards with icons linking to relevant sections
- 404 pages = full-screen takeover (dramatic, no app shell)
- Route error pages (error.tsx) = within app shell (header/nav remain, less jarring)
- Full food puns -- lean into food humor for headlines
- Unique copy per error type (404 = lost dish, 500 = kitchen meltdown, offline = kitchen closed)
- Claude writes all copy during implementation -- no pre-approval needed
- No search bar on 404 -- card grid navigation is sufficient (search is Phase 55)
- One shared visual design for all portals -- same food-themed branding
- Per-portal not-found.tsx files: root, admin, driver -- each with relevant navigation cards
- Navigation cards change per portal: customer (Home, Menu, Orders), admin (Dashboard, Orders, Drivers), driver (Dashboard, Routes, History)
- Same copy across portals -- only navigation links differ
- RouteError component gets food-themed upgrade -- all 14 existing error.tsx files benefit automatically
- CSS-only animations -- carry over Phase 48 constraint (no Framer Motion in error pages)
- "Pepper Aesthetic" brand tokens for all styling (deep red primary, golden yellow secondary)

### Claude's Discretion
- Exact food pun copy for each error type
- Floating emoji selection, count, and animation timing
- Gradient animation speed and direction
- Card grid layout details (2-col, 3-col, responsive breakpoints)
- RouteError upgrade approach -- balance food personality with maintaining Phase 48's retry/go-home functionality

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.2 | App Router not-found.tsx and error.tsx conventions | Already in use; file conventions define behavior |
| React | 19 | Component rendering | Already in use |
| TailwindCSS | v4 | Styling via utility classes + `@theme inline` | Already in use; all styling via tokens.css + globals.css |
| Lucide React | current | Icons for navigation cards | Already in use in RouteError (AlertTriangle, RefreshCw, Home) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/link | built-in | Navigation links in cards | Used for all card navigation |
| next/image | built-in | Logo rendering | Already used in RouteError |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS-only floating emojis | Existing `FloatingEmoji.tsx` (Framer Motion) | Cannot use -- Framer Motion banned in error pages (ERRP-06). Must create CSS-only version. |
| CSS keyframe animations | Web Animations API | CSS keyframes more reliable in error contexts, no JS dependency |

**Installation:** No new packages needed. Everything is already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/ui/
│   ├── RouteError.tsx              # MODIFY: Add food-themed copy, keep retry/go-home
│   ├── error-pages/                # NEW: Shared error page components
│   │   ├── index.tsx               # Barrel exports
│   │   ├── ErrorPageShell.tsx      # Full-screen gradient + floating emojis background
│   │   ├── FloatingFoodEmojis.tsx  # CSS-only floating food emojis (decorative)
│   │   ├── ErrorMascot.tsx         # Emoji mascot with contextual expression
│   │   ├── NavigationCardGrid.tsx  # Card grid for portal-specific navigation
│   │   └── error-page.css          # CSS keyframes for error page animations
├── app/
│   ├── not-found.tsx               # MODIFY: Full-screen branded 404 (customer portal)
│   ├── (admin)/admin/
│   │   └── not-found.tsx           # NEW: Admin portal 404 with admin nav cards
│   ├── (driver)/driver/
│   │   └── not-found.tsx           # NEW: Driver portal 404 with driver nav cards
```

### Pattern 1: Not-Found File Hierarchy (Next.js App Router)
**What:** Root `app/not-found.tsx` catches all unmatched URLs globally. Nested `not-found.tsx` files only activate when `notFound()` is called programmatically from that route segment.
**When to use:** Always -- this is how Next.js works.
**Critical detail:** Per-portal `not-found.tsx` files (admin, driver) will only show when `notFound()` is called from within those route segments. Unmatched URLs like `/admin/nonexistent` still hit the **root** `not-found.tsx`. To show portal-specific 404s for unmatched admin/driver URLs, the root not-found must detect the URL path and render the appropriate portal variant.

Source: Context7 /vercel/next.js/v16.1.5 - not-found.js Reference

```
// Key behavior:
// /admin/nonexistent  --> app/not-found.tsx (ROOT, not admin's)
// notFound() in admin page --> app/(admin)/admin/not-found.tsx (if exists)
```

### Pattern 2: CSS-Only Floating Emojis (No Framer Motion)
**What:** Decorative floating food emojis using CSS `@keyframes` instead of Framer Motion.
**When to use:** Error pages where Framer Motion is banned (ERRP-06).
**Key difference from Hero's FloatingEmoji:** No `m.span`, no `useAnimationPreference()`, no mouse repel. Pure CSS with deterministic positions.

```tsx
// CSS-only floating emoji (no JS dependencies)
const FLOAT_EMOJIS = [
  { emoji: "🍜", x: 10, y: 15, delay: "0s", duration: "8s" },
  { emoji: "🍛", x: 80, y: 25, delay: "2s", duration: "10s" },
  // ...
];

function FloatingFoodEmojis() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {FLOAT_EMOJIS.map((item, i) => (
        <span
          key={i}
          className="absolute text-3xl select-none animate-error-float opacity-50"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            animationDelay: item.delay,
            animationDuration: item.duration,
          }}
        >
          {item.emoji}
        </span>
      ))}
    </div>
  );
}
```

### Pattern 3: Full-Screen 404 vs In-Shell Error
**What:** 404 pages are full-screen takeovers (render outside app shell). Error.tsx pages render within app shell.
**When to use:** Per CONTEXT.md locked decision.
**Implementation:**
- `not-found.tsx`: Returns `min-h-screen` container with own gradient background, no dependency on layout
- `RouteError` (used by `error.tsx`): Keeps `min-h-[60vh]` with `bg-background`, renders inside layout

### Pattern 4: Emoji Mascot with Error-Type Swapping
**What:** Central large emoji that changes based on error type.
**When to use:** Both 404 pages and RouteError.

```tsx
// Error type to mascot mapping
const ERROR_MASCOTS: Record<string, { emoji: string; label: string }> = {
  "not-found": { emoji: "🥺", label: "sad face" },
  "server-error": { emoji: "🤯", label: "mind blown" },
  "offline": { emoji: "😴", label: "sleeping" },
  "default": { emoji: "😵‍💫", label: "dizzy" },
};
```

### Pattern 5: Navigation Card Grid
**What:** Small cards with emoji icons linking to portal-specific sections.
**When to use:** 404 pages for navigation back to useful pages.

```tsx
interface NavCard {
  emoji: string;
  label: string;
  href: string;
}

const CUSTOMER_CARDS: NavCard[] = [
  { emoji: "🏠", label: "Home", href: "/" },
  { emoji: "🍜", label: "Menu", href: "/menu" },
  { emoji: "📦", label: "Orders", href: "/orders" },
];

const ADMIN_CARDS: NavCard[] = [
  { emoji: "📊", label: "Dashboard", href: "/admin" },
  { emoji: "📦", label: "Orders", href: "/admin/orders" },
  { emoji: "🚗", label: "Drivers", href: "/admin/drivers" },
];

const DRIVER_CARDS: NavCard[] = [
  { emoji: "📊", label: "Dashboard", href: "/driver" },
  { emoji: "🗺️", label: "Routes", href: "/driver/route" },
  { emoji: "📜", label: "History", href: "/driver/history" },
];
```

### Anti-Patterns to Avoid
- **Using Framer Motion in error/not-found pages:** Framer Motion crash in error page = infinite crash loop. CSS-only is mandatory (ERRP-06).
- **Making not-found.tsx a client component:** `not-found.tsx` should be a server component (supports metadata export, no client JS needed for static content). Only use `'use client'` if interactivity is needed.
- **Relying on layout context in not-found.tsx:** Root `not-found.tsx` renders within the root layout but has no awareness of which route group the user was trying to access. Path detection must be done explicitly if portal-specific behavior is desired.
- **Complex JS in error pages:** Error pages should be as simple as possible to avoid secondary crashes. CSS animations + static HTML is the safest pattern.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Floating animation | Custom JS animation loop | CSS `@keyframes` + `animation` property | CSS animations run on compositor thread, can't crash from JS errors |
| Gradient animation | JS-driven gradient interpolation | CSS `@keyframes gradient-shift` (already in globals.css) | Already exists, compositor-optimized |
| Bobbing animation | JS-driven transform | CSS `@keyframes float` (already in animations.css) | Already exists as `animate-float` and `animate-float-slow` |
| Fade-in on mount | JS intersection observer | CSS `animate-fade-in-up` (already in animations.css) | Already exists, used by current RouteError |
| Icon system | Custom SVG icons | Lucide React icons (already imported) | Already in use throughout codebase |

**Key insight:** The codebase already has all needed CSS animation keyframes (`float`, `fade-in-up`, `gradient-shift`). New keyframes needed only for the specific bobbing mascot animation and varied float timings for decorative emojis.

## Common Pitfalls

### Pitfall 1: Root not-found.tsx Catches All Unmatched URLs
**What goes wrong:** Developer creates `app/(admin)/admin/not-found.tsx` expecting it to catch `/admin/nonexistent` URLs, but the root `app/not-found.tsx` catches them instead.
**Why it happens:** Next.js only triggers nested `not-found.tsx` when `notFound()` is called programmatically from that segment. Unmatched URLs always bubble to root.
**How to avoid:** The root `not-found.tsx` must handle all portals. Option A: detect path from headers and render portal-specific cards. Option B: single generic 404 with customer-focused cards (simplest, matches CONTEXT.md "same copy across portals, only nav links differ").
**Warning signs:** Testing `/admin/nonexistent` shows customer nav cards instead of admin nav cards.
**Recommendation:** Use a single root `not-found.tsx` with customer navigation cards. Create per-portal `not-found.tsx` files for programmatic `notFound()` calls only. Optionally, the root can detect URL path to show portal-specific cards using `headers()`.

### Pitfall 2: Framer Motion Dependency in Error Components
**What goes wrong:** Importing from `framer-motion` in error boundary components causes crash loops if FM itself has an error.
**Why it happens:** Error boundaries catch errors from their children. If the error boundary component itself crashes (e.g., bad FM import), there's no recovery.
**How to avoid:** All error page components must be CSS-only. No `framer-motion`, no `m.div`, no `useAnimationPreference()`.
**Warning signs:** `import { m } from "framer-motion"` in any file used by error/not-found pages.

### Pitfall 3: Tailwind v4 Token Registration
**What goes wrong:** New CSS custom properties defined in error page CSS don't generate Tailwind utility classes.
**Why it happens:** Tailwind v4 + Turbopack only reads `@theme inline {}` in globals.css. New tokens in separate CSS files are invisible.
**How to avoid:** Any new animation keyframes should go in `animations.css` (already imported). Any new color/sizing tokens must also be registered in `@theme inline`. For error pages, prefer inline styles or existing utility classes over new tokens.
**Warning signs:** Classes like `bg-error-gradient` resolve to `transparent` in computed styles.

### Pitfall 4: Global-Error Must Include HTML/Body Tags
**What goes wrong:** The `global-error.tsx` page breaks because it doesn't include `<html>` and `<body>` tags.
**Why it happens:** `global-error.tsx` replaces the root layout entirely, so it must provide its own document structure.
**How to avoid:** The current `global-error.tsx` already includes `<html>` and `<body>`. If upgrading it with branding, keep those tags. However, this file uses Sentry + NextError -- consider whether to brand it (it only fires when the root layout itself crashes, which is extremely rare).
**Recommendation:** Leave `global-error.tsx` minimal (Sentry reporting only). Focus branding on `not-found.tsx` and `RouteError`.

### Pitfall 5: Button Component Uses Framer Motion
**What goes wrong:** Using the project's `<Button>` component in error/not-found pages imports Framer Motion.
**Why it happens:** `src/components/ui/button.tsx` imports `m` from `framer-motion` and uses `m.button` for animations.
**How to avoid:** The current `RouteError` already uses `<Button>` -- this works because error.tsx renders within the app shell where FM is loaded. But for `not-found.tsx` (server component), either: (a) make it a client component and use `<Button>`, or (b) use plain `<a>` / `<Link>` elements styled with Tailwind.
**Recommendation:** Since `not-found.tsx` pages are full-screen takeovers with navigation cards (not buttons with retry logic), use `<Link>` elements with Tailwind styling. No `<Button>` component needed.

### Pitfall 6: 400-Line File Limit
**What goes wrong:** Error page shell component exceeds 400-line ESLint limit.
**Why it happens:** Combining gradient background, floating emojis, mascot, copy, and navigation cards in one file.
**How to avoid:** Split into subfolder with barrel export: `ErrorPageShell`, `FloatingFoodEmojis`, `ErrorMascot`, `NavigationCardGrid`.

## Code Examples

### CSS-Only Floating/Bobbing Animation (New Keyframe)
```css
/* Add to src/styles/animations.css */

/* Gentle bobbing for error page mascot */
@keyframes error-bob {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* Floating food emojis - varied per emoji via animation-duration */
@keyframes error-float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.4;
  }
  25% {
    transform: translateY(-15px) rotate(5deg);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-25px) rotate(-3deg);
    opacity: 0.5;
  }
  75% {
    transform: translateY(-10px) rotate(4deg);
    opacity: 0.55;
  }
}

/* Slow gradient shift for 404 background */
@keyframes error-gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

### Animated Gradient Background (Sunset Theme)
```tsx
// Uses existing hero tokens: --hero-bg-start (orange), --hero-bg-mid (pink), --hero-bg-end (violet)
<div
  className="fixed inset-0"
  style={{
    background: `linear-gradient(-45deg, var(--hero-bg-start), var(--hero-bg-mid), var(--hero-bg-end), var(--hero-bg-start))`,
    backgroundSize: '400% 400%',
    animation: 'error-gradient-shift 15s ease infinite',
  }}
/>
```

### Root not-found.tsx with Path Detection
```tsx
// Source: Next.js 16.1.5 docs - not-found.tsx can use headers() for path detection
import { headers } from 'next/headers';

export default async function NotFound() {
  const headersList = await headers();
  // x-pathname or referer can hint at which portal
  // Fallback: show customer navigation cards
  return (
    <ErrorPageShell errorType="not-found">
      <NavigationCardGrid portal="customer" />
    </ErrorPageShell>
  );
}
```

### RouteError Food-Themed Upgrade
```tsx
// Maintain Phase 48's structure: retry counter, go-home button, Sentry reporting
// Add food-themed copy based on context
const FOOD_COPY: Record<string, { headline: string; message: string }> = {
  default: {
    headline: "Oops! We dropped the plate!",
    message: "Something spilled in the kitchen. Let's clean it up!",
  },
  "admin dashboard": {
    headline: "Recipe Error in the Kitchen!",
    message: "The admin kitchen had a mishap. Let's try again!",
  },
  orders: {
    headline: "Your order got lost in the kitchen!",
    message: "We misplaced something. Give us another chance!",
  },
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hand-rolled error boundaries per route | RouteError delegation pattern | Phase 48 (2026-02-08) | All 14 error.tsx files delegate to single RouteError |
| Framer Motion in error pages | CSS-only animations | Phase 48 ERRP-06 | Prevents crash loops |
| Generic "Something went wrong" copy | Context-aware messaging | Phase 48 | RouteError uses `context` prop |
| No not-found branding | Generic 8-line not-found | Pre-Phase 49 | Root not-found is plain text |

**Deprecated/outdated:**
- `tailwind.config.ts` -- dead code, Turbopack ignores it. All tokens via `@theme inline` in globals.css
- `@config` directive -- silently ignored by Turbopack

## Existing Assets Inventory

### Reusable CSS Animations (from `src/styles/animations.css`)
| Class | Keyframe | Duration | Use For |
|-------|----------|----------|---------|
| `animate-float` | `float` | 6s infinite | Floating food emojis |
| `animate-float-slow` | `float` | 8s infinite | Slower floating emojis |
| `animate-fade-in-up` | `fade-in-up` | 500ms once | Page content entrance |
| `animate-gradient-shift` | `gradient-shift` | 15s infinite | Gradient background |
| `animate-fade-in` | `fade-in` | 300ms once | Subtle content entrance |
| `animate-scale-in` | `scale-in` | 300ms once | Card entrance |

### Reusable Design Tokens (from `src/styles/tokens.css`)
| Token | Value | Use For |
|-------|-------|---------|
| `--hero-bg-start` | `#FB923C` (orange) | Gradient start |
| `--hero-bg-mid` | `#EC4899` (pink) | Gradient mid |
| `--hero-bg-end` | `#7C3AED` (violet) | Gradient end |
| `--color-primary` | `#A41034` (deep red) | Brand accent |
| `--color-secondary` | `#EBCD00` (golden) | Secondary accent |
| `--shadow-card` | warm shadow | Card elevation |
| `--radius-card` | 24px | Card corners |
| `--font-display` | Nunito 900 | Headlines |

### Reduced Motion Support
Both `animations.css` and `globals.css` have `[data-reduce-motion="true"]` and `@media (prefers-reduced-motion: reduce)` selectors that disable animations. New animation classes MUST be added to these selectors.

## Implementation Scope

### Files to Create (NEW)
| File | Purpose | Lines (est.) |
|------|---------|------|
| `src/components/ui/error-pages/index.tsx` | Barrel exports | ~10 |
| `src/components/ui/error-pages/ErrorPageShell.tsx` | Full-screen gradient + layout | ~80 |
| `src/components/ui/error-pages/FloatingFoodEmojis.tsx` | CSS-only decorative emojis | ~60 |
| `src/components/ui/error-pages/ErrorMascot.tsx` | Central emoji mascot with bobbing | ~40 |
| `src/components/ui/error-pages/NavigationCardGrid.tsx` | Portal-specific nav cards | ~90 |
| `src/app/(admin)/admin/not-found.tsx` | Admin 404 page | ~15 |
| `src/app/(driver)/driver/not-found.tsx` | Driver 404 page | ~15 |

### Files to Modify (EXISTING)
| File | Change | Lines changed (est.) |
|------|--------|------|
| `src/app/not-found.tsx` | Replace 8-line generic with full branded page | ~25 |
| `src/components/ui/RouteError.tsx` | Add food-themed copy, emoji mascot swap | ~30 |
| `src/styles/animations.css` | Add error-bob, error-float keyframes + reduced motion | ~25 |

### Files NOT to Modify
| File | Reason |
|------|--------|
| `src/app/global-error.tsx` | Only fires on root layout crash; keep minimal with Sentry |
| `src/app/error.tsx` | Already delegates to RouteError; benefits automatically |
| All 14 `error.tsx` files | All delegate to RouteError; benefit automatically from RouteError upgrade |
| `src/app/globals.css` | No new tokens needed; existing hero tokens suffice |

## Open Questions

1. **Root not-found.tsx path detection for portal-specific cards**
   - What we know: Root `not-found.tsx` catches all unmatched URLs. Next.js provides `headers()` in server components. The `x-invoke-path` or `referer` header may contain the attempted URL.
   - What's unclear: Whether `headers()` reliably provides the attempted path in all deployment environments (Vercel, self-hosted).
   - Recommendation: Try `headers()` for path detection. Fallback: always show customer cards (simplest, covers 80% use case). Per-portal `not-found.tsx` files handle programmatic `notFound()` calls within those segments.

2. **`not-found.tsx` as server vs client component**
   - What we know: `not-found.tsx` can be a server component (supports `metadata` export). Navigation cards are static links, no interactivity needed.
   - What's unclear: Whether the CSS animation classes will work without `'use client'` (they should -- CSS animations don't need JS).
   - Recommendation: Keep as server component. CSS animations work regardless. Use `<Link>` for navigation, no `<Button>` component.

## Sources

### Primary (HIGH confidence)
- Context7 `/vercel/next.js/v16.1.5` - not-found.tsx file conventions, error.tsx behavior, route groups
- Codebase: `src/components/ui/RouteError.tsx` - current error component (Phase 48 output)
- Codebase: `src/components/ui/homepage/FloatingEmoji.tsx` - existing emoji pattern (FM-based)
- Codebase: `src/components/ui/homepage/Hero/HeroSubComponents.tsx` - GradientFallback pattern
- Codebase: `src/styles/animations.css` - existing CSS animation keyframes
- Codebase: `src/styles/tokens.css` - design tokens including hero gradient colors
- Codebase: `src/app/globals.css` - `@theme inline` block and CSS utilities
- Codebase: `.planning/phases/48-error-boundaries-loading-states/48-01-SUMMARY.md` - Phase 48 decisions

### Secondary (MEDIUM confidence)
- Context7 Next.js docs on `global-error.tsx` requiring html/body tags

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries, everything exists in codebase
- Architecture: HIGH - patterns verified against codebase + Next.js docs via Context7
- Pitfalls: HIGH - critical `not-found.tsx` routing behavior verified via Context7; Tailwind v4 pitfalls from project error history
- CSS animations: HIGH - existing keyframes verified in `animations.css`; new keyframes are trivial CSS

**Research date:** 2026-02-08
**Valid until:** 2026-03-08 (stable domain, no moving targets)
