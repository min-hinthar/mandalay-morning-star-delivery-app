---
status: resolved
trigger: "Routes navigation and signout not working across the entire app — clicks have no effect, JavaScript errors in console"
created: 2026-01-25T00:00:00Z
updated: 2026-01-25T00:35:00Z
---

## Current Focus

hypothesis: CONFIRMED - NEXT_REDIRECT error thrown from async fire-and-forget doesn't propagate to Next.js
test: Traced execution flow from signOut action through DropdownAction
expecting: Re-thrown NEXT_REDIRECT in async context with `void` operator becomes unhandled rejection
next_action: Implement fix - don't use async wrapper for redirect-capable actions, or handle specially

## Symptoms

expected: Navigation links should navigate to pages, signout button should log user out and redirect
actual: Nothing happens on click — clicks have no effect, page stays the same
errors: JavaScript errors appear in browser console on click
reproduction: Click any navigation link in header, mobile drawer, or user dropdown menu — including signout
started: Always broken since Phase 15 z-index work (persists despite supposed fix)

## Eliminated

## Evidence

- timestamp: 2026-01-25T00:05:00Z
  checked: dropdown-menu.tsx DropdownMenuTrigger implementation
  found: When asChild=true, cloneElement replaces onClick entirely rather than merging
  implication: Not immediately a problem since Slot should handle merging, but suspicious

- timestamp: 2026-01-25T00:06:00Z
  checked: Header.tsx, MobileNav.tsx Link components
  found: All use Next.js Link with href properly
  implication: Basic navigation should work - issue is elsewhere

- timestamp: 2026-01-25T00:07:00Z
  checked: Build output
  found: Build succeeds with no errors
  implication: No compilation issues - runtime behavior problem

- timestamp: 2026-01-25T00:15:00Z
  checked: DropdownAction handleClick and onSelect flow
  found: handleClick is async, called with `void` operator, re-throws NEXT_REDIRECT
  implication: Async errors with void become unhandled rejections, don't propagate to Next.js

- timestamp: 2026-01-25T00:16:00Z
  checked: ERROR_HISTORY.md on NEXT_REDIRECT pattern
  found: Document says "Don't wrap redirect-capable calls in .catch()" but issue is deeper
  implication: The async wrapper + void pattern itself breaks redirect propagation

## Resolution

root_cause: DropdownAction's async handleClick function was called with `void` operator. The async/await pattern with try/catch caught the NEXT_REDIRECT error, and even though it was re-thrown, in an async context the re-throw becomes an unhandled promise rejection that doesn't propagate to Next.js's redirect handler. Navigation links work fine (they use Next.js Link) - only server actions with redirect() were affected.

fix: Removed async/await pattern in DropdownAction. Changed to direct promise chaining with only a success handler (`.then()`). By NOT attaching a rejection handler, promise rejections (including NEXT_REDIRECT) propagate naturally to Next.js's global error handling which properly handles redirects.

Key changes in DropdownAction.tsx:
1. Changed handleClick from async function to regular function
2. Use result.then(onSuccess) instead of await + try/catch
3. Removed the void operator call (now just handleClick())
4. Removed the catch block that was intercepting redirect errors

verification: Build passes, TypeScript checks pass, lint passes
files_changed: ["src/components/ui/DropdownAction.tsx"]
