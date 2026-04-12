# Phase 117: Integration & Asset Fixes - Context

**Gathered:** 2026-04-11 (assumptions mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Close two gaps from v2.3 milestone audit: CFIX-04 (dead toast dispatch in usePaymentSubmit.ts) and UXPL-06 (missing OG image asset). No new features — fix existing wiring and supply missing asset.

</domain>

<decisions>
## Implementation Decisions

### Toast Wiring Fix (CFIX-04)
- **D-01:** Patch `useToastV8.ts` `toast()` function to guard `addToRemoveQueue` — skip queue when `duration <= 0 || !isFinite(duration)`. Convention: `duration: 0` means "no auto-dismiss" (matches react-hot-toast, sonner). This is required because `setTimeout(fn, Infinity)` overflows 32-bit int and fires at ~1ms.
- **D-02:** Swap import in `usePaymentSubmit.ts` from `import { toast } from "@/lib/hooks/useToast"` to `import { toast } from "@/lib/hooks/useToastV8"`.
- **D-03:** Transform toast call from `{ title, description, variant, persistent }` to `{ message: "Checkout timed out", type: "error", duration: 0 }`. Use title only — banner handles detailed explanation + Burmese text.
- **D-04:** No action button on the toast. CheckoutErrorBanner already provides "Try again" retry button. Toast actions are reserved for undo patterns (cart remove/clear).
- **D-05:** No Burmese text in toast. Zero V8 toast precedent for bilingual content across 81 consumer files. Banner handles bilingual display.

### Legacy Toast Cleanup
- **D-06:** Delete `src/lib/hooks/useToast.ts` entirely — zero consumers remain after migration. Only `usePaymentSubmit.ts` imports the legacy `toast()` function; no component uses the `useToast()` hook return value.
- **D-07:** Delete `src/lib/hooks/__tests__/useToast.test.ts` (tests for deleted module).
- **D-08:** Remove legacy barrel export from `src/lib/hooks/index.ts` line 131: `export { useToast, toast } from "./useToast"`.

### OG Image Asset (UXPL-06)
- **D-09:** Create `/public/og-image.png` as a static 1200x630 PNG. No dynamic OG generation (@vercel/og) — static asset is sufficient for brand image. All metadata code in `layout.tsx` and `share/page.tsx` already references this path correctly.
- **D-10:** Image design: hero sunset gradient background (`#FB923C → #EC4899 → #7C3AED`), logo from `/public/logo.png` centered, brand name "Mandalay Morning Star" in white, tagline "Authentic Burmese Cuisine Delivered Fresh" below. Use `sharp` (v0.34.5, already in deps) for programmatic generation via build script.
- **D-11:** No code changes to metadata — `layout.tsx:46` and `share/page.tsx:71,101,108` already reference `/og-image.png` with correct dimensions.

### Test Updates
- **D-12:** Update `usePaymentSubmit.test.ts` mock from `vi.mock("@/lib/hooks/useToast")` to `vi.mock("@/lib/hooks/useToastV8")`. Update assertions from `persistent/variant` to `duration/type`.
- **D-13:** Add persistent toast unit test in `useToastV8.test.ts` — verify `duration: 0` toast is not auto-dismissed after 60s with fake timers.

### Claude's Discretion
- OG image exact layout composition (safe zone, text sizing, shadow treatment)
- Whether to commit the Sharp build script or just the output PNG
- Exact JSDoc wording for `duration: 0` convention documentation in ToastOptions
- Whether to add `favicon.ico` from existing icon-192 (low-priority improvement)

</decisions>

<specifics>
## Specific Ideas

- Toast message must be concise: "Checkout timed out" (19 chars). V8 toast container is `max-w-[380px]` — long merged messages wrap awkwardly.
- The `cart-store.ts:498` comment ("Long-lived for visibility — no persistent field in ToastOptions") confirms the team knew persistent support was missing. The guard clause fix resolves this systemically.
- OG image must stay within center 1000x500px safe zone — social platforms crop edges unpredictably.
- `NEXT_PUBLIC_SITE_URL` fallback is `https://delivery.mandalaymorningstar.com` (share/page.tsx:91).

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### CFIX-04 Toast Fix
- `.planning/phases/117-integration-asset-fixes/117-PRECONTEXT-RESEARCH.md` — Full research with API mismatch table, setTimeout overflow analysis, exact diff specifications
- `.planning/v2.3-MILESTONE-AUDIT.md` lines 31-37 — CFIX-04 gap evidence (orphaned useToast import)
- `src/lib/hooks/useToastV8.ts` — V8 toast API, `addToRemoveQueue` function at lines 186-195, `toast()` at line 205
- `src/lib/hooks/useToast.ts` — Legacy toast API (to be deleted)
- `src/components/ui/checkout/usePaymentSubmit.ts` — Target file, toast call at lines 220-226
- `src/components/ui/checkout/__tests__/usePaymentSubmit.test.ts` — Test mock at lines 33-41, assertions at lines 228-230
- `src/components/ui/Toast.tsx` — V8 toast renderer, imports at lines 19-23, toastConfig at lines 29-63
- `src/components/ui/checkout/CheckoutErrorBanner.tsx` — CHECKOUT_NETWORK_TIMEOUT case at lines 169-181 (must not regress)

### UXPL-06 OG Image
- `.planning/phases/117-integration-asset-fixes/117-PRECONTEXT-RESEARCH.md` §13 — Brand identity colors, fonts, existing assets
- `.planning/v2.3-MILESTONE-AUDIT.md` lines 38-44 — UXPL-06 gap evidence (missing og-image.png)
- `src/app/layout.tsx` line 46 — Root OG image reference
- `src/app/(public)/orders/[id]/share/page.tsx` lines 71, 101, 108 — Share page OG image references
- `src/styles/tokens.css` — Brand color tokens (primary, secondary, hero gradient)
- `public/logo.png` — Brand logo asset (799x531 WebP)

### Phase Contracts (must not break)
- `.planning/phases/110-critical-fixes/110-VERIFICATION.md` — Phase 110 contracts (10s timeout, idempotency key, banner retry)
- `.planning/phases/116-micro-interactions-polish/116-VERIFICATION.md` — Phase 116 contracts (generateMetadata, cart undo toasts)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useToastV8.ts` toast() function — target for guard clause patch, then import swap
- `Toast.tsx` ToastContainer — already renders V8 toasts with type-based styling (toastConfig map)
- `sharp` v0.34.5 — already in deps for image processing, usable for OG image generation
- `/public/logo.png` — 799x531 brand mark with alpha channel
- Hero gradient tokens — `--hero-bg-start: #FB923C`, `--hero-bg-mid: #EC4899`, `--hero-bg-end: #7C3AED`

### Established Patterns
- V8 toast pattern: `toast({ message: "...", type: "success"|"error"|"info"|"warning", duration: 5000 })` — 81 files follow this
- Cart undo toasts use `duration: 5000` with action buttons — guard clause must preserve this path
- Build scripts in `scripts/` directory: `build-sw.mjs`, `seed-menu.ts` — OG script follows same pattern
- Barrel exports in `src/lib/hooks/index.ts` — must clean legacy export after deletion

### Integration Points
- `usePaymentSubmit.ts` → `useToastV8.ts` (new dependency after swap)
- `usePaymentSubmit.ts` → `CheckoutErrorBanner.tsx` (existing, via error state — untouched)
- `Toast.tsx` ��� `useToastV8.ts` (existing consumer — benefits from guard clause fix)
- `layout.tsx` → `/public/og-image.png` (existing reference — just needs the file)
- `share/page.tsx` → `/public/og-image.png` (existing reference — just needs the file)

</code_context>

<deferred>
## Deferred Ideas

- Dynamic per-order OG images via `@vercel/og` — future milestone (richer share previews with item names/totals rendered into image)
- Audit all `duration: 30_000` workarounds in codebase — tech debt cleanup after guard clause enables `duration: 0`
- Social preview E2E test (Playwright fetch of og:image meta → assert 200) — future test hardening phase
- `favicon.ico` generation from icon-192 — minor improvement, not blocking any requirement

</deferred>

---

*Phase: 117-integration-asset-fixes*
*Context gathered: 2026-04-11*
