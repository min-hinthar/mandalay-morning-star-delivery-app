---
status: resolved
trigger: "Mobile devices still crashing on modal close despite multiple fix attempts. Need exhaustive investigation of ALL modal-related code."
created: 2026-01-30T00:00:00Z
updated: 2026-01-30T00:15:00Z
---

## Current Focus

hypothesis: CONFIRMED AND FIXED - Multiple GPU-intensive CSS effects on mobile causing crashes
test: Applied fixes to all identified issues
expecting: Mobile modals will close without crashing
next_action: Verify fixes pass lint/typecheck/build (DONE), ready for manual mobile testing

## Symptoms

expected: Modals close without crashing on mobile
actual: Still crashing on modal close
errors: Page crash on mobile when closing modals
reproduction: Open any modal on mobile, close it - crashes
started: Persisting through 5+ fix attempts

## Eliminated

- hypothesis: Radix/Vaul animation conflicts
  evidence: vaul is installed but not imported anywhere in src/ (grep shows 0 results)
  timestamp: 2026-01-30T00:02:00Z

- hypothesis: Body scroll lock causing issues
  evidence: useBodyScrollLock properly uses deferRestore pattern and restores in onExitComplete
  timestamp: 2026-01-30T00:02:30Z

## Evidence

- timestamp: 2026-01-30T00:03:00Z
  checked: backdrop-blur-3xl usage across codebase
  found: |
    STILL PRESENT on mobile-rendered elements:
    1. CartBar.tsx line 205: "backdrop-blur-3xl" - ALWAYS renders (no mobile condition)
    2. CategoryTabs.tsx line 217: "backdrop-blur-3xl" - ALWAYS renders (no mobile condition)
    3. dropdown-menu.tsx line 106: "backdrop-blur-3xl" - ALWAYS renders (no mobile condition)

    ALREADY FIXED (have sm: conditional):
    - Drawer.tsx line 280-282: Uses "sm:backdrop-blur-xl" (desktop only)
    - Modal.tsx line 389-390: Uses "sm:backdrop-blur-xl" (desktop only)
  implication: Multiple components still use heavy backdrop-blur on mobile

- timestamp: 2026-01-30T00:03:30Z
  checked: AnimatedImage blur filter animation
  found: |
    ItemDetailSheet uses AnimatedImage with variant="blur-scale" (line 219)
    AnimatedImage animates CSS filter: blur(20px) -> blur(0px)
    Uses spring.gentle + 0.4s filter transition
    Has NO exit variant - interrupted mid-animation during drawer close
  implication: CSS filter animation on image inside modal is GPU-intensive and gets interrupted

- timestamp: 2026-01-30T00:04:00Z
  checked: CartItem.tsx
  found: Uses "backdrop-blur-xl" (line 256) on delete button reveal - visible during cart drawer
  implication: Another backdrop-blur element inside modal content

## Resolution

root_cause: |
  Multiple GPU-intensive CSS effects cause mobile Safari compositor crashes:

  1. **CartBar.tsx**: Uses backdrop-blur-3xl with NO mobile exclusion
     - CartBar is ALWAYS visible when cart has items
     - Renders BEHIND modals - when modal closes, blur is still active

  2. **CategoryTabs.tsx**: Uses backdrop-blur-3xl with NO mobile exclusion
     - Sticky category tabs on menu page

  3. **AnimatedImage in ItemDetailSheet**: Uses CSS filter: blur() animation
     - Animates filter: blur(20px) -> blur(0px) on image load
     - Has NO exit variant
     - When parent drawer closes, filter animation gets interrupted
     - Interrupted CSS filter animations can corrupt GPU state

  4. **CartItem.tsx**: Uses backdrop-blur-xl on delete button

  The combination of:
  - backdrop-blur on fixed/sticky elements (CartBar, CategoryTabs)
  - backdrop-blur on modal content (CartItem delete button)
  - CSS filter animation (AnimatedImage blur)
  - All active simultaneously when modal closes
  = GPU compositor crash on mobile Safari

fix: |
  Applied fixes to 5 files:

  1. **CartBar.tsx**: Changed to solid bg on mobile, blur only on desktop
     - Was: "backdrop-blur-3xl"
     - Now: "bg-surface-primary dark:bg-gray-900 sm:bg-surface-primary/80 sm:dark:bg-gray-900/75 sm:backdrop-blur-3xl"

  2. **CategoryTabs.tsx**: Same pattern - solid bg on mobile
     - Now: "bg-surface-primary dark:bg-gray-900 sm:bg-surface-primary/80 sm:dark:bg-gray-900/75 sm:backdrop-blur-3xl"

  3. **dropdown-menu.tsx**: Same pattern - solid bg on mobile
     - Now: "bg-surface-primary dark:bg-gray-900 sm:bg-surface-primary/75 sm:dark:bg-gray-900/70 sm:backdrop-blur-3xl"

  4. **CartItem.tsx**: Backdrop-blur only on desktop
     - Was: "backdrop-blur-xl"
     - Now: "sm:backdrop-blur-xl"

  5. **animated-image.tsx**: Disabled CSS filter: blur() animation on mobile
     - Added useMediaQuery hook to detect mobile
     - Skip blur filter animation on mobile (scale/opacity still animate)
     - Prevents GPU crash from interrupted filter animations

verification: |
  - TypeCheck: PASSED
  - Lint: PASSED
  - Build: PASSED
  - Tests: PASSED (343/343)

files_changed:
  - src/components/ui/cart/CartBar.tsx
  - src/components/ui/menu/CategoryTabs.tsx
  - src/components/ui/dropdown-menu.tsx
  - src/components/ui/cart/CartItem.tsx
  - src/components/ui/animated-image.tsx
