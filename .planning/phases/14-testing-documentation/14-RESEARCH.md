# Phase 14: Testing & Documentation - Research

**Researched:** 2026-01-23
**Domain:** Visual regression testing, documentation updates
**Confidence:** HIGH

## Summary

Phase 14 completes visual regression test coverage for admin and driver flows, then updates documentation to reflect the completed V8 migration. Existing infrastructure is fully set up - Playwright configured with visual regression, Webpack mode enabled, snapshot directory defined. Current tests exist but have minimal admin/driver coverage (single test each, no state variations).

Documentation requirements are straightforward: Z-INDEX-MIGRATION.md is outdated (shows 64 violations when Phase 10 achieved 0), and v7-index references exist only in .planning phase docs (30 files), not in actual component documentation like component-guide.md.

**Primary recommendation:** Extend visual-regression.spec.ts with comprehensive admin/driver state tests; update Z-INDEX-MIGRATION.md to completion status; remove v7-index from planning docs (DOCS-02 scope is component docs, which have none).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @playwright/test | ^1.57.0 | E2E and visual regression | Already configured in project |
| Playwright toHaveScreenshot | built-in | Snapshot comparison | Native Playwright API, no extra deps |

### Configuration
| Setting | Value | Purpose |
|---------|-------|---------|
| webServer.command | `pnpm dev --webpack` | Turbopack CSS issues (per STATE.md) |
| snapshotDir | `./e2e/__snapshots__` | Centralized snapshot storage |
| maxDiffPixels | 100-150 | Tolerance for anti-aliasing differences |
| threshold | 0.2 | 20% pixel difference tolerance |

### No Additional Libraries Needed
Visual regression tests use built-in Playwright capabilities. No new dependencies required.

## Architecture Patterns

### Existing Test Structure
```
e2e/
├── visual-regression.spec.ts   # Main visual tests (extend this)
├── admin-operations.spec.ts    # Functional admin tests
├── driver-flow.spec.ts         # Functional driver tests
└── __snapshots__/              # Baseline images (to create)
```

### Pattern 1: State-Based Visual Tests
**What:** Capture different application states, not just pages
**When to use:** Admin/driver dashboards have multiple visual states
**Example:**
```typescript
// Admin dashboard states
test.describe("Admin Dashboard Visual Regression", () => {
  test("admin dashboard - loading state", async ({ page }) => {
    // Intercept API to delay response
    await page.route("**/api/admin/**", async (route) => {
      await new Promise(r => setTimeout(r, 5000));
      await route.continue();
    });
    await page.goto("/admin");
    await expect(page).toHaveScreenshot("admin-loading.png");
  });

  test("admin dashboard - data loaded", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("admin-dashboard.png");
  });
});
```

### Pattern 2: Authentication Bypass for Visual Tests
**What:** Skip auth for visual-only tests using test data
**When to use:** When functional auth tests exist separately
**Example:**
```typescript
// Mock auth state for visual tests
test.beforeEach(async ({ page }) => {
  // The page redirects to login - capture login state OR
  // use page.route to mock auth responses
});
```

### Pattern 3: Network Mocking for Fonts
**What:** Mock or block Google Fonts to avoid TLS failures
**When to use:** Sandboxed environments without network access
**Example:**
```typescript
await page.route("**/fonts.googleapis.com/**", route => route.fulfill({
  status: 200,
  contentType: "text/css",
  body: "/* mocked fonts */"
}));
```

### Anti-Patterns to Avoid
- **Capturing full page for state-specific tests:** Use element locators for targeted state capture
- **Waiting for networkidle with mocked APIs:** Use explicit waitFor conditions
- **Creating new test files:** Extend visual-regression.spec.ts for consistency

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Font rendering differences | Custom font loading | Mock fonts.googleapis.com | Network-independent tests |
| Screenshot comparison | Custom diff logic | toHaveScreenshot() | Built-in Playwright, well-tested |
| State capture timing | Arbitrary timeouts | waitForSelector/waitForLoadState | Reliable state detection |
| Auth state setup | Manual cookie injection | Playwright storageState or route mocking | Standard approach |

**Key insight:** Visual regression infrastructure is complete. Only test content needs adding.

## Common Pitfalls

### Pitfall 1: Flaky Font Rendering
**What goes wrong:** Google Fonts TLS failure causes inconsistent renders
**Why it happens:** Sandboxed test environment blocks external network
**How to avoid:** Mock fonts.googleapis.com in test setup
**Warning signs:** Tests pass locally, fail in CI with font differences

### Pitfall 2: Animation Timing
**What goes wrong:** Screenshots capture mid-animation states
**Why it happens:** Framer Motion animations run during capture
**How to avoid:** Wait for animations (500ms delay already in tests), or disable animations via media query
**Warning signs:** Inconsistent opacity/position in snapshots

### Pitfall 3: Auth Redirect Confusion
**What goes wrong:** Admin/driver tests capture login page instead of dashboard
**Why it happens:** Auth required, test user not authenticated
**How to avoid:** Capture redirect state explicitly OR mock auth API
**Warning signs:** All admin/driver screenshots show login page

### Pitfall 4: Outdated Documentation Claims
**What goes wrong:** Z-INDEX-MIGRATION.md says 64 violations exist
**Why it happens:** Not updated after Phase 10 completed migration
**How to avoid:** Update with current status (0 violations, migration complete)
**Warning signs:** Doc content contradicts codebase reality

## Code Examples

Verified patterns from existing codebase:

