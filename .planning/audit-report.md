# Token Audit Report

Generated: 2026-01-27 12:25:57
Total files scanned: 107
Total violations: 334

## Summary

| Severity | Count |
|----------|-------|
| Critical | 283 |
| Warning | 51 |
| Info | 0 |
| **Total** | **334** |

## By Category

| Category | Critical | Warning | Info | Total |
|----------|----------|---------|------|-------|
| colors | 250 | 30 | 0 | 280 |
| imports | 5 | 0 | 0 | 5 |
| effects | 20 | 4 | 0 | 24 |
| deprecated | 6 | 17 | 0 | 23 |
| spacing | 2 | 0 | 0 | 2 |

## By Type

### text-white (135) - **CRITICAL**

**Suggested fix:** text-text-inverse (or text-hero-text in hero sections)

- `src/app/(admin)/admin/analytics/delivery/DeliveryMetricsDashboard.tsx:128` - `text-white`
- `src/app/(admin)/admin/analytics/drivers/DriverAnalyticsDashboard.tsx:132` - `text-white`
- `src/app/(admin)/admin/categories/page.tsx:302` - `text-white`
- `src/app/(admin)/admin/categories/page.tsx:310` - `text-white`
- `src/app/(admin)/admin/categories/page.tsx:377` - `text-white`
- `src/app/(admin)/admin/drivers/page.tsx:203` - `text-white`
- `src/app/(admin)/admin/drivers/page.tsx:324` - `text-white`
- `src/app/(admin)/admin/menu/page.tsx:248` - `text-white`
- `src/app/(admin)/admin/menu/page.tsx:330` - `text-white`
- `src/app/(admin)/admin/menu/page.tsx:344` - `text-white`
- ... and 125 more

### bg-white (43) - **CRITICAL**

**Suggested fix:** bg-surface-primary

- `src/app/(admin)/admin/analytics/delivery/DeliveryMetricsDashboard.tsx:121` - `bg-white`
- `src/app/(admin)/admin/analytics/delivery/DeliveryMetricsDashboard.tsx:260` - `bg-white`
- `src/app/(admin)/admin/analytics/drivers/DriverAnalyticsDashboard.tsx:125` - `bg-white`
- `src/app/(admin)/admin/analytics/drivers/DriverAnalyticsDashboard.tsx:262` - `bg-white`
- `src/app/(admin)/admin/analytics/drivers/DriverAnalyticsDashboard.tsx:328` - `bg-white`
- `src/app/(admin)/admin/routes/page.tsx:325` - `bg-white`
- `src/app/(admin)/admin/routes/page.tsx:383` - `bg-white`
- `src/app/(customer)/orders/[id]/feedback/DeliveryFeedbackForm.tsx:93` - `bg-white`
- `src/app/(customer)/orders/[id]/feedback/DeliveryFeedbackForm.tsx:142` - `bg-white`
- `src/app/(customer)/orders/[id]/feedback/DeliveryFeedbackForm.tsx:205` - `bg-white`
- ... and 33 more

### bg-white/N (25) - **CRITICAL**

**Suggested fix:** bg-surface-primary/N

- `src/components/admin/analytics/Charts.tsx:140` - `bg-white/95`
- `src/components/admin/analytics/MetricCard.tsx:126` - `bg-white/80`
- `src/components/admin/RouteOptimization.tsx:316` - `bg-white/60`
- `src/components/admin/RouteOptimization.tsx:331` - `bg-white/80`
- `src/components/admin/RouteOptimization.tsx:335` - `bg-white/80`
- `src/components/auth/AuthModal.tsx:123` - `bg-white/50`
- `src/components/auth/AuthModal.tsx:330` - `bg-white/80`
- `src/components/auth/MagicLinkSent.tsx:105` - `bg-white/10`
- `src/components/checkout/AddressInput.tsx:330` - `bg-white/90`
- `src/components/driver/DriverDashboard.tsx:355` - `bg-white/30`
- ... and 15 more

### inline color:#hex (25) - WARNING

**Suggested fix:** Use CSS variable: color: var(--color-*)

