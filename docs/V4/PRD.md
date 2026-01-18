# V4 PRD — Refinement & Polish Pass

> **Version**: 1.1 (Clarified)
> **Generated**: 2026-01-17
> **Clarified**: 2026-01-17 (35 questions answered)
> **Scope**: Bug fixes, consistency pass, premium polish, and performance optimization
> **Prerequisite**: V3 complete (35/35 tasks across 6 sprints)
> **Sprints**: 4 sprints, 28 tasks total

---

## 1. One-Sentence Problem

> **Users of the V3 interface** struggle to **complete key flows reliably and perceive the app as premium** because **7 critical bugs block functionality and inconsistent styling undermines the "world-class Burmese food experience" vision**, resulting in **user friction, abandoned checkouts, and a design that feels 80% polished instead of 95%+**.

---

## 2. Demo Goal (What Success Looks Like)

### Success Criteria

A successful V4 demo must demonstrate:

1. **Zero Blockers**: All 7 critical bugs fixed — checkout loads, signout works, no white-on-white text
2. **Visual Consistency**: Single card style (16:9), all components use design tokens, unified header system
3. **Premium Feel**: Shimmer loading, staggered animations, elastic progress bars — no "generic AI slop"

### Key Outcomes

| Area | Before (V3) | After (V4) |
|------|-------------|------------|
| **Bugs** | 7 critical issues | 0 blocking bugs |
| **Design Quality** | 80% | 95%+ |
| **Card Styles** | 2 competing (4:3 vs 16:9) | 1 unified (16:9) |
| **Token Usage** | Partial (tailwind mixed) | 100% design tokens |
| **Animations** | Basic | Premium (shimmer, stagger, elastic) |

### Non-Goals (Out of Scope)

- New features or functionality (V4 is refinement-only)
- Backend changes (APIs remain as-is)
- New page layouts or information architecture
- Mobile app (PWA continues)
- Design token value changes (just consistent usage)

---

## 3. Scope: What's Broken

### 3.1 Critical Bugs (Must Fix)

| ID | Bug | File | Impact |
|----|-----|------|--------|
| B1 | **White text on white background** | `HomepageHero.tsx:154,207` | Text unreadable on cream/gradient backgrounds |
| B2 | **Saturday badge invisible** | `HomepageHero.tsx:199-210` | White text on `.glass` translucent overlay |
| B3 | **Category scroll jumps page** | `menu-content.tsx:59-83` | `headerOffset=140` vs actual ~124px mismatch |
| B4 | **Checkout steps don't load** | `CheckoutLayout.tsx` vs `checkout-store.ts` | Type mismatch (4 steps vs 3 steps) |
| B5 | **Signout doesn't work** | `user-menu.tsx:65-72` | Form inside Radix dropdown not propagating |
| B6 | **Z-index chaos** | `menu-header.tsx:20` | Hardcoded `z-30` breaks stacking order |
| B7 | **Header height inconsistent** | Multiple files | 56px, 64px, ~60px variance causes layout jumps |

### 3.2 Consistency Issues (Must Standardize)

| ID | Issue | Files | Fix |
|----|-------|-------|-----|
| C1 | **Two card styles** | `ItemCard.tsx` (4:3) vs `MenuItemCard.tsx` (16:9) | Consolidate to 16:9 |
| C2 | **CartItem uses tailwind colors** | `cart-item.tsx` | Migrate to `--color-*` tokens |
| C3 | **Badge untouched** | `Badge.tsx` | Add V4 variants (featured, allergen, etc.) |
| C4 | **Sticky headers vary** | `CustomerLayout`, `MenuHeader`, `CategoryTabs` | Normalize to 56px + token z-index |
| C5 | **Cart drawer/bar mismatch** | `cart-drawer.tsx`, `CustomerLayout.tsx` | Unify bg, shadow, border patterns |
| C6 | **Hardcoded colors throughout** | Multiple components | Audit and replace with tokens |

### 3.3 Polish Gaps (Should Enhance)

| ID | Gap | Current | Target |
|----|-----|---------|--------|
| P1 | **Image loading** | Basic skeleton pulse | Shimmer animation |
| P2 | **List animations** | Items appear together | Stagger cascade effect |
| P3 | **Progress bars** | Linear easeOut | Elastic/spring easing |
| P4 | **Cart badge** | Static count | Pulse on change |
| P5 | **Primary CTAs** | Flat color | Gradient overlay (gold-to-red shimmer) |

