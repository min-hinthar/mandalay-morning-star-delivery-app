# Token Audit Report

Generated: 2026-01-28 06:57:03
Total files scanned: 32
Total violations: 126

## Summary

| Severity | Count |
|----------|-------|
| Critical | 89 |
| Warning | 37 |
| Info | 0 |
| **Total** | **126** |

## By Category

| Category | Critical | Warning | Info | Total |
|----------|----------|---------|------|-------|
| effects | 11 | 13 | 0 | 24 |
| colors | 69 | 24 | 0 | 93 |
| spacing | 2 | 0 | 0 | 2 |
| deprecated | 7 | 0 | 0 | 7 |

## By Type

### text-white (29) - **CRITICAL**

**Suggested fix:** text-text-inverse (or text-hero-text in hero sections)

- `src/app/(customer)/orders/[id]/feedback/DeliveryFeedbackForm.tsx:150` - `text-white`
- `src/components/ui/Container.stories.tsx:129` - `text-white`
- `src/components/ui/driver/PhotoCapture.tsx:243` - `text-white`
- `src/components/ui/driver/PhotoCapture.tsx:249` - `text-white`
- `src/components/ui/driver/PhotoCapture.tsx:282` - `text-white`
- `src/components/ui/driver/PhotoCapture.tsx:340` - `text-white`
- `src/components/ui/Grid.stories.tsx:243` - `text-white`
- `src/components/ui/layout/DriverLayout.tsx:110` - `text-white`
- `src/components/ui/layout/DriverLayout.tsx:132` - `text-white`
- `src/components/ui/layout/DriverLayout.tsx:155` - `text-white`
- ... and 19 more

### inline color:#hex (24) - WARNING

**Suggested fix:** Use CSS variable: color: var(--color-text-primary)

- `src/stories/button.css:11` - `color: #555ab9`
- `src/stories/button.css:17` - `color: #333`
- `src/stories/header.css:30` - `color: #333`
- `src/stories/page.css:5` - `color: #333`
- `src/stories/page.css:44` - `color: #357a14`
- `src/styles/high-contrast.css:83` - `color: #000000`
- `src/styles/high-contrast.css:119` - `color: #000000`
- `src/styles/high-contrast.css:120` - `color: #FFFFFF`
- `src/styles/high-contrast.css:126` - `color: #333333`
- `src/styles/high-contrast.css:132` - `color: #FFFFFF`
- ... and 14 more

### inline boxShadow (11) - **CRITICAL**

**Suggested fix:** Use CSS variable: boxShadow: var(--shadow-*)

- `src/app/(customer)/checkout/page.tsx:41` - `boxShadow: "0 0`
- `src/app/(customer)/checkout/page.tsx:47` - `boxShadow: "0 0`
- `src/components/ui/checkout/CheckoutStepperV8.tsx:124` - `boxShadow: "0 0`
- `src/components/ui/homepage/CTABanner.tsx:33` - `boxShadow: "0 0`
- `src/components/ui/homepage/CTABanner.tsx:37` - `boxShadow: "0 2`
- `src/lib/micro-interactions.ts:63` - `boxShadow: "0 2`
- `src/lib/micro-interactions.ts:67` - `boxShadow: "0 4`
- `src/lib/micro-interactions.ts:72` - `boxShadow: "0 1`
- `src/lib/micro-interactions.ts:84` - `boxShadow: "0 8`
- `src/lib/micro-interactions.ts:102` - `boxShadow: "0 2`
- ... and 1 more

### bg-white (9) - **CRITICAL**

**Suggested fix:** bg-surface-primary

