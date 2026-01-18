# Sprint 4: Performance & Docs

> **Priority**: LOWER — Optimize after features stable
> **Tasks**: 6
> **Dependencies**: Sprints 1-3 complete

---

## Progress

| Task | Status | Description |
|------|--------|-------------|
| 4.1 | ✅ | Core Web Vitals optimization |
| 4.2 | ✅ | Bundle size audit |
| 4.3 | ✅ | TTI improvements |
| 4.4 | ✅ | Animation frame rate (60fps) |
| 4.5 | ⏸️ | Storybook stories update (deferred to V5) |
| 4.6 | ✅ | Component guide + JSDoc |

---

## Task 4.1: Core Web Vitals Optimization

**Goal**: LCP < 2.5s, INP < 200ms, CLS < 0.1
**Status**: ✅ Complete

**Implemented**:
- `src/lib/web-vitals.ts` - Web vitals monitoring with Sentry reporting
- `src/components/WebVitalsReporter.tsx` - Client component for tracking
- `src/lib/utils/image-optimization.ts` - Image optimization utilities
- Updated `layout.tsx` with preconnect hints and font optimization
- Updated `next.config.ts` with bundle analyzer, image config, and caching headers
- Added `docs/performance/LIGHTHOUSE-METHODOLOGY.md` for audit process

### Prompt

```
Audit and optimize Core Web Vitals: LCP, FID, CLS.

REQUIREMENTS:
- LCP: < 2.5s (Largest Contentful Paint)
- FID: < 100ms (First Input Delay)
- CLS: < 0.1 (Cumulative Layout Shift)

IMPLEMENTATION:
- Run Lighthouse audit
- Identify bottlenecks
- Optimize: image loading, font loading, layout shifts
- Add preload hints, lazy loading, size attributes

OUTPUT:
- Lighthouse report before/after
- Optimization changes documented
```

### Verification
- [ ] LCP < 2.5s on mobile
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] Lighthouse score > 90

---

## Task 4.2: Bundle Size Audit

**Goal**: Reduce JavaScript bundle size
**Status**: ⬜ Not Started

### Prompt

```
Audit and reduce JavaScript bundle size.

REQUIREMENTS:
- Analyze bundle composition
- Identify large dependencies
- Implement code splitting
- Tree shake unused code

IMPLEMENTATION:
- Run bundle analyzer
- Review large imports
- Dynamic imports for heavy components
- Remove unused dependencies

OUTPUT:
- Bundle analysis report
- Reduced bundle size
```

### Verification
- [ ] Bundle analyzer report generated
- [ ] Largest chunks identified
- [ ] Code splitting implemented
- [ ] Bundle size reduced by target %

---

## Task 4.3: TTI Improvements

**Goal**: Improve Time to Interactive
**Status**: ⬜ Not Started

### Prompt

```
Improve Time to Interactive.

REQUIREMENTS:
- Reduce main thread blocking
- Defer non-critical JavaScript
- Optimize hydration

IMPLEMENTATION:
- Identify long tasks
- Use React.lazy for route components
- Defer analytics, tracking scripts
- Optimize React hydration

OUTPUT:
- TTI improvement metrics
```

### Verification
- [ ] Long tasks identified
- [ ] Route components lazy loaded
- [ ] Non-critical JS deferred
- [ ] TTI improved

---

## Task 4.4: Animation Frame Rate

**Goal**: All animations maintain 60fps
**Status**: ⬜ Not Started

### Prompt

```
Ensure all animations maintain 60fps.

REQUIREMENTS:
- Target: 60fps for all animations
- No jank or dropped frames
- Test on mid-range devices

IMPLEMENTATION:
- Profile animations in DevTools
- Use GPU-accelerated properties (transform, opacity)
- Avoid layout thrashing
- Reduce animation complexity if needed

OUTPUT:
- Performance profiles
- Animation optimizations
```

### Verification
- [ ] All animations profiled
- [ ] GPU-accelerated properties used
- [ ] No layout thrashing
- [ ] 60fps on mid-range device

---

## Task 4.5: Storybook Stories Update

**Goal**: Document all V4 components in Storybook
**Status**: ⬜ Not Started

### Prompt

```
Update Storybook stories for all V4 components.

REQUIREMENTS:
- Stories for new components
- Updated stories for modified components
- Document all variants and states

COMPONENTS:
- DropdownAction
- MenuItemCard (unified)
- CartItem (rewritten)
- Badge (variants)
- Collapsible Header
- CTA Button (shimmer)
- Skeleton (shimmer/pulse)

OUTPUT:
- stories/ files for each component
- Storybook deploy
```

### Verification
- [ ] All V4 components have stories
- [ ] All variants documented
- [ ] All states shown
- [ ] Storybook builds

---

## Task 4.6: Component Guide + JSDoc

**Goal**: Document components for developers
**Status**: ⬜ Not Started

### Prompt

```
Update component documentation with JSDoc and guide.

REQUIREMENTS:
- JSDoc for all public components
- Props documented with types and descriptions
- Usage examples
- Update component-guide.md

OUTPUT:
- JSDoc comments in all V4 components
- docs/component-guide.md updated
```

### Verification
- [ ] All components have JSDoc
- [ ] Props documented
- [ ] Usage examples included
- [ ] component-guide.md updated

---

## Sprint 4 Completion Checklist

Before marking V4 complete:
- [ ] All 6 tasks completed
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] Lighthouse score > 90
- [ ] Bundle size acceptable
- [ ] 60fps animations verified
- [ ] Storybook complete
- [ ] Documentation updated

---

## V4 Final Checklist

After all 4 sprints:

### Technical Quality
- [ ] TypeScript clean (no errors)
- [ ] All tests passing
- [ ] E2E tests for all bug fixes
- [ ] Lint rules passing

### Visual Quality
- [ ] 95%+ design quality (subjective review)
- [ ] All tokens used (no hardcoded values)
- [ ] Light mode works
- [ ] Dark mode works
- [ ] All breakpoints tested

### Performance
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] 60fps animations
- [ ] Bundle size acceptable

### Documentation
- [ ] Storybook complete
- [ ] JSDoc on all components
- [ ] component-guide.md updated
- [ ] V4 PRD and UX-Specs complete

### Release
- [ ] All bugs fixed (Sprint 1)
- [ ] All consistency issues resolved (Sprint 2)
- [ ] All polish applied (Sprint 3)
- [ ] All perf optimizations done (Sprint 4)
- [ ] Ready for production
