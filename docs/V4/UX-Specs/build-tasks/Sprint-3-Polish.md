# Sprint 3: Polish

> **Priority**: MEDIUM — Add premium feel after consistency
> **Tasks**: 7
> **Dependencies**: Sprints 1-2 complete

---

## Progress

| Task | Status | Description |
|------|--------|-------------|
| 3.1 | ✅ | Contextual shimmer/pulse loading |
| 3.2 | ✅ | Variable stagger animations |
| 3.3 | ✅ | Tight spring progress bars |
| 3.4 | ✅ | Cart badge pulse |
| 3.5 | ✅ | Continuous CTA shimmer |
| 3.6 | ✅ | User animation toggle |
| 3.7 | ✅ | A/B test infrastructure |

---

## Task 3.1: Contextual Shimmer/Pulse Loading

**Goal**: Different loading states for initial vs refetch
**Status**: ✅ Complete

### Prompt

```
Implement contextual loading states: shimmer for initial load, pulse for refetch.

REQUIREMENTS:
- Shimmer: gradient translateX animation, 1.5s infinite
- Pulse: subtle opacity/scale pulse, 0.5s once
- Track loading context: initial vs refetch

IMPLEMENTATION:
- Update src/components/ui/skeleton.tsx
- Add context prop: "initial" | "refetch"
- Default to "initial" for backwards compatibility
- Shimmer keyframes already exist, add pulse variant

APPLY TO:
- Menu item cards
- Cart items
- Any image loading state

OUTPUT:
- src/components/ui/skeleton.tsx (enhanced)
- Usage examples in components
```

### Verification
- [ ] Shimmer shows on first load
- [ ] Pulse shows on refetch
- [ ] Respects reduced motion
- [ ] 60fps animation

---

## Task 3.2: Variable Stagger Animations

**Goal**: Natural-feeling cascade effect on lists
**Status**: ✅ Complete

### Prompt

```
Implement variable-timing stagger animations for all lists.

REQUIREMENTS:
- Stagger delay: start at 30ms, decelerate to 80ms
- Apply to: menu grids, cart items, order lists, admin cards
- Respect reduced motion preference

IMPLEMENTATION:
- Create variableStagger function in micro-interactions.ts
- Formula: delay = baseDelay + (index * index * acceleration)
- Cap at maxDelay (80ms)

APPLY TO:
- MenuItemCard grids
- CartItem lists
- Order history
- Admin dashboard cards

OUTPUT:
- src/lib/micro-interactions.ts (enhanced)
- All list components updated
```

### Verification
- [ ] Items cascade naturally
- [ ] Later items slower than earlier
- [ ] Respects reduced motion
- [ ] Applied to all list types

---

## Task 3.3: Tight Spring Progress Bars

**Goal**: Apple-like crisp spring physics
**Status**: ✅ Complete

### Prompt

```
Replace linear easing with tight spring on all progress bars.

REQUIREMENTS:
- Spring config: stiffness: 400, damping: 25
- Apply to: free delivery progress, order tracking, route completion, loading bars
- Respect reduced motion

IMPLEMENTATION:
- Create progressSpring variant in micro-interactions.ts
- Update all progress bar components
- Use Framer Motion's useSpring or spring transition

OUTPUT:
- src/lib/micro-interactions.ts (progressSpring)
- All progress bar components updated
```

### Verification
- [ ] Progress bars have spring physics
- [ ] No overshoot (damping: 25)
- [ ] Respects reduced motion
- [ ] Applied to all progress bars

---

## Task 3.4: Cart Badge Pulse

**Goal**: Visual feedback when cart changes
**Status**: ✅ Complete

### Prompt

```
Add pulse animation to cart badge on ANY cart change.

REQUIREMENTS:
- Trigger: item added, removed, quantity changed
- Animation: scale [1, 1.2, 1] over 0.3s
- Spring physics for natural feel
- Respect reduced motion

IMPLEMENTATION:
- Add pulse state to cart store or hook
- Trigger pulse on cart mutations
- Auto-reset after animation completes
- Use Framer Motion animate prop

OUTPUT:
- Update src/components/cart/cart-button.tsx or wherever badge lives
- Update cart store/hook to trigger pulse
```

### Verification
- [ ] Badge pulses on add
- [ ] Badge pulses on remove
- [ ] Badge pulses on quantity change
- [ ] Respects reduced motion

---

## Task 3.5: Continuous CTA Shimmer

**Goal**: Primary buttons draw attention with subtle shimmer
**Status**: ✅ Complete

### Prompt

```
Add continuous subtle gradient shimmer to all primary CTA buttons.

REQUIREMENTS:
- Gradient: from var(--color-cta) to var(--color-primary)
- Shimmer: translateX animation, 3s infinite
- Subtle: low opacity gradient overlay
- Respect reduced motion

IMPLEMENTATION:
- Update Button component variant="primary"
- Add shimmer overlay as ::after pseudo-element
- Animate background-position or transform

OUTPUT:
- src/components/ui/Button.tsx (primary variant enhanced)
- Verify on: Add to Cart, Checkout, Hero CTA
```

### Verification
- [ ] Primary buttons shimmer
- [ ] Shimmer is subtle, not distracting
- [ ] Respects reduced motion
- [ ] Works in light and dark mode

---

## Task 3.6: User Animation Toggle

**Goal**: Let users control animation level
**Status**: ✅ Complete

### Prompt

```
Add user-configurable animation preference toggle.

REQUIREMENTS:
- Storage: localStorage key "animation-preference"
- Values: "full" | "reduced" | "none"
- Overrides system prefers-reduced-motion
- UI: Toggle in settings/preferences

IMPLEMENTATION:
- Create useAnimationPreference hook
- Check localStorage first, then system preference
- Apply via data attribute or context
- All animations check this preference

OUTPUT:
- src/lib/hooks/useAnimationPreference.ts
- Settings UI component for toggle
- All animation components respect preference
```

### Verification
- [ ] Toggle in settings works
- [ ] "full" enables all animations
- [ ] "reduced" disables non-essential
- [ ] "none" disables all animations
- [ ] Persists across sessions

---

## Task 3.7: A/B Test Infrastructure

**Goal**: Support A/B testing with Vercel Edge Config
**Status**: ✅ Complete

### Prompt

```
Set up Vercel Edge Config for A/B testing.

REQUIREMENTS:
- Vercel Edge Config for feature flags
- Hero variant A/B test ready
- Consistent user experience (same variant per user)

IMPLEMENTATION:
- Set up Edge Config in Vercel dashboard
- Create useABTest hook
- Store variant assignment in cookie/localStorage
- Fetch config at edge for fast response

OUTPUT:
- src/lib/hooks/useABTest.ts
- Vercel Edge Config setup docs
- Hero component with variant support
```

### Verification
- [ ] Edge Config connected
- [ ] useABTest hook works
- [ ] Same user gets same variant
- [ ] Hero supports multiple variants

---

## Sprint 3 Completion Checklist

Before moving to Sprint 4:
- [x] All 7 tasks completed
- [x] `pnpm typecheck` passes
- [x] `pnpm test` passes (346 tests)
- [ ] All animations 60fps (needs visual testing)
- [x] Reduced motion respected everywhere
- [x] A/B infrastructure tested
- [ ] Visual review at all breakpoints (needs manual review)