- `src/app/(customer)/orders/[id]/feedback/DeliveryFeedbackForm.tsx:93` - `bg-white`
- `src/app/(customer)/orders/[id]/feedback/DeliveryFeedbackForm.tsx:142` - `bg-white`
- `src/app/(customer)/orders/[id]/feedback/DeliveryFeedbackForm.tsx:205` - `bg-white`
- `src/components/ui/layout/DriverLayout.tsx:174` - `bg-white`
- `src/components/ui/layout/DriverLayout.tsx:260` - `bg-white`
- `src/components/ui/Stack.stories.tsx:250` - `bg-white`
- `src/components/ui/Stack.stories.tsx:251` - `bg-white`
- `src/components/ui/Stack.stories.tsx:257` - `bg-white`
- `src/components/ui/Stack.stories.tsx:258` - `bg-white`

### bg-white/N (8) - **CRITICAL**

**Suggested fix:** bg-surface-primary/N

- `src/components/ui/driver/PhotoCapture.tsx:249` - `bg-white/20`
- `src/components/ui/driver/PhotoCapture.tsx:250` - `bg-white/30`
- `src/components/ui/driver/PhotoCapture.tsx:340` - `bg-white/20`
- `src/components/ui/driver/PhotoCapture.tsx:341` - `bg-white/30`
- `src/components/ui/layout/DriverLayout.tsx:195` - `bg-white/10`
- `src/components/ui/layout/DriverLayout.tsx:195` - `bg-white/20`
- `src/components/ui/layout/DriverLayout.tsx:297` - `bg-white/20`
- `src/components/ui/layout/DriverLayout.tsx:297` - `bg-white/30`

### border-white (6) - **CRITICAL**

**Suggested fix:** border-border-default or border-text-inverse

- `src/app/(customer)/orders/[id]/feedback/DeliveryFeedbackForm.tsx:293` - `border-white`
- `src/components/ui/layout/CheckoutLayout.tsx:260` - `border-white`
- `src/components/ui/layout/DriverLayout.tsx:120` - `border-white`
- `src/components/ui/layout/DriverLayout.tsx:230` - `border-white`
- `src/components/ui/layout/DriverLayout.tsx:297` - `border-white`
- `src/components/ui/orders/tracking/DriverCard.tsx:102` - `border-white`

### inline filter blur (6) - **CRITICAL**

**Suggested fix:** Use CSS variable: filter: blur(var(--blur-*))

- `src/components/ui/animated-image.tsx:89` - `filter: "blur(0px)`
- `src/components/ui/homepage/Hero.tsx:73` - `filter: "blur(10px)`
- `src/components/ui/homepage/Hero.tsx:79` - `filter: "blur(0px)`
- `src/components/ui/transitions/PageTransition.tsx:76` - `filter: "blur(12px)`
- `src/components/ui/transitions/PageTransition.tsx:81` - `filter: "blur(0px)`
- `src/components/ui/transitions/PageTransition.tsx:91` - `filter: "blur(8px)`

### v6-* prefix (6) - **CRITICAL**

**Suggested fix:** Remove v6- prefix, use semantic tokens

- `src/components/ui/orders/tracking/StatusTimeline.tsx:65` - `v6-secondary`
- `src/components/ui/orders/tracking/StatusTimeline.tsx:70` - `v6-primary`
- `src/components/ui/orders/tracking/StatusTimeline.tsx:75` - `v6-primary`
- `src/components/ui/orders/tracking/StatusTimeline.tsx:80` - `v6-secondary`
- `src/components/ui/orders/tracking/StatusTimeline.tsx:85` - `v6-green`
- `src/components/ui/orders/tracking/StatusTimeline.tsx:90` - `v6-status-error`

### border-white/N (5) - **CRITICAL**

**Suggested fix:** border-text-inverse/N

- `src/components/ui/auth/AuthModal.tsx:127` - `border-white/50`
- `src/components/ui/auth/AuthModal.tsx:331` - `border-white/50`
- `src/components/ui/cart/CartItem.tsx:207` - `border-white/20`
- `src/components/ui/cart/CartItem.tsx:207` - `border-white/10`
- `src/components/ui/checkout/CheckoutWizard.tsx:476` - `border-white/30`

