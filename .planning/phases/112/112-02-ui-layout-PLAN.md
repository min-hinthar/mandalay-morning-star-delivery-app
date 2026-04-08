---
phase: 112
plan: 02
type: execute
wave: 2
depends_on:
  - 112-01
files_modified:
  - src/lib/hooks/useMutePreference.ts
  - src/lib/hooks/__tests__/useMutePreference.test.ts
  - src/components/ui/orders/tracking/ReconnectingBanner.tsx
  - src/components/ui/orders/tracking/MuteToggle.tsx
  - src/components/ui/orders/tracking/index.ts
  - src/components/ui/orders/tracking/TrackingPageClient.tsx
  - tailwind.config.ts
autonomous: false
requirements:
  - CFIX-10
  - TRAK-01
  - TRAK-02
user_setup: []
must_haves:
  truths:
    - "Customer sees 'Reconnecting...' banner 2s after connection drops, with calm warmth copy + WifiOff icon"
    - "Banner auto-dismisses on reconnect (no manual close button)"
    - "Customer can tap a mute toggle in the header to silence audio notifications for tracking"
    - "Mute preference persists across sessions and orders (localStorage 'trackingAudioMuted')"
    - "Audio notification does NOT play when muted OR when the tab is hidden"
    - "On mobile (< lg breakpoint), map fills the viewport behind a collapsible bottom sheet"
    - "On desktop (lg+ breakpoint), existing lg:grid-cols-2 layout is unchanged"
    - "All new motion honors prefers-reduced-motion via useAnimationPreference().getSpring()"
    - "All new components render in light AND dark mode without hardcoded colors"
  artifacts:
    - path: "src/lib/hooks/useMutePreference.ts"
      provides: "SSR-safe localStorage mute hook returning { isMuted, setMuted, toggleMuted, isHydrated }"
      contains: "trackingAudioMuted"
    - path: "src/lib/hooks/__tests__/useMutePreference.test.ts"
      provides: "Hydration + toggle + persistence tests"
    - path: "src/components/ui/orders/tracking/ReconnectingBanner.tsx"
      provides: "2s-debounced banner with aria-live polite, WifiOff icon, status-warning tokens"
      contains: "role=\"status\""
    - path: "src/components/ui/orders/tracking/MuteToggle.tsx"
      provides: "Icon-only button with aria-pressed, Volume2/VolumeX swap, 44px touch target"
      contains: "aria-pressed"
    - path: "src/components/ui/orders/tracking/TrackingPageClient.tsx"
      provides: "Mobile layout wrapped in Drawer (lg:hidden), ReconnectingBanner mounted, MuteToggle in header, audio gated by isMuted + document.hidden"
      contains: "lg:hidden"
    - path: "tailwind.config.ts"
      provides: "border-status-warning alias addition"
  key_links:
    - from: "src/components/ui/orders/tracking/TrackingPageClient.tsx"
      to: "src/lib/hooks/useMutePreference.ts"
      via: "useMutePreference() hook call"
      pattern: "useMutePreference"
    - from: "src/components/ui/orders/tracking/TrackingPageClient.tsx"
      to: "src/components/ui/orders/tracking/ReconnectingBanner.tsx"
      via: "JSX mount below sticky header"
      pattern: "<ReconnectingBanner"
    - from: "src/components/ui/orders/tracking/TrackingPageClient.tsx"
      to: "src/components/ui/orders/tracking/MuteToggle.tsx"
      via: "JSX mount between ShareButton and RefreshCw"
      pattern: "<MuteToggle"
    - from: "src/components/ui/orders/tracking/TrackingPageClient.tsx"
      to: "src/components/ui/Drawer.tsx"
      via: "Drawer wraps mobile info pane"
      pattern: "<Drawer"
    - from: "src/components/ui/orders/tracking/TrackingPageClient.tsx"
      to: "audio gate check"
      via: "conditional new Audio() call"
      pattern: "!isMuted.*!document.hidden"
---

<objective>
Ship all three visible Phase 112 surfaces in a single coordinated plan: the Reconnecting banner (TRAK-02), the mute toggle (CFIX-10), and the mobile collapsible bottom sheet (TRAK-01). Plan 01 delivered the plumbing (backoff + visibility pause); this plan consumes that stable `isConnected` state and wraps the existing tracking info pane in a mobile-only Drawer without touching the desktop layout.

Purpose:
- TRAK-02 makes disconnects legible to the user with calm warmth copy ("Reconnecting...") and a 2s debounce to eliminate false alarms on momentary blips
- CFIX-10 gives users a one-tap escape from audio notifications that persists globally (not per-order)
- TRAK-01 delivers the "map dominates, info pedestalled" mobile UX that was the original phase goal

Output:
- `src/lib/hooks/useMutePreference.ts` (~40 LOC) + tests (~80 LOC)
- `src/components/ui/orders/tracking/ReconnectingBanner.tsx` (~80 LOC)
- `src/components/ui/orders/tracking/MuteToggle.tsx` (~50 LOC)
- `src/components/ui/orders/tracking/index.ts` — barrel re-exports
- `src/components/ui/orders/tracking/TrackingPageClient.tsx` — major extend: Drawer wrap, banner mount, mute toggle mount, audio gate
- `tailwind.config.ts` — add `borderColor.status-warning` alias
- One human-verify checkpoint at the end for mobile UX smoke test
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/112/112-CONTEXT.md
@.planning/phases/112/112-PRECONTEXT-RESEARCH.md
@.planning/phases/112/112-UI-SPEC.md
@.planning/phases/112/112-01-hook-refactor-PLAN.md
@src/components/ui/orders/tracking/TrackingPageClient.tsx
@src/components/ui/orders/tracking/NearbyBanner.tsx
@src/components/ui/Drawer.tsx
@src/lib/hooks/useAnimationPreference.ts

<interfaces>
<!-- Existing Drawer API (src/components/ui/Drawer.tsx:41-60) — Plan 02 MUST compose this exactly -->

```typescript
export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  position?: "left" | "right" | "bottom";
  width?: "sm" | "md" | "lg";
  height?: "auto" | "full";  // "full" = 95vh
  showDragHandle?: boolean;   // default true
  title?: string;
  className?: string;
}
```

**Drawer reality check (critical for TRAK-01):**
- Drawer does NOT support native binary snap points. It's a controlled `isOpen`/`onClose` dialog.
- `height="full"` = 95vh expanded state.
- `height="auto"` = content-fit.
- Exit animation is `duration: 0.15s easeIn` (Drawer.tsx:99-104) — **NEVER TOUCH** (mobile Safari GPU crash, commit 4087d3bf).
- Swipe-to-dismiss closes via `onClose`. For the tracking sheet which "cannot fully dismiss" (UI-SPEC state matrix line 288), we use a local `isSheetOpen` state that toggles between "peek mode" (sheet closed, static peek bar visible) and "expanded mode" (Drawer open with height="full").

**Implementation strategy for TRAK-01 binary snap:**
- Do NOT extend Drawer.tsx (would risk touching exit animation or body-scroll-lock logic)
- Instead: render a static peek bar (pure DOM, no Drawer) when sheet is collapsed, AND render the Drawer when sheet is expanded
- Tapping the peek bar opens the Drawer; swipe-down on expanded Drawer closes it back to peek state
- `onClose` in this context means "snap back to peek", not "fully unmount"
- Both peek and full states always present (never hidden) — `onClose` just toggles back to peek