- `src/components/admin/RevenueChart.tsx:93` - `color: "#111111`
- `src/stories/button.css:11` - `color: #555ab9`
- `src/stories/button.css:17` - `color: #333`
- `src/stories/header.css:30` - `color: #333`
- `src/stories/page.css:5` - `color: #333`
- `src/stories/page.css:44` - `color: #357a14`
- `src/styles/high-contrast.css:83` - `color: #000000`
- `src/styles/high-contrast.css:119` - `color: #000000`
- `src/styles/high-contrast.css:120` - `color: #FFFFFF`
- `src/styles/high-contrast.css:126` - `color: #333333`
- ... and 15 more

### shadow-[...] (24) - **CRITICAL**

**Suggested fix:** Use semantic shadow tokens (shadow-card, shadow-md, etc.)

- `src/components/layout/AppHeader/AccountIndicator.tsx:249` - `shadow-[0_4px_20px_-4px_rgba(164,16,52,0.15),0_2px_8px_rgba(0,0,0,0.08)]`
- `src/components/layout/AppHeader/AccountIndicator.tsx:250` - `shadow-[0_4px_20px_-4px_rgba(245,158,11,0.15),0_2px_8px_rgba(0,0,0,0.3)]`
- `src/components/layout/AppHeader/SearchTrigger.tsx:111` - `shadow-[0_2px_8px_rgba(164,16,52,0.15),0_1px_4px_rgba(0,0,0,0.1)]`
- `src/components/layout/AppHeader/SearchTrigger.tsx:112` - `shadow-[0_2px_8px_rgba(245,158,11,0.2),0_1px_4px_rgba(0,0,0,0.2)]`
- `src/components/layout/MobileDrawer/DrawerNavLink.tsx:54` - `shadow-[0_0_12px_rgba(164,16,52,0.25)]`
- `src/components/layouts/AdminLayout.tsx:202` - `shadow-[var(--shadow-lg)]`
- `src/components/layouts/CheckoutLayout.tsx:251` - `shadow-[var(--shadow-glow-primary)]`
- `src/components/layouts/DriverLayout.tsx:248` - `shadow-[var(--shadow-glow-jade)]`
- `src/components/layouts/DriverLayout.tsx:253` - `shadow-[var(--shadow-glow-primary)]`
- `src/components/menu/MenuAccordion.tsx:136` - `shadow-[var(--elevation-2)]`
- ... and 14 more

### bg-black/N (18) - **CRITICAL**

**Suggested fix:** bg-[var(--color-text-primary)]/N

- `src/components/admin/StatusCelebration.tsx:340` - `bg-black/40`
- `src/components/auth/AuthModal.tsx:313` - `bg-black/40`
- `src/components/driver/DeliverySuccess.tsx:387` - `bg-black/50`
- `src/components/driver/ExceptionModal.tsx:119` - `bg-black/50`
- `src/components/driver/PhotoCapture.tsx:274` - `bg-black/80`
- `src/components/homepage/CTABanner.tsx:28` - `bg-black/5`
- `src/components/homepage/FooterCTA.tsx:54` - `bg-black/10`
- `src/components/layout/CommandPalette/CommandPalette.tsx:131` - `bg-black/50`
- `src/components/layout/MobileDrawer/MobileDrawer.tsx:90` - `bg-black/40`
- `src/components/menu/UnifiedMenuItemCard/UnifiedMenuItemCard.tsx:435` - `bg-black/50`
- ... and 8 more

### border-white/N (9) - WARNING

**Suggested fix:** border-text-inverse/N

- `src/components/auth/AuthModal.tsx:127` - `border-white/50`
- `src/components/auth/AuthModal.tsx:331` - `border-white/50`
- `src/components/checkout/CheckoutWizard.tsx:475` - `border-white/30`
- `src/components/layout/CommandPalette/CommandPalette.tsx:159` - `border-white/20`
- `src/components/layout/CommandPalette/CommandPalette.tsx:159` - `border-white/10`
- `src/components/layout/CommandPalette/CommandPalette.tsx:171` - `border-white/20`
- `src/components/layout/CommandPalette/CommandPalette.tsx:171` - `border-white/10`
- `src/components/ui-v8/cart/CartItemV8.tsx:207` - `border-white/20`
- `src/components/ui-v8/cart/CartItemV8.tsx:207` - `border-white/10`

