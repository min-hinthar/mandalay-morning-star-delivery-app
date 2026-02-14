---
status: skipped
phase: 60-lcp-optimization
source: [60-01-SUMMARY.md, 60-02-SUMMARY.md, 60-03-SUMMARY.md]
started: 2026-02-14T11:40:00Z
updated: 2026-02-14T11:40:00Z
---

## Current Test

number: 1
name: Hero heading visible without JS
expected: |
  Navigate to the homepage. The hero heading ("Authentic Burmese Cuisine" or similar) should be visible immediately on page load — no flash of invisible text, no delay waiting for JavaScript to hydrate. The text may have a subtle fade-in-up animation but should never start fully invisible.
awaiting: user response

## Tests

### 1. Hero heading visible without JS
expected: Hero heading text is visible immediately on page load (no opacity:0 flash). A subtle CSS fade-in-up animation may play but content starts near-visible (opacity ~0.85).
result: [pending]

### 2. Hero content elements visible at server render
expected: All hero content below the heading (greeting badge, tagline, subheadline, CTA buttons, stats bar) are visible on initial page load without waiting for JS. Each element may have a staggered CSS fade-in-up animation with increasing delays.
result: [pending]

### 3. Tab indicator slides smoothly (CSS transition)
expected: On any page with tabs (e.g., menu category tabs, account settings tabs), clicking a different tab causes the active indicator pill to slide smoothly to the new position. The animation should be a smooth CSS transition, not an instant snap.
result: [pending]

### 4. Navigation dots animate on carousel
expected: On the homepage testimonials carousel or featured carousel, the active dot indicator transitions smoothly between dots (size/color change with CSS transition, not instant snap).
result: [pending]

### 5. Bottom nav indicator slides between items
expected: On mobile, tapping different bottom navigation items causes the active indicator bar to slide smoothly to the tapped item position via CSS transition.
result: [pending]

### 6. Cart item swipe-to-delete still works
expected: On the cart page with items, swiping a cart item left/right triggers the drag-to-delete interaction. The item should drag horizontally and dismiss when released past the threshold.
result: [pending]

### 7. Admin nav indicator animates
expected: On admin pages, clicking different nav items causes the active indicator to animate smoothly between positions (layoutId still works on admin routes via DomMaxProvider).
result: [pending]

### 8. Toast dismisses via X button
expected: When a toast notification appears, clicking the X button dismisses it with a smooth exit animation. Swipe-to-dismiss is no longer available (removed as non-signature animation).
result: [pending]

### 9. Reduced motion preference respected
expected: With "Reduce motion" enabled in OS accessibility settings, hero entrance animations and all CSS fade-in-up animations should be disabled (content appears instantly, no animation).
result: [pending]

### 10. Build and tests pass
expected: Running `pnpm build` and `pnpm test` both complete successfully with no errors. All 335+ tests pass.
result: [pending]

## Summary

total: 10
passed: 0
issues: 0
pending: 10
skipped: 0

## Gaps

[none yet]
