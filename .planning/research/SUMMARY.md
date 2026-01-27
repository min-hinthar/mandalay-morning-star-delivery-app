# Project Research Summary: v1.3 Full Codebase Consolidation

**Project:** Mandalay Morning Star Delivery App
**Domain:** Food delivery SPA - theme consistency + hero enhancement + codebase cleanup
**Researched:** 2026-01-27
**Confidence:** HIGH (verified against existing codebase + authoritative sources)

---

## Executive Summary

This milestone addresses technical debt accumulated during v1.0-v1.2 rapid development: **221 hardcoded color values** breaking theme consistency, **mobile 3D tilt bugs** causing content to disappear, and **V7 naming remnants** confusing the component API. The research reveals this is fundamentally a **consolidation milestone**, not a feature milestone. The architecture exists, the patterns are defined, and the token system is comprehensive. The work is systematic replacement and cleanup.

The recommended approach is **pattern-based batch fixes** rather than file-by-file manual review. Grep patterns identify all violations, fixes are applied in waves by priority (user-facing first, admin last), and verification happens in both light and dark modes. The existing token system in `tokens.css` is well-designed; adoption is the issue. ESLint enforcement prevents regression after migration.

Key risks: **incomplete audits** leaving edge cases broken, **3D transform stacking context conflicts** when combining `preserve-3d` with scale animations, and **hydration mismatches** from device detection. Mitigation: comprehensive grep audits before fixes, disable competing animations when 3D tilt is active, and use mounted state for SSR-safe device detection.

---

## Key Findings

### Recommended Stack

**No new dependencies required.** All tooling already installed:

| Tool | Purpose | Status |
|------|---------|--------|
| ESLint 9 + `no-restricted-syntax` | Enforce theme token usage | Extend existing rule |
| TailwindCSS 4 + `@theme inline` | Token-to-utility mapping | Already configured |
| Framer Motion 12.26.1 | Parallax scroll + entrance animations | Already used in Hero |
| CSS `@keyframes float` | Floating emoji animations | Already defined in `globals.css` |
| CSS `@media (hover: hover) and (pointer: fine)` | Touch device detection | Native CSS |

**Configuration changes needed:**

| File | Change |
|------|--------|
| `eslint.config.mjs` | Add rule: ban `text-white`, `text-black`, `bg-white`, `bg-black` |
| `src/lib/webgl/gradients.ts` | Rename `v7Palettes` to `palettes` (public API cleanup) |
| Component files | Systematic color token replacement |

**Existing patterns to leverage:**

| Pattern | Location | Usage |
|---------|----------|-------|
| Parallax presets | `motion-tokens.ts` | `parallaxPresets.background`, `.mid`, `.foreground` |
| Spring configs | `motion-tokens.ts` | `spring.default`, `.rubbery`, `.snappy` |
| Float animations | `globals.css` + `tailwind.config.ts` | `animate-float`, `animate-float-slow` |
| Z-index tokens | `design-system/tokens/z-index.ts` | `zIndex.modal`, `.toast`, `.tooltip` |
| Theme tokens | `tokens.css` | `--color-text-primary`, `--hero-gradient-start` |

### Expected Features

**Table Stakes (Must Fix):**

| Feature | Why Expected | Current State | Priority |
|---------|--------------|---------------|----------|
| No hardcoded `text-white` | Dark mode users see invisible text | 137 violations in 62 files | P0 |
| No hardcoded `bg-white` | Light-only backgrounds break dark mode | 22 violations in 15 files | P0 |
| Semantic color tokens throughout | `text-text-inverse` not `text-white` | Token system exists, not enforced | P0 |
| Mobile 3D tilt works | Core functionality broken | Content clips/disappears on iOS | P0 |
| Theme-aware hero gradient | Consistent dark mode | Uses `--hero-*` tokens correctly | Working |

