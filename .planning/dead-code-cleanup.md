# Dead Code Cleanup - Milestone Investigation

**Date:** 2026-01-30
**Status:** Ready for Implementation
**Verified:** Build ✅ | TypeCheck ✅

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Initial estimate (unused) | 155 files |
| Verified unused | **23 files** |
| False positives | 132 files (used via internal/barrel imports) |
| Accuracy rate | 15% of initial estimate |

---

## Phase 1: Safe Deletions (23 files)

### 1.1 Storybook Files (8 files)

**Risk:** None - development artifacts in production
**Action:** Delete immediately

```
src/components/ui/Badge.stories.tsx
src/components/ui/Button.stories.tsx
src/components/ui/Container.stories.tsx
src/components/ui/Grid.stories.tsx
src/components/ui/Input.stories.tsx
src/components/ui/Modal.stories.tsx
src/components/ui/Stack.stories.tsx
src/components/ui/menu/MenuAccordion.stories.tsx
```

**Cleanup command:**
```bash
rm src/components/ui/Badge.stories.tsx \
   src/components/ui/Button.stories.tsx \
   src/components/ui/Container.stories.tsx \
   src/components/ui/Grid.stories.tsx \
   src/components/ui/Input.stories.tsx \
   src/components/ui/Modal.stories.tsx \
   src/components/ui/Stack.stories.tsx \
   src/components/ui/menu/MenuAccordion.stories.tsx
```

---

### 1.2 Navigation Components (6 files)

**Risk:** Low - replaced by newer layout system
**Action:** Delete after verifying no dynamic imports

```
src/components/ui/navigation/AppShell.tsx
src/components/ui/navigation/BottomNav.tsx
src/components/ui/navigation/Header.tsx
src/components/ui/navigation/MobileMenu.tsx
src/components/ui/navigation/PageContainer.tsx
src/components/ui/navigation/index.ts
```

**Context:**
- Superseded by `src/components/ui/layout/AppHeader/` system
- Old navigation never imported via `@/components/ui/navigation`
- Current app uses HeaderWrapper + AppHeader + MobileDrawer

**Cleanup command:**
```bash
rm -rf src/components/ui/navigation/
```

---

### 1.3 Auth Modal & Flows (4 files)

**Risk:** Low - unused auth UI variants
**Action:** Delete after confirming auth flow uses forms only

```
src/components/ui/auth/AuthModal.tsx
src/components/ui/auth/MagicLinkSent.tsx
src/components/ui/auth/OnboardingTour.tsx
src/components/ui/auth/WelcomeAnimation.tsx
```

**Context:**
- Current auth uses: LoginForm, SignupForm, ForgotPasswordForm, ResetPasswordForm
- AuthModal was alternative modal-based auth (not used)
- MagicLinkSent, OnboardingTour, WelcomeAnimation never integrated

**Post-deletion:** Update `src/components/ui/auth/index.ts` to remove exports

---

### 1.4 Homepage Components (5 files)

**Risk:** Medium - may be planned features
**Action:** Confirm with product before deletion

```
src/components/ui/homepage/CTABanner.tsx
src/components/ui/homepage/FooterCTA.tsx
src/components/ui/homepage/Hero.tsx
src/components/ui/homepage/HowItWorksSection.tsx
src/components/ui/homepage/TestimonialsCarousel.tsx
```

**Context:**
- Current homepage uses: HomePageClient, HomepageMenuSection only
- These appear to be designed but never integrated
- Hero.tsx imports useDynamicTheme (has dependency)

**Post-deletion:** Update `src/components/ui/homepage/index.ts` to remove exports

---

## Phase 2: Barrel Export Cleanup

After file deletion, update these barrel exports:

### `src/components/ui/auth/index.ts`