---

## 4. Sprint Plan (Clarified)

### Sprint 1: Bug Fixes (7 tasks)

| Task | File | Action |
|------|------|--------|
| 1.1 | `HomepageHero.tsx` | Dynamic luminance detection for text color based on background brightness |
| 1.2 | `HomepageHero.tsx` | Saturday badge with dynamic contrast (same luminance approach) |
| 1.3 | `menu-content.tsx` | Intersection Observer for category scroll detection (replace headerOffset) |
| 1.4 | `checkout-store.ts`, `CheckoutLayout.tsx` | Fix CheckoutLayout to 3 steps (address, time, payment), integrate as wrapper |
| 1.5 | `user-menu.tsx` | Create DropdownAction component (full featured: onClick, loading, disabled, icon, variant) |
| 1.6 | `tokens.css`, multiple files | Expanded z-index tokens + CSS Layers for cascade control |
| 1.7 | Multiple layouts | Collapsible scroll-direction-aware headers (expand on scroll up, collapse on down) |

### Sprint 2: Consistency (8 tasks)

| Task | Action |
|------|--------|
| 2.1 | Port all ItemCard features to MenuItemCard (16:9 aspect-video), deprecate ItemCard |
| 2.2 | Full CartItem rewrite with design tokens (not just migration) |
| 2.3 | Badge variants: featured (gold), allergen (amber), price (green/red), status (semantic) |
| 2.4 | Header normalization: 56px collapsed height, backdrop-blur-lg (16px), unified tokens |
| 2.5 | New unified cart drawer/bar style using only design tokens |
| 2.6 | Full token audit: colors, opacity, border-radius, all visual properties |
| 2.7 | Stylelint + ESLint rules for token enforcement |
| 2.8 | Dark mode parity testing (test all fixes in both modes) |

### Sprint 3: Polish (7 tasks)

| Task | Action |
|------|--------|
| 3.1 | Contextual shimmer: shimmer on initial load, subtle pulse on refetch |
| 3.2 | Variable stagger animations: faster at start, slower at end (all lists) |
| 3.3 | Tight spring (stiffness: 400, damping: 25) on all progress bars |
| 3.4 | Cart badge pulse on all changes (add, increase, remove, any total change) |
| 3.5 | Continuous subtle gradient CTA shimmer on all primary variant buttons |
| 3.6 | User animation toggle in localStorage (overrides system preference) |
| 3.7 | A/B test infrastructure with Vercel Edge Config |

### Sprint 4: Performance & Docs (6 tasks)

| Task | Action |
|------|--------|
| 4.1 | Core Web Vitals optimization (LCP, FID, CLS) |
| 4.2 | Bundle size audit and optimization |
| 4.3 | Time to Interactive improvements |
| 4.4 | Animation frame rate optimization (60fps target) |
| 4.5 | Storybook stories update for all V4 components |
| 4.6 | Component guide + JSDoc documentation pass |

---

## 5. Functional Decisions (Clarified)

### 5.1 Bug Fix Details

| ID | Before | After |
|----|--------|-------|
| B1 | `<span className="text-white">` | Dynamic luminance detection: calculate background brightness, switch to charcoal/white accordingly |
| B2 | White text on `.glass` | Same luminance approach: detect overlay brightness, auto-switch text color |
| B3 | `headerOffset = 140` | Intersection Observer: observe category sections, update active on intersection |
| B4 | 4 steps in layout, 3 in store | Fix CheckoutLayout to 3 steps, integrate as page wrapper, remove duplicate type |
| B5 | `<form action={signOut}>` in dropdown | New DropdownAction component with onClick, loading, disabled, icon, variant props |
| B6 | `z-30` hardcoded | Expanded z-index tokens + CSS @layer for cascade: base, components, modals, tooltips |
| B7 | 56px, 64px, 60px heights | Scroll-direction-aware: collapse to 56px on scroll down, expand on scroll up |

### 5.2 Consistency Rules

| Rule | Standard |
|------|----------|
| **Card aspect ratio** | 16:9 using Tailwind `aspect-video` class |
| **Header height** | 56px collapsed (h-14), expandable on scroll up |
| **Backdrop blur** | `backdrop-blur-lg` (16px) for all sticky headers |
| **Z-index** | Use expanded `--z-*` tokens with CSS @layer |
| **Colors** | Use `--color-*` tokens only (enforced by Stylelint + ESLint) |
| **Shadows** | Use `--shadow-*` tokens only |
| **Spacing** | Use `--space-*` tokens only |
| **Opacity** | Create `--opacity-*` tokens for consistent transparency |

