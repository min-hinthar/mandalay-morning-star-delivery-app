# Phase 75: Fix Security & Navigation Wiring - Research

**Researched:** 2026-02-26
**Domain:** CSP Security Headers, Driver UX Navigation Wiring
**Confidence:** HIGH

## Summary

Phase 75 closes two gaps from the v1.8 milestone audit. Both items are partially complete -- the core implementations exist but have specific wiring issues.

**SEC-02 gap:** The audit flagged `'unsafe-eval'` appearing unconditionally in production CSP `script-src` (line 46 of `next.config.ts`), contradicting Phase 67 documentation that said dev-only gating. Investigation reveals this is **intentionally correct behavior**: Google Maps JavaScript API officially requires `'unsafe-eval'` in both allowlist and nonce-based CSP configurations (verified via [Google's CSP documentation](https://developers.google.com/maps/documentation/javascript/content-security-policy), updated 2026-02-18). Commit `06eff7ce` explicitly removed the `isDev` gate with message "CSP script-src includes 'unsafe-eval' in production for Google Maps JS API compatibility." The fix needed is **documentation-only** -- update the Phase 67 docs to reflect this intentional change and mark SEC-02 as verified.

**DPROF-05 gap:** The test delivery page at `/driver/test-delivery` exists and works correctly (built in Phase 74, commit `5a519c7d`). However, `OnboardingWalkthroughCard` milestone 3 ("Complete your first delivery") has `href: null` -- meaning new drivers cannot navigate to the test delivery page from the walkthrough. The fix is to wire `href: "/driver/test-delivery"` for the delivery milestone so new drivers can tap it to practice.

**Primary recommendation:** Two small targeted fixes -- one documentation update, one single-line href change. No new libraries, no architectural changes.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEC-02 | CSP enforced after report-only validation | CSP is already enforcing (commit `c5f9d2d`). `unsafe-eval` is correctly unconditional per Google Maps official CSP requirements. Gap is documentation-only -- Phase 67 docs contradict the intentional fix in `06eff7ce`. |
| DPROF-05 | Test delivery page (/driver/test-delivery) with mock route data | Page exists and works (commit `5a519c7d`). Gap is navigation wiring -- OnboardingWalkthroughCard milestone 3 `href: null` leaves the page unreachable from the walkthrough flow. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.x | CSP headers via `headers()` in `next.config.ts` | Already configured, no changes needed |
| Framer Motion | (existing) | Animation for OnboardingWalkthroughCard | Already used in walkthrough card |

### Supporting

No additional libraries needed. Both fixes are wiring changes to existing code.

### Alternatives Considered

None -- this phase has no library decisions. Both fixes are mechanical.

**Installation:** No new packages needed.

## Architecture Patterns

### Pattern 1: OnboardingWalkthroughCard Milestone Navigation

**What:** Each milestone in the walkthrough has a `key`, `label`, and `href`. When `href` is non-null and the milestone is incomplete, tapping navigates to that page.

**Current state:**
```typescript
// src/components/ui/driver/DriverDashboard/OnboardingWalkthroughCard.tsx
const milestones: Milestone[] = [
  { key: "profile", label: "Complete your profile", href: "/driver/profile" },
  { key: "route", label: "View today's route", href: "/driver/route" },
  { key: "delivery", label: "Complete your first delivery", href: null }, // GAP: unreachable
];
```

**Fix:**
```typescript
const milestones: Milestone[] = [
  { key: "profile", label: "Complete your profile", href: "/driver/profile" },
  { key: "route", label: "View today's route", href: "/driver/route" },
  { key: "delivery", label: "Complete your first delivery", href: "/driver/test-delivery" },
];
```

**Why this is correct:**
- The milestone says "Complete your first delivery" -- for 0-delivery drivers, the test delivery page is the intended practice path
- The page already exists at `/driver/test-delivery` within the `(driver)` route group
- The `handleMilestoneClick` function already handles navigation: `if (isComplete || !milestone.href) return; router.push(milestone.href);`
- The milestone auto-completes based on `deliveriesCount > 0`, which is data-driven (not dependent on visiting test-delivery)

### Pattern 2: CSP Documentation Reconciliation

**What:** Phase 67 documentation states `unsafe-eval` is dev-only gated. Commit `06eff7ce` intentionally made it unconditional. The REQUIREMENTS.md still marks SEC-02 as incomplete.

**Fix:** Update the tracking checkbox in REQUIREMENTS.md and add a note to Phase 67 docs about the intentional production inclusion of `unsafe-eval` per Google Maps requirements.

### Anti-Patterns to Avoid

- **Adding test-delivery to DriverNav bottom bar:** The test-delivery page is for onboarding, not daily use. It should be reachable from the walkthrough card, not from persistent navigation.
- **Removing `unsafe-eval` from production CSP:** Google Maps JS API requires it. Removing it breaks map rendering (tiles, markers, WebGL workers). Verified against official docs updated 2026-02-18.
- **Switching to nonce-based CSP to "fix" unsafe-eval:** Nonce-based CSP still requires `unsafe-eval` for Google Maps. It would also require creating middleware.ts (doesn't exist) and is pointless when `unsafe-inline` is already needed for Framer Motion's `<style>` injection.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Walkthrough navigation | Custom deep-link system | Existing `href` + `router.push` pattern | Already built into OnboardingWalkthroughCard |
| CSP validation | Manual browser testing | Sentry CSP violation reporting (already configured) | Already reports violations via `report-uri` and `Report-To` headers |

**Key insight:** Both gaps are wiring/documentation issues, not missing features. The implementations exist -- they just need connecting.

## Common Pitfalls

### Pitfall 1: Changing milestone label to mention "test delivery"

**What goes wrong:** Changing the label from "Complete your first delivery" to "Try a test delivery" breaks the semantic meaning. The milestone completes when `deliveriesCount > 0`, which happens on a REAL delivery, not a test delivery.
**Why it happens:** Natural instinct to match the label to the destination.
**How to avoid:** Keep the label as "Complete your first delivery." The test-delivery page is a stepping stone, not the completion criterion. The href provides a useful starting point for new drivers, but the milestone tracks real deliveries.
**Warning signs:** Users confused about why test delivery didn't check off the milestone.

### Pitfall 2: Adding testMode prop passthrough to walkthrough

**What goes wrong:** Over-engineering by trying to track whether the driver completed the test delivery flow.
**Why it happens:** Assumption that the walkthrough needs to know about test delivery completion.
**How to avoid:** The walkthrough already works correctly -- milestone 3 completes based on `deliveriesCount > 0` from the database. The test delivery page is just a practice tool.

### Pitfall 3: Documenting SEC-02 as "needs fix" instead of "already correct"

**What goes wrong:** Wasting time trying to gate `unsafe-eval` behind `isDev` again, which breaks Google Maps in production.
**Why it happens:** The audit flagged it as a gap based on documentation contradiction.
**How to avoid:** Verify against Google's official CSP documentation. The fix commit (`06eff7ce`) message explicitly states the reasoning. The gap is documentation accuracy, not code behavior.

## Code Examples

### Fix 1: Wire test-delivery href in OnboardingWalkthroughCard

```typescript
// File: src/components/ui/driver/DriverDashboard/OnboardingWalkthroughCard.tsx
// Line 42: Change href from null to "/driver/test-delivery"

// BEFORE
{ key: "delivery", label: "Complete your first delivery", href: null },

// AFTER
{ key: "delivery", label: "Complete your first delivery", href: "/driver/test-delivery" },
```

### Fix 2: Update REQUIREMENTS.md SEC-02 status

```markdown
// File: .planning/REQUIREMENTS.md
// Line 13: Change [ ] to [x]

// BEFORE
- [ ] **SEC-02**: CSP enforced after report-only validation

// AFTER
- [x] **SEC-02**: CSP enforced after report-only validation
```

### Fix 3: Update REQUIREMENTS.md DPROF-05 status (after fix applied)

```markdown
// File: .planning/REQUIREMENTS.md
// Line 35: Change [ ] to [x]

// BEFORE
- [ ] **DPROF-05**: Test delivery page (/driver/test-delivery) with mock route data

// AFTER
- [x] **DPROF-05**: Test delivery page (/driver/test-delivery) with mock route data
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Dev-only `unsafe-eval` in CSP | Unconditional `unsafe-eval` for Google Maps | Commit `06eff7ce` (2026-02-17) | Required -- Google Maps JS API mandates `unsafe-eval` in both allowlist and nonce-based CSP |
| Walkthrough milestone 3 non-navigable | Wire to `/driver/test-delivery` | This phase | New drivers can tap to practice delivery flow |

**Current CSP status (verified):**
- Header: `Content-Security-Policy` (enforcing, not report-only)
- `unsafe-eval`: Unconditional in `script-src` (required by Google Maps)
- `unsafe-inline`: In `script-src` and `style-src` (required by Framer Motion + Google Maps allowlist approach)
- Reporting: Sentry `/security/` endpoint via `report-uri` and `Report-To`
- All external domains whitelisted: Google Maps (*.googleapis.com, *.gstatic.com, *.google.com), Supabase (https + wss), Sentry, Google Fonts, Vercel Speed Insights

## Open Questions

None. Both gaps have clear, verified solutions.

## Sources

### Primary (HIGH confidence)

- [Google Maps JavaScript API CSP Guide](https://developers.google.com/maps/documentation/javascript/content-security-policy) - Confirms `unsafe-eval` required in both strict and allowlist CSP approaches. Updated 2026-02-18.
- [Next.js CSP Guide](https://nextjs.org/docs/app/guides/content-security-policy) (via Context7 `/websites/nextjs`) - Confirms `unsafe-eval` is dev-only for Next.js itself, but third-party libraries may require it.
- Codebase audit: `next.config.ts` line 46, `OnboardingWalkthroughCard.tsx` line 42, git commits `06eff7ce`, `c5f9d2da`, `5a519c7d`
- `.planning/v1.8-MILESTONE-AUDIT.md` - Defines the exact gaps being closed

### Secondary (MEDIUM confidence)

- [content-security-policy.com Google Maps example](https://content-security-policy.com/examples/google-maps/) - Confirms Maps-specific CSP directives (does not mention `unsafe-eval` explicitly in allowlist snippet, but Google's official docs do)

## Metadata

**Confidence breakdown:**
- SEC-02 resolution: HIGH -- verified against Google official docs (updated 2026-02-18), commit history, and current next.config.ts
- DPROF-05 resolution: HIGH -- verified page exists at correct route, walkthrough card pattern understood, fix is single-line href change
- No new libraries: HIGH -- both fixes are wiring changes to existing code

**Research date:** 2026-02-26
**Valid until:** 2026-03-26 (stable domain, both fixes are mechanical)