### v7Palette reference (8) - WARNING

**Suggested fix:** Use semantic tokens from @/styles/tokens.css

- `src/components/theme/DynamicThemeProvider.tsx:12` - `v7Palette`
- `src/components/theme/DynamicThemeProvider.tsx:238` - `v7Palette`
- `src/lib/webgl/gradients.ts:48` - `v7Palette`
- `src/lib/webgl/gradients.ts:107` - `v7Palette`
- `src/lib/webgl/gradients.ts:113` - `v7Palette`
- `src/lib/webgl/gradients.ts:116` - `v7Palette`
- `src/lib/webgl/gradients.ts:119` - `v7Palette`
- `src/lib/webgl/gradients.ts:298` - `v7Palette`

### v7Palettes reference (8) - WARNING

**Suggested fix:** Use semantic tokens from @/styles/tokens.css

- `src/components/theme/DynamicThemeProvider.tsx:12` - `v7Palettes`
- `src/components/theme/DynamicThemeProvider.tsx:238` - `v7Palettes`
- `src/lib/webgl/gradients.ts:48` - `v7Palettes`
- `src/lib/webgl/gradients.ts:107` - `v7Palettes`
- `src/lib/webgl/gradients.ts:113` - `v7Palettes`
- `src/lib/webgl/gradients.ts:116` - `v7Palettes`
- `src/lib/webgl/gradients.ts:119` - `v7Palettes`
- `src/lib/webgl/gradients.ts:298` - `v7Palettes`

### border-white (7) - **CRITICAL**

**Suggested fix:** border-border-default or border-text-inverse

- `src/app/(customer)/orders/[id]/feedback/DeliveryFeedbackForm.tsx:293` - `border-white`
- `src/components/layouts/CheckoutLayout.tsx:260` - `border-white`
- `src/components/layouts/DriverLayout.tsx:118` - `border-white`
- `src/components/layouts/DriverLayout.tsx:223` - `border-white`
- `src/components/layouts/DriverLayout.tsx:288` - `border-white`
- `src/components/tracking/DriverCard.tsx:102` - `border-white`
- `src/components/tracking/StatusTimeline.tsx:176` - `border-white`

### v6-* prefix (6) - **CRITICAL**

**Suggested fix:** Remove v6- prefix, use semantic tokens

- `src/components/tracking/StatusTimeline.tsx:65` - `v6-secondary`
- `src/components/tracking/StatusTimeline.tsx:70` - `v6-primary`
- `src/components/tracking/StatusTimeline.tsx:75` - `v6-primary`
- `src/components/tracking/StatusTimeline.tsx:80` - `v6-secondary`
- `src/components/tracking/StatusTimeline.tsx:85` - `v6-green`
- `src/components/tracking/StatusTimeline.tsx:90` - `v6-status-error`

### inline bg:rgb() (5) - WARNING

**Suggested fix:** Use CSS variable: backgroundColor: var(--color-*)

- `src/components/admin/analytics/DriverLeaderboard.tsx:128` - `backgroundColor: "rgba(`
- `src/components/admin/OrderManagement.tsx:501` - `backgroundColor: "rgba(`
- `src/components/layout/AppHeader/AppHeader.tsx:34` - `backgroundColor: "rgba(`
- `src/components/layout/AppHeader/AppHeader.tsx:48` - `backgroundColor: "rgba(`
- `src/components/layout/CommandPalette/CommandPalette.tsx:175` - `backgroundColor: "rgba(`

### dual-ui-import (5) - **CRITICAL**

**Suggested fix:** Consolidate to single UI component source

- `src/components/checkout/AddressStepV8.tsx:1` - `Imports from both @/components/ui/ and @/components/ui-v8/`
- `src/components/menu/menu-skeleton.tsx:1` - `Imports from both @/components/ui/ and @/components/ui-v8/`
- `src/components/menu/UnifiedMenuItemCard/CardImage.tsx:1` - `Imports from both @/components/ui/ and @/components/ui-v8/`
- `src/components/ui-v8/cart/CartDrawerV8.tsx:1` - `Imports from both @/components/ui/ and @/components/ui-v8/`
- `src/components/ui-v8/menu/ItemDetailSheetV8.tsx:1` - `Imports from both @/components/ui/ and @/components/ui-v8/`