Remove:
```typescript
export { UserMenu } from "./UserMenu";
export { AuthModal, AuthModal as AuthModalV7 } from "./AuthModal";
export type { AuthModalProps, AuthModalProps as AuthModalV7Props } from "./AuthModal";
export { MagicLinkSent } from "./MagicLinkSent";
export type { MagicLinkSentProps } from "./MagicLinkSent";
export { WelcomeAnimation } from "./WelcomeAnimation";
export type { WelcomeAnimationProps } from "./WelcomeAnimation";
export { OnboardingTour, OnboardingTour as OnboardingTourV7 } from "./OnboardingTour";
```

### `src/components/ui/homepage/index.ts`

Remove:
```typescript
export { Hero } from "./Hero";
export { CTABanner } from "./CTABanner";
export { FooterCTA } from "./FooterCTA";
export { HowItWorksSection } from "./HowItWorksSection";
export { TestimonialsCarousel } from "./TestimonialsCarousel";
```

---

## Phase 3: Verification Checklist

- [ ] Run `pnpm typecheck` after each phase
- [ ] Run `pnpm build` after all deletions
- [ ] Run `pnpm test` to check for broken imports
- [ ] Verify app loads correctly in browser
- [ ] Check all routes render without errors

---

## False Positives - Components Verified as USED

### Cart System (10 files) ✅
**Import chain:** `providers.tsx` → cart barrel → all components
**Also used in:** menu/UnifiedMenuItemCard, menu/ItemDetailSheet, menu/MenuHeader

### Checkout V8 (12 files) ✅
**Import chain:** `checkout/page.tsx` → checkout barrel → V8 components
**Note:** V8 components aliased as default names (CheckoutStepper, AddressStep, etc.)

### Driver Components (11 files) ✅
**Import chain:** Direct imports in driver pages
**Internal deps:** StopDetailView uses DeliveryActions, LocationTracker, etc.

### Layout/Headers (13 files) ✅
**Import chain:** `layout.tsx` → HeaderWrapper → AppHeader → subcomponents
**Internal deps:** AppHeader imports DesktopHeader, MobileHeader, CartIndicator, SearchTrigger, AccountIndicator, MobileDrawer

### Admin Analytics (9 files) ✅
**Import chain:** Analytics dashboards → `@/components/ui/admin/analytics` barrel
**Also used:** DeliveryFeedbackForm imports StarRating

### Scroll Components (5 files) ✅
**Import chain:** HomePageClient, MenuContent, OrderListAnimated → scroll barrel
**Used:** AnimatedSection, SectionNavDots, itemVariants

### Search Components (5 files) ✅
**Import chain:** AppHeader → `@/components/ui/search` → CommandPalette

### Theme Components (3 files) ✅
**Import chain:** `providers.tsx` → ThemeProvider, DynamicThemeProvider
**Also used:** Hero.tsx uses useDynamicTheme

### Layout Utilities (Portal, Backdrop, etc.) ✅
**Import chain:** Toast → Portal, Drawer → Portal, CartDrawer → Drawer

---

## Implementation Plan

### Wave 1: Zero-Risk (Storybook)
1. Delete 8 storybook files
2. Run build verification
3. Commit: `chore: remove storybook files from production`

### Wave 2: Low-Risk (Navigation)
1. Delete navigation folder (6 files)
2. Run build verification
3. Commit: `refactor: remove deprecated navigation components`

### Wave 3: Auth Cleanup
1. Delete 4 unused auth components
2. Update auth/index.ts barrel
3. Run build verification
4. Commit: `refactor: remove unused auth modal and flow components`

### Wave 4: Homepage Cleanup
1. Confirm with product team re: planned features
2. Delete 5 unused homepage components (if approved)
3. Update homepage/index.ts barrel
4. Run build verification
5. Commit: `refactor: remove unused homepage section components`

---

## Estimated Impact

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| UI component files | 228 | 205 | -23 (-10%) |
| Bundle size | TBD | TBD | Minimal (tree-shaking) |
| Maintenance burden | High | Lower | Reduced confusion |

---

## Notes

- Most "unused" components are actually used via internal imports
- Barrel exports (`index.ts`) hide true import chains
- Always trace: direct import → barrel → internal import → actual usage
- Build passes = safe to ship, but manual testing recommended
