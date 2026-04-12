# Phase 117: Integration & Asset Fixes — Precontext Research

**Phase**: 117 — Integration & Asset Fixes
**Goal**: CFIX-04 persistent toast fires via correct toast store; UXPL-06 social previews render with brand image
**Requirements**: CFIX-04, UXPL-06
**Researched**: 2026-04-11 (12-agent deep protocol)

---

## 1. Resolved Assumptions

### Technical Approach

| Assumption | Resolution | Confidence |
|-----------|-----------|------------|
| Simple import swap fixes CFIX-04 | **PARTIAL** — import swap + API shape change + V8 patch needed | HIGH |
| `duration: Infinity` works for persistent toasts | **FALSE** — setTimeout overflow fires at 1ms; must patch `addToRemoveQueue` | HIGH |
| OG image is a static asset drop | **TRUE** — metadata code already wired; only `/public/og-image.png` missing | HIGH |
| Legacy `useToast` can be removed entirely | **TRUE** — only `usePaymentSubmit.ts` uses it; no other consumers | HIGH |
| No code changes needed for UXPL-06 | **TRUE** — `layout.tsx:46` and `share/page.tsx:71,101,108` already reference `/og-image.png` | HIGH |

### Scope Boundaries

**In scope:**
- Patch `useToastV8.addToRemoveQueue` to guard against `Infinity`/`0` duration
- Swap import in `usePaymentSubmit.ts` from `useToast` to `useToastV8`
- Transform toast call: `{title, description, variant, persistent}` → `{message, type, duration}`
- Update test mock in `usePaymentSubmit.test.ts`
- Create `/public/og-image.png` (1200x630 PNG)
- Remove legacy `useToast.ts` + barrel export cleanup

**Out of scope:**
- Dynamic OG image generation (@vercel/og) — static asset is sufficient
- Toast action button — banner already has "Try again"
- Burmese text in toast — banner handles bilingual display
- Any changes to CheckoutErrorBanner
- Any changes to `generateMetadata` in share page

### Implementation Order

1. **Patch `useToastV8`** — add guard in `addToRemoveQueue` for non-finite/zero duration
2. **Swap import** in `usePaymentSubmit.ts` — change `useToast` → `useToastV8`
3. **Transform toast call** — merge title into message, map variant→type, persistent→duration:0
4. **Update test** — mock `useToastV8`, update assertions
5. **Remove legacy** — delete `useToast.ts`, update barrel export in `hooks/index.ts`
6. **Create OG image** — Sharp build script or static asset
7. **Verify** — toast renders on timeout, banner still works, OG previews resolve

---

## 2. Realistic Data/Scale Analysis

**Scope**: 2 bug fixes, ~6 files modified, ~1 file created, ~1 file deleted
**Risk**: LOW — isolated changes with clear test coverage
**Estimated plans**: 1-2 (could be single plan given small scope)

---

## 3. Cross-Phase Contract Inventory

### From Phase 110 (Critical Fixes)

| Contract | Status | Phase 117 Impact |
|----------|--------|-----------------|
| 10s `AbortController` timeout on Stripe fetch | ACTIVE | Must NOT change timing |
| `ClientErrorCodes.CHECKOUT_NETWORK_TIMEOUT` error code | ACTIVE | Consumed by banner — don't change |
| `idempotency_key=checkout_${order.id}` server-side | ACTIVE | Untouched |
| CheckoutErrorBanner `CHECKOUT_NETWORK_TIMEOUT` case | ACTIVE | Must NOT regress retry flow |
| `setError()` → banner render pipeline | ACTIVE | Untouched |
| `persistent: true` toast flag (legacy) | DEAD CODE | Replacing with V8 equivalent |

### From Phase 116 (Micro-Interactions & Polish)