**Differentiators (Hero Enhancement):**

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Floating food emojis | Playful brand identity, memorable | Medium | CSS float keyframes (exists) |
| Enhanced parallax scroll | Depth, premium feel | Low | `useScroll` hook (exists) |
| Staggered emoji entrance | Polished reveal animation | Low | Stagger variants (exist) |

**Anti-Features (Do NOT Build):**

| What to Avoid | Why | What to Do Instead |
|---------------|-----|-------------------|
| React Three Fiber for this milestone | Scope creep, out of scope | Stick to 2D CSS/Framer Motion |
| Heavy parallax (speed > 0.7) | Motion sickness, poor LCP | Keep speeds 0.2-0.5 |
| 3D tilt on ALL cards | Performance on list views | Featured cards only or disable on touch |
| Different color mappings per component | Maintenance nightmare | Single token system |
| `!important` for theme fixes | Specificity wars | Fix at source |

### Architecture Approach

**Theme Audit Architecture: Pattern-Based Systematic Fixes**

Current token system is well-structured (`tokens.css` → `globals.css` → `tailwind.config.ts` → components), but **component adoption is inconsistent**. Approach is automated discovery, categorized fixes, batch replacement.

**Violation categories:**

| Pattern | Count | Files | Fix Priority |
|---------|-------|-------|--------------|
| `text-white` | 137 | 62 | HIGH |
| `bg-white/[opacity]` | 22 | 15 | MEDIUM |
| `bg-black/[opacity]` | 18 | 18 | MEDIUM |
| Hex colors in TSX | 133 | 40+ | MEDIUM |

**Audit workflow:**

```
Phase 1: Discovery (automated grep patterns)
  ├── Identify all hardcoded colors
  ├── Generate violation report with file:line locations
  └── Categorize by context (hero, checkout, admin)

Phase 2: Batch Fixes (by pattern, not by file)
  ├── Fix high-traffic pages first (homepage, menu, checkout)
  ├── Test in both light and dark modes
  └── Visual regression testing

Phase 3: ESLint Enforcement
  └── Add rule to prevent new violations
```

**Hero Redesign Architecture: Enhance Existing Component**

Current hero structure is functional (2D gradient + parallax). Enhancement adds depth without architectural changes:

```
Hero.tsx (enhance existing)
  ├── HeroBackground.tsx (extract/new)
  │     ├── Multiple parallax layers at different speeds
  │     ├── Floating food emojis with CSS animations
  │     └── Decorative elements
  └── HeroContent (keep mostly unchanged)
        └── Enhanced entrance animations
```

**Parallax layer configuration (using existing tokens):**

| Layer | Existing Token | Speed | Elements |
|-------|---------------|-------|----------|
| Background | `parallaxPresets.background` (0.1) | Slow | Gradient, pattern |
| Midground | `parallaxPresets.mid` (0.4) | Medium | Decorative shapes |
| Content | Base (1.0) | Normal | Headlines, CTAs |
| Foreground | `parallaxPresets.foreground` (0.8) | Fast | Floating emojis |

**V7 Consolidation: Minimal Scope**

V7 remnants are **naming only**, not functional conflicts:

| Issue | Files | Action |
|-------|-------|--------|
| Public API uses `v7Palettes` | `gradients.ts`, `DynamicThemeProvider.tsx` | Rename to `palettes` |
| Export aliases (`AuthModalV7`) | `auth/index.ts`, `onboarding/index.ts` | Remove aliases |
| Legacy comments | 2 files | Update or remove |

**UI Library Unification: Defer to Later Milestone**

Two UI directories (`ui/` and `ui-v8/`) have overlapping exports (Modal, Drawer, Toast, Tooltip). This is intentional during migration. Full unification is out of scope for v1.3. Focus on theme consistency only.

### Critical Pitfalls

**1. Incomplete Theme Token Audit (Partial Fix Syndrome)**

Works in light mode, broken in dark mode. Root cause: fixing visible violations while missing fallback code, error states, inline styles, or SVG fills.

**Prevention:**
- Comprehensive grep patterns: `style={{`, `fill=`, `stroke=`
- Fix by code path (primary UI, error states, loading states, empty states)
- ESLint rule after migration to prevent regression
- Always test BOTH themes before marking complete

