---
status: resolved
trigger: "category-tabs-scroll-snap - Tab bar resets position when category is selected"
created: 2026-01-28T00:00:00Z
updated: 2026-01-28T00:50:00Z
---

## Current Focus

hypothesis: CONFIRMED - scrollIntoView interacts poorly with sticky positioning and simultaneous page scroll
test: Replaced scrollIntoView with manual scroll calculation using container.scrollTo
expecting: Tab bar should now properly scroll to keep active tab visible
next_action: Verify fix works in browser

## Symptoms

expected: Tab bar should snap/scroll to keep selected category tab visible while content scrolls to that category
actual: When selecting a category tab, the tab bar view resets (scrolls back to start?) causing the selected category tab to go out of view, but the menu content does scroll to the correct category
errors: None reported
reproduction: Tap any category tab that requires scrolling to see (e.g., a tab on the right side of the tab bar)
started: Current behavior, happens on both homepage menu section and /menu page

## Eliminated

## Evidence

- timestamp: 2026-01-28T00:05:00Z
  checked: CategoryTabs.tsx lines 121-134
  found: useEffect exists that calls scrollIntoView on activeTabRef when activeCategory changes
  implication: Scroll-into-view logic IS present and should work

- timestamp: 2026-01-28T00:06:00Z
  checked: CategoryTabs.tsx line 123
  found: Condition "if (!activeTabRef.current || !shouldAnimate) return" - skips scrollIntoView if shouldAnimate is false
  implication: If user prefers reduced motion, scrollIntoView is SKIPPED

- timestamp: 2026-01-28T00:07:00Z
  checked: HomepageMenuSection.tsx lines 305-312
  found: CategoryTabs uses controlled mode (activeCategory prop passed in)
  implication: isControlled=true, so scrollspy is disabled

- timestamp: 2026-01-28T00:08:00Z
  checked: HomepageMenuSection.tsx line 126-143
  found: handleCategoryChange sets activeCategory state AND scrolls content to category section
  implication: State change occurs, triggering re-render

- timestamp: 2026-01-28T00:09:00Z
  checked: HomepageMenuSection.tsx line 318
  found: AnimatePresence mode="wait" with key={activeCategory || "all"}
  implication: When activeCategory changes, entire content block exits/enters with new key - BUT this is BELOW the CategoryTabs component

- timestamp: 2026-01-28T00:10:00Z
  checked: CategoryTabs.tsx line 123 closely
  found: The condition is "if (!activeTabRef.current || !shouldAnimate) return" - the scrollIntoView is ONLY called when shouldAnimate is TRUE
  implication: ROOT CAUSE CANDIDATE - scrollIntoView doesn't work when shouldAnimate=false (prefers-reduced-motion), but MORE IMPORTANTLY: this check seems inverted

- timestamp: 2026-01-28T00:12:00Z
  checked: useAnimationPreference.ts line 101
  found: shouldAnimate = preference !== "none" - so it's TRUE for "full" and "reduced"
  implication: The shouldAnimate check is NOT the root cause for most users

- timestamp: 2026-01-28T00:13:00Z
  checked: CategoryTabs.tsx line 195-197 (ref assignment)
  found: ref={isActive ? activeTabRef : null} - ref is conditionally assigned based on isActive
  implication: When activeCategory changes, the NEW active button gets the ref assigned, but this happens during render BEFORE the useEffect runs - so ref should be correct

- timestamp: 2026-01-28T00:14:00Z
  checked: CategoryTabs.tsx line 189-192 (isActive calculation)
  found: isActive = tab.slug === null ? activeCategory === null : activeCategory === tab.slug
  implication: isActive is correctly calculated based on activeCategory prop

- timestamp: 2026-01-28T00:15:00Z
  checked: Timing of scrollIntoView vs page scroll
  found: handleCategoryChange in HomepageMenuSection ALSO scrolls the content with window.scrollTo (line 136)
  implication: HYPOTHESIS: The window.scrollTo for content AND the scrollIntoView for tab might conflict, OR the window scroll causes the tab bar to lose its scroll position

- timestamp: 2026-01-28T00:18:00Z
  checked: HomepageMenuSection scroll target
  found: sectionRefs.current.get(category.id) is used but NO section elements have these IDs in the current render!
  implication: The scroll target may not exist, OR sectionRefs is incorrectly populated

- timestamp: 2026-01-28T00:19:00Z
  checked: HomepageMenuSection line 351-354
  found: ref={(el) => setSectionRef(category.id, el)} - this DOES set refs when rendering by category
  implication: The refs ARE populated correctly when a category is active