| Contract | Status | Phase 117 Impact |
|----------|--------|-----------------|
| `generateMetadata` async function in share page | ACTIVE | Untouched — already references `/og-image.png` |
| Root `openGraph` defaults in layout.tsx | ACTIVE | Untouched — already references `/og-image.png` |
| Cart undo toast via `useToastV8` (UXPL-01/02) | ACTIVE | V8 patch must not break existing toasts |
| Swipe hint + scroll indicators (UXPL-03/04) | ACTIVE | Unrelated |
| Sticky reorder button (UXPL-05) | ACTIVE | Unrelated |

### Feeds Into Phase 118

- Phase 118 depends on 117 completion to unblock v2.3 re-audit
- Phase 118 generates VERIFICATION.md for phases 113-115 and VALIDATION.md for 111-116
- Both CFIX-04 and UXPL-06 must be fully satisfied before Phase 118

---

## 4. CFIX-04: Toast System Deep Analysis

### Current State (BROKEN)

```
usePaymentSubmit.ts:6  →  import { toast } from "@/lib/hooks/useToast"  (LEGACY)
usePaymentSubmit.ts:220-226  →  toast({ title, description, variant, persistent })

Toast.tsx:20-23  →  import { useToast } from "@/lib/hooks/useToastV8"  (V8)
Toast.tsx:207  →  const { toasts } = useToast()  // reads V8 store
```

**Result**: Toast dispatched to legacy store; Toast.tsx reads V8 store. Toast never renders.

### Legacy API (`useToast.ts`)

```typescript
interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning";
  persistent?: boolean;  // true = skip auto-dismiss queue
}
// Returns: { id, dismiss, update }
```

### V8 API (`useToastV8.ts`)

```typescript
interface ToastOptions {
  message: string;           // single field (replaces title+description)
  type?: "success" | "error" | "info" | "warning" | "order" | "exception";
  duration?: number;         // ms, default 5000
  sound?: boolean;
  action?: { label: string; onClick: () => void };
}
// Returns: { id, dismiss, update, triggerAction }
```

### API Mismatch Table

| Feature | Legacy | V8 | Migration |
|---------|--------|-----|-----------|
| Message | `title` + `description` | `message` | Use title only ("Checkout timed out") |
| Variant | `variant: "destructive"` | `type: "error"` | Direct map |
| Persistent | `persistent: true` | `duration: 0` (after patch) | Guard clause needed |
| Sound | N/A | `sound?: boolean` | Omit (default false) |
| Action | N/A | `action?: {...}` | Omit (banner has retry) |

### CRITICAL: `setTimeout(fn, Infinity)` Bug

**Problem**: `useToastV8.addToRemoveQueue` (lines 186-195) passes `duration` directly to `setTimeout()` with no guards.

```typescript
function addToRemoveQueue(id: string, duration: number) {
  if (toastTimeouts.has(id)) return;
  const timeout = setTimeout(() => {
    toastTimeouts.delete(id);
    dispatch({ type: "REMOVE_TOAST", id });
  }, duration);  // <-- NO GUARD for Infinity/0
  toastTimeouts.set(id, timeout);
}
```

**Behavior with special values:**
| Value | setTimeout behavior | Result |
|-------|-------------------|--------|
| `Infinity` | Overflows 32-bit int → 1ms | Toast removed immediately |
| `0` | Clamped to 1ms | Toast removed immediately |
| `Number.MAX_SAFE_INTEGER` | Overflows → 1ms | Toast removed immediately |
| `5000` | Works correctly | 5s auto-dismiss |

**Fix**: Add guard before `addToRemoveQueue` call:

```typescript
// In toast() function, line ~231:
if (duration > 0 && isFinite(duration)) {
  addToRemoveQueue(id, duration);
}
// duration: 0 or Infinity → skip queue → toast persists until dismiss()
```

### Existing Persistent Toast Workaround

`cart-store.ts:498-499` uses `duration: 30_000` with comment:
> "Long-lived for visibility (no persistent field in ToastOptions)"

This confirms the team knew persistent support was missing and worked around it.

### Target Toast Call