### text-black (4) - **CRITICAL**

**Suggested fix:** text-text-primary

- `src/components/auth/LoginForm.tsx:73` - `text-black`
- `src/components/layouts/DriverLayout.tsx:150` - `text-black`
- `src/components/layouts/DriverLayout.tsx:169` - `text-black`
- `src/components/layouts/DriverLayout.tsx:252` - `text-black`

### bg-black (4) - **CRITICAL**

**Suggested fix:** bg-surface-inverse or bg-[var(--color-text-primary)]

- `src/components/driver/PhotoCapture.tsx:233` - `bg-black`
- `src/components/layouts/DriverLayout.tsx:109` - `bg-black`
- `src/components/layouts/DriverLayout.tsx:118` - `bg-black`
- `src/components/layouts/DriverLayout.tsx:223` - `bg-black`

### text-white/N (2) - **CRITICAL**

**Suggested fix:** text-text-inverse/N

- `src/components/checkout/TimeSlotPicker.tsx:83` - `text-white/80`
- `src/components/checkout/TimeSlotPicker.tsx:102` - `text-white/80`

### inline color:rgb() (2) - **CRITICAL**

**Suggested fix:** Use CSS variable: color: var(--color-*)

- `src/components/layout/CommandPalette/CommandPalette.tsx:191` - `color: rgba(`
- `src/components/layout/CommandPalette/CommandPalette.tsx:192` - `color: rgba(`

### inline bg:#hex (1) - WARNING

**Suggested fix:** Use CSS variable: backgroundColor: var(--color-*)

- `src/components/admin/RevenueChart.tsx:86` - `backgroundColor: "#FFFFFF`

### v7-* prefix (1) - WARNING

**Suggested fix:** Remove v7- prefix, use semantic tokens

- `src/components/theme/DynamicThemeProvider.tsx:69` - `v7-theme-settings`

### mt-[Npx] (1) - **CRITICAL**

**Suggested fix:** Use Tailwind spacing scale

- `src/components/ui-v8/menu/MenuSectionV8.tsx:56` - `mt-[140px]`

### pt-[Npx] (1) - **CRITICAL**

**Suggested fix:** Use Tailwind spacing scale

- `src/components/ui-v8/navigation/AppShell.tsx:91` - `pt-[72px]`

## By File

### Top 20 Files with Most Violations

### src/components/layouts/DriverLayout.tsx (25 violations)

Severity breakdown: 25 critical, 0 warning, 0 info

- Line 109: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 129: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 151: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 189: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 248: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 250: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 253: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 288: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 150: `text-black` -> text-text-primary
- Line 169: `text-black` -> text-text-primary
- Line 252: `text-black` -> text-text-primary
- Line 169: `bg-white` -> bg-surface-primary
- Line 252: `bg-white` -> bg-surface-primary
- Line 109: `bg-black` -> bg-surface-inverse or bg-[var(--color-text-primary)]
- Line 118: `bg-black` -> bg-surface-inverse or bg-[var(--color-text-primary)]
- ... and 10 more in this file

### src/components/layouts/Stack.stories.tsx (17 violations)

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

### src/components/driver/PhotoCapture.tsx (11 violations)

Severity breakdown: 11 critical, 0 warning, 0 info

- Line 240: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 245: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 277: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 334: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 350: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 233: `bg-black` -> bg-surface-inverse or bg-[var(--color-text-primary)]
- Line 245: `bg-white/20` -> bg-surface-primary/N
- Line 246: `bg-white/30` -> bg-surface-primary/N
- Line 334: `bg-white/20` -> bg-surface-primary/N
- Line 335: `bg-white/30` -> bg-surface-primary/N
- Line 274: `bg-black/80` -> bg-[var(--color-text-primary)]/N

### src/components/admin/RouteOptimization.tsx (10 violations)

