# Phase 47: Final LCP Measurement & Gap Closure - Research

**Researched:** 2026-02-06
**Domain:** Performance measurement, E2E testing, verification
**Confidence:** HIGH

## Summary

Phase 47 is a measurement and verification phase requiring no new features. The primary tasks are:

1. Running Lighthouse CLI to measure LCP on 4 customer routes (local + deployed)
2. Running bundle analysis to verify Phase 43 cart scoping savings
3. Writing Playwright E2E tests for cart flow verification (closing REQ-43.4/43.8/43.9)
4. Documenting results in PERFORMANCE.md and VERIFICATION.md

All required infrastructure exists: Lighthouse CI is configured (`lighthouserc.js`), bundle analyzer is installed (`@next/bundle-analyzer`), and Playwright is set up with existing cart-related tests in `e2e/checkout-flow.spec.ts` and `e2e/happy-path.spec.ts`.

**Primary recommendation:** Execute measurements via existing tooling, write dedicated cart E2E suite, update PERFORMANCE.md with final numbers.

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- Run Lighthouse on **both** local production build (`pnpm build && pnpm start`) and deployed Vercel URLs
- Deployed: measure both fresh preview deployment AND existing production URL
- **3 runs per page**, take median
- Measure **all 4 customer routes**: homepage, menu, checkout, order tracking
- **Both profiles**: mobile throttled (Lighthouse default) for official score, desktop for comparison
- Bundle analysis: report **current sizes only** (no Phase 40 baseline comparison)
- Capture **summary scores only** in PERFORMANCE.md (no HTML reports saved)
- If Google Fonts 403 build issue recurs: **fix the root cause** (don't skip font optimization)
- **Revised LCP target: < 4s** (adjusted from original 2.5s based on realistic assessment)
- If LCP is 4-6s: document gap, add follow-up optimization phase to **v1.6 backlog**
- Tests performed via **Playwright automation** (not manual)
- Results recorded as **written checklist in VERIFICATION.md** (no screenshots)
- REQ-47.5 (cart on customer routes): **full journey with edge cases** - happy path + empty cart, quantity changes, remove item, cart persistence across navigation
- REQ-47.6 (deep links): test **all cart-adjacent routes** - /cart, /checkout, /menu/[id], and any route with cart interaction
- Playwright is **already set up** in the project
- Cart tests **kept as permanent E2E suite** in CI going forward
- PERFORMANCE.md update: **summary table with before/after** (concise, quick reference)
- If LCP misses <4s: **identify top 3 bottlenecks** with specific files/resources, actionable for v1.6
- Milestone close: **auto-close v1.5 if LCP < 4s**, pause for user review if target missed
- STATE.md and ROADMAP.md updates: **leave for milestone close ceremony**, not Phase 47

### Claude's Discretion

- Bundle analysis success criteria for Phase 43 savings
- Per-route LCP thresholds (tiered based on page complexity)
- Whether to verify admin/driver routes lack cart components in Playwright
- Technical approach to fixing Google Fonts 403 issue

### Deferred Ideas (OUT OF SCOPE)

- Further LCP optimization beyond Phase 47 - v1.6 backlog (if target missed)
- CDN/hosting-level performance optimization - future consideration

</user_constraints>

---

## Standard Stack

All tools already installed and configured. No new dependencies needed.

### Core

| Tool                  | Version | Purpose                                    | Project Status |
| --------------------- | ------- | ------------------------------------------ | -------------- |
| @lhci/cli             | 0.15.1  | Lighthouse CI for programmatic measurement | Installed      |
| @next/bundle-analyzer | 16.1.3  | Bundle size analysis                       | Installed      |
| @playwright/test      | 1.57.0  | E2E test automation                        | Installed      |

### Supporting

| Tool              | Purpose                   | When to Use                    |
| ----------------- | ------------------------- | ------------------------------ |
| `pnpm lighthouse` | Run Lighthouse CI locally | LCP measurement on local build |
| `pnpm analyze`    | Generate bundle analysis  | Verify cart scoping savings    |
| `pnpm test:e2e`   | Run Playwright tests      | Cart flow verification         |

### No New Dependencies

This phase uses existing tooling only. Do NOT install additional packages.

---

## Architecture Patterns

### Measurement Workflow

```
1. Production Build
   pnpm build && pnpm start

2. Local Lighthouse (4 routes x 3 runs x 2 profiles = 24 measurements)
   - Homepage: http://localhost:3000/
   - Menu: http://localhost:3000/menu
   - Cart: http://localhost:3000/cart (added - not in current lighthouserc.js)
   - Checkout: http://localhost:3000/checkout
   - Order tracking: http://localhost:3000/orders/[id]/tracking (needs sample ID)

3. Deployed Lighthouse (same routes on Vercel URLs)
   - Preview deployment
   - Production URL

4. Bundle Analysis
   ANALYZE=true pnpm build
   - Compare cart-related chunks between route groups
```

### Lighthouse CLI Patterns

**Running Lighthouse programmatically:**

```bash
# Mobile (official score - default throttling)
npx @lhci/cli autorun

# Or run individual measurements:
npx lighthouse http://localhost:3000/ \
  --output=json \
  --output-path=./lighthouse-homepage.json \
  --chrome-flags="--no-sandbox --headless" \
  --only-categories=performance
```

**Extracting LCP from JSON output:**

```javascript
// LCP is in audits['largest-contentful-paint'].numericValue (ms)
const lcp = report.audits["largest-contentful-paint"].numericValue / 1000;
```

### Cart E2E Test Structure

```typescript
// e2e/cart-flow.spec.ts - new permanent suite
import { test, expect } from "@playwright/test";

test.describe("Cart Flow Verification (REQ-47.5)", () => {
  // Happy path
  test("add item, modify quantity, checkout");

  // Edge cases
  test("empty cart shows empty state");
  test("quantity changes persist");
  test("remove item updates total");
  test("cart persists across navigation");
});

test.describe("Deep Link Verification (REQ-47.6)", () => {
  test("/cart loads correctly");
  test("/checkout with empty cart redirects");
  test("/menu/[id] allows add to cart");
});

test.describe.optional("Admin No-Cart Verification (REQ-47.7)", () => {
  // Claude's discretion - recommend including
  test("admin routes lack cart components");
  test("driver routes lack cart components");
});
```

### Anti-Patterns to Avoid

- **Running Lighthouse in dev mode:** Always use production build (`pnpm build && pnpm start`)
- **Single run measurements:** Take median of 3 runs for statistical validity
- **Ignoring Google Fonts 403:** Fix root cause, don't suppress errors
- **Manual test results without automation:** Use Playwright, not manual clicking

---

## Don't Hand-Roll

Problems that have existing solutions in this project:

| Problem                | Don't Build           | Use Instead                               | Why                                       |
| ---------------------- | --------------------- | ----------------------------------------- | ----------------------------------------- |
| Lighthouse measurement | Custom script         | `@lhci/cli autorun` via `pnpm lighthouse` | Already configured in `lighthouserc.js`   |
| Bundle analysis        | Manual inspection     | `ANALYZE=true pnpm build`                 | Already configured in `next.config.ts`    |
| Cart E2E testing       | Manual test checklist | Playwright tests                          | Already set up, produces reliable results |
| LCP extraction         | JSON parsing script   | Lighthouse report summary                 | CLI outputs human-readable summary        |

**Key insight:** Phase 47 is verification, not development. Use existing tools, don't create new ones.

---

## Common Pitfalls

### Pitfall 1: Google Fonts 403 During Build

**What goes wrong:** Build fails with 403 error when fetching Google Fonts in CI/sandboxed environments.
**Why it happens:** Network restrictions, rate limiting, or regional blocks on Google Fonts API.
**How to avoid:**

1. **Primary fix:** Use Next.js font optimization which downloads fonts at build time:
   ```typescript
   // Already configured in src/app/layout.tsx
   import { Inter, Playfair_Display } from "next/font/google";
   ```
2. **Fallback (if needed):** Self-host fonts locally by downloading from Google Fonts and placing in `/public/fonts/`
3. **CI retry:** If intermittent, retry the build

**Warning signs:** Build output shows `Failed to fetch [font] from Google Fonts`

### Pitfall 2: Measuring Wrong Environment

**What goes wrong:** LCP measured on dev server shows different values than production.
**Why it happens:** Dev mode has hot reload, no minification, source maps in bundle.
**How to avoid:** Always `pnpm build && pnpm start` before Lighthouse
**Warning signs:** Unusually high TBT, bundle sizes larger than expected

### Pitfall 3: Order Tracking Route Needs Dynamic ID

**What goes wrong:** `/orders/[id]/tracking` returns 404 in Lighthouse.
**Why it happens:** Route requires valid order ID parameter.
**How to avoid:**

- Use a seeded test order ID from database
- Or skip tracking route for Lighthouse (document limitation)
- Alternative: measure tracking page structure without dynamic data

### Pitfall 4: Cart Tests Without Data Setup

**What goes wrong:** Cart tests fail because cart is empty or menu items unavailable.
**Why it happens:** No `beforeEach` setup to populate cart state.
**How to avoid:**

- Existing pattern: add item in `beforeEach` (see `e2e/checkout-flow.spec.ts`)
- Clear cart state before each test for isolation

### Pitfall 5: Lighthouse CI vs Manual Lighthouse

**What goes wrong:** LHCI results differ from Chrome DevTools Lighthouse.
**Why it happens:** Different throttling settings, browser versions, or emulation.
**How to avoid:**

- Use consistent method (prefer LHCI for reproducibility)
- Document which method produced the numbers
- The `lighthouserc.js` config specifies mobile throttling and emulation

---

## Code Examples

### Lighthouse Measurement Commands

```bash
# Local production build measurement
pnpm build && pnpm start

# In separate terminal - run LHCI (uses lighthouserc.js config)
pnpm lighthouse

# Output: JSON reports in .lighthouseci/ directory
```

### Bundle Analysis Commands

```bash
# Full bundle analysis with visual report
ANALYZE=true pnpm build

# Opens browser with interactive treemap
# Look for cart-related chunks in admin/driver route bundles
```

### Cart E2E Test Pattern

```typescript
// Based on existing e2e/checkout-flow.spec.ts pattern
import { test, expect } from "@playwright/test";

test.describe("Cart Flow - Happy Path", () => {
  test("complete cart journey", async ({ page }) => {
    // 1. Navigate to menu
    await page.goto("/");

    // 2. Add item to cart
    await page.locator('[data-testid="menu-item"]').first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();

    // 3. Verify cart indicator updated
    const cartIcon = page.locator('[data-testid="cart-button"]');
    await expect(cartIcon).toContainText("1");

    // 4. Open cart drawer
    await cartIcon.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // 5. Proceed to checkout
    await page.getByRole("button", { name: /checkout/i }).click();
    await expect(page).toHaveURL(/\/(checkout|login)/);
  });
});

test.describe("Cart Flow - Edge Cases", () => {
  test("empty cart shows empty state", async ({ page }) => {
    await page.goto("/cart");
    await expect(page.getByText(/empty|no items/i)).toBeVisible();
  });

  test("cart persists across navigation", async ({ page }) => {
    // Add item
    await page.goto("/");
    await page.locator('[data-testid="menu-item"]').first().click();
    await page.getByRole("button", { name: /add to cart/i }).click();
    await page.keyboard.press("Escape");

    // Navigate away
    await page.goto("/menu");

    // Cart should still have item
    const cartIcon = page.locator('[data-testid="cart-button"]');
    await expect(cartIcon).toContainText("1");
  });
});
```

### Updating lighthouserc.js for Order Tracking

```javascript
// Add order tracking route (requires valid order ID)
url: [
  'http://localhost:3000/',
  'http://localhost:3000/menu',
  'http://localhost:3000/cart',
  'http://localhost:3000/checkout',
  // Note: tracking requires auth + valid order ID
  // 'http://localhost:3000/orders/[id]/tracking',
],
```

---

## Discretion Recommendations

### Bundle Analysis Success Criteria

**Recommendation:** Verify cart components are absent from admin/driver bundles.

**Measurable criteria:**

- Run `ANALYZE=true pnpm build`
- In browser-side bundle treemap, navigate to admin and driver route chunks
- Search for: `CartBar`, `CartDrawer`, `FlyToCart`, `CartOverlays`
- **Pass:** Zero matches in admin/driver bundles
- **Pass:** Cart components present in customer/public bundles

**Quantitative fallback:** If treemap is unclear, measure total JS size for `/admin` route before/after Phase 43 cart scoping (historical comparison).

### Per-Route LCP Thresholds

**Recommendation:** Tiered thresholds based on page complexity:

| Route                            | LCP Target | Rationale                                |
| -------------------------------- | ---------- | ---------------------------------------- |
| Homepage `/`                     | < 4.0s     | Image-heavy, emoji LCP element           |
| Menu `/menu`                     | < 4.0s     | CardImage gallery, primary shopping page |
| Cart `/cart`                     | < 3.5s     | Lighter page, no heavy images            |
| Checkout `/checkout`             | < 4.5s     | Form + Google Maps component             |
| Tracking `/orders/[id]/tracking` | < 5.0s     | Real-time map, eager Google Maps load    |

**Rationale:** Checkout and tracking have Google Maps (~120KB), which adds load time even with code-splitting (eager lazy for tracking).

### Admin/Driver No-Cart Verification

**Recommendation:** Include verification with lightweight approach.

**Approach:**

```typescript
test.describe("Route Isolation - Admin No Cart", () => {
  test("admin dashboard has no cart indicator", async ({ page }) => {
    // Note: Requires admin auth - mark as optional if auth setup complex
    await page.goto("/admin");
    await expect(page.locator('[data-testid="cart-button"]')).not.toBeVisible();
  });
});
```

**Rationale:** The cart scoping in Phase 43 is a structural guarantee (CartOverlays only in customer/public layouts). The test is cheap insurance but optional if auth setup is complex.

### Google Fonts 403 Fix Approach

**Recommendation:** The project already uses Next.js font optimization correctly.

**Current implementation (src/app/layout.tsx):**

```typescript
import { Inter, Playfair_Display } from "next/font/google";
```

This downloads fonts at build time, not runtime. If 403 errors occur:

1. **Likely cause:** Transient network issue or CI rate limiting
2. **First fix:** Retry the build
3. **Persistent fix:** Self-host fonts locally:
   - Download Inter and Playfair Display from fonts.google.com
   - Place `.woff2` files in `/public/fonts/`
   - Update layout.tsx to use `next/font/local`

**Do NOT:** Add retry logic or network fallbacks. The existing `next/font/google` approach is correct.

---

## State of the Art

| Old Approach           | Current Approach        | When Changed | Impact                                   |
| ---------------------- | ----------------------- | ------------ | ---------------------------------------- |
| Manual Lighthouse runs | LHCI in CI              | Phase 44     | Automated regression detection           |
| Full library imports   | optimizePackageImports  | Phase 44     | Tree-shaking for framer-motion, recharts |
| Global cart provider   | Route-group scoped cart | Phase 43     | ~60KB removed from admin/driver bundles  |
| motion.\* components   | m.\* with LazyMotion    | Phase 44     | 86% animation bundle reduction           |

**Deprecated/outdated:**

- Manual `useMemo`/`useCallback`: React Compiler handles this automatically
- Lighthouse in Chrome DevTools for CI: Use LHCI for reproducible measurements

---

## Open Questions

### 1. Order Tracking Route Measurement

**What we know:** Route requires authenticated user with valid order ID.
**What's unclear:** Whether to seed test data or skip this route for Lighthouse.
**Recommendation:**

- Attempt with seeded test order ID if available
- If not feasible, document limitation and measure other 3 routes
- Cart tests can still cover tracking page navigation

### 2. Vercel Deployment for Measurement

**What we know:** User wants measurements on preview and production deployments.
**What's unclear:** Whether to create a fresh preview deployment or use existing.
**Recommendation:**

- Use existing production URL if available
- Create preview deployment via Vercel CLI or push to PR branch
- Document URLs measured

### 3. Cart State in Checkout Test

**What we know:** Checkout redirects to login for unauthenticated users.
**What's unclear:** Whether to test authenticated checkout flow.
**Recommendation:**

- Test up to login redirect (current pattern in `checkout-flow.spec.ts`)
- Full authenticated checkout is out of scope for cart verification

---

## Requirements Mapping

| REQ      | Research Finding                         | Approach                         |
| -------- | ---------------------------------------- | -------------------------------- |
| REQ-47.1 | Build may hit Google Fonts 403           | Retry or self-host fonts         |
| REQ-47.2 | Lighthouse CLI configured                | `pnpm lighthouse` on homepage    |
| REQ-47.3 | Lighthouse CLI configured                | `pnpm lighthouse` on menu        |
| REQ-47.4 | Bundle analyzer installed                | `ANALYZE=true pnpm build`        |
| REQ-47.5 | Existing cart tests as template          | New `e2e/cart-flow.spec.ts`      |
| REQ-47.6 | Deep link tests needed                   | Add to cart-flow.spec.ts         |
| REQ-47.7 | Structural guarantee exists              | Optional Playwright verification |
| REQ-47.8 | PERFORMANCE.md exists                    | Update with summary table        |
| REQ-47.9 | Lighthouse output identifies bottlenecks | Document if LCP > 4s             |

---

## Sources

### Primary (HIGH confidence)

- Project files: `lighthouserc.js`, `package.json`, `next.config.ts`, `playwright.config.ts`
- Existing tests: `e2e/checkout-flow.spec.ts`, `e2e/happy-path.spec.ts`
- Project docs: `PERFORMANCE.md`, `.planning/v1.5-MILESTONE-AUDIT.md`

### Secondary (MEDIUM confidence)

- [Lighthouse CLI documentation](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint) - LCP measurement
- [Next.js Bundle Analyzer docs](https://nextjs.org/docs/14/pages/building-your-application/optimizing/bundle-analyzer) - Bundle analysis
- [Checkly Playwright Checkout Testing Guide](https://www.checklyhq.com/docs/learn/playwright/checkout-testing-guide/) - E2E patterns
- [Next.js Google Fonts discussion](https://github.com/vercel/next.js/discussions/46012) - 403 error fixes

### Tertiary (LOW confidence)

- General web search patterns for Lighthouse CLI programmatic usage

---

## Metadata

**Confidence breakdown:**

- Tooling: HIGH - All tools already installed and configured in project
- Measurement approach: HIGH - Existing `lighthouserc.js` provides template
- Cart testing: HIGH - Existing `checkout-flow.spec.ts` provides exact patterns
- Google Fonts fix: MEDIUM - Standard Next.js approach, may need troubleshooting

**Research date:** 2026-02-06
**Valid until:** 2026-03-06 (30 days - stable tooling phase)
