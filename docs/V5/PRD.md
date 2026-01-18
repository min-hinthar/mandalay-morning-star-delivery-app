# V5 PRD — Complete UI Redesign

> **Version**: 5.0
> **Status**: Requirements Clarified ✅
> **Scope**: Full visual + architecture overhaul
> **Target**: Q1 2026
> **Clarification Session**: 2026-01-18 (35 questions)

---

## Executive Summary

V5 is a complete redesign of the Mandalay Morning Star delivery application, addressing architectural debt accumulated in V3/V4 and introducing a fresh visual identity while maintaining brand recognition.

---

## Background

### V4 Accomplishments

| Sprint | Focus | Status |
|--------|-------|--------|
| Sprint 1 | Bug Fixes | ✅ Complete (7 tasks) |
| Sprint 2 | Consistency | ✅ Complete (8 tasks) |
| Sprint 3 | Polish | ✅ Complete (7 tasks) |
| Sprint 4 | Performance | ✅ Complete (5/6 tasks) |

**Key V4 Deliverables:**
- Design token system (95%+ adoption)
- Dynamic contrast detection (`useLuminance`)
- Intersection Observer-based scroll tracking
- Unified component patterns (MenuItemCard, Badge)
- Web Vitals monitoring
- Bundle optimization infrastructure

### Recurring Issues (from ERROR_HISTORY.md)

| Issue | Frequency | Root Cause |
|-------|-----------|------------|
| White text on light backgrounds | 3x | Hardcoded styles without luminance check |
| Scroll position mismatches | 2x | Inconsistent header height handling |
| Z-index conflicts | 2x | Scattered hardcoded values |
| Form events in dropdowns | 1x | Radix dropdown swallowing submits |
| Dynamic route slug conflicts | 1x | Inconsistent param naming |

### Key Learnings (from LEARNINGS.md)

1. **CSS Variable System**: Works well when enforced via linting
2. **Hook Architecture**: Custom hooks scale better than component props
3. **Intersection Observer**: More reliable than scroll events
4. **Theme Consistency**: Requires provider + token system + component updates
5. **Test Resilience**: Avoid class-based assertions; prefer behavior testing

---

## V5 Scope

### Visual Redesign

#### New Design Language

| Element | V4 State | V5 Target | Decision |
|---------|----------|-----------|----------|
| Colors | Warm neutrals (cream, charcoal) | **High contrast + bold** | Stronger contrast, vibrant accents |
| Typography | Playfair + Inter | **Keep Playfair + Inter** | Optimize loading/weights only |
| Spacing | Token-based (mixed adoption) | 4px grid, strict enforcement | CSS Container Queries |
| Shadows | Custom warm shadows | Elevation system (0-5 levels) | — |
| Motion | Framer Motion (per-component) | **Keep Framer Motion** | Standardize via tokens |
| Icons | Lucide React | **Hybrid** (custom brand + Lucide UI) | Custom for brand moments |

#### Design Strategy

| Aspect | Decision |
|--------|----------|
| Device Focus | **Mobile-first** |
| Dark Mode | System preference + manual toggle |
| Layout | **CSS Container Queries** (hybrid approach) |
| Migration | **Big bang** (Sprint 6 launch) |

#### Component Visual Refresh

**Priority 1: Customer-Facing**

| Component | V5 Pattern |
|-----------|------------|
| Homepage hero | **Featured items** showcase (daily specials, promotions) |
| Menu navigation | **Accordion sections** (collapsible categories) |
| Cart access | Drawer (desktop), **Bottom sheet** (mobile) |
| Checkout flow | **Upsell integration** (recommendations, add-ons) |
| Order tracking | **Map + timeline** combined view |

**Priority 2: Admin/Driver**

| Component | V5 Pattern |
|-----------|------------|
| Dashboard | **Operations focus** (order queue, prep times, delivery status) |
| Data tables | **Quick preview** (hover/click for details) |
| Driver mode | **Manual toggle** for high-contrast |
| Mobile admin | Optimized responsive views |

**UX Patterns (Clarified)**

| Pattern | Decision |
|---------|----------|
| Header scroll | Hide on scroll down, reveal on up |
| Overlay stacking | Full support (multiple layers) |
| Error handling | Context-sensitive (toast/inline/modal by severity) |
| Loading states | Hybrid (skeleton/optimistic/spinner by context) |
| Image loading | Eager critical, lazy rest |