**2. CSS 3D Transforms + Stacking Context = Content Disappearing**

Content flickers or disappears when hovering 3D-transformed elements. Root cause: `preserve-3d` creates stacking context conflicts when combined with `scale`, `zIndex`, or `opacity`.

**Prevention:**
- Never combine `preserve-3d` with `overflow: hidden`, `opacity < 1`, or `filter`
- Use `translateZ` instead of `z-index` inside 3D contexts
- Disable competing animations: no scale when 3D tilt is active
- Isolate 3D contexts with `isolation: isolate` on parent

**Evidence from codebase (LEARNINGS.md):**
```tsx
// BROKEN - zIndex and scale conflict with preserve-3d
<motion.div
  style={{ transformStyle: "preserve-3d", rotateX, rotateY }}
  whileHover={{ scale: 1.03, zIndex: 50 }}  // Breaks 3D context
>

// WORKING - disable scale when using 3D tilt
<motion.div
  style={{ transformStyle: "preserve-3d", rotateX, rotateY }}
  whileHover={!shouldEnableTilt ? { scale: 1.03 } : undefined}
>
```

**3. Semantic Token Misuse (Inverse Tokens)**

Using `bg-text-*` tokens for backgrounds or `text-surface-*` for text creates inverted contrast that breaks in one theme.

**Prevention:**
- Use section-specific token pairs (`bg-footer-bg` + `text-footer-text`)
- Never mix "opposite" tokens
- Create explicit paired tokens for special sections

**4. Touch Device Detection for 3D Effects**

3D tilt effects on touch devices cause content to disappear or block scrolling. Root cause: `pointer: coarse` doesn't catch all touch devices, touch/mouse events fire differently.

**Prevention:**
- SSR-safe detection with mounted state
- Check capabilities, not device type: `window.matchMedia('(hover: hover)').matches`
- Graceful degradation: disable tilt on touch devices
- Only prevent scroll when actively tilting (`touchAction: 'none'` during interaction only)

**5. Parallax Performance on Mobile Safari**

Parallax scroll causes janky animation or battery drain on iOS. Root cause: `background-attachment: fixed` not supported on iOS Safari, scroll-linked animations trigger expensive repaints.

**Prevention:**
- Use CSS scroll-driven animations (`animation-timeline: scroll()`) where supported
- Limit parallax layers to 3 maximum on mobile
- Disable on `prefers-reduced-motion`
- Test on real iOS device, not just simulator

---

## Implications for Roadmap

Suggested phase structure based on research:

### Phase 1: Foundation Audit (1-2 tasks)

**Rationale:** Must know full scope before fixing anything. Grep patterns establish baseline, prevent partial fixes.

**Delivers:**
- Complete violation inventory (files + line numbers)
- Baseline report with counts
- Categorized by priority (user-facing vs admin)

**Addresses:** Prevents Pitfall #1 (incomplete audits)

**Pattern:** Automated discovery → categorization → prioritization

### Phase 2: High-Impact Token Fixes (3-5 tasks)

**Rationale:** User-facing pages first (homepage, checkout, cart). Highest visibility, most users affected.

**Delivers:**
- Theme-consistent homepage
- Theme-consistent checkout flow
- Theme-consistent cart/navigation
- Fixed hardcoded hex colors in critical paths

**Addresses:**
- Table stakes: no hardcoded `text-white`, `bg-white`
- FEATURES.md: semantic tokens throughout
- Files: `Hero.tsx`, `TestimonialsCarousel.tsx`, `CartBarV8.tsx`, `TimeSlotPicker.tsx`

**Avoids:** Pitfall #3 (semantic token misuse) by using paired tokens

**Pattern:** Batch fixes by page/feature, test both themes per batch

### Phase 3: Hero Enhancement (3-4 tasks)

**Rationale:** Hero needs consistent tokens to work correctly. After token fixes, enhance with parallax layers and floating emojis.