### Admin Dashboard State Capture
```typescript
// Source: e2e/visual-regression.spec.ts pattern
test.describe("Admin Dashboard Visual Regression (TEST-02)", () => {
  test("admin dashboard - redirects to login", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    // Captures login state for unauthenticated users
    await expect(page).toHaveScreenshot("admin-dashboard-unauthenticated.png", {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });

  test("admin dashboard - desktop", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("admin-dashboard-desktop.png", {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });

  test("admin dashboard - mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("admin-dashboard-mobile.png", {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });
});
```

### Driver Dashboard State Capture
```typescript
// Source: e2e/visual-regression.spec.ts pattern
test.describe("Driver Dashboard Visual Regression (TEST-03)", () => {
  test("driver dashboard - redirects to login", async ({ page }) => {
    await page.goto("/driver");
    // Redirects to /login?next=/driver
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("driver-login-redirect.png", {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });

  test("driver route page - login redirect", async ({ page }) => {
    await page.goto("/driver/route");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("driver-route-login.png", {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });

  test("driver history page - login redirect", async ({ page }) => {
    await page.goto("/driver/history");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("driver-history-login.png", {
      fullPage: true,
      maxDiffPixels: 150,
    });
  });
});
```

### Font Mocking Setup
```typescript
// Add to test.beforeEach for font-independent tests
test.beforeEach(async ({ page }) => {
  await page.route("**/fonts.googleapis.com/**", route =>
    route.fulfill({ status: 200, contentType: "text/css", body: "" })
  );
  await page.route("**/fonts.gstatic.com/**", route =>
    route.fulfill({ status: 200, contentType: "font/woff2", body: "" })
  );
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Turbopack | Webpack mode | Phase 9 | Required for CSS parsing |
| 64 z-index violations | 0 violations | Phase 10 | Migration complete |
| v7-index.ts barrels | Direct imports | Phase 11-13 | All deleted |

**Deprecated/outdated:**
- Z-INDEX-MIGRATION.md content: Shows pre-migration state (64 violations, Phase breakdown)
- v7-index.ts files: Deleted in Phase 13 (10 files, 366 lines)

## Admin Dashboard Visual States

Based on AdminDashboard.tsx component analysis:

| State | Description | Test Approach |
|-------|-------------|---------------|
| Loading | KPISkeleton placeholders | Mock API with delay |
| Refreshing | Spinner on cards | Trigger refresh |
| Data loaded | KPIs, quick stats, trends | Default state |
| Goal reached | Celebration overlay | Mock KPI at goal threshold |
| Desktop | Full grid layout | Default viewport |
| Mobile | Stacked cards | setViewportSize(375, 667) |

**Unauthenticated:** Redirects to login page (capture login state)

## Driver Dashboard Visual States

Based on DriverDashboard.tsx component analysis:

| State | Description | Test Approach |
|-------|-------------|---------------|
| No route | "No Route Today" card | Default for day without route |
| Planned route | "Ready to Start" badge | Mock route with status: planned |
| In progress | Progress bar, Continue button | Mock route with status: in_progress |
| Completed | Trophy icon, "Route Completed" | Mock route with status: completed |
| Streak active | Fire animation, streak counter | Mock streakDays > 0 |
| With badges | Badge row display | Mock badges array |
| Desktop | Full layout | Default viewport |
| Mobile | Stacked layout | Primary target viewport |

**Unauthenticated:** Redirects to /login?next=/driver

## Documentation Update Analysis

### Z-INDEX-MIGRATION.md Status
**Location:** `.planning/phases/01-foundation-token-system/Z-INDEX-MIGRATION.md`
**Current content:** Shows 64 violations, 28 files, migration phases
**Actual status:** 0 violations (Phase 10 complete), ESLint at error severity (Phase 13)
**Action:** Update to completion status with summary

### v7-index References
**Search results:** 30 files with v7-index references
**All in:** `.planning/` directory (phase docs, requirements, structure)
**None in:** `docs/` directory (component-guide.md, STACKING-CONTEXT.md, etc.)
**DOCS-02 scope:** "Remove v7-index references from component docs"
**Action:** Component docs already clean - verify and document completion

## Open Questions

Things that couldn't be fully resolved:

1. **Authenticated visual tests**
   - What we know: Admin/driver pages require auth
   - What's unclear: Whether to capture authenticated states
   - Recommendation: Capture login redirect state (tests auth flow works), note authenticated visuals optional

2. **Baseline generation timing**
   - What we know: No snapshots directory exists yet
   - What's unclear: When/how to generate baselines
   - Recommendation: Run `--update-snapshots` locally with Webpack mode

## Sources

### Primary (HIGH confidence)
- `/home/user/mandalay-morning-star-delivery-app/playwright.config.ts` - Visual regression config
- `/home/user/mandalay-morning-star-delivery-app/e2e/visual-regression.spec.ts` - Existing patterns
- `/home/user/mandalay-morning-star-delivery-app/src/components/admin/AdminDashboard.tsx` - Component states
- `/home/user/mandalay-morning-star-delivery-app/src/components/driver/DriverDashboard.tsx` - Component states
- `/home/user/mandalay-morning-star-delivery-app/.planning/STATE.md` - Decisions (Webpack mode, baselines deferred)

### Secondary (MEDIUM confidence)
- `.planning/phases/01-foundation-token-system/Z-INDEX-MIGRATION.md` - Current outdated state
- `docs/STACKING-CONTEXT.md` - V8 z-index patterns (confirms completion)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Playwright already configured, patterns established
- Architecture: HIGH - Existing tests provide templates
- Pitfalls: HIGH - STATE.md documents known issues
- Documentation status: HIGH - Grep verified file locations

**Research date:** 2026-01-23
**Valid until:** Indefinite (stable infrastructure)