### bg-black (4) - **CRITICAL**

**Suggested fix:** bg-surface-inverse or bg-[var(--color-text-primary)]

- `src/components/ui/driver/PhotoCapture.tsx:235` - `bg-black`
- `src/components/ui/layout/DriverLayout.tsx:110` - `bg-black`
- `src/components/ui/layout/DriverLayout.tsx:120` - `bg-black`
- `src/components/ui/layout/DriverLayout.tsx:230` - `bg-black`

### shadow-[...] (4) - WARNING

**Suggested fix:** Use semantic shadow tokens (shadow-xs, shadow-sm, shadow-card, shadow-primary, etc.)

- `src/lib/hooks/useLuminance.ts:281` - `shadow-[0_1px_2px_rgba(255,255,255,0.8)]`
- `src/lib/hooks/useLuminance.ts:282` - `shadow-[0_1px_1px_rgba(255,255,255,0.5)]`
- `src/lib/hooks/useLuminance.ts:284` - `shadow-[0_2px_4px_rgba(0,0,0,0.5)]`
- `src/lib/hooks/useLuminance.ts:285` - `shadow-[0_1px_2px_rgba(0,0,0,0.3)]`

### inline bg:rgb() (3) - **CRITICAL**

**Suggested fix:** Use CSS variable: backgroundColor: var(--color-surface-primary)

- `src/components/ui/admin/analytics/DriverLeaderboard.tsx:128` - `backgroundColor: "rgba(`
- `src/components/ui/layout/AppHeader/AppHeader.tsx:34` - `backgroundColor: "rgba(`
- `src/components/ui/layout/AppHeader/AppHeader.tsx:48` - `backgroundColor: "rgba(`

### text-black (3) - **CRITICAL**

**Suggested fix:** text-text-primary

- `src/components/ui/layout/DriverLayout.tsx:154` - `text-black`
- `src/components/ui/layout/DriverLayout.tsx:174` - `text-black`
- `src/components/ui/layout/DriverLayout.tsx:260` - `text-black`

### inline backdropFilter (3) - WARNING

**Suggested fix:** Use CSS variable: backdropFilter: blur(var(--blur-*))

- `src/lib/motion-tokens.ts:394` - `backdropFilter: "blur(0px)`
- `src/lib/motion-tokens.ts:398` - `backdropFilter: "blur(20px)`
- `src/lib/motion-tokens.ts:404` - `backdropFilter: "blur(0px)`

### inline color:rgb() (2) - **CRITICAL**

**Suggested fix:** Use CSS variable: color: var(--color-text-primary)

- `src/components/ui/search/CommandPalette/CommandPalette.tsx:191` - `color: rgba(`
- `src/components/ui/search/CommandPalette/CommandPalette.tsx:192` - `color: rgba(`

### mt-[Npx] (1) - **CRITICAL**

**Suggested fix:** Use Tailwind spacing scale

- `src/components/ui/menu/MenuSection.tsx:56` - `mt-[140px]`

### pt-[Npx] (1) - **CRITICAL**

**Suggested fix:** Use Tailwind spacing scale

- `src/components/ui/navigation/AppShell.tsx:91` - `pt-[72px]`

### v7-* prefix (1) - **CRITICAL**

**Suggested fix:** Remove v7- prefix, use semantic tokens

- `src/components/ui/theme/DynamicThemeProvider.tsx:69` - `v7-theme-settings`

## By File

### Top 20 Files with Most Violations

### src/components/ui/layout/DriverLayout.tsx (23 violations)

Severity breakdown: 23 critical, 0 warning, 0 info

- Line 110: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 132: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 155: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 195: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 256: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 258: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 261: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 297: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 154: `text-black` -> text-text-primary
- Line 174: `text-black` -> text-text-primary
- Line 260: `text-black` -> text-text-primary
- Line 174: `bg-white` -> bg-surface-primary
- Line 260: `bg-white` -> bg-surface-primary
- Line 110: `bg-black` -> bg-surface-inverse or bg-[var(--color-text-primary)]
- Line 120: `bg-black` -> bg-surface-inverse or bg-[var(--color-text-primary)]
- ... and 8 more in this file