### Architecture Redesign

#### 1. Header Navigation System (REBUILD)

**Problem:**
- 5+ scattered header implementations
- No unified height context
- Scroll direction detection duplicated
- Mobile/desktop behavior inconsistent

**V5 Solution:**
```
HeaderProvider (context)
├── useHeaderHeight() - dynamic height
├── useHeaderCollapse() - scroll-aware collapse
├── useHeaderSlots() - composable regions
└── HeaderLayout (component)
    ├── HeaderLeft (logo, back)
    ├── HeaderCenter (title, search)
    └── HeaderRight (actions, menu)
```

**Files to Create:**
- `src/contexts/HeaderContext.tsx`
- `src/components/layouts/HeaderLayout.tsx`
- `src/lib/hooks/useHeaderHeight.ts`

#### 2. Modal/Drawer System (REBUILD)

**Problem:**
- Each modal handles focus/escape/overlay differently
- Body scroll lock inconsistent
- No shared animation patterns

**V5 Solution:**
```
OverlayProvider (context)
├── OverlayBase (component)
│   ├── Focus trap
│   ├── Escape key handler
│   ├── Body scroll lock
│   └── Portal rendering
├── Modal (extends OverlayBase)
├── Drawer (extends OverlayBase)
├── BottomSheet (extends OverlayBase)
└── Dialog (extends OverlayBase)
```

**Files to Create:**
- `src/contexts/OverlayContext.tsx`
- `src/components/ui/overlay-base.tsx`
- Refactored modal, drawer, dialog components

#### 3. Form Architecture (REBUILD)

**Problem:**
- Radix dropdown swallows form events
- Inconsistent validation patterns
- No unified error display

**V5 Solution:**
- Integrate **Conform** (progressive enhancement, server-first) with `zod` validation
- Create `FormField` compound component
- Replace dropdown forms with `DropdownAction` pattern
- Unified error state display
- Optimized for Next.js App Router and RSC patterns

**Files to Create:**
- `src/components/ui/form-field.tsx`
- `src/lib/hooks/useFormValidation.ts`
- Update all forms to new pattern

#### 4. Layout System (REBUILD)

**Problem:**
- Scattered layout patterns
- Inconsistent responsive behavior
- No safe area handling

**V5 Solution:**
```
LayoutPrimitives
├── Container (max-width, padding)
├── Stack (vertical spacing)
├── Cluster (horizontal with wrap)
├── Grid (responsive columns)
└── SafeArea (mobile notches)
```

**Files to Create:**
- `src/components/layouts/Container.tsx`
- `src/components/layouts/Stack.tsx`
- `src/components/layouts/Grid.tsx`

---

## Design Token System (V5)

### Color System

```css
/* Semantic Colors */
--color-surface-primary: /* main backgrounds */
--color-surface-secondary: /* cards, elevated */
--color-surface-tertiary: /* nested elements */

--color-text-primary: /* main text */
--color-text-secondary: /* muted text */
--color-text-inverse: /* on dark surfaces */

--color-border-default: /* standard borders */
--color-border-strong: /* emphasized borders */

--color-interactive-primary: /* CTA buttons */
--color-interactive-hover: /* hover states */
--color-interactive-active: /* active states */

--color-status-success: /* positive */
--color-status-warning: /* caution */
--color-status-error: /* negative */
--color-status-info: /* neutral info */
```

### Typography Scale

```css
/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing Scale

```css
/* 4px base grid */
--space-0: 0;
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

### Elevation System

```css
--elevation-0: none;
--elevation-1: 0 1px 2px rgba(0,0,0,0.05);
--elevation-2: 0 2px 4px rgba(0,0,0,0.08);
--elevation-3: 0 4px 8px rgba(0,0,0,0.10);
--elevation-4: 0 8px 16px rgba(0,0,0,0.12);
--elevation-5: 0 16px 32px rgba(0,0,0,0.15);
```

### Motion Tokens

