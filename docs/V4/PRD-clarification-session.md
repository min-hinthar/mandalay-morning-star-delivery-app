# PRD Clarification Session

**Source PRD**: PRD.md
**Session Started**: 2026-01-17
**Depth Selected**: Ultralong
**Total Questions**: 35
**Progress**: 35/35 ✅ COMPLETE

---

## Session Summary

### Key Decisions Made

| Area | Decision |
|------|----------|
| **Text Contrast (B1/B2)** | Dynamic luminance detection for text color |
| **Checkout (B4)** | Fix CheckoutLayout.tsx to 3 steps, integrate as wrapper |
| **Card Style (C1)** | Port all ItemCard features to MenuItemCard (16:9) |
| **Header (B7)** | Collapsible on scroll, direction-aware |
| **Animations** | All lists get stagger; all primary buttons get gradient shimmer |
| **Shimmer** | Contextual: shimmer on initial load, pulse on refetch |
| **Badges** | Add all 4 types: featured, allergen, price, status |
| **Cart Pulse** | Trigger on all cart changes |
| **Reduced Motion** | User toggle in localStorage |
| **Token Audit** | Full audit: colors, opacity, border-radius, all properties |
| **Scroll Fix (B3)** | Intersection Observer approach |
| **Cart UI (C5)** | New unified style using design tokens |
| **Aspect Ratio** | Tailwind aspect-video class |
| **Backdrop Blur** | backdrop-blur-lg (16px) |
| **Dark Mode** | Test and fix in both modes equally |
| **Testing** | Add E2E tests for bug fixes |
| **Quality Metrics** | Checklist + linting + visual review combined |
| **Hero** | A/B test 2-3 variants |
| **Stagger Timing** | Variable (faster at start, slower at end) |
| **Spring Values** | Tight: stiffness 400, damping 25 |
| **Header Collapse** | Scroll direction aware |
| **Performance** | Full perf audit as Sprint 4 |
| **CartItem (C2)** | Full rewrite to V4 patterns |
| **CTA Shimmer** | Continuous subtle animation |
| **Animation Setting** | localStorage, overrides system preference |
| **Assumptions** | A/B test them |
| **Release Strategy** | Batch by risk level |
| **DropdownAction** | Full featured component with onClick, loading, disabled, icon, variant |
| **Linting** | Stylelint + ESLint for token enforcement |
| **Perf Metrics** | Core Web Vitals, bundle size, TTI, frame rate |
| **Documentation** | Full pass: Storybook + guide + JSDoc |
| **A/B Tool** | Vercel Edge Config |
| **Z-Index** | Expanded tokens + CSS Layers |
| **Priority** | Bugs > Consistency > Polish |

---

## Updated Sprint Plan

Based on clarifications, V4 now has **4 sprints**:

### Sprint 1: Bug Fixes (7 tasks)
1. Dynamic text contrast for HomepageHero (luminance detection)
2. Saturday badge with dynamic contrast
3. Intersection Observer for category scroll
4. Fix CheckoutLayout.tsx (3 steps, integrate)
5. Create DropdownAction component (signout fix)
6. Z-index tokens + CSS Layers
7. Collapsible scroll-direction-aware headers

### Sprint 2: Consistency (8 tasks)
1. Port ItemCard → MenuItemCard (all features)
2. Full CartItem rewrite with tokens
3. Badge variants (featured, allergen, price, status)
4. Header normalization (56px collapsed, blur-lg)
5. New unified cart drawer/bar style
6. Full token audit (colors, opacity, radius, etc.)
7. Stylelint + ESLint rules for tokens
8. Dark mode parity testing

### Sprint 3: Polish (7 tasks)
1. Contextual shimmer (initial) + pulse (refetch)
2. Variable stagger animations for all lists
3. Tight spring (400/25) on progress bars
4. Cart badge pulse on all changes
5. Continuous subtle gradient CTA shimmer
6. User animation toggle (localStorage)
7. A/B test infrastructure (Vercel Edge Config)

### Sprint 4: Performance & Docs (6 tasks)
1. Core Web Vitals optimization
2. Bundle size audit
3. TTI improvements
4. Animation frame rate (60fps)
5. Storybook stories update
6. Component guide + JSDoc

---

## Session Log

### Question 1
**Category**: Bug Fixes - Visual Contrast
**Question**: For B1/B2 (HomepageHero text contrast), which approach?
**Response**: Dynamic based on background
**Clarified**: Implement luminance detection for text color

### Question 2
**Category**: Bug Fixes - Checkout
**Question**: Keep or remove CheckoutLayout.tsx?
**Response**: Fix CheckoutLayout.tsx
**Clarified**: Update to 3 steps, integrate as checkout wrapper

### Question 3
**Category**: Consistency - Cards
**Question**: When deprecating ItemCard, what about unique features?
**Response**: Port all to MenuItemCard
**Clarified**: Merge all ItemCard features as variants

### Question 4
**Category**: Bug Fixes - Headers
**Question**: Headers with extra content (search, tabs)?
**Response**: Collapsible on scroll
**Clarified**: Start taller, collapse to 56px on scroll

### Question 5
**Category**: Polish - Stagger
**Question**: Which lists get cascade effect?
**Response**: All (menu grids, cart, orders, admin)
**Clarified**: Apply stagger to all list components

### Question 6
**Category**: Polish - CTA
**Question**: Which buttons get gradient shimmer?
**Response**: All primary variant buttons
**Clarified**: Apply to all buttons with variant='primary'