### 5.3 Polish Specifications

| Effect | Implementation |
|--------|----------------|
| **Shimmer** | Contextual: shimmer on initial load (1.5s), subtle pulse on refetch (0.5s) |
| **Stagger** | Variable timing: start fast (30ms), decelerate to (80ms) at end |
| **Spring** | Tight: `type: "spring", stiffness: 400, damping: 25` (Apple-like crisp) |
| **Pulse** | `scale: [1, 1.2, 1]` with `duration: 0.3` on ANY cart change |
| **Gradient CTA** | Continuous subtle shimmer, `bg-gradient-to-r from-cta to-primary` with 3s animation |
| **Animation Toggle** | localStorage key `animation-preference`: "full", "reduced", "none" |

### 5.4 Testing & Validation

| Type | Approach |
|------|----------|
| **E2E Tests** | Playwright tests for all 7 bug fixes |
| **Quality Metrics** | Checklist + Stylelint/ESLint + visual review combined |
| **A/B Testing** | Vercel Edge Config for hero variants and assumption validation |
| **Release Strategy** | Batch by risk: low-risk first, high-risk after testing |
| **Dark Mode** | Test all fixes equally in both light and dark modes |

---

## 6. UX Decisions

### 6.1 Visual Language (Unchanged from V3)

| Attribute | Value |
|-----------|-------|
| **Primary Color** | Bold Red (#9B1B1E) |
| **CTA Color** | Bright Gold (#F4D03F) |
| **Aesthetic** | Warm Burmese heritage, premium, layered |
| **Typography** | Manrope (headings), DM Sans (body), Padauk (Burmese) |
| **Motion** | Spring physics, reduced-motion respect |

### 6.2 Quality Bar (V4 Target)

| Area | V3 Score | V4 Target |
|------|----------|-----------|
| Design Tokens | 95% | 100% |
| Base Components | 85% | 95% |
| Menu Components | 80% | 95% |
| Cart Components | 75% | 95% |
| Animations | 70% | 90% |
| Visual Polish | 65% | 90% |
| **Overall** | 80% | **95%** |

---

## 7. Data & Logic (Unchanged)

V4 makes no backend or data model changes. All existing:
- Supabase tables and queries
- Stripe integration
- Google Maps integration
- Authentication flow

...remain as-is. V4 is purely a UI refinement layer.

---

## 8. Verification

### Automated

```bash
pnpm typecheck && pnpm test
```

### Visual Validation

| Check | Pass Criteria |
|-------|---------------|
| Homepage text | Readable on all backgrounds (light and dark mode) |
| Category tabs | Click doesn't jump page up |
| Checkout | All 3 steps load and navigate correctly |
| Signout | Clicking logs user out and redirects to login |
| Cards | All menu cards use 16:9 aspect ratio |
| Colors | No hardcoded hex values outside tokens.css |
| Animations | Shimmer visible during image load, stagger on lists |

### Breakpoint Testing

- 375px (mobile)
- 768px (tablet)
- 1024px (small desktop)
- 1440px (large desktop)

---

## 9. Assumptions

1. **[ASSUMPTION]** V3 implementation is the baseline (35/35 tasks complete)
2. **[ASSUMPTION]** Design token values are correct; only usage needs standardization
3. **[ASSUMPTION]** 16:9 card aspect ratio is preferred over 4:3
4. **[ASSUMPTION]** 56px header height is standard (not 64px or 60px)
5. **[ASSUMPTION]** Users prefer elastic/spring animations over linear

---

## 10. References

- V4 Clarification Session: [PRD-clarification-session.md](./PRD-clarification-session.md)
- V3 PRD: [docs/V3/UX-Specs/PRD.md](../V3/UX-Specs/PRD.md)
- V3 UX-Specs: [docs/V3/UX-Specs/UX-Specs.md](../V3/UX-Specs/UX-Specs.md)
- Design Tokens: [src/styles/tokens.css](../../src/styles/tokens.css)
- V3 Build Tasks: [docs/V3/UX-Specs/build-tasks/](../V3/UX-Specs/build-tasks/)