```css
/* Durations */
--duration-instant: 0ms;
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 400ms;

/* Easings */
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## Testing Infrastructure

### Unit Tests
- Target: **80%+ coverage across all components equally**
- Focus: Hooks, utilities, store logic, components
- Tool: Vitest

### E2E Tests
- Target: All critical user flows
- Flows: Cart → Checkout → Payment → Confirmation
- Tool: Playwright

### Visual Regression
- Target: All component states
- Tool: **Playwright screenshots** + CI comparison
- Baseline: Capture after V5 launch

### Accessibility
- Target: **WCAG 2.1 AA**
- Tool: axe-core in tests
- Focus: Color contrast, keyboard nav, screen readers

---

## Sprint Plan (Updated)

### Sprint 1: Foundation (Tokens + Layout)
- [ ] New token system in `tokens.css` (high contrast + bold)
- [ ] Layout primitives with CSS Container Queries
- [ ] Typography scale implementation (Playfair + Inter optimized)
- [ ] Color system migration
- [ ] SafeArea component (all modern devices)

### Sprint 2: Core Components
- [ ] OverlayBase and modal system (full stacking support)
- [ ] HeaderLayout context (hide on scroll down)
- [ ] Form architecture with **Conform** + Zod
- [ ] Button, Badge, Input refresh
- [ ] BottomSheet component (mobile cart)

### Sprint 3: Customer Experience
- [ ] Homepage redesign (featured items hero)
- [ ] Menu browsing (accordion sections)
- [ ] Cart drawer/bottom sheet
- [ ] Checkout flow (upsell integration)

### Sprint 4: Admin & Driver
- [ ] Dashboard (operations focus)
- [ ] Table components (quick preview)
- [ ] Driver high-contrast toggle
- [ ] Analytics charts

### Sprint 5: Polish & Performance
- [ ] Animation system finalization
- [ ] Performance audit
- [ ] **Full Storybook setup** + deployment
- [ ] Documentation

### Sprint 6: Testing & Launch
- [ ] E2E test suite completion
- [ ] Visual regression baseline (Playwright)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Production deployment (big bang)

### Sprint 7: Extended Features (NEW)
- [ ] **i18n**: English + Burmese bilingual (next-intl)
- [ ] **Payments**: Apple Pay + Google Pay (Stripe)
- [ ] **Notifications**: Web push + email + SMS
- [ ] **Support**: In-app contact form
- [ ] **SEO**: Local SEO + Google My Business
- [ ] **Analytics**: Full event tracking

---

## Success Metrics

| Metric | V4 Baseline | V5 Target |
|--------|-------------|-----------|
| Lighthouse Performance | TBD | > 90 |
| LCP | TBD | < 2.5s |
| CLS | TBD | < 0.1 |
| INP | TBD | < 200ms |
| Design Token Usage | 95% | 100% |
| Component Test Coverage | < 10% | > 80% |
| E2E Flow Coverage | 2 suites | All critical flows |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing flows | High | Feature flags, staged rollout |
| Performance regression | Medium | Continuous monitoring, budgets |
| Design inconsistency | Medium | Design system enforcement |
| Migration complexity | Medium | Incremental refactoring |

---

## Open Questions (RESOLVED ✅)

| Question | Decision |
|----------|----------|
| Font Selection | **Keep Playfair + Inter** - optimize loading only |
| Animation Library | **Keep Framer Motion** - standardize via tokens |
| State Management | **Keep Zustand** - no migration needed |
| Form Library | **Conform** - progressive enhancement, server-first |
| Visual Regression | **Playwright screenshots** - leverage existing setup |

### Remaining Ambiguities

1. **SMS Provider**: Twilio vs alternatives (decide in Sprint 7)
2. **Burmese Font**: Myanmar script typography selection
3. **Storybook Hosting**: Chromatic vs Vercel (decide in Sprint 5)

---

## Next Steps

1. ~~Run `/prd-clarify` to address open questions~~ ✅ Complete (35 questions)
2. Create UX-Specs via `/prd-ux`
3. Generate build tasks for Sprint 1
4. Begin implementation

---

## Appendix

### V4 Files for Reference

- `docs/V4/PRD.md` - V4 requirements
- `docs/V4/PRD-clarification-session.md` - V4 decisions
- `docs/V4/UX-Specs/` - V4 specifications
- `.claude/ERROR_HISTORY.md` - Bug patterns
- `.claude/LEARNINGS.md` - Implementation patterns