**Delivers:**
- Floating food emojis with CSS animations
- Multi-layer parallax (3 layers)
- Staggered entrance animations
- Theme-aware gradient enhancements

**Uses:**
- STACK: Framer Motion `useScroll`, CSS float keyframes
- ARCHITECTURE: `parallaxPresets` from motion-tokens.ts
- Existing: `animate-float`, `spring.rubbery`

**Addresses:**
- Differentiators: floating emojis, enhanced parallax
- Mobile 3D detection patterns

**Avoids:**
- Pitfall #2 (3D stacking conflicts) by isolating 3D contexts
- Pitfall #4 (touch device issues) with SSR-safe detection
- Pitfall #5 (parallax performance) by limiting layers to 3 max

**Pattern:** Extract background component → add parallax → add emojis → polish

### Phase 4: Mobile 3D Tilt Fix (1-2 tasks)

**Rationale:** Isolated to `UnifiedMenuItemCard.tsx`. Critical bug but contained scope.

**Delivers:**
- Working 3D tilt on iOS Safari
- No content clipping or disappearing
- Touch-safe interaction patterns

**Implements:**
- CSS fixes: `-webkit-backface-visibility: hidden`, `translate3d(0,0,0)`
- Disable scale animations when tilt active
- Touch device detection with mounted state

**Avoids:** Pitfall #2 (stacking context conflicts) explicitly

**Pattern:** CSS fixes → test on real iOS device → fallback if issues persist

### Phase 5: Remaining Fixes + V7 Cleanup (2-3 tasks)

**Rationale:** Lower priority areas (admin/driver) after user-facing fixes complete.

**Delivers:**
- Theme-consistent admin components
- Theme-consistent driver layouts
- V7 naming removed from public APIs
- Documentation updated

**Addresses:**
- CONSOLIDATION.md: V7 naming cleanup (4 files)
- Admin/driver components with hardcoded colors
- Token usage pattern documentation

**Pattern:** Low-priority batch fixes → API cleanup → documentation

### Phase Ordering Rationale

**Dependencies:**
- Audit first → establishes baseline, prevents partial fixes
- User-facing tokens before hero → hero needs consistent tokens
- Hero before admin fixes → parallels frontend/backend work
- Mobile tilt can parallel with hero → different components

**Architecture-based grouping:**
- Phase 2 groups by visibility tier (homepage > checkout > admin)
- Phase 3 isolates hero work (single component, high polish)
- Phase 4 isolates mobile tilt (different skillset, needs real device)