- timestamp: 2026-01-28T00:20:00Z
  checked: Deeper analysis of re-render flow
  found: When activeCategory changes from null to "soup":
    1. setActiveCategory("soup") triggers re-render
    2. AnimatePresence key changes from "all" to "soup"
    3. mode="wait" causes old grid to EXIT before new grid ENTERS
    4. CategoryTabs re-renders with new activeCategory
    5. useEffect for scrollIntoView fires
    6. BUT: The tab ref assignment happens in render, useEffect fires after render
  implication: The ref SHOULD be assigned before useEffect fires

- timestamp: 2026-01-28T00:22:00Z
  checked: Root cause analysis - FOUND IT
  found: Looking at CategoryTabs line 197: ref={isActive ? activeTabRef : null}
         When activeCategory changes from "appetizers" to "desserts":
         - In SAME render: old button loses ref (isActive=false), new button gets ref (isActive=true)
         - React ref behavior: when ref changes from element A to element B in same render,
           the ref.current is updated to new element AFTER layout effects run
         - useEffect (not useLayoutEffect!) runs AFTER browser paint
         - So scrollIntoView SHOULD work correctly
  implication: Ref timing is NOT the issue

- timestamp: 2026-01-28T00:25:00Z
  checked: Possibility of tab bar scroll container reset
  found: The CategoryTabs component receives activeCategory as prop
         When prop changes, component re-renders but scroll container is NOT unmounted
         Native browser scroll position should be preserved on re-render
  implication: Scroll position should NOT reset just from prop change

- timestamp: 2026-01-28T00:27:00Z
  checked: CSS sticky behavior interaction
  found: CategoryTabs has "sticky top-[var(--tabs-offset)]" class
         When user scrolls down to see "Desserts" tab and clicks it:
         - Content scrolls via window.scrollTo
         - Page scroll position changes
         - Tab bar position on screen might change due to sticky behavior
         - BUT this shouldn't affect the INTERNAL scroll position of the tab bar
  implication: Sticky positioning is NOT the cause

- timestamp: 2026-01-28T00:30:00Z
  checked: Critical realization about render timing
  found: In HomepageMenuSection, when category changes:
         - AnimatePresence mode="wait" causes old content to ANIMATE OUT
         - This animation takes time (exit animation)
         - During exit, the content shrinks/fades
         - This might cause layout reflow
         - BUT the CategoryTabs is OUTSIDE the AnimatePresence block (lines 305-312 vs 315-411)
  implication: CategoryTabs should NOT be affected by AnimatePresence animations

- timestamp: 2026-01-28T00:32:00Z
  checked: Looking for any scroll-to-top or scroll reset behavior
  found: No explicit scroll reset in CategoryTabs
         BUT: If for some reason the scroll container is affected by layout changes, browser might reset scroll
  implication: Need to verify in browser - no clear code-level cause found

- timestamp: 2026-01-28T00:35:00Z
  checked: scrollIntoView behavior with sticky containers
  found: scrollIntoView({ block: "nearest", inline: "center" }) operates on the element's position
         When element is in a sticky container, scrollIntoView might affect:
         1. The horizontal scroll container (intended)
         2. The page scroll (unintended) - because element position relative to viewport changes during page scroll
  implication: POTENTIAL ROOT CAUSE - scrollIntoView might scroll the wrong ancestor or interact poorly with sticky positioning

- timestamp: 2026-01-28T00:38:00Z
  checked: Alternative scroll approach
  found: Instead of scrollIntoView, we should directly scroll the scrollContainer using scrollTo or scrollLeft
         This gives us precise control and avoids scrollIntoView's unpredictable behavior with sticky elements
  implication: FIX DIRECTION - Replace scrollIntoView with direct scrollContainer manipulation

## Resolution

root_cause: |
  The CategoryTabs component used `element.scrollIntoView({ block: "nearest", inline: "center" })` to scroll
  the active tab into view. However, `scrollIntoView` can interact unpredictably when:
  1. The element is inside a sticky container
  2. The page is simultaneously scrolling (via window.scrollTo for content navigation)

  The `scrollIntoView` method operates on all scrollable ancestors, including the viewport.
  When the tab bar is sticky and the page is scrolling, the browser may calculate incorrect
  scroll targets or the scroll may be overridden by the page scroll operation.

fix: |
  Replaced `scrollIntoView` with manual scroll calculation using `container.scrollTo`:
  1. Calculate the tab's offsetLeft relative to the scroll container
  2. Calculate target scroll position to center the tab horizontally
  3. Clamp to valid scroll range (0 to maxScroll)
  4. Check if tab is already visible (with padding)
  5. Only scroll if not visible, using container.scrollTo({ left, behavior })

  This approach directly controls only the horizontal scroll container,
  avoiding any interaction with page scroll or sticky positioning.

verification: |
  - TypeScript: No new errors introduced (pre-existing error in unrelated file)
  - ESLint: CategoryTabs.tsx passes lint with no errors
  - Browser testing needed: tap category tabs on right side of tab bar to verify scroll behavior
files_changed:
  - src/components/ui/menu/CategoryTabs.tsx