Severity breakdown: 10 critical, 0 warning, 0 info

- Line 321: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 391: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 393: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 394: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 650: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 374: `bg-white` -> bg-surface-primary
- Line 690: `bg-white` -> bg-surface-primary
- Line 316: `bg-white/60` -> bg-surface-primary/N
- Line 331: `bg-white/80` -> bg-surface-primary/N
- Line 335: `bg-white/80` -> bg-surface-primary/N

### src/components/tracking/StatusTimeline.tsx (10 violations)

Severity breakdown: 10 critical, 0 warning, 0 info

- Line 142: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 143: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 187: `bg-white` -> bg-surface-primary
- Line 176: `border-white` -> border-border-default or border-text-inverse
- Line 65: `v6-secondary` -> Remove v6- prefix, use semantic tokens
- Line 70: `v6-primary` -> Remove v6- prefix, use semantic tokens
- Line 75: `v6-primary` -> Remove v6- prefix, use semantic tokens
- Line 80: `v6-secondary` -> Remove v6- prefix, use semantic tokens
- Line 85: `v6-green` -> Remove v6- prefix, use semantic tokens
- Line 90: `v6-status-error` -> Remove v6- prefix, use semantic tokens

### src/components/layout/CommandPalette/CommandPalette.tsx (9 violations)

Severity breakdown: 9 critical, 0 warning, 0 info

- Line 157: `bg-white/90` -> bg-surface-primary/N
- Line 131: `bg-black/50` -> bg-[var(--color-text-primary)]/N
- Line 159: `border-white/20` -> border-text-inverse/N
- Line 159: `border-white/10` -> border-text-inverse/N
- Line 171: `border-white/20` -> border-text-inverse/N
- Line 171: `border-white/10` -> border-text-inverse/N
- Line 191: `color: rgba(` -> Use CSS variable: color: var(--color-*)
- Line 192: `color: rgba(` -> Use CSS variable: color: var(--color-*)
- Line 175: `backgroundColor: "rgba(` -> Use CSS variable: backgroundColor: var(--color-*)

### src/components/auth/AuthModal.tsx (7 violations)

Severity breakdown: 5 critical, 2 warning, 0 info

- Line 181: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 368: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 123: `bg-white/50` -> bg-surface-primary/N
- Line 330: `bg-white/80` -> bg-surface-primary/N
- Line 313: `bg-black/40` -> bg-[var(--color-text-primary)]/N
- Line 127: `border-white/50` -> border-text-inverse/N
- Line 331: `border-white/50` -> border-text-inverse/N

### src/components/checkout/TimeSlotPicker.tsx (7 violations)

Severity breakdown: 7 critical, 0 warning, 0 info

- Line 74: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 121: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 190: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 228: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 113: `bg-white` -> bg-surface-primary
- Line 83: `text-white/80` -> text-text-inverse/N
- Line 102: `text-white/80` -> text-text-inverse/N

### src/components/ui-v8/cart/CartBarV8.tsx (6 violations)

Severity breakdown: 6 critical, 0 warning, 0 info

- Line 294: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 311: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 334: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 120: `bg-white` -> bg-surface-primary
- Line 239: `shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]` -> Use semantic shadow tokens (shadow-card, shadow-md, etc.)
- Line 239: `shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.3)]` -> Use semantic shadow tokens (shadow-card, shadow-md, etc.)

### src/app/(customer)/orders/[id]/feedback/DeliveryFeedbackForm.tsx (5 violations)

Severity breakdown: 5 critical, 0 warning, 0 info

- Line 150: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 93: `bg-white` -> bg-surface-primary
- Line 142: `bg-white` -> bg-surface-primary
- Line 205: `bg-white` -> bg-surface-primary
- Line 293: `border-white` -> border-border-default or border-text-inverse

### src/components/layout/AppHeader/AccountIndicator.tsx (5 violations)

Severity breakdown: 5 critical, 0 warning, 0 info