### Question 7
**Category**: Polish - Shimmer
**Question**: Initial load only or every load?
**Response**: Contextual
**Clarified**: Shimmer on initial, pulse on refetch

### Question 8
**Category**: Consistency - Badges
**Question**: What badge types for V4?
**Response**: All 4 types
**Clarified**: Featured, allergen, price, status badges

### Question 9
**Category**: Polish - Cart Pulse
**Question**: When should pulse trigger?
**Response**: All cart changes
**Clarified**: Add, increase, remove, any total change

### Question 10
**Category**: Accessibility
**Question**: Handle reduced motion users how?
**Response**: User toggle
**Clarified**: Let users choose animation level in settings

### Question 11
**Category**: Consistency - Tokens
**Question**: Audit colors only or more?
**Response**: Full token audit
**Clarified**: Colors, opacity, radius, all visual properties

### Question 12
**Category**: Polish - Progress Bars
**Question**: Where apply elastic effect?
**Response**: All progress bars
**Clarified**: Free delivery, tracking, route, loading

### Question 13
**Category**: Bug Fixes - Forms
**Question**: Fix only signout or all dropdown forms?
**Response**: Create pattern
**Clarified**: Build reusable DropdownAction component

### Question 14
**Category**: Bug Fixes - Z-Index
**Question**: What hierarchy for V4?
**Response**: Expanded tokens + CSS Layers
**Clarified**: More granular z-index tokens with @layer

### Question 15
**Category**: Bug Fixes - Scroll
**Question**: Hardcode offset or calculate?
**Response**: Intersection Observer
**Clarified**: Use IO for scroll detection

### Question 16
**Category**: Consistency - Cart UI
**Question**: Which style as standard?
**Response**: New unified style
**Clarified**: Design new shared style with tokens only

### Question 17
**Category**: Consistency - Aspect Ratio
**Question**: CSS aspect-ratio or padding hack?
**Response**: Tailwind aspect class
**Clarified**: Use aspect-video built-in class

### Question 18
**Category**: Consistency - Blur
**Question**: What blur value for headers?
**Response**: backdrop-blur-lg (16px)
**Clarified**: Stronger blur for premium feel

### Question 19
**Category**: Testing - Dark Mode
**Question**: Focus on light or both modes?
**Response**: Both equally
**Clarified**: Test all fixes in both modes

### Question 20
**Category**: Testing
**Question**: Manual or E2E tests?
**Response**: Add E2E tests
**Clarified**: Playwright tests for bug fixes

### Question 21
**Category**: Quality Metrics
**Question**: How to measure quality bar?
**Response**: All three combined
**Clarified**: Checklist + linting + visual review

### Question 22
**Category**: Bug Fixes - Hero
**Question**: Just fix contrast or redesign?
**Response**: A/B test options
**Clarified**: Create 2-3 variants, test performance

### Question 23
**Category**: Polish - Timing
**Question**: Stagger delay between items?
**Response**: Variable
**Clarified**: Faster at start, slow down at end

### Question 24
**Category**: Polish - Spring
**Question**: Stiffness/damping values?
**Response**: Tight (400/25)
**Clarified**: Apple-like crisp response

### Question 25
**Category**: UX - Header
**Question**: What triggers collapse?
**Response**: Scroll direction aware
**Clarified**: Collapse on down, expand on up

### Question 26
**Category**: Performance
**Question**: Include perf optimizations?
**Response**: Full perf audit
**Clarified**: Add Sprint 4 for performance

### Question 27
**Category**: Consistency - CartItem
**Question**: Just tokens or refactor?
**Response**: Full rewrite
**Clarified**: Rewrite CartItem to V4 patterns

### Question 28
**Category**: Polish - CTA Animation
**Question**: Continuous or hover only?
**Response**: Continuous subtle
**Clarified**: Always animating with subtle shimmer

### Question 29
**Category**: Settings
**Question**: Where does animation toggle live?
**Response**: Browser localStorage
**Clarified**: Client-side, persists across sessions

### Question 30
**Category**: Assumptions
**Question**: Validate before implementing?
**Response**: A/B test assumptions
**Clarified**: Ship both options and measure

### Question 31
**Category**: Release
**Question**: Ship incrementally or all at once?
**Response**: Batch by risk
**Clarified**: Low-risk first, high-risk after testing

### Question 32
**Category**: Component API
**Question**: DropdownAction component API?
**Response**: Full featured
**Clarified**: onClick, loading, disabled, icon, variant

### Question 33
**Category**: Linting
**Question**: ESLint for token enforcement?
**Response**: Stylelint + ESLint
**Clarified**: Lint both CSS and TSX files

### Question 34
**Category**: Performance
**Question**: What metrics to track?
**Response**: All (CWV, bundle, TTI, fps)
**Clarified**: Full performance metrics

### Question 35
**Category**: Priority
**Question**: Order if time runs short?
**Response**: Bugs > Consistency > Polish
**Clarified**: Fix blockers first, then standardize, then enhance

---

## Remaining Ambiguities

1. **Hero A/B Variants**: Specific designs for 2-3 hero variants not defined
2. **Animation Toggle UI**: Where in the app should the toggle appear?
3. **Perf Budgets**: Specific targets for bundle size, TTI not set
4. **Dark Mode Specifics**: Which dark mode issues need fixing beyond bugs?

---

## Next Steps

1. Update PRD.md with clarified requirements
2. Run `/prd-ux` to generate UX-Specs with 28 tasks across 4 sprints
3. Create build-tasks sprint files
4. Begin implementation with Sprint 1 (bugs)