### src/components/ui/Stack.stories.tsx (17 violations)

Severity breakdown: 17 critical, 0 warning, 0 info

- Line 130: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 131: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 132: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 140: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 141: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 142: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 150: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 151: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 152: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 160: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 163: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 166: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 207: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 250: `bg-white` -> bg-surface-primary
- Line 251: `bg-white` -> bg-surface-primary
- ... and 2 more in this file

### src/components/ui/driver/PhotoCapture.tsx (9 violations)

Severity breakdown: 9 critical, 0 warning, 0 info

- Line 243: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 249: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 282: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 340: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 235: `bg-black` -> bg-surface-inverse or bg-[var(--color-text-primary)]
- Line 249: `bg-white/20` -> bg-surface-primary/N
- Line 250: `bg-white/30` -> bg-surface-primary/N
- Line 340: `bg-white/20` -> bg-surface-primary/N
- Line 341: `bg-white/30` -> bg-surface-primary/N

### src/components/ui/orders/tracking/StatusTimeline.tsx (6 violations)

Severity breakdown: 6 critical, 0 warning, 0 info

- Line 65: `v6-secondary` -> Remove v6- prefix, use semantic tokens
- Line 70: `v6-primary` -> Remove v6- prefix, use semantic tokens
- Line 75: `v6-primary` -> Remove v6- prefix, use semantic tokens
- Line 80: `v6-secondary` -> Remove v6- prefix, use semantic tokens
- Line 85: `v6-green` -> Remove v6- prefix, use semantic tokens
- Line 90: `v6-status-error` -> Remove v6- prefix, use semantic tokens

### src/app/(customer)/orders/[id]/feedback/DeliveryFeedbackForm.tsx (5 violations)

Severity breakdown: 5 critical, 0 warning, 0 info

- Line 150: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 93: `bg-white` -> bg-surface-primary
- Line 142: `bg-white` -> bg-surface-primary
- Line 205: `bg-white` -> bg-surface-primary
- Line 293: `border-white` -> border-border-default or border-text-inverse

### src/components/ui/transitions/PageTransition.tsx (3 violations)

Severity breakdown: 3 critical, 0 warning, 0 info

- Line 76: `filter: "blur(12px)` -> Use CSS variable: filter: blur(var(--blur-*))
- Line 81: `filter: "blur(0px)` -> Use CSS variable: filter: blur(var(--blur-*))
- Line 91: `filter: "blur(8px)` -> Use CSS variable: filter: blur(var(--blur-*))

### src/app/(customer)/checkout/page.tsx (2 violations)

Severity breakdown: 2 critical, 0 warning, 0 info

- Line 41: `boxShadow: "0 0` -> Use CSS variable: boxShadow: var(--shadow-*)
- Line 47: `boxShadow: "0 0` -> Use CSS variable: boxShadow: var(--shadow-*)

### src/components/ui/auth/AuthModal.tsx (2 violations)

Severity breakdown: 2 critical, 0 warning, 0 info

- Line 127: `border-white/50` -> border-text-inverse/N
- Line 331: `border-white/50` -> border-text-inverse/N

### src/components/ui/cart/CartItem.tsx (2 violations)

Severity breakdown: 2 critical, 0 warning, 0 info

- Line 207: `border-white/20` -> border-text-inverse/N
- Line 207: `border-white/10` -> border-text-inverse/N

### src/components/ui/homepage/CTABanner.tsx (2 violations)

Severity breakdown: 2 critical, 0 warning, 0 info

- Line 33: `boxShadow: "0 0` -> Use CSS variable: boxShadow: var(--shadow-*)
- Line 37: `boxShadow: "0 2` -> Use CSS variable: boxShadow: var(--shadow-*)