```typescript
// BEFORE (legacy):
toast({
  title: "Checkout timed out",
  description: "We couldn't reach the payment service in time. Tap Retry to try again — you haven't been charged.",
  variant: "destructive",
  persistent: true,
});

// AFTER (V8, with patch):
toast({
  message: "Checkout timed out",
  type: "error",
  duration: 0,  // persistent — skip remove queue
});
```

### Test Updates Required

**File**: `src/components/ui/checkout/__tests__/usePaymentSubmit.test.ts`

```diff
- vi.mock("@/lib/hooks/useToast", () => {
+ vi.mock("@/lib/hooks/useToastV8", () => {
    const toastSpy = vi.fn();
    return {
      toast: toastSpy,
-     useToast: () => ({ toasts: [], dismiss: vi.fn(), toast: toastSpy }),
+     useToast: () => ({ toasts: [], dismiss: vi.fn(), toast: toastSpy, expanded: false, toggleExpanded: vi.fn() }),
    };
  });

// Assertion update:
- expect(toastCall.persistent).toBe(true);
- expect(toastCall.variant).toBe("destructive");
+ expect(toastCall.duration).toBe(0);
+ expect(toastCall.type).toBe("error");
```

### Legacy Removal Scope

| File | Action |
|------|--------|
| `src/lib/hooks/useToast.ts` | DELETE |
| `src/lib/hooks/__tests__/useToast.test.ts` | DELETE |
| `src/lib/hooks/index.ts:131` | Remove `export { useToast, toast } from "./useToast"` |

**Consumers**: Only `usePaymentSubmit.ts` (migrated) and its test (migrated). Zero other consumers.

---

## 5. UXPL-06: OG Image Analysis

### Current State

**Metadata code**: Complete and correct
- `src/app/layout.tsx:46` → `images: [{ url: "/og-image.png", width: 1200, height: 630 }]`
- `src/app/(public)/orders/[id]/share/page.tsx:71,101,108` → same reference
- Dynamic title/description from Supabase query working
- Twitter card: `summary_large_image`

**Asset**: `/public/og-image.png` does NOT exist → 404 for social crawlers

### Brand Identity for OG Image

| Element | Value | Source |
|---------|-------|--------|
| Primary color | `#A41034` (deep red) | `tokens.css` |
| Secondary color | `#EBCD00` (golden yellow) | `tokens.css` |
| Hero gradient | `#FB923C → #EC4899 → #7C3AED` | `tokens.css` |
| Display font | Nunito Bold 900 | `layout.tsx` |
| Body font | Nunito Regular / Inter | `layout.tsx` |
| Logo | `/public/logo.png` (799x531 WebP) | Brand mark with red/gold/star |
| Scenic image | `/public/images/sunset_ubein.webp` | U Bein Bridge silhouette |
| Theme color | `#8B1A1A` | `manifest.json` |
| Background | `#FDF8F0` (warm cream) | `manifest.json` |
| Tagline | "Authentic Burmese cuisine delivered fresh to your door" | `layout.tsx:40` |

### Approach: Sharp Build Script

**Why**: `sharp` v0.34.5 already in dependencies. No new packages needed.

**Script**: `scripts/generate-og-image.mjs`
- Compose 1200x630 canvas with hero gradient background
- Overlay logo (scaled, centered)
- Add brand name + tagline text
- Output optimized PNG to `public/og-image.png`

**Alternative**: Supply a pre-made PNG directly (simpler, but less reproducible).

### OG Image Design Spec

```
┌──────────────────────────────────────────────────┐
│                                                   │
│  Sunset gradient background (#FB923C → #7C3AED)  │
│                                                   │
│        ┌──────────┐                               │
│        │  LOGO    │                               │
│        │  (star)  │   Mandalay Morning Star       │
│        └──────────┘                               │
│                                                   │
│        Authentic Burmese Cuisine                  │
│        Delivered Fresh to Your Door               │
│                                                   │
│                                          1200x630 │
└───────────────────��──────────────────────────────┘
```

**Safe zone**: Keep critical elements within center 1000x500px (platforms crop edges).

---

## 6. Gotcha Inventory

### Critical (will break if ignored)

| # | Gotcha | Source | Applies To |
|---|--------|--------|-----------|
| 1 | `setTimeout(fn, Infinity)` fires at 1ms due to 32-bit overflow | V8 toast agent | CFIX-04 |
| 2 | `setTimeout(fn, 0)` also fires at 1ms — cannot use 0 without guard | V8 toast agent | CFIX-04 |
| 3 | Never internal fetch from SSC to own API routes — extract shared helper | `nextjs.md` | UXPL-06 (if dynamic OG) |
| 4 | `process.env.KEY` inlined at build — can't validate dynamically | `nextjs.md` | UXPL-06 |
| 5 | Webhook handlers must return 500 on DB errors for retry | `stripe.md` | CFIX-04 (context) |

### High (likely regression)

| # | Gotcha | Source | Applies To |
|---|--------|--------|-----------|
| 6 | V8 toast has no `title`/`description` — only `message` | Toast agent | CFIX-04 |
| 7 | V8 toast has no `variant` — uses `type` instead | Toast agent | CFIX-04 |
| 8 | `revalidatePath` defaults to "page" not "layout" | `nextjs.md` | UXPL-06 |
| 9 | Supabase fluent chain mocks must match exact query shape | `testing.md` | CFIX-04 tests |
| 10 | Cart undo toasts use V8 — patch must not break `duration: 5000` path | Cart store | CFIX-04 |

### Medium (quality issue)

| # | Gotcha | Source | Applies To |
|---|--------|--------|-----------|
| 11 | E2E: use `.count() === 0` not `.not.toBeVisible()` for toast exit | `testing.md` | CFIX-04 tests |
| 12 | `loading="lazy"` + opacity:0 animated containers = images never load | `animation.md` | UXPL-06 |
| 13 | Toast backdrop blur causes mobile perf issues | `mobile-ux.md` | CFIX-04 |
| 14 | Drawer safe-area-inset: use position not padding on iOS | `mobile-ux.md` | CFIX-04 |

---

## 7. Data Contracts

### Toast V8 TypeScript Interface

```typescript
// src/lib/hooks/useToastV8.ts
export interface ToastOptions {
  message: string;
  type?: "success" | "error" | "info" | "warning" | "order" | "exception";
  duration?: number;       // 0 = persistent (after patch)
  sound?: boolean;
  action?: { label: string; onClick: () => void };
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  sound?: boolean;
  action?: ToastActionButton;
}
```

### Checkout Error Interface

```typescript
// src/types/errors.ts
export const ClientErrorCodes = {
  CHECKOUT_NETWORK_TIMEOUT: "CHECKOUT_NETWORK_TIMEOUT",
  // ...
} as const;

// src/components/ui/checkout/usePaymentSubmit.ts
interface CheckoutError {
  code: string;
  message: string;
}
```

### OG Metadata Shape

```typescript
// src/app/layout.tsx (root)
openGraph: {
  siteName: "Mandalay Morning Star",
  title: "Mandalay Morning Star",
  description: "Authentic Burmese cuisine delivered fresh to your door.",
  images: [{ url: "/og-image.png", width: 1200, height: 630 }],
}

// src/app/(public)/orders/[id]/share/page.tsx (dynamic)
openGraph: {
  title: `Order from Morning Star - ${dateStr}`,
  description: `${itemCount} item(s) — ${totalFormatted}`,
  url: `${siteUrl}/orders/${shareToken}/share`,
  type: "website",
  siteName: "Mandalay Morning Star",
  images: [{ url: `${siteUrl}/og-image.png`, width: 1200, height: 630 }],
}
```

---

## 8. Design Compliance Matrix

| Principle | Phase 117 Compliance | Notes |
|-----------|---------------------|-------|
| WCAG AA contrast | N/A for toast (uses token colors) | OG image: white text on gradient needs drop shadow |
| 44px touch targets | Existing toast dismiss button already compliant | No change needed |
| Motion tokens | Toast entry/exit animations already in Toast.tsx | No change needed |
| Semantic color tokens | V8 `type: "error"` maps to `toastConfig.error` colors | Verified in Toast.tsx:29-63 |
| Bilingual support | Banner handles Burmese; toast is English-only (consistent with all V8 toasts) | No change |
| Brand colors in OG | Must use exact token values | `#A41034`, `#EBCD00`, gradient |

---

## 9. Architectural Decisions

### Decision 1: Patch V8 vs. add `persistent` boolean

| Option | Pros | Cons | Chosen |
|--------|------|------|--------|
| Guard `duration: 0` in `addToRemoveQueue` | Minimal change, convention matches "0 = forever" | Less explicit than boolean | **YES** |
| Add `persistent?: boolean` to ToastOptions | More explicit, matches legacy API | Larger surface area change, type update | NO |

**Rationale**: `duration: 0` meaning "no auto-dismiss" is the standard convention in toast libraries (react-hot-toast, sonner). Minimal code change — just a guard clause.

### Decision 2: Remove legacy `useToast.ts` vs. keep

| Option | Pros | Cons | Chosen |
|--------|------|------|--------|
| Remove entirely | Clean, no dead code, prevents future confusion | Slightly larger diff | **YES** |
| Keep but deprecate | Safer if unknown consumers | Dead code remains | NO |

**Rationale**: Exhaustive search confirms zero consumers beyond `usePaymentSubmit.ts`. Safe to remove.

### Decision 3: OG image approach

| Option | Pros | Cons | Chosen |
|--------|------|------|--------|
| Sharp build script | Reproducible, existing dep, matches project patterns | More complex than static drop | **RECOMMENDED** |
| Static PNG drop | Simplest, immediate | Not reproducible, requires design tool | ACCEPTABLE |
| @vercel/og dynamic | Modern, per-page images | Overkill, new dep, runtime cost | NO |

**Rationale**: Either Sharp script or static drop works. User choice — Sharp is more maintainable.

---

## 10. File Map

### Create

| File | Purpose |
|------|---------|
| `public/og-image.png` | 1200x630 brand OG image |
| `scripts/generate-og-image.mjs` | Sharp-based image generator (optional) |

### Modify

| File | Change |
|------|--------|
| `src/lib/hooks/useToastV8.ts` | Add guard in `toast()` for `duration <= 0 \|\| !isFinite(duration)` |
| `src/components/ui/checkout/usePaymentSubmit.ts` | Swap import + transform toast call |
| `src/components/ui/checkout/__tests__/usePaymentSubmit.test.ts` | Update mock + assertions |
| `src/lib/hooks/index.ts` | Remove legacy `useToast` export |
| `src/lib/hooks/__tests__/useToastV8.test.ts` | Add persistent toast test case |

### Delete

| File | Reason |
|------|--------|
| `src/lib/hooks/useToast.ts` | Legacy, zero consumers after migration |
| `src/lib/hooks/__tests__/useToast.test.ts` | Tests for deleted module |

### Read (verification)

| File | Verify |
|------|--------|
| `src/components/ui/checkout/CheckoutErrorBanner.tsx` | No regression in retry flow |
| `src/components/ui/Toast.tsx` | Renders V8 toasts correctly |
| `src/app/layout.tsx` | OG metadata unchanged |
| `src/app/(public)/orders/[id]/share/page.tsx` | OG metadata unchanged |

---

## 11. Gray Area Resolutions

| # | Gray Area | Resolution | Confidence | Evidence |
|---|-----------|-----------|------------|----------|
| 1 | Legacy `useToast` cleanup scope | Remove entirely — only 1 consumer | HIGH | Exhaustive grep: 0 hook consumers, 1 function consumer |
| 2 | Toast action button needed? | No — banner has "Try again" | HIGH | Action buttons reserved for undo patterns (cart-store) |
| 3 | Toast message: merge or title only? | Title only ("Checkout timed out") | HIGH | V8 toasts avg 30-65 chars; max-w-[380px] container |
| 4 | Burmese in toast? | No — zero V8 toast precedent; banner handles it | HIGH | 81 files use V8, none bilingual |
| 5 | Test scope: unit or integration? | Both — update unit mock + add persistent toast unit test | HIGH | Existing V8 tests are unit-level only |
| 6 | `duration: Infinity` safe? | NO — must use `duration: 0` with guard patch | HIGH | Verified: setTimeout overflows 32-bit int → 1ms |
| 7 | OG image: static or dynamic? | Static asset (Sharp script optional) | HIGH | No dynamic OG exists; static sufficient for brand image |
| 8 | `duration: 0` convention? | Industry standard for "no auto-dismiss" | HIGH | react-hot-toast, sonner, radix-toast all use this |

---

## 12. V8 Toast Patch Specification

### Guard Clause Location

**File**: `src/lib/hooks/useToastV8.ts`
**Function**: `toast()` (~line 231)

```typescript
// CURRENT (line 231):
addToRemoveQueue(id, duration);

// PATCHED:
if (duration > 0 && isFinite(duration)) {
  addToRemoveQueue(id, duration);
}
```

### Test Case for Patch

```typescript
// In useToastV8.test.ts:
it("does not auto-dismiss when duration is 0", () => {
  vi.useFakeTimers();
  const { id } = toast({ message: "Persistent", duration: 0 });
  vi.advanceTimersByTime(60000); // 1 minute
  const state = useToast();
  expect(state.toasts.find(t => t.id === id)).toBeDefined();
  vi.useRealTimers();
});
```

---

## 13. Brand Identity for OG Image

### Color Palette

| Token | Hex | Usage in OG |
|-------|-----|-------------|
| `--color-primary` | `#A41034` | Logo accent, possible text |
| `--color-secondary` | `#EBCD00` | Golden highlights, decorative |
| `--hero-bg-start` | `#FB923C` | Gradient start (orange) |
| `--hero-bg-mid` | `#EC4899` | Gradient mid (pink) |
| `--hero-bg-end` | `#7C3AED` | Gradient end (violet) |
| White | `#FFFFFF` | Primary text on gradient |
| Cream | `#FDF8F0` | Possible text bg |

### Typography

| Role | Font | Weight | Size (in OG) |
|------|------|--------|-------------|
| Brand name | Nunito | 900 (Black) | 72-80px |
| Tagline | Nunito | 400 (Regular) | 28-32px |
| Burmese (optional) | Padauk | 400 | 24px |

### Existing Assets

| Asset | Path | Dimensions | Notes |
|-------|------|-----------|-------|
| Logo | `/public/logo.png` | 799x531 WebP | Red/gold star badge, alpha channel |
| Sunset | `/public/images/sunset_ubein.webp` | ~1200px wide | U Bein Bridge silhouette, golden tones |
| Icon 192 | `/public/icons/icon-192.png` | 192x192 | Brand mark for PWA |
| Icon 512 | `/public/icons/icon-512.png` | 512x512 | Brand mark for PWA |

---

## 14. Verification Checklist

### CFIX-04 Success Criteria

- [ ] Stripe 10s timeout fires a persistent error toast via `useToastV8`
- [ ] Toast uses `type: "error"` and renders with red styling in Toast.tsx
- [ ] Toast does NOT auto-dismiss (stays until manual dismiss)
- [ ] CheckoutErrorBanner retry flow still renders and recovers
- [ ] No regression in cart undo toasts (duration: 5000 still works)
- [ ] Legacy `useToast.ts` removed, barrel export cleaned
- [ ] Tests pass with V8 mock

### UXPL-06 Success Criteria

- [ ] `/public/og-image.png` exists (1200x630 PNG)
- [ ] Image is brand-appropriate (uses token colors, logo, tagline)
- [ ] Social crawler preview shows image thumbnail
- [ ] `layout.tsx` and `share/page.tsx` metadata unchanged
- [ ] Image file size reasonable (<500KB for fast social preview load)