From src/lib/hooks/useAnimationPreference.ts:107-123:
```typescript
// getSpring wrapper for prefers-reduced-motion
function getSpring<T extends object>(fullSpring: T): T | { duration: 0 };
// Returns { duration: 0 } if preference === "none"
// Returns gentler spring if preference === "reduced"
// Returns fullSpring if preference === "full"

// Also exposed from the hook:
// const { shouldAnimate, isHydrated, getSpring } = useAnimationPreference();
```

From src/components/ui/orders/tracking/NearbyBanner.tsx:40-50 (CANONICAL audio pattern — mirror):
```typescript
function playNotificationSound() {
  try {
    const audio = new Audio("/sounds/notification.mp3");
    audio.volume = 0.3;
    void audio.play().catch(() => {
      // Sound file may not exist yet -- graceful failure
    });
  } catch {
    // Audio creation failed -- skip
  }
}
```

From TrackingPageClient.tsx:77-104 (current audio trigger location — WILL BE GATED):
```typescript
// Status transition effects: haptic + sound + delayed delivered screen
useEffect(() => {
  if (prevStatusRef.current === orderStatus) return;
  prevStatusRef.current = orderStatus;

  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(50);
  }

  // <<< Lines 87-95: audio play — WRAP with !isMuted && !document.hidden >>>
  try {
    const audio = new Audio("/sounds/notification.mp3");
    audio.volume = 0.2;
    void audio.play().catch(() => { /* graceful */ });
  } catch { /* skip */ }

  // ... delivered screen logic unchanged
}, [orderStatus]);
```

From TrackingPageClient.tsx:178-211 (header location for MuteToggle mount):
```tsx
<div className="flex items-center gap-2 text-xs text-charcoal-500">
  {subscription.isConnected ? (...) : subscription.connectionError ? (...) : (...)}
  {lastUpdateDisplay && (<span>...</span>)}
  <ShareButton orderId={orderId} orderStatus={orderStatus} />
  {/* <<< MUTE TOGGLE MOUNTS HERE >>> */}
  <button onClick={() => subscription.refresh()} aria-label="Refresh tracking data">
    <RefreshCw ... />
  </button>
</div>
```

From TrackingPageClient.tsx:216-378 (layout region — WILL BE SPLIT into mobile + desktop):
```tsx
{/* Split-view layout */}
<div className="mx-auto max-w-5xl lg:grid lg:grid-cols-2 lg:h-[calc(100vh-3.5rem)]">
  {/* Map section: top 50vh mobile, left 50% desktop */}
  {hasLocation && (
    <div className="h-[50vh] lg:h-full relative"> ... LazyDeliveryMap ... </div>
  )}

  {/* Info section: bottom 50vh mobile (scrollable), right 50% desktop */}
  <div className="h-[50vh] lg:h-full overflow-y-auto pb-24">
    <div className="px-4 py-4 space-y-4">
      <NearbyBanner ... />
      <m.div>StatusStepper ...</m.div>
      <m.div>ETACountdown ...</m.div>
      <m.div>StatusTimeline ...</m.div>
      <m.div>DriverCard ...</m.div>
      <m.div>DeliveryNotesEditor ...</m.div>
      <m.div>OrderSummary ...</m.div>
      <m.div>SupportActions ...</m.div>
    </div>
  </div>
</div>
```

NEW useMutePreference contract:
```typescript
// src/lib/hooks/useMutePreference.ts
export interface MutePreferenceReturn {
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
  isHydrated: boolean;  // false during SSR + first render; true post-useEffect
}

export function useMutePreference(): MutePreferenceReturn;

// Storage key: "trackingAudioMuted" (boolean, CONTEXT D-28)
// Default: false (unmuted) — matches SSR output for hydration safety
```
</interfaces>
</context>

<locked_assumptions>
1. **TRAK-01 binary snap via dual-render strategy, NOT Drawer extension.**
   - Peek state: static div mounted at `bottom-0` with `h-[120px]` showing driver name + ETA + drag handle affordance. No Drawer involved.
   - Expanded state: Drawer (`height="full"`, `position="bottom"`) mounted alongside the peek bar (peek bar remains in DOM but Drawer visually covers it via z-50 vs z-40).
   - Tap the peek bar → `setSheetOpen(true)`.
   - Drawer's `onClose` → `setSheetOpen(false)` (returns to peek, does NOT unmount the tracking page).
   - Rationale: avoids touching Drawer.tsx exit animation (C-1 critical gotcha), avoids adding `dismissible={false}` prop that would require new tests on Drawer itself, keeps sheet "always present" as required by UI-SPEC state matrix.

2. **Mobile-only wrapper uses `lg:hidden` + `hidden lg:block` split.** The existing `lg:grid-cols-2` layout is extracted into the desktop branch verbatim; the mobile branch gets the new full-height map + Drawer treatment. Desktop branch content is copy-pasted from current lines 217-378 minus the `lg:` prefixes that were only needed because mobile shared the same div.

3. **`NearbyBanner` stays inside the mobile Drawer content** — it's a sheet-interior banner about driver proximity, not about connection health. The ReconnectingBanner is a different surface (fixed top of viewport).