### src/components/ui/homepage/Hero.tsx (2 violations)

Severity breakdown: 2 critical, 0 warning, 0 info

- Line 73: `filter: "blur(10px)` -> Use CSS variable: filter: blur(var(--blur-*))
- Line 79: `filter: "blur(0px)` -> Use CSS variable: filter: blur(var(--blur-*))

### src/components/ui/layout/AppHeader/AppHeader.tsx (2 violations)

Severity breakdown: 2 critical, 0 warning, 0 info

- Line 34: `backgroundColor: "rgba(` -> Use CSS variable: backgroundColor: var(--color-surface-primary)
- Line 48: `backgroundColor: "rgba(` -> Use CSS variable: backgroundColor: var(--color-surface-primary)

### src/components/ui/search/CommandPalette/CommandPalette.tsx (2 violations)

Severity breakdown: 2 critical, 0 warning, 0 info

- Line 191: `color: rgba(` -> Use CSS variable: color: var(--color-text-primary)
- Line 192: `color: rgba(` -> Use CSS variable: color: var(--color-text-primary)

### src/components/ui/admin/analytics/DriverLeaderboard.tsx (1 violations)

Severity breakdown: 1 critical, 0 warning, 0 info

- Line 128: `backgroundColor: "rgba(` -> Use CSS variable: backgroundColor: var(--color-surface-primary)

### src/components/ui/animated-image.tsx (1 violations)

Severity breakdown: 1 critical, 0 warning, 0 info

- Line 89: `filter: "blur(0px)` -> Use CSS variable: filter: blur(var(--blur-*))

### src/components/ui/checkout/CheckoutStepperV8.tsx (1 violations)

Severity breakdown: 1 critical, 0 warning, 0 info

- Line 124: `boxShadow: "0 0` -> Use CSS variable: boxShadow: var(--shadow-*)

### src/components/ui/checkout/CheckoutWizard.tsx (1 violations)

Severity breakdown: 1 critical, 0 warning, 0 info

- Line 476: `border-white/30` -> border-text-inverse/N

### src/components/ui/Container.stories.tsx (1 violations)

Severity breakdown: 1 critical, 0 warning, 0 info

- Line 129: `text-white` -> text-text-inverse (or text-hero-text in hero sections)

### src/components/ui/Grid.stories.tsx (1 violations)

Severity breakdown: 1 critical, 0 warning, 0 info

- Line 243: `text-white` -> text-text-inverse (or text-hero-text in hero sections)

### src/components/ui/layout/CheckoutLayout.tsx (1 violations)

Severity breakdown: 1 critical, 0 warning, 0 info

- Line 260: `border-white` -> border-border-default or border-text-inverse


*... and 12 more files with violations*

## Baseline

### Current Run
| Category | Critical | Warning | Info | Total |
|----------|----------|---------|------|-------|
| effects | 11 | 13 | 0 | 24 |
| colors | 69 | 24 | 0 | 93 |
| spacing | 2 | 0 | 0 | 2 |
| deprecated | 7 | 0 | 0 | 7 |

### Historical Trend
| Run | Date | Critical | Warning | Info | Total |
|-----|------|----------|---------|------|-------|
| 6 | 2026-01-28 | 89 | 37 | 0 | 126 |
| 3 | 2026-01-27 | 283 | 51 | 0 | 334 |
| 1 | 2026-01-27 | 283 | 51 | 0 | 334 |
| 2 | 2026-01-27 | 283 | 51 | 0 | 334 |
| 4 | 2026-01-27 | 283 | 51 | 0 | 334 |

### Category Baselines
- colors: 93
- spacing: 2
- effects: 24
- deprecated: 7
- imports: 0

### Delta from Previous Run
- colors: -2 (improved)
- spacing: 0
- effects: -28 (improved)
- deprecated: 0
- imports: 0

---
*Generated by scripts/audit-tokens.js*