**Pitfall avoidance:**
- Audit prevents incomplete fixes (Pitfall #1)
- Hero phase addresses 3D, touch, parallax pitfalls together (Pitfalls #2, #4, #5)
- Token fixes before enhancement work prevents rework

### Research Flags

**Needs deeper research during planning:**
- None. Patterns are well-established, tokens exist, architecture is defined.

**Standard patterns (skip research-phase):**
- All phases use existing patterns from codebase
- Theme tokens: documented in LEARNINGS.md
- 3D fixes: documented in ERROR_HISTORY.md
- Parallax: existing implementation in Hero.tsx

**Validation needed:**
- Real iOS device testing for mobile 3D tilt (Phase 4)
- Visual regression testing in both themes (all phases)
- Performance testing for parallax on low-end devices (Phase 3)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All dependencies already installed, patterns already used |
| Features | HIGH | Table stakes are clear (theme consistency), differentiators are optional polish |
| Architecture | HIGH | Token system exists and is well-designed, adoption is the issue |
| Pitfalls | HIGH | Documented in ERROR_HISTORY.md and LEARNINGS.md from actual bugs |
| Theme Audit | HIGH | Grep counts verified, violation patterns clear |
| Hero Enhancement | HIGH | Existing Hero uses same patterns, just adding layers |
| Mobile 3D Fix | MEDIUM-HIGH | CSS fixes documented, may need device-specific testing |

**Overall confidence:** HIGH

Research is comprehensive and verified against actual codebase. Patterns exist, tools are installed, and past bugs are documented. This is systematic cleanup work, not exploratory development.

### Gaps to Address

**During planning:**
- **Exact token mappings:** Some contexts need manual review (e.g., is this `text-text-inverse` or `text-hero-text`?)
- **Hero gradient behavior:** Verify dynamic theme gradients work with parallax layers
- **Safari version support:** Confirm CSS scroll-timeline fallback strategy for Safari < 17.6

**During implementation:**
- **Real device testing:** iOS Safari 3D tilt must be tested on physical iPhone, not simulator
- **Visual regression baseline:** Establish screenshot baseline in both themes before fixes
- **Performance budget:** Define acceptable FPS for parallax on low-end devices

**After implementation:**
- **ESLint rule calibration:** Add enforcement rules only after migration complete to avoid noise
- **Documentation:** Update LEARNINGS.md with final token usage patterns

---

## Sources

### Primary (HIGH confidence)

**Codebase Documentation:**
- `src/styles/tokens.css` - Token definitions verified (62 tokens across 8 categories)
- `src/lib/motion-tokens.ts` - Motion system verified (parallax presets, spring configs)
- `src/components/homepage/Hero.tsx` - Current hero implementation reviewed
- `src/app/globals.css` - Animation keyframes available
- `.claude/ERROR_HISTORY.md` (2026-01-22 to 2026-01-26) - Actual bugs documented
- `.claude/LEARNINGS.md` (2026-01-25, 2026-01-26) - Theme patterns documented

**Official Documentation:**
- [TailwindCSS v4.0 @theme Directive](https://tailwindcss.com/blog/tailwindcss-v4) - CSS-first configuration
- [Theme Variables - Tailwind CSS Docs](https://tailwindcss.com/docs/theme) - @theme vs :root guidance
- [Next.js Hydration Errors](https://nextjs.org/docs/messages/react-hydration-error) - SSR safety patterns
- [MDN transform-style](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform-style) - 3D stacking context rules
- [MDN CSS Scroll-Driven Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations) - Parallax performance

### Secondary (MEDIUM confidence)

**Design Systems & Patterns:**
- [Tailwind CSS Best Practices 2025-2026](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns)
- [Design Tokens Explained - Contentful](https://www.contentful.com/blog/design-token-system/)
- [Advanced Theming with Design Tokens - David Supik](https://david-supik.medium.com/advanced-theming-techniques-with-design-tokens-bd147fe7236e)

**Animation & Performance:**
- [CSS and JavaScript Animation Performance - MDN](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance)
- [Framer Motion Parallax Implementation](https://medium.com/@rob.bettison94/framer-motion-parallax-implementation-in-react-b4c0c652c407)
- [Performant Parallaxing - Chrome Developers](https://developer.chrome.com/blog/performant-parallaxing)

**Mobile & Touch:**
- [A Guide to Hover and Pointer Media Queries - Smashing Magazine](https://www.smashingmagazine.com/2022/03/guide-hover-pointer-media-queries/)
- [Detecting Hover-Capable Devices - CSS-IRL](https://css-irl.info/detecting-hover-capable-devices/)

### Tertiary (Community findings, needs validation)

- [Samsung CSS Hover Bug - Ctrl Blog](https://www.ctrl.blog/entry/css-media-hover-samsung.html) - Samsung quirk with pointer detection
- [Fixing Hydration Mismatch in Next.js](https://medium.com/@pavan1419/fixing-hydration-mismatch-in-next-js-next-themes-issue-8017c43dfef9) - Theme flash fixes
- [CSS 3D Transform Gotchas](https://css-tricks.com/things-watch-working-css-3d/) - Community 3D pitfalls
- [W3C CSS preserve-3d Stacking Context](https://github.com/w3c/csswg-drafts/issues/6430) - Spec discussions on 3D stacking

---

*Research completed: 2026-01-27*
*Ready for roadmap: yes*
*Synthesized from: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md, CONSOLIDATION.md*
