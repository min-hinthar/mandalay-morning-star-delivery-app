---
status: resolved
trigger: "Three visual issues with floating emojis in Hero: rectangular backgrounds, parallax scroll, infinite repeating animations"
created: 2026-01-28T00:00:00Z
updated: 2026-01-28T00:02:00Z
---

## Current Focus

hypothesis: CONFIRMED and FIXED - All three issues resolved
test: TypeScript typecheck, ESLint, and Next.js production build all pass
expecting: N/A - complete
next_action: Archive

## Symptoms

expected:
1. Floating emojis should have transparent backgrounds (no visible rectangles)
2. Emojis should NOT move with scroll parallax - static position (only floating animation)
3. Emojis should appear once (not repeating) with varied, finite animations

actual:
1. Emojis show rectangular backgrounds behind them
2. Emojis move with scroll parallax effect
3. Emojis repeat and animations loop infinitely

errors: No console errors - purely visual issues
reproduction: Load homepage and observe hero section
started: Phase 31 implementation (31-03 created FloatingEmoji.tsx)

## Eliminated

## Evidence

- timestamp: 2026-01-28T00:00:30Z
  checked: FloatingEmoji.tsx line 158
  found: `boxShadow: var(--hero-emoji-shadow-${depth})` applied to the span element; tokens.css defines these as `0 2px 8px rgba(0,0,0,0.1)` etc. Emojis are rendered as `<span>` elements with text content. The boxShadow creates a rectangular shadow around the span's bounding box, making a visible rectangle behind the emoji character.
  implication: This is ISSUE 1 - the boxShadow on the span creates the rectangular background effect.

- timestamp: 2026-01-28T00:00:35Z
  checked: Hero.tsx lines 443-447, 459, 521-540
  found: `emojisY` transform computed from `scrollYProgress` with `parallaxPresets.near.speedFactor`. The `smoothEmojisY` spring is applied to the emoji container div via `style={{ y: smoothEmojisY }}`. This makes the entire emoji layer shift vertically as user scrolls.
  implication: This is ISSUE 2 - the parallax scroll transform on the emoji container div.

- timestamp: 2026-01-28T00:00:40Z
  checked: FloatingEmoji.tsx lines 184-189
  found: `repeat: Infinity` in the transition config for all emoji animations. Also, `parallaxY` prop is passed through from Hero.tsx. Animation configs use only 3 types (drift/spiral/bob) with infinite loops.
  implication: This is ISSUE 3 - the `repeat: Infinity` causes endless animation loops.

## Resolution

root_cause: Three issues:
  1. `boxShadow` CSS property on emoji spans creates rectangular shadow behind emoji text, appearing as a background rectangle
  2. `smoothEmojisY` parallax transform on emoji container div in Hero.tsx causes emojis to shift with scroll
  3. `repeat: Infinity` in FloatingEmoji.tsx animation transition causes infinite looping

fix:
  1. Replaced `boxShadow` with `filter: drop-shadow()` which follows the emoji glyph shape instead of the rectangular bounding box
  2. Removed `emojisY`/`smoothEmojisY` scroll transforms from Hero.tsx; changed emoji container from `motion.div` to plain `div` (no parallax)
  3. Changed `repeat: Infinity` to `repeat: getRepeatCount(index)` returning 1-3 based on index. Added per-emoji animation variation via index-based offsets to keyframe values. Added opacity fade-in keyframes to all animation types.

verification: TypeScript typecheck passes (0 errors). ESLint passes (only pre-existing blur warnings unrelated to changes). Next.js production build succeeds.

files_changed:
  - src/components/ui/homepage/FloatingEmoji.tsx
  - src/components/ui/homepage/Hero.tsx