- Line 163: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 213: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 246: `bg-white` -> bg-surface-primary
- Line 249: `shadow-[0_4px_20px_-4px_rgba(164,16,52,0.15),0_2px_8px_rgba(0,0,0,0.08)]` -> Use semantic shadow tokens (shadow-card, shadow-md, etc.)
- Line 250: `shadow-[0_4px_20px_-4px_rgba(245,158,11,0.15),0_2px_8px_rgba(0,0,0,0.3)]` -> Use semantic shadow tokens (shadow-card, shadow-md, etc.)

### src/components/ui-v8/Toast.tsx (5 violations)

Severity breakdown: 5 critical, 0 warning, 0 info

- Line 41: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 42: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 43: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 44: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 69: `bg-white/20` -> bg-surface-primary/N

### src/app/(admin)/admin/analytics/drivers/DriverAnalyticsDashboard.tsx (4 violations)

Severity breakdown: 4 critical, 0 warning, 0 info

- Line 132: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 125: `bg-white` -> bg-surface-primary
- Line 262: `bg-white` -> bg-surface-primary
- Line 328: `bg-white` -> bg-surface-primary

### src/app/(admin)/admin/routes/page.tsx (4 violations)

Severity breakdown: 4 critical, 0 warning, 0 info

- Line 240: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 382: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 325: `bg-white` -> bg-surface-primary
- Line 383: `bg-white` -> bg-surface-primary

### src/components/admin/OrderManagement.tsx (4 violations)

Severity breakdown: 3 critical, 1 warning, 0 info

- Line 311: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 351: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 203: `bg-white` -> bg-surface-primary
- Line 501: `backgroundColor: "rgba(` -> Use CSS variable: backgroundColor: var(--color-*)

### src/components/auth/MagicLinkSent.tsx (4 violations)

Severity breakdown: 4 critical, 0 warning, 0 info

- Line 143: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 377: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 119: `bg-white` -> bg-surface-primary
- Line 105: `bg-white/10` -> bg-surface-primary/N

### src/components/checkout/AddressInput.tsx (4 violations)

Severity breakdown: 4 critical, 0 warning, 0 info

- Line 102: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 240: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 274: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 330: `bg-white/90` -> bg-surface-primary/N

### src/components/driver/DeliverySuccess.tsx (4 violations)

Severity breakdown: 4 critical, 0 warning, 0 info

- Line 164: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 388: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 389: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 387: `bg-black/50` -> bg-[var(--color-text-primary)]/N

### src/components/driver/OfflineBanner.tsx (4 violations)

Severity breakdown: 4 critical, 0 warning, 0 info

- Line 37: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 77: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 60: `bg-white/30` -> bg-surface-primary/N
- Line 60: `bg-white/40` -> bg-surface-primary/N

### src/components/homepage/TestimonialsCarousel.tsx (4 violations)

Severity breakdown: 4 critical, 0 warning, 0 info

- Line 116: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 118: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 119: `text-white` -> text-text-inverse (or text-hero-text in hero sections)
- Line 120: `text-white` -> text-text-inverse (or text-hero-text in hero sections)


*... and 87 more files with violations*

## Baseline

### Current Run
| Category | Critical | Warning | Info | Total |
|----------|----------|---------|------|-------|
| colors | 250 | 30 | 0 | 280 |
| imports | 5 | 0 | 0 | 5 |
| effects | 20 | 4 | 0 | 24 |
| deprecated | 6 | 17 | 0 | 23 |
| spacing | 2 | 0 | 0 | 2 |

### Historical Trend
| Run | Date | Critical | Warning | Info | Total |
|-----|------|----------|---------|------|-------|
| 5 | 2026-01-27 | 283 | 51 | 0 | 334 |
| 3 | 2026-01-27 | 283 | 51 | 0 | 334 |
| 1 | 2026-01-27 | 283 | 51 | 0 | 334 |
| 2 | 2026-01-27 | 283 | 51 | 0 | 334 |
| 4 | 2026-01-27 | 283 | 51 | 0 | 334 |

### Category Baselines
- colors: 280
- spacing: 2
- effects: 24
- deprecated: 23
- imports: 5

### Delta from Previous Run
- colors: 0
- spacing: 0
- effects: 0
- deprecated: 0
- imports: 0

---
*Generated by scripts/audit-tokens.js*
