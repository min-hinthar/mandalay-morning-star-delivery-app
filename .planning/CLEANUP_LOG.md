# Cleanup Log

**Phase:** 37-codebase-cleanup
**Date:** 2026-02-04

## Files Deleted

### Storybook Files (REFACTOR-01)

| File                                             | Reason              | Lines |
| ------------------------------------------------ | ------------------- | ----- |
| src/components/ui/Badge.stories.tsx              | Production artifact | 156   |
| src/components/ui/Button.stories.tsx             | Production artifact | 201   |
| src/components/ui/Input.stories.tsx              | Production artifact | 168   |
| src/components/ui/Modal.stories.tsx              | Production artifact | 241   |
| src/components/ui/Container.stories.tsx          | Production artifact | 132   |
| src/components/ui/Grid.stories.tsx               | Production artifact | 189   |
| src/components/ui/Stack.stories.tsx              | Production artifact | 143   |
| src/components/ui/menu/MenuAccordion.stories.tsx | Production artifact | 376   |

**Subtotal:** 8 files, 1,606 lines

### Deprecated Auth Components (REFACTOR-03)

| File                                        | Reason                     | Lines |
| ------------------------------------------- | -------------------------- | ----- |
| src/components/ui/auth/AuthModal.tsx        | Superseded by direct forms | 465   |
| src/components/ui/auth/MagicLinkSent.tsx    | Unused                     | 420   |
| src/components/ui/auth/OnboardingTour.tsx   | Feature removed            | 461   |
| src/components/ui/auth/WelcomeAnimation.tsx | Feature removed            | 449   |

**Subtotal:** 4 files, 1,795 lines

### Already Completed

- REFACTOR-02: navigation/ folder (6 files) - Already deleted in prior milestone (v1.3)
- REFACTOR-05: src/ folder structure - Already feature-based organization

## Barrel Exports Updated (REFACTOR-04)

| File                            | Exports Removed                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| src/components/ui/auth/index.ts | AuthModal, AuthModalV7, MagicLinkSent, WelcomeAnimation, OnboardingTour, OnboardingTourV7 + their Props types |

**Exports remaining:** LoginForm, SignupForm, ForgotPasswordForm, ResetPasswordForm, UserMenu

## Circular Dependencies Fixed (REFACTOR-07)

| Cycle | Files Involved                                                                        | Fix Applied                                          |
| ----- | ------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 1-3   | SettingsClient ↔ DeliverySettingsForm/NotificationSettingsForm/OperationsSettingsForm | Extracted settings-types.ts                          |
| 4-5   | cart barrel → CartDrawer → ClearCartConfirmation → ui barrel                          | Direct imports for Drawer/Modal                      |
| 6     | checkout barrel → AddressStepV8 → ui barrel                                           | Direct imports for Modal/Drawer                      |
| 7-8   | menu barrel → FeaturedCarousel → CardImage/UnifiedMenuItemCard → ui/menu barrel       | Relative imports for getCategoryEmoji/FavoriteButton |
| 9     | navigation barrel → AppShell → MobileMenu → ui barrel                                 | Direct import for Drawer                             |

**Pattern applied:** Replace barrel imports (`@/components/ui`) with direct file imports (`@/components/ui/Drawer`)

## ESLint Rules Added (REFACTOR-08)

| Rule                                | Severity | Purpose                                 |
| ----------------------------------- | -------- | --------------------------------------- |
| import-x/no-cycle                   | error    | Prevent circular dependencies           |
| max-lines (components)              | warn     | Flag files >400 lines for review        |
| no-restricted-imports (navigation/) | error    | Prevent recreation of deleted directory |

## Files Over 400 Lines (REFACTOR-06 - Warning Only)

Per CONTEXT.md decision: warning only, not build failure. Page files exempt.

Files flagged as warnings (not blockers):

- FormValidation.tsx, OrderDetailExpanded.tsx, HowItWorksSection.tsx, and others
- These are candidates for future refactoring, not immediate action items

## Summary

- Files deleted: 12
- Lines removed: 3,401 (actual from git)
- Barrel exports updated: 1
- Circular dependencies fixed: 9
- ESLint rules added: 3 (no-cycle, max-lines, navigation guard)
- New files created: 1 (settings-types.ts)
- Build verified: SUCCESS