4. **Audio gate implementation** — check `isMuted || document.hidden` inside the status transition effect. Does not prevent the haptic vibration (D-34 only gates the audio; haptic stays because it's silent and physical).

5. **`useMutePreference` renders `Volume2` during SSR (isHydrated === false).** Prevents hydration mismatch per C-5. Post-mount `useEffect` reads localStorage and flips state.

6. **`tailwind.config.ts` is the source of truth for the new alias**, NOT `globals.css`. CONTEXT D-25 mentioned `globals.css @theme inline` but UI-SPEC §"Token Additions" places it in `tailwind.config.ts`. Tailwind v4 with `@theme inline` means Tailwind config is the actual authoritative location for class aliases (the `@theme inline` block is CSS-variables-as-source, but class generation happens from the config). Verified: color tokens in tailwind.config.ts already use `var(--color-*)` — consistent.

7. **ReconnectingBanner receives `isConnected` as a prop**, not via hook call. Keeps component testable and decoupled from the subscription. TrackingPageClient derives `isConnected` from `subscription.isConnected` (from Plan 01) and passes it down.

8. **No Burmese copy files yet** — inline Burmese strings in ReconnectingBanner with `{/* BURMESE-REVIEW */}` comment per CONTEXT D-45. Keep strings in the component, not extracted to a locale file (out of scope per D-44 "no new deps" spirit).

9. **MuteToggle pulse animation omitted in v1.** UI-SPEC §"Animation/Motion Contract" marks this planner-discretion. Instant icon swap matches the "don't shout" principle and avoids animation wiring overhead. Can be added in Phase 113 UX polish if needed.

10. **No Sentry breadcrumbs** (D-46 deferred in Plan 01; Plan 02 follows suit).
</locked_assumptions>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: useMutePreference hook + tests (CHKP-04)</name>
  <files>
    src/lib/hooks/useMutePreference.ts (CREATE, ~50 LOC)
    src/lib/hooks/__tests__/useMutePreference.test.ts (CREATE, ~100 LOC)
  </files>
  <behavior>
    <!-- TDD: write tests first, then implement -->

    Test A: Initial render returns default unmuted + not hydrated
    - `renderHook(() => useMutePreference())`
    - Expect `result.current.isMuted === false`
    - Expect `result.current.isHydrated === false` (first render, pre-useEffect)
    - After `await waitFor(...)` for useEffect: `isHydrated === true`

    Test B: Hydrates from localStorage on mount
    - `localStorage.setItem("trackingAudioMuted", "true")`
    - Render hook → wait for useEffect
    - Expect `result.current.isMuted === true`
    - Expect `result.current.isHydrated === true`

    Test C: Ignores invalid localStorage value
    - `localStorage.setItem("trackingAudioMuted", "garbage")`
    - Render hook → wait for useEffect
    - Expect `result.current.isMuted === false` (safe default)

    Test D: Handles missing localStorage key gracefully
    - Ensure key absent
    - Render hook → wait for useEffect
    - Expect `result.current.isMuted === false` + `isHydrated === true`

    Test E: `setMuted(true)` persists to localStorage
    - Render hook, call `act(() => result.current.setMuted(true))`
    - Expect `localStorage.getItem("trackingAudioMuted") === "true"`
    - Expect `result.current.isMuted === true`

    Test F: `setMuted(false)` clears localStorage to "false"
    - Pre-set localStorage to "true", render, setMuted(false)
    - Expect `localStorage.getItem("trackingAudioMuted") === "false"`

    Test G: `toggleMuted()` flips state + persists
    - Render hook (starts unmuted), call `toggleMuted()`
    - Expect `isMuted === true`, localStorage "true"
    - Call `toggleMuted()` again
    - Expect `isMuted === false`, localStorage "false"

    Test H: SSR safety — accessing localStorage does not throw
    - Temporarily mock `window.localStorage` to throw on `getItem`
    - Render hook
    - Expect no throw, `isMuted === false`, component does not crash

    Test I: Multiple hook instances stay in sync (optional — skip if adds complexity)
    - Two `renderHook` calls; one calls `setMuted(true)`
    - Note: this requires either a storage event listener or context; if omitted, document as "each hook instance reads localStorage on mount only — multi-instance sync via storage event is NICE-TO-HAVE, deferred"
  </behavior>
  <action>
    Step 1 — Write tests FIRST (RED):

    Create `src/lib/hooks/__tests__/useMutePreference.test.ts`:
    ```typescript
    import { describe, expect, it, beforeEach, vi } from "vitest";
    import { renderHook, act, waitFor } from "@testing-library/react";
    import { useMutePreference } from "../useMutePreference";

    const STORAGE_KEY = "trackingAudioMuted";

    describe("useMutePreference", () => {
      beforeEach(() => {
        localStorage.clear();
      });

      it("returns default unmuted during SSR/first render", () => {
        const { result } = renderHook(() => useMutePreference());
        // Synchronous first render — useEffect not yet run
        expect(result.current.isMuted).toBe(false);
      });

      it("hydrates from localStorage on mount", async () => {
        localStorage.setItem(STORAGE_KEY, "true");
        const { result } = renderHook(() => useMutePreference());
        await waitFor(() => expect(result.current.isHydrated).toBe(true));
        expect(result.current.isMuted).toBe(true);
      });

      it("ignores invalid localStorage value", async () => {
        localStorage.setItem(STORAGE_KEY, "garbage");
        const { result } = renderHook(() => useMutePreference());
        await waitFor(() => expect(result.current.isHydrated).toBe(true));
        expect(result.current.isMuted).toBe(false);
      });

      it("defaults to unmuted when key absent", async () => {
        const { result } = renderHook(() => useMutePreference());
        await waitFor(() => expect(result.current.isHydrated).toBe(true));
        expect(result.current.isMuted).toBe(false);
      });

      it("setMuted(true) persists to localStorage", async () => {
        const { result } = renderHook(() => useMutePreference());
        await waitFor(() => expect(result.current.isHydrated).toBe(true));
        act(() => { result.current.setMuted(true); });
        expect(localStorage.getItem(STORAGE_KEY)).toBe("true");
        expect(result.current.isMuted).toBe(true);
      });

      it("setMuted(false) writes 'false'", async () => {
        localStorage.setItem(STORAGE_KEY, "true");
        const { result } = renderHook(() => useMutePreference());
        await waitFor(() => expect(result.current.isMuted).toBe(true));
        act(() => { result.current.setMuted(false); });
        expect(localStorage.getItem(STORAGE_KEY)).toBe("false");
        expect(result.current.isMuted).toBe(false);
      });

      it("toggleMuted flips state and persists", async () => {
        const { result } = renderHook(() => useMutePreference());
        await waitFor(() => expect(result.current.isHydrated).toBe(true));
        act(() => { result.current.toggleMuted(); });
        expect(result.current.isMuted).toBe(true);
        expect(localStorage.getItem(STORAGE_KEY)).toBe("true");
        act(() => { result.current.toggleMuted(); });
        expect(result.current.isMuted).toBe(false);
        expect(localStorage.getItem(STORAGE_KEY)).toBe("false");
      });

      it("survives localStorage throwing on getItem", async () => {
        const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
          throw new Error("QuotaExceeded");
        });
        const { result } = renderHook(() => useMutePreference());
        await waitFor(() => expect(result.current.isHydrated).toBe(true));
        expect(result.current.isMuted).toBe(false);
        spy.mockRestore();
      });
    });
    ```

    Run tests → confirm all fail with "module not found".

    Step 2 — Implement hook (GREEN):

    Create `src/lib/hooks/useMutePreference.ts`:
    ```typescript
    "use client";

    import { useState, useEffect, useCallback } from "react";

    /**
     * CFIX-10: localStorage-backed mute preference for tracking audio notifications.
     *
     * - SSR-safe: renders `isMuted: false` default during SSR, reads localStorage post-mount
     * - Global scope: single key ("trackingAudioMuted") persists across orders and sessions
     * - Hydration flag: `isHydrated` indicates when localStorage has been read
     *
     * Mirrors the SSR-safe pattern from useAnimationPreference.ts:41-59.
     */

    const STORAGE_KEY = "trackingAudioMuted";

    export interface MutePreferenceReturn {
      isMuted: boolean;
      setMuted: (muted: boolean) => void;
      toggleMuted: () => void;
      isHydrated: boolean;
    }

    export function useMutePreference(): MutePreferenceReturn {
      const [isMuted, setIsMuted] = useState(false);
      const [isHydrated, setIsHydrated] = useState(false);

      useEffect(() => {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored === "true") {
            setIsMuted(true);
          } else {
            setIsMuted(false);
          }
        } catch {
          // localStorage unavailable (private mode quota, etc.) — fall back to unmuted
          setIsMuted(false);
        }
        setIsHydrated(true);
      }, []);

      const setMuted = useCallback((muted: boolean) => {
        try {
          localStorage.setItem(STORAGE_KEY, muted ? "true" : "false");
        } catch {
          // Write failed (quota exceeded) — in-memory state still updates below
        }
        setIsMuted(muted);
      }, []);

      const toggleMuted = useCallback(() => {
        setIsMuted((prev) => {
          const next = !prev;
          try {
            localStorage.setItem(STORAGE_KEY, next ? "true" : "false");
          } catch {
            // Silent failure
          }
          return next;
        });
      }, []);

      return { isMuted, setMuted, toggleMuted, isHydrated };
    }
    ```

    Run tests → all green.

    Verification:
    - `pnpm test -- useMutePreference`
    - `pnpm typecheck`
    - `pnpm lint src/lib/hooks/useMutePreference.ts src/lib/hooks/__tests__/useMutePreference.test.ts`

    Commit: `feat(112-02): useMutePreference hook (CFIX-10)`
  </action>
  <verify>
    <automated>pnpm test -- src/lib/hooks/__tests__/useMutePreference.test.ts</automated>
  </verify>
  <done>
    - `src/lib/hooks/useMutePreference.ts` exists with the contract from `<interfaces>`
    - Test file has 8 passing tests (A-H), minimum
    - SSR-safe: no direct localStorage access during render
    - Try/catch around all localStorage operations (C-5 gotcha)
    - `pnpm typecheck` + `pnpm lint` clean
    - Git commit landed
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: ReconnectingBanner component + MuteToggle component + tailwind alias + barrel export (CHKP-05)</name>
  <files>
    tailwind.config.ts (MODIFY, add borderColor alias)
    src/components/ui/orders/tracking/ReconnectingBanner.tsx (CREATE, ~80 LOC)
    src/components/ui/orders/tracking/MuteToggle.tsx (CREATE, ~55 LOC)
    src/components/ui/orders/tracking/index.ts (MODIFY, add 2 exports)
  </files>
  <behavior>
    <!-- Component-level tests via Vitest + @testing-library/react -->

    Co-locate lightweight component tests next to each component OR extend existing tracking test files. Decision: inline smoke tests in the component action for speed; defer full RTL coverage to a follow-up if needed.

    ReconnectingBanner behavior:
    - When `isConnected === true`, does NOT render anything (AnimatePresence unmounted state)
    - When `isConnected === false` for less than 2 seconds, still does NOT render (debounce active)
    - When `isConnected === false` for >= 2 seconds, renders banner with:
      - `role="status"`
      - `aria-live="polite"` (NOT assertive)
      - `WifiOff` icon with `aria-hidden="true"`
      - Title text "Reconnecting..."
      - Subtitle text "We're updating your driver's location"
      - Burmese companion strings (marked `// BURMESE-REVIEW`)
      - Tokens: `bg-status-warning-bg`, `border-status-warning/20`, `text-status-warning`
      - Position: `fixed top-14 left-0 right-0 z-30 mx-4` (`z-30` = Tailwind semantic `fixed` layer, between sticky header z-20 and modal-backdrop z-40; matches codebase convention in `DriverNav.tsx:81`, `SupportActions.tsx:114`, `FeedbackFAB.tsx:118`, `AdminMobileHeader.tsx:49`)
    - When `isConnected` flips back to true, banner exits via `duration: 0.15s easeIn` (Drawer pattern)
    - Reduced motion: `useAnimationPreference().getSpring()` wraps the enter transition

    MuteToggle behavior:
    - Props: `{ isMuted: boolean, onToggle: () => void, disabled?: boolean }`
    - Renders `Volume2` when `isMuted === false`, `VolumeX` when `isMuted === true`
    - Both icons are `w-5 h-5` with button padding to hit 44px touch target (`h-11 w-11`)
    - `aria-pressed={isMuted}`
    - `aria-label={isMuted ? "Unmute notifications" : "Mute notifications"}`
    - `title={...}` matches aria-label
    - `onClick` calls `onToggle` and triggers `triggerHaptic("light")` (existing util)
    - Ghost button variant: `hover:bg-surface-secondary` / `focus:ring-2 focus:ring-ring focus:ring-offset-2`
    - Icon color: `text-text-primary` when unmuted, `text-text-muted` when muted
  </behavior>
  <action>
    Step 1 — Tailwind alias:

    Open `tailwind.config.ts`. Find the `theme.extend` block. Add or extend the `borderColor` object:
    ```typescript
    theme: {
      extend: {
        // ... existing extensions ...
        borderColor: {
          // Phase 112 TRAK-02: alias for status-warning border so banner markup matches CheckoutErrorBanner idiom
          "status-warning": "var(--color-status-warning)",
        },
        // ... rest ...
      },
    },
    ```
    If `borderColor` already exists under `extend`, merge the new key into it — do NOT clobber existing entries. If merging feels fragile, add the entry via a `borderColor: { ...existing, "status-warning": "var(...)" }` spread (if not merged, add after existing `borderColor` block).

    Verification: `pnpm lint` (no errors), `pnpm build` (Tailwind compiles).

    Step 2 — Create ReconnectingBanner:

    Create `src/components/ui/orders/tracking/ReconnectingBanner.tsx`:
    ```tsx
    "use client";

    /**
     * ReconnectingBanner — TRAK-02
     *
     * Fixed-top banner shown when the tracking Realtime + polling connection drops.
     * 2s debounce eliminates flashing on momentary network blips.
     *
     * - Calm warmth copy ("Reconnecting..." not "Connection lost") per CONTEXT D-20
     * - Auto-dismiss on reconnect (no manual close button) per D-21
     * - aria-live="polite" (NOT assertive) per D-24
     * - Honors prefers-reduced-motion via useAnimationPreference().getSpring()
     *
     * Placement (by consumer): fixed top, below sticky header (z-30, top-14).
     */

    import { useEffect, useState } from "react";
    import { m, AnimatePresence } from "framer-motion";
    import { WifiOff } from "lucide-react";
    import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

    const DEBOUNCE_MS = 2000;

    export interface ReconnectingBannerProps {
      /** Current connection state from useTrackingSubscription */
      isConnected: boolean;
    }

    export function ReconnectingBanner({ isConnected }: ReconnectingBannerProps) {
      const [showBanner, setShowBanner] = useState(false);
      const { getSpring, shouldAnimate } = useAnimationPreference();

      // 2s debounce: only show banner if disconnected state persists
      useEffect(() => {
        if (isConnected) {
          setShowBanner(false);
          return;
        }
        const timer = setTimeout(() => setShowBanner(true), DEBOUNCE_MS);
        return () => clearTimeout(timer);
      }, [isConnected]);

      return (
        <AnimatePresence>
          {showBanner && !isConnected && (
            <m.div
              key="reconnecting-banner"
              role="status"
              aria-live="polite"
              initial={shouldAnimate ? { y: -50, opacity: 0 } : { opacity: 0 }}
              animate={shouldAnimate ? { y: 0, opacity: 1 } : { opacity: 1 }}
              exit={shouldAnimate ? { y: -50, opacity: 0, transition: { duration: 0.15, ease: "easeIn" } } : { opacity: 0 }}
              transition={getSpring({ type: "spring", stiffness: 300, damping: 25 })}
              className="fixed top-14 left-0 right-0 z-30 mx-4 rounded-xl border border-status-warning/20 bg-status-warning-bg p-3 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-status-warning/10">
                  <WifiOff aria-hidden="true" className="h-4 w-4 text-status-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-status-warning">Reconnecting...</p>
                  {/* BURMESE-REVIEW: native speaker sign-off before prod deploy */}
                  <p className="text-xs text-text-muted">We&apos;re updating your driver&apos;s location</p>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      );
    }
    ```

    Gotcha references:
    - **C-1 / D-04:** Exit transition uses `duration: 0.15, ease: "easeIn"` — NOT a spring (mirrors Drawer exit protection pattern even though this isn't Drawer itself; staying consistent with codebase)
    - **D-22:** Enter spring `stiffness: 300, damping: 25` (matches NearbyBanner.tsx:85)
    - **D-24:** `aria-live="polite"`
    - **D-49:** All motion through `getSpring()`

    Step 3 — Create MuteToggle:

    Create `src/components/ui/orders/tracking/MuteToggle.tsx`:
    ```tsx
    "use client";

    /**
     * MuteToggle — CFIX-10
     *
     * Icon-only button for toggling tracking audio notifications.
     * Persistence is handled by the consumer (via useMutePreference hook);
     * this component is a stateless presentation wrapper so it's easy to test
     * and easy to drive from a parent's useMutePreference call.
     *
     * - 44px touch target (Phase 113 A11Y prep) per D-31
     * - aria-pressed toggle state per D-32
     * - Haptic feedback on click via triggerHaptic("light") per D-31
     * - Ghost button variant matches adjacent ShareButton + RefreshCw per D-30
     */

    import { Volume2, VolumeX } from "lucide-react";
    import { triggerHaptic } from "@/lib/swipe-gestures";
    import { cn } from "@/lib/utils/cn";

    export interface MuteToggleProps {
      isMuted: boolean;
      onToggle: () => void;
      disabled?: boolean;
      className?: string;
    }

    export function MuteToggle({ isMuted, onToggle, disabled = false, className }: MuteToggleProps) {
      const label = isMuted ? "Unmute notifications" : "Mute notifications";

      const handleClick = () => {
        if (disabled) return;
        triggerHaptic("light");
        onToggle();
      };

      return (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          aria-label={label}
          aria-pressed={isMuted}
          title={label}
          className={cn(
            "inline-flex h-11 w-11 items-center justify-center rounded-lg",
            "hover:bg-surface-secondary",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors",
            className
          )}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5 text-text-muted" aria-hidden="true" />
          ) : (
            <Volume2 className="h-5 w-5 text-text-primary" aria-hidden="true" />
          )}
        </button>
      );
    }
    ```

    Gotcha references:
    - **D-31:** 44px touch target via `h-11 w-11`
    - **D-32:** `aria-pressed` + `aria-label` both dynamic
    - **H-8:** aria-pressed not just visual swap
    - **D-50:** Token-only styling (no hex, no arbitrary px)

    Step 4 — Barrel export:

    Open `src/components/ui/orders/tracking/index.ts`. Add at the bottom (before `TrackingPageClient` re-export):
    ```typescript
    export { ReconnectingBanner } from "./ReconnectingBanner";
    export type { ReconnectingBannerProps } from "./ReconnectingBanner";

    export { MuteToggle } from "./MuteToggle";
    export type { MuteToggleProps } from "./MuteToggle";
    ```

    Step 5 — Verification:
    - `pnpm lint src/components/ui/orders/tracking/ReconnectingBanner.tsx src/components/ui/orders/tracking/MuteToggle.tsx src/components/ui/orders/tracking/index.ts tailwind.config.ts`
    - `pnpm typecheck`
    - `pnpm build` (verify Tailwind alias resolves, no CSS errors)

    Commit: `feat(112-02): ReconnectingBanner + MuteToggle + border-status-warning alias (TRAK-02, CFIX-10)`
  </action>
  <verify>
    <automated>pnpm lint src/components/ui/orders/tracking/ReconnectingBanner.tsx src/components/ui/orders/tracking/MuteToggle.tsx src/components/ui/orders/tracking/index.ts tailwind.config.ts && pnpm typecheck</automated>
  </verify>
  <done>
    - `tailwind.config.ts` has `borderColor.status-warning` alias
    - `ReconnectingBanner.tsx` renders banner with aria-live polite, 2s debounce, WifiOff icon, status-warning tokens, reduced-motion gate
    - `MuteToggle.tsx` renders 44px button with aria-pressed, Volume2/VolumeX swap, ghost variant styling, haptic feedback
    - Barrel `index.ts` exports both components + prop types
    - `pnpm typecheck` + `pnpm lint` + `pnpm build` all clean
    - Git commit landed
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Wire into TrackingPageClient — mute hook + audio gate + banner mount + mobile Drawer wrap (CHKP-06)</name>
  <files>
    src/components/ui/orders/tracking/TrackingPageClient.tsx (MAJOR MODIFY, ~60 LOC delta)
  </files>
  <behavior>
    <!-- Integration test strategy: since the full E2E Playwright suite is the right tool for visible UI flows, -->
    <!-- this task uses a manual verification checkpoint (CHKP-06) plus type/build safety from pnpm build. -->
    <!-- Unit-level tests on the subscription hook + mute hook + banner/mute components already cover the logic. -->

    Integration behavior:
    1. `useMutePreference()` hook call added at top of component
    2. Audio trigger at lines 87-95 gated by `!isMuted && !document.hidden`
    3. `<MuteToggle>` mounted in header between `<ShareButton>` and the refresh `<button>` (currently lines 198-210)
    4. `<ReconnectingBanner isConnected={subscription.isConnected} />` mounted after the sticky header, before the layout split
    5. Mobile layout (current lines 216-378 `<div className="mx-auto max-w-5xl lg:grid ...">`) is SPLIT into two branches:
       - `<div className="lg:hidden">` — full-height map + Drawer wrap
       - `<div className="hidden lg:block">` — existing desktop `lg:grid-cols-2` layout, UNCHANGED except for classes
    6. Mobile branch structure:
       - Full-height map: `h-[calc(100svh-3.5rem)]` absolute-positioned map
       - Peek bar at `bottom-0`: static `h-[120px]` div with driver name + ETA + drag handle affordance, `onClick` → `setSheetOpen(true)`
       - `<Drawer isOpen={sheetOpen} onClose={() => setSheetOpen(false)} position="bottom" height="full" title="Tracking details">` wrapping the existing info pane children (NearbyBanner, StatusStepper, ETACountdown, etc.)
    7. Desktop layout: COPY-PASTE existing layout into `hidden lg:block` wrapper, ZERO content or className changes inside
  </behavior>
  <action>
    Open `src/components/ui/orders/tracking/TrackingPageClient.tsx`. Current file is 381 lines.

    **Important:** This is a heavy edit. Work section-by-section. After each section, compile-check with `pnpm typecheck` before proceeding.

    === Step 1: Imports ===

    Add to the imports block (lines 11-37):
    ```typescript
    import { useMutePreference } from "@/lib/hooks/useMutePreference";
    import { ReconnectingBanner } from "./ReconnectingBanner";
    import { MuteToggle } from "./MuteToggle";
    import { Drawer } from "@/components/ui/Drawer";
    ```

    === Step 2: Hook call + sheet state ===

    Inside `TrackingPageClient` function, after line 59 (`const [eta, setEta] = useState(...)`):
    ```typescript
    const { isMuted, toggleMuted } = useMutePreference();
    const [sheetOpen, setSheetOpen] = useState(false);
    ```

    === Step 3: Audio gate ===

    Replace lines 86-95 (the audio try/catch block) with:
    ```typescript
    // Brief audio cue — gated by mute preference AND tab visibility (CFIX-10, D-34/D-36)
    if (!isMuted && !document.hidden) {
      try {
        const audio = new Audio("/sounds/notification.mp3");
        audio.volume = 0.2;
        void audio.play().catch(() => {
          // Sound file may not exist or autoplay policy rejected -- graceful failure
        });
      } catch {
        // Audio creation failed -- skip
      }
    }
    ```

    Update the useEffect dependency array at line 104 to include `isMuted`:
    ```typescript
    }, [orderStatus, isMuted]);
    ```

    === Step 4: MuteToggle in header ===

    In the header JSX (around lines 198-210), insert `<MuteToggle>` between `<ShareButton>` and the refresh button:
    ```tsx
    <ShareButton orderId={orderId} orderStatus={orderStatus} />
    <MuteToggle isMuted={isMuted} onToggle={toggleMuted} />
    <button
      onClick={() => subscription.refresh()}
      className="p-1 hover:bg-charcoal-100 rounded-full transition-colors"
      aria-label="Refresh tracking data"
    >
      <RefreshCw ... />
    </button>
    ```

    === Step 5: ReconnectingBanner mount ===

    Immediately after the closing `</header>` tag (around line 214), before the layout wrapper `<div className="mx-auto max-w-5xl ...">`:
    ```tsx
    </header>

    {/* TRAK-02: Reconnecting banner with 2s debounce */}
    <ReconnectingBanner isConnected={subscription.isConnected} />

    {/* Split-view layout */}
    ```

    === Step 6: Split layout into mobile + desktop branches ===

    This is the biggest change. The existing block (lines 216-378) must become two siblings.

    **Current structure to replace:**
    ```tsx
    <div className="mx-auto max-w-5xl lg:grid lg:grid-cols-2 lg:h-[calc(100vh-3.5rem)]">
      {/* Map section: top 50vh mobile, left 50% desktop */}
      {hasLocation && (<div className="h-[50vh] lg:h-full relative"> ... </div>)}

      {/* Info section: bottom 50vh mobile, right 50% desktop */}
      <div className="h-[50vh] lg:h-full overflow-y-auto pb-24">
        <div className="px-4 py-4 space-y-4"> ... all the info pane content ... </div>
      </div>
    </div>
    ```

    **Replace with a two-branch structure.** First, extract the info pane content into a local variable for reuse:
    ```tsx
    // Inside the component body, just before the return statement:
    const infoPaneContent = (
      <div className="px-4 py-4 space-y-4">
        {/* Nearby Banner */}
        <NearbyBanner
          etaMinutes={eta?.minMinutes ?? null}
          isVisible={orderStatus === "out_for_delivery"}
        />

        {/* StatusStepper - horizontal progress */}
        <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatusStepper currentStatus={orderStatus} cancelledAt={initialData.order.cancelledAt} />
        </m.div>

        {/* ETA Countdown */}
        {showLiveTracking && eta && (
          <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <ETACountdown
              minMinutes={eta.minMinutes}
              maxMinutes={eta.maxMinutes}
              estimatedArrival={eta.estimatedArrival}
              isNearby={eta.minMinutes <= 5}
            />
          </m.div>
        )}

        {/* Delivered Screen */}
        <AnimatePresence>
          {showDelivered && orderStatus === "delivered" && (
            <DeliveredScreen
              orderId={orderId}
              initialRating={initialData.rating}
              deliveryPhotoUrl={routeStop?.deliveryPhotoUrl}
            />
          )}
        </AnimatePresence>

        {/* Status Timeline (detailed vertical) */}
        <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <StatusTimeline
            currentStatus={orderStatus}
            placedAt={initialData.order.placedAt}
            confirmedAt={initialData.order.confirmedAt}
            deliveredAt={initialData.order.deliveredAt}
            isLive={showLiveTracking}
          />
        </m.div>

        {/* Driver Card */}
        {driverInfo && stopProgress && (
          <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <DriverCard driver={driverInfo} stopProgress={stopProgress} />
          </m.div>
        )}

        {/* Delivery Notes Editor */}
        <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <DeliveryNotesEditor
            orderId={orderId}
            initialNotes={initialData.order.specialInstructions}
            isEditable={!isTerminalStatus}
          />
        </m.div>

        {/* Order Summary */}
        <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <OrderSummary
            items={initialData.order.items}
            subtotalCents={initialData.order.subtotalCents}
            deliveryFeeCents={initialData.order.deliveryFeeCents}
            taxCents={initialData.order.taxCents}
            totalCents={initialData.order.totalCents}
            deliveryWindow={{
              start: initialData.order.deliveryWindowStart,
              end: initialData.order.deliveryWindowEnd,
            }}
            deliveryAddress={{
              line1: initialData.order.address.line1,
              city: initialData.order.address.city,
              state: initialData.order.address.state,
            }}
          />
        </m.div>

        {/* Support Actions */}
        <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <SupportActions
            driverPhone={initialData.driver?.phone ?? null}
            orderStatus={orderStatus}
          />
        </m.div>
      </div>
    );

    const mapContent = hasLocation ? (
      <LazyDeliveryMap
        customerLocation={{
          lat: initialData.order.address.lat!,
          lng: initialData.order.address.lng!,
          address: `${initialData.order.address.line1}, ${initialData.order.address.city}`,
        }}
        driverLocation={
          driverLocation
            ? { lat: driverLocation.latitude, lng: driverLocation.longitude, heading: driverLocation.heading }
            : null
        }
        restaurantLocation={initialData.restaurantLocation}
        orderStatus={orderStatus}
        lastLocationUpdate={subscription.lastUpdate}
        isLive={subscription.isConnected}
        className="h-full rounded-none lg:rounded-none"
      />
    ) : null;

    const cancelledOverlayContent = (
      <AnimatePresence>
        {orderStatus === "cancelled" && (
          <CancelledOverlay
            cancellationReason={initialData.order.cancellationReason}
            orderId={orderId}
          />
        )}
      </AnimatePresence>
    );
    ```

    Then replace the layout block (lines 216-378) with:
    ```tsx
    {/* MOBILE: full-height map + collapsible bottom sheet (TRAK-01) */}
    <div className="lg:hidden relative">
      {/* Full-height map fills viewport minus header */}
      {hasLocation && (
        <div className="h-[calc(100svh-3.5rem)] w-full relative">
          {mapContent}
          {cancelledOverlayContent}
        </div>
      )}

      {/* Peek bar: always visible, tap to open sheet. Sits above map via fixed bottom. */}
      {!sheetOpen && (
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label="Expand tracking details"
          className="fixed bottom-0 inset-x-0 z-40 h-[120px] bg-card border-t border-border-default rounded-t-3xl shadow-lg text-left"
        >
          {/* Drag handle affordance */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 rounded-full bg-border-default" aria-hidden="true" />
          </div>
          <div className="px-4 pb-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {driverInfo?.fullName ?? "Finding your driver..."}
              </p>
              <p className="text-xs text-text-muted truncate">
                {eta ? `Arriving in ${eta.minMinutes}-${eta.maxMinutes} min` : "Calculating ETA..."}
              </p>
            </div>
          </div>
        </button>
      )}

      {/* Expanded sheet: Drawer handles focus trap, body scroll lock, swipe-to-dismiss */}
      <Drawer
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        position="bottom"
        height="full"
        title="Tracking details"
      >
        {infoPaneContent}
      </Drawer>
    </div>

    {/* DESKTOP: existing lg:grid-cols-2 layout UNCHANGED */}
    <div className="hidden lg:block mx-auto max-w-5xl lg:grid lg:grid-cols-2 lg:h-[calc(100vh-3.5rem)]">
      {hasLocation && (
        <div className="lg:h-full relative">
          {mapContent}
          {cancelledOverlayContent}
        </div>
      )}
      <div className="lg:h-full overflow-y-auto pb-24">
        {infoPaneContent}
      </div>
    </div>
    ```

    === Step 7: Verification ===

    - `pnpm lint src/components/ui/orders/tracking/TrackingPageClient.tsx`
    - `pnpm typecheck`
    - `pnpm test` (no new failures)
    - `pnpm build` (Next.js SSR build succeeds)

    CRITICAL gotcha checks:
    - **C-1:** Drawer.tsx NOT modified — we only consume it. ✓
    - **C-4 / D-34:** Audio gate `!isMuted && !document.hidden` present. ✓
    - **H-1:** Mobile map uses `100svh` (not 100vh) for iOS safe area. ✓
    - **D-03:** Desktop `lg:grid-cols-2` layout unchanged inside `hidden lg:block`. ✓
    - **D-43:** LazyDeliveryMap not modified (passed through `mapContent` variable). ✓
    - **File size:** Check `wc -l` on TrackingPageClient.tsx. If > 400 lines after changes, flag in SUMMARY — do not split in this task (out of scope), note for Phase 113 refactor.

    Commit: `feat(112-02): wire mute toggle + reconnecting banner + mobile bottom sheet into TrackingPageClient (CFIX-10, TRAK-01, TRAK-02)`
  </action>
  <verify>
    <automated>pnpm lint src/components/ui/orders/tracking/TrackingPageClient.tsx && pnpm typecheck && pnpm test && pnpm build</automated>
  </verify>
  <done>
    - `useMutePreference()` hook called in component body
    - Audio gate present at status transition effect: `if (!isMuted && !document.hidden) { ... }`
    - `<MuteToggle>` mounted in header between `<ShareButton>` and refresh button
    - `<ReconnectingBanner isConnected={subscription.isConnected} />` mounted after `</header>`
    - Mobile layout wrapped in `<div className="lg:hidden relative">` with peek bar + Drawer
    - Desktop layout wrapped in `<div className="hidden lg:block ...">` with ORIGINAL `lg:grid-cols-2` classes preserved
    - `100svh` used for mobile map height (not 100vh)
    - Drawer.tsx NOT modified
    - `pnpm build` succeeds
    - `pnpm typecheck` clean
    - `pnpm lint` clean
    - `pnpm test` full suite green
    - Git commit landed
    - If `TrackingPageClient.tsx` exceeds 400 lines, flag in SUMMARY for Phase 113 refactor (not blocking)
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>CHKP-07: Mobile UX smoke test on real device or Chrome DevTools mobile emulation</name>
  <files>none (verification only)</files>
  <action>HUMAN VERIFICATION CHECKPOINT — Pause execution. Present the mobile UX verification scenarios from `<how-to-verify>` below to the user. Do NOT proceed with any further tasks, commits, or phase closure until the user replies with the resume signal defined in `<resume-signal>`. If the user reports bugs, log them, fix via targeted edits, re-verify the failing scenario, and only then resume.</action>
  <verify><automated>echo "Manual checkpoint — 7 mobile UX scenarios in <how-to-verify>. No automated verification command. Waiting for user resume signal."</automated></verify>
  <done>User has typed the resume signal ("approved" or a failure description). All 7 verification scenarios (TRAK-01 mobile, TRAK-01 desktop regression, TRAK-02 banner, TRAK-03 visibility, TRAK-04 backoff, CFIX-10 mute, accessibility + dark mode) have been executed on a mobile viewport by the user. Any bugs reported have been fixed and re-verified before resume.</done>
  <what-built>
    Plan 02 delivered:
    - `useMutePreference` hook (SSR-safe localStorage)
    - `ReconnectingBanner` component (2s debounce, WifiOff, aria-live polite)
    - `MuteToggle` component (44px, aria-pressed, Volume2/VolumeX)
    - `tailwind.config.ts` `border-status-warning` alias
    - `TrackingPageClient` wired: mute hook + audio gate + banner + mobile Drawer wrap

    Combined with Plan 01 (exponential backoff + visibility pause), the full Phase 112 customer tracking experience is now live.
  </what-built>
  <how-to-verify>
    Run `pnpm dev` and test the tracking page on mobile (real device if possible, otherwise Chrome DevTools → Device Toolbar → iPhone 15 Pro).

    **Setup:** Log in as a customer with an active `out_for_delivery` order. Navigate to `/orders/:id/tracking`.

    **TRAK-01 — Bottom sheet (mobile):**
    1. Mobile viewport (< lg breakpoint, ~390px wide)
    2. Expected: map fills the viewport height (minus header), peek bar visible at bottom showing driver name + ETA
    3. Tap the peek bar → expect Drawer slides up to 95vh with spring animation
    4. Expected inside: NearbyBanner (if near), StatusStepper, ETA, StatusTimeline, DriverCard, DeliveryNotesEditor, OrderSummary, SupportActions
    5. Swipe down past 150px threshold on the Drawer → expect snap back to peek state (NOT page unmount)
    6. Tap outside Drawer (backdrop) → expect snap back to peek state
    7. ESC key → expect snap back to peek state
    8. Verify: Drawer exit animation is fast (~150ms, NOT a bouncy spring) — if it bounces, STOP and check Drawer.tsx was not modified

    **TRAK-01 — Desktop (regression check):**
    1. Resize to > 1024px (lg breakpoint)
    2. Expected: EXISTING `lg:grid-cols-2` 50/50 split (map left, info pane right)
    3. No Drawer, no peek bar, no collapsible behavior
    4. All info pane content (StatusStepper, DriverCard, etc.) renders identically to before Phase 112

    **TRAK-02 — Reconnecting banner:**
    1. Open DevTools → Network → toggle "Offline"
    2. Wait ~2 seconds
    3. Expected: fixed-top banner appears below header (z-30) with:
       - WifiOff icon
       - "Reconnecting..." headline
       - "We're updating your driver's location" subtitle
       - Warning palette background (light yellow / warning bg token)
       - Slide-down enter animation
    4. Toggle "Online"
    5. Expected: banner exits quickly (~150ms), no lingering
    6. Edge case: toggle offline → online within < 2 seconds → banner should NEVER appear (debounce)

    **TRAK-03 — Visibility pause:**
    1. Open browser DevTools → Network → check WebSocket tab
    2. Switch to another tab for ~5 seconds
    3. Come back
    4. Expected (via DevTools): WebSocket connection is re-established after switching back
    5. Verify via console: no errors about stale closures or listener accumulation
    6. Rapid tab flip-flop (5x quick switches): no console errors, no request flood on the Network tab

    **TRAK-04 — Exponential backoff:**
    1. Network offline mode
    2. Watch Network tab filtered to `/api/tracking/`
    3. Expected pattern: polling requests at ~30s intervals (polling fallback)
    4. Verify in console: `setupSubscriptions` is retried with increasing delays — cannot easily observe in DevTools without adding logs, SKIP this manual verification if tedious (covered by unit tests J, K, L in Plan 01)

    **CFIX-10 — Mute toggle:**
    1. Locate the mute button in the header (between Share and Refresh buttons)
    2. Expected icon: `Volume2` (speaker with waves)
    3. Tap it
    4. Expected: haptic on mobile, icon swaps to `VolumeX` (speaker with X), color shifts to muted text color
    5. Check `aria-label` via DevTools → Elements → should say "Unmute notifications"
    6. Check `aria-pressed` attribute → should be `"true"`
    7. Refresh the page → mute state persists (icon stays `VolumeX`)
    8. Navigate to a DIFFERENT tracking page (another order) → mute state still persists (global localStorage)
    9. Trigger a status change (hardest to manually verify — can force via server) → no audio should play while muted
    10. Unmute, switch tabs (tab hidden), force status change → NO audio should play (document.hidden guard)

    **Accessibility spot-check:**
    1. Tab through the header: Back → Live indicator → ShareButton → MuteToggle → Refresh
    2. Space/Enter on MuteToggle triggers toggle
    3. Focus ring visible on MuteToggle (ring-2 ring-ring ring-offset-2)
    4. Banner `role=status` announced by screen reader (use VoiceOver / NVDA if possible — non-blocking)

    **Dark mode:**
    1. Toggle OS/browser to dark mode
    2. Banner renders with dark mode status-warning tokens (not broken, not hardcoded white)
    3. Mute toggle icon colors adapt
    4. Peek bar uses dark mode surface colors
  </how-to-verify>
  <resume-signal>
    Type "approved" if all seven surfaces work as expected.

    If issues: describe which surface + what broke (e.g., "banner shows immediately, not after 2s" or "Drawer exit is bouncy" or "mute doesn't persist across refresh"). Planner will fix before closing the plan.

    KNOWN-OK behaviors (do NOT report as bugs):
    - Map tiles behind the peek bar may look slightly different due to full-height layout change (expected)
    - Sheet open animation is spring, exit is fast (by design — C-1 mobile Safari GPU protection)
    - No audio plays during testing even when unmuted (autoplay policy requires a prior user gesture)
    - `attempt counter` is not visible in any UI (by design — UI-SPEC forbids exposing internal state)
  </resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| browser localStorage ↔ mute hook | localStorage is tab-scoped, writable by any script in the same origin; trusted for UX preference only |
| user click ↔ MuteToggle | Trusted user gesture; also unblocks audio autoplay policy |
| document.visibilityState ↔ audio play | Browser-provided signal; trusted |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-112-08 | Tampering | localStorage trackingAudioMuted key | accept | Same-origin only; user can modify their own storage; no security impact (mute is a preference, not an authz boundary) |
| T-112-09 | Information disclosure | Burmese untranslated copy in production | mitigate | `// BURMESE-REVIEW` comments flag strings for native-speaker sign-off before v2.3 ships (CONTEXT D-45) |
| T-112-10 | Denial of service (audio spam) | Unmuted status change sound | mitigate | Audio gated by `!isMuted && !document.hidden`; defaults to unmuted but user can silence with one tap |
| T-112-11 | Audio autoplay exploitation | `new Audio().play()` | mitigate | `try/catch` + `void .catch(() => {})` handles autoplay rejection silently; first user gesture (mute toggle itself, or tap anywhere on page) unblocks subsequent plays |
| T-112-12 | Hydration mismatch | SSR vs client-side mute state | mitigate | `useMutePreference` renders `isMuted: false` + `isHydrated: false` default during SSR; reads localStorage post-mount; MuteToggle renders `Volume2` (default unmuted) during `isHydrated === false` |
| T-112-13 | Focus trap escape | Drawer body-scroll lock failure on swipe-to-dismiss | accept | Existing Drawer.tsx handles this with `deferRestore: true` + `onExitComplete` per Phase 110 commit 4087d3bf; Plan 02 does NOT modify Drawer internals |
| T-112-14 | Misleading accessibility | aria-pressed on non-toggle semantics | mitigate | MuteToggle is a true toggle button — aria-pressed reflects actual state; aria-label updates dynamically to match |
| T-112-15 | Rapid sheet toggle DoS | User rapidly opens/closes sheet | mitigate | Drawer primitive already throttles animations via Framer Motion + `willChange` optimization (commit 4087d3bf); peek bar click is throttled by natural tap cadence |
</threat_model>

<verification>
  Per-task verification commands are embedded in each task's `<verify>` block.

  **Plan-level full verification suite (MUST run before claiming plan complete — per user's MEMORY.md [verify_before_push]):**
  ```bash
  pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build
  ```

  **Regression guards:**
  - Plan 01 tests (`useTrackingSubscription` subscription lifecycle) still pass — Plan 02 does NOT touch the hook
  - Existing tracking tests (`useShowLiveTracking`, `useLastUpdateDisplay`) still pass
  - Existing `Drawer.tsx` component NOT modified (grep `git diff src/components/ui/Drawer.tsx` must be empty)
  - Existing `LazyDeliveryMap` / `LazyMaps.tsx` NOT modified (D-42)
  - Desktop `lg:grid-cols-2` layout visually identical to pre-Phase-112 (only moved into a `hidden lg:block` wrapper)
  - E2E Playwright suite (if any covers tracking): `pnpm test:e2e -- tracking` — no new failures

  **Checkpoint:** CHKP-07 at end of Task 3 for human mobile UX verification.
</verification>

<success_criteria>
  - `useMutePreference` hook ships with 8+ passing tests
  - `ReconnectingBanner` renders with aria-live polite, 2s debounce, reduced-motion gate
  - `MuteToggle` renders with aria-pressed, 44px touch target, haptic feedback
  - `tailwind.config.ts` `border-status-warning` alias compiles cleanly
  - `TrackingPageClient`: audio gated, banner mounted, mute toggle mounted, mobile wrapped in Drawer
  - Desktop layout unchanged (visually identical before/after Phase 112)
  - Drawer.tsx NOT modified (zero diff)
  - LazyDeliveryMap NOT modified (zero diff)
  - Full verification suite green: `pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build`
  - CHKP-07 human verification passed (approved by user)
  - 3 git commits with scope `112-02` landed
  - REQ-ID coverage: CFIX-10 (mute toggle + audio gate), TRAK-01 (mobile bottom sheet), TRAK-02 (reconnecting banner) — all delivered

  **Burmese review debt:** Copy strings marked `// BURMESE-REVIEW` — non-blocking for Phase 112 ship, coordinate with project owner before next prod deploy (CONTEXT D-45).
</success_criteria>

<output>
After completion, create `.planning/phases/112/112-02-SUMMARY.md` with:
- What shipped: useMutePreference hook, ReconnectingBanner, MuteToggle, tailwind alias, TrackingPageClient wiring
- Files touched: useMutePreference.ts (+test), ReconnectingBanner.tsx, MuteToggle.tsx, tailwind.config.ts, tracking/index.ts, TrackingPageClient.tsx
- REQ-ID coverage: CFIX-10, TRAK-01, TRAK-02 delivered; TRAK-03 + TRAK-04 delivered by Plan 01
- Phase 112 complete: all 5 requirements satisfied
- Locked assumptions shipped: dual-render binary snap strategy (peek bar + Drawer), instant mute icon swap (no pulse), no Sentry breadcrumbs, no Burmese translation files
- Known tech debt:
  - Burmese copy needs native-speaker sign-off (`// BURMESE-REVIEW` markers)
  - If `TrackingPageClient.tsx` exceeds 400 lines, flag for Phase 113 refactor via component subfolder extraction
  - Sentry breadcrumbs (D-46) deferred — revisit after first production incident
- Hand-off to Phase 113 (A11Y): focus indicators already correct, 44px targets met, aria-live/aria-pressed in place; Phase 113 audits StatusStepper reduced-motion gap (M-6 — pre-existing)
</output>
</content>
</invoke>