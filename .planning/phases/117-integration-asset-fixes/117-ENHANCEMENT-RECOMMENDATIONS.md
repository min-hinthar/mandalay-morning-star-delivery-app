# Phase 117: Enhancement Recommendations

**Phase**: 117 — Integration & Asset Fixes
**Generated**: 2026-04-11 (12-agent deep protocol)

---

## Priority Matrix

| # | Recommendation | Priority | Effort | Impact |
|---|---------------|----------|--------|--------|
| 1 | Patch V8 `addToRemoveQueue` guard clause | MUST-HAVE | XS | Blocks CFIX-04 |
| 2 | Swap `usePaymentSubmit.ts` import to V8 | MUST-HAVE | XS | Core fix |
| 3 | Create `/public/og-image.png` | MUST-HAVE | S | Core fix |
| 4 | Remove legacy `useToast.ts` entirely | MUST-HAVE | XS | Dead code cleanup |
| 5 | Add persistent toast unit test | MUST-HAVE | XS | Prevents regression |
| 6 | Update `usePaymentSubmit.test.ts` mock | MUST-HAVE | XS | Test parity |
| 7 | Add `favicon.ico` from existing icon | SHOULD-HAVE | XS | Prevents 404 |
| 8 | Add OG image build script | SHOULD-HAVE | S | Reproducibility |
| 9 | Audit `duration: 30_000` workarounds | NICE-TO-HAVE | XS | Tech debt signal |
| 10 | Add social preview E2E test | NICE-TO-HAVE | M | Prevents future regression |
| 11 | Dynamic per-order OG images | NICE-TO-HAVE | L | Better share previews |
| 12 | Toast persistence documentation | NICE-TO-HAVE | XS | Developer guidance |

---

## Detailed Recommendations

### 1. Patch V8 `addToRemoveQueue` Guard Clause

**Priority**: MUST-HAVE
**What**: Add `if (duration > 0 && isFinite(duration))` guard before `addToRemoveQueue` call in `useToastV8.ts` toast function (~line 231).
**Why**: `setTimeout(fn, Infinity)` and `setTimeout(fn, 0)` both fire at ~1ms due to 32-bit integer overflow. Without this patch, persistent toasts are impossible in V8. This blocks the entire CFIX-04 fix.
**Design compliance**: No UI change — internal behavior fix.
**Implementation hint**: Single line change. Convention: `duration: 0` means "no auto-dismiss" (matches react-hot-toast, sonner).

### 2. Swap `usePaymentSubmit.ts` Import to V8

**Priority**: MUST-HAVE
**What**: Change line 6 from `import { toast } from "@/lib/hooks/useToast"` to `import { toast } from "@/lib/hooks/useToastV8"`. Transform toast call from `{title, description, variant, persistent}` to `{message, type, duration}`.
**Why**: Core CFIX-04 fix — the legacy import dispatches to a dead store that no renderer consumes.
**Design compliance**: Toast renders with V8 `error` type styling (red icon, border) via `toastConfig.error` in Toast.tsx.
**Implementation hint**: Message should be title only ("Checkout timed out") — banner handles the detailed explanation. Use `type: "error"` and `duration: 0`.

### 3. Create `/public/og-image.png`

**Priority**: MUST-HAVE
**What**: 1200x630 PNG using brand colors (hero gradient `#FB923C → #EC4899 → #7C3AED`), logo, and tagline ("Authentic Burmese Cuisine Delivered Fresh").
**Why**: Core UXPL-06 fix — four metadata references point to this file but it doesn't exist, causing 404 for social crawlers.
**Design compliance**: Must use exact brand tokens. White text on gradient needs drop shadow for readability. Keep critical elements within center 1000x500px safe zone.
**Implementation hint**: `sharp` v0.34.5 already in deps. Compose with `sharp.composite()` for logo overlay on gradient canvas. Alternatively, supply a pre-made PNG.

### 4. Remove Legacy `useToast.ts` Entirely

**Priority**: MUST-HAVE
**What**: Delete `src/lib/hooks/useToast.ts` and `src/lib/hooks/__tests__/useToast.test.ts`. Remove barrel export from `src/lib/hooks/index.ts:131`.
**Why**: After the import swap, legacy `useToast` has zero consumers. Dead code risks future confusion (developers might import the wrong one).
**Design compliance**: N/A — internal cleanup.
**Implementation hint**: Exhaustive search confirms only `usePaymentSubmit.ts` imports the legacy `toast()` function. No component uses the `useToast()` hook return value.

### 5. Add Persistent Toast Unit Test

**Priority**: MUST-HAVE
**What**: Add test in `useToastV8.test.ts` verifying that `duration: 0` toasts are not auto-dismissed after 60s.
**Why**: The guard clause patch is a behavioral change that needs test coverage. Without it, a future refactor could reintroduce the bug.
**Design compliance**: N/A — test only.
**Implementation hint**: Use `vi.useFakeTimers()`, call `toast({ message: "x", duration: 0 })`, advance 60s, assert toast still exists in store.

### 6. Update `usePaymentSubmit.test.ts` Mock

**Priority**: MUST-HAVE
**What**: Change mock from `vi.mock("@/lib/hooks/useToast")` to `vi.mock("@/lib/hooks/useToastV8")`. Update assertions from `persistent/variant` to `duration/type`.
**Why**: Test must match the new import path and V8 API shape.
**Design compliance**: N/A — test only.
**Implementation hint**: Mock shape needs `expanded` and `toggleExpanded` in addition to existing fields.

### 7. Add `favicon.ico` from Existing Icon

**Priority**: SHOULD-HAVE
**What**: Generate `public/favicon.ico` (16x16 + 32x32) from existing `public/icons/icon-192.png`.
**Why**: Browsers auto-request `/favicon.ico`. Currently returns 404. Layout.tsx already points to icon-192 but some browsers ignore the `<link>` tag and request `/favicon.ico` directly.
**Design compliance**: Uses existing brand mark.
**Implementation hint**: `sharp` can resize icon-192 to 32x32 PNG. For true `.ico` format, use `to-ico` npm package or just serve as PNG renamed.

### 8. Add OG Image Build Script

**Priority**: SHOULD-HAVE
**What**: Create `scripts/generate-og-image.mjs` that programmatically generates the OG image using Sharp compositing.
**Why**: Reproducible image generation. If brand colors change, re-run script. Matches project pattern (`scripts/build-sw.mjs`, `scripts/seed-menu.ts`).
**Design compliance**: Script reads from token values for exact brand compliance.
**Implementation hint**: `sharp({ create: { width: 1200, height: 630, channels: 4, background: ... } }).composite([...]).png().toFile('public/og-image.png')`. Add to `package.json`: `"og:generate": "node scripts/generate-og-image.mjs"`.

### 9. Audit `duration: 30_000` Workarounds

**Priority**: NICE-TO-HAVE
**What**: Search for toast calls using high duration values as workaround for missing persistent support. After the guard patch, these could use `duration: 0` instead.
**Why**: `cart-store.ts:498` has a comment explicitly noting the workaround. There may be others.
**Design compliance**: N/A — internal.
**Implementation hint**: `grep -r "duration: 30" src/` to find workarounds. Evaluate case-by-case whether `duration: 0` is more appropriate.

### 10. Add Social Preview E2E Test

**Priority**: NICE-TO-HAVE
**What**: Playwright test that fetches `/orders/[id]/share` and asserts `og:image` meta tag resolves to a 200 response.
**Why**: Prevents future regression where someone removes or renames the OG image.
**Design compliance**: N/A — test only.
**Implementation hint**: `page.goto(shareUrl)` → `page.locator('meta[property="og:image"]').getAttribute('content')` → `fetch(imageUrl)` → assert 200.

### 11. Dynamic Per-Order OG Images

**Priority**: NICE-TO-HAVE
**What**: Use `@vercel/og` or `next/og` to generate per-order share images showing item names, total, and delivery date.
**Why**: Much richer share experience — each order gets a unique preview card instead of generic brand image.
**Design compliance**: Would need brand-compliant template with tokens.
**Implementation hint**: Defer to future milestone. Current static image satisfies UXPL-06 requirement. `@vercel/og` uses Satori (SVG→PNG) at edge runtime — would need new API route.

### 12. Toast Persistence Documentation

**Priority**: NICE-TO-HAVE
**What**: Add JSDoc comment on `ToastOptions.duration` documenting that `0` means "no auto-dismiss".
**Why**: Convention isn't obvious. The `cart-store.ts` workaround comment proves developers didn't know how to make persistent toasts.
**Design compliance**: N/A — documentation.
**Implementation hint**: Single JSDoc line: `/** Auto-dismiss delay in ms. 0 = persistent (no auto-dismiss). Default: 5000 */`

---

## Summary

**6 MUST-HAVE items** form the core Phase 117 deliverable:
- V8 guard patch + import swap + toast call transform + test updates + legacy removal + OG image

**2 SHOULD-HAVE items** improve quality:
- favicon.ico (prevents 404) + OG build script (reproducibility)

**4 NICE-TO-HAVE items** are future improvements:
- Workaround audit + E2E test + dynamic OG + docs
