---
phase: 112
slug: order-tracking-overhaul
status: approved
shadcn_initialized: true
preset: new-york (neutral base, lucide icons)
created: 2026-04-08
reviewed_at: 2026-04-08
---

# Phase 112 — UI Design Contract

> Visual and interaction contract for Phase 112 Order Tracking Overhaul. Phase 112 is a **near-zero-new-tokens** phase — three visible surfaces (bottom sheet, reconnecting banner, mute toggle) compose from existing Phase 110/111 primitives. Only one token alias is introduced: `border-status-warning` (missing alias, not a new color). All motion, spring, and color values already exist in the design system.

---

## Scope Recap

Five requirements, three visible surfaces, two invisible plumbing changes. Executor-relevant surfaces:

| Requirement | Surface | Visual Change? |
|-------------|---------|----------------|
| TRAK-01 | `TrackingPageClient.tsx` mobile layout → full-height map + collapsible `Drawer` bottom sheet | YES — new mobile layout |
| TRAK-02 | `ReconnectingBanner.tsx` (new) — fixed top, 2s debounce | YES — new component |
| CFIX-10 | `MuteToggle.tsx` (new) — header icon button | YES — new header control |
| TRAK-03 | `useTrackingSubscription.ts` visibility pause | NO — plumbing only |
| TRAK-04 | `useTrackingSubscription.ts` exponential backoff | NO — plumbing only |

**Desktop (`lg:` breakpoint): UNCHANGED.** Phase 112 is mobile-only. `lg:grid-cols-2` layout at `TrackingPageClient.tsx:217` stays exactly as-is. Zero desktop regression risk.

---

## Design System

| Property | Value | Source |
|----------|-------|--------|
| Tool | **shadcn/ui (new-york style)** | `components.json` |
| Preset | base color `neutral`, CSS variables enabled, `rsc: true`, `tsx: true` | `components.json` |
| Component library | **shadcn/ui + Radix UI primitives** + custom V8 layer (`src/components/ui/**`, 70+ components) | Project convention |
| Icon library | **lucide-react** (`Volume2`, `VolumeX`, `WifiOff` all pre-installed) | `components.json` |
| Font (Latin) | **Nunito** (weights 400/500/600/700) | `globals.css:1-2` |
| Font (Burmese) | **Padauk** — weights 400/700 — applied via `.font-burmese` utility | `globals.css:272-274` |
| CSS architecture | Tailwind v4 with `@theme inline`, tokens in `src/styles/tokens.css` | `globals.css:22-190` |
| Tokens enforced by | ESLint (62+ design tokens) — hardcoded hex/rgb is an error | `CLAUDE.md` |
| Motion library | Framer Motion 12 (LazyMotion `domMax` at root) — `<m.div>` not `<motion.div>` | V8 convention |
| Bottom sheet primitive | **`src/components/ui/Drawer.tsx`** (existing, battle-tested, mobile-Safari-GPU-hardened) | CONTEXT D-01 |
| Spring tokens | `spring.default` (300/22/0.8), `spring.snappy` (600/35/1), `spring.gentle` (200/25/1) | `src/lib/motion-tokens` |
| Animation gate | All motion through `useAnimationPreference().getSpring(spring.X)` — honors `prefers-reduced-motion` | CONTEXT D-23 |
| Dark mode | Light + dark both mandatory — no dark-mode-only features in this phase | `globals.css:227-260` |

**Phase 112 registry impact:** No shadcn block additions. Drawer.tsx is already registered. Safety gate not applicable.

---

## Token Additions (single minor alias)

Phase 112 introduces **one** missing Tailwind alias so the Reconnecting banner can use `border-status-warning` class cleanly. The underlying color already exists; this is a class alias only.

```typescript
// tailwind.config.ts — add under borderColor
borderColor: {
  "status-warning": "var(--color-status-warning)",
}
```

**Rationale:** `bg-status-warning-bg`, `text-status-warning`, and `bg-status-warning/10` already resolve. Only the border alias was missing — adding it keeps the banner markup consistent with Phase 111's `CheckoutErrorBanner` idiom (`border-status-warning/20`).

No other token additions. Research §15 confirms every other token already exists.

---

## Spacing Scale

Declared values (multiples of 4, Tailwind v4 default spacing). Phase 112 surfaces use a subset.

| Token | Value | Class | Phase 112 Usage |
|-------|-------|-------|-----------------|
| xs | 4px | `gap-1`, `p-1` | Mute icon inner padding |
| sm | 8px | `gap-2`, `p-2`, `py-2` | Banner icon gap, header button spacing |
| md | 12px | `gap-3`, `p-3` | Banner outer padding, drag handle region |
| md+ | 16px | `gap-4`, `p-4` | Sheet header padding, banner content padding |
| lg | 24px | `gap-6`, `p-6`, `pb-6` | Sheet content sections (status stepper, driver card) |

**Phase 112 spacing rules:**
- **Sheet peek height:** `h-[120px]` (collapsed state shows header row + status row) — declared via Drawer.tsx snap point
- **Sheet full height:** `h-[95svh]` — viewport-dependent arbitrary value PERMITTED per §15 (precedent in Drawer.tsx `max-h-[calc(95vh-3rem)]`)
- **Banner vertical offset:** `top-14` (56px — matches sticky header height in `TrackingPageClient.tsx:198`)
- **Banner horizontal:** `left-0 right-0` (full-width, flush with viewport edges) + `px-4` inner padding
- **Header button spacing:** mute toggle sits between ShareButton and RefreshCw — inherits existing `gap-2` from header flex row (no new spacing)
- **Touch targets:** 44px minimum on mobile for mute button (`h-11 w-11` or `p-2.5` wrapper around 24px icon)

**Exceptions:** `h-[120px]` sheet peek and `h-[95svh]` sheet full are the only arbitrary viewport-dependent values. Both are explicitly permitted per research §15 precedent.

**Codebase pattern note (executor awareness):** Drawer.tsx (`src/components/ui/Drawer.tsx`) already implements drag handle, focus trap, scroll lock, and swipe-to-dismiss. Phase 112 wraps Drawer, does NOT reimplement any of those. Executor must import and compose, not copy/paste internals.

---

## Typography

Phase 112 touches 3 surfaces. Declared sizes for this phase:

| Role | Size | Weight | Line Height | Class | Usage in Phase 112 |
|------|------|--------|-------------|-------|---------------------|
| Caption / helper | 12px | 500 | 1.4 | `text-xs font-medium` | Banner subtitle ("We're updating…"), Burmese companion lines |
| Body | 14px | 400/500 | 1.5 | `text-sm` / `text-sm font-medium` | Banner headline, sheet driver name, sheet status labels |
| Body large | 16px | 400 | 1.5 | `text-base` | Sheet ETA / primary status text |
| Heading | 20px | 600 | 1.2 | `text-xl font-semibold` | Sheet heading (driver name or "On the way") |

**Weights used in Phase 112:** exactly **2** — `font-medium` (500) + `font-semibold` (600). Body default (400) inherited from root.

**Typography rules:**
- **Burmese companion** below every new English string in banner and sheet headings — mirrors `CutoffModal.tsx:45,54,61` pattern. Marked with `{/* BURMESE-REVIEW */}`.
- **Burmese strings** MUST wrap in `className="font-burmese"` or inherit via parent.
- **No decorative typography** — no gradient text, no hero-style treatments in Phase 112 surfaces.
- **Mute button has NO text label** — icon-only with `aria-label`. Touch target established by padding, not by text width.

---

## Color

Phase 112 is a **status communication + ambient state** phase (reconnecting warning, muted state indicator, map-primary aesthetic). The 60/30/10 split applies to the tracking page as a whole; Phase 112's role is to layer a calm warning banner and an icon toggle on top of the existing `bg-cream` page without introducing new hues.

### 60/30/10 Split

| Role | % | Token | Used for |
|------|---|-------|----------|
| **Dominant (60%)** | 60 | `bg-cream` (page background) + map tiles | Page surface, map fill |
| **Secondary (30%)** | 30 | `bg-card` / `bg-surface-primary` | Sheet surface, header surface |
| **Accent (10%)** | 10 | `text-primary` / `bg-primary` (Morning Star red) | CTAs only (e.g., sheet primary buttons if any) — **NOT used on banner, mute icon, or status controls** |

**Accent reserved for:** Primary CTA buttons inside the sheet content (if Phase 112 surfaces one — sheet body is largely inherited from current driver card, not this phase's scope). **NEVER** used on reconnecting banner, mute icon, drag handle, or as a focus state outside the existing focus ring.

### Semantic Status Colors (Phase 112 Working Layer)

Phase 112 surfaces communicate two distinct meanings. **No new semantic colors.**

| Meaning | Token group | Classes | Used by |
|---------|-------------|---------|---------|
| **Warning** (reconnecting, temporary degradation) | `status-warning` | `bg-status-warning-bg`, `border-status-warning/20`, `text-status-warning` | ReconnectingBanner |
| **Muted-state indicator** (audio off) | `text-text-muted` (neutral, not warning) | `text-text-muted` | MuteToggle when `isMuted === true` (VolumeX icon) |

**Why mute uses `text-text-muted` not `status-warning`:** Muting is user preference, not an error. Warning palette would feel accusatory. A simple muted/unmuted visual swap (VolumeX vs Volume2) with subtle color differentiation respects the user's choice without shouting.

### Reconnecting Banner Color Matrix (TRAK-02)

| Element | State: reconnecting (debounce elapsed, still disconnected) |
|---------|-------------------------------------------------------------|
| Outer bg | `bg-status-warning-bg` |
| Outer border | `border-status-warning/20` (alias added this phase) |
| Icon container bg | `bg-status-warning/10` |
| Icon color | `text-status-warning` |
| Headline text | `text-status-warning` |
| Subtitle text | `text-text-muted` |
| Shadow | `shadow-sm` (subtle lift, since banner floats above map) |

**Icon choice:** `WifiOff` from lucide-react. Size: `w-4 h-4`, wrapped in `p-1.5 rounded-lg` container (mirrors Phase 111 CheckoutErrorBanner direction-mismatch icon). `AlertCircle` and `Radio` evaluated and rejected: `WifiOff` is literal and calm, `AlertCircle` feels alarming, `Radio` is ambiguous.

### Mute Toggle Color Matrix (CFIX-10)

| State | Icon | Icon color | Container bg | `aria-pressed` |
|-------|------|------------|--------------|----------------|
| Unmuted (default) | `Volume2` | `text-text-primary` | transparent (ghost button) | `false` |
| Muted | `VolumeX` | `text-text-muted` | transparent (ghost button) | `true` |
| Hover (both states) | — | — | `hover:bg-surface-secondary` | — |
| Focus (both states) | — | — | inherits existing `ring-2 ring-ring ring-offset-2` | — |

**Rationale:** Ghost button style matches adjacent `ShareButton` and `RefreshCw` in the header. Icon-only with color variation is sufficient signal; no badge, no dot, no background chip.

### Destructive

Phase 112 has **no destructive actions**. No "Delete", no "Clear", no "Cancel". Destructive palette (`text-destructive`) is not used.

### Focus Indicators

All interactive elements in Phase 112 MUST inherit the existing focus ring style (`ring-2 ring-ring ring-offset-2` via shadcn button primitives). **Do not override.** The mute button inherits its focus ring from the shared `<button>` pattern used by ShareButton and RefreshCw.

---

## Copywriting Contract

Phase 112 introduces 4 user-visible strings. **Every English string gets a Burmese companion** (existing precedent, CONTEXT D-20). Burmese strings are marked `// BURMESE-REVIEW` for native-speaker sign-off before ship.

### TRAK-02 — Reconnecting Banner

| Element | Copy | Locale | Notes |
|---------|------|--------|-------|
| Headline | `Reconnecting...` | en | Calm, action-oriented; matches existing "Live" indicator vocabulary |
| Headline (Burmese) | `ပြန်လည်ချိတ်ဆက်နေသည်...` | my | BURMESE-REVIEW |
| Subtitle (optional) | `We're updating your driver's location` | en | Conversational, reassuring, "we" not "system" |
| Subtitle (Burmese) | `သင့်ယာဉ်မောင်းရဲ့တည်နေရာ ပြန်လည်ပေးပို့နေပါသည်` | my | BURMESE-REVIEW |

**Tone rules:**
- **Never use** "Error", "Failed", "Disconnected", "Lost connection", "Connection lost", "Timeout", "WebSocket"
- **Never use** exclamation marks (reserved for celebration — "Delivered!")
- **Never announce** with sound, vibration, or modal takeover — banner only
- **Auto-dismiss** on reconnect; no user dismissal affordance

**Dismissibility:** Banner is **not** user-dismissable. Auto-dismisses when `isConnected === true` (via `AnimatePresence` exit). If user mutes the page, banner still shows visually (banner is not audio-gated).

**Debounce behavior:**
- Disconnection detected → start 2s timer
- Timer elapses AND still disconnected → show banner
- Reconnect during timer → clear timer, banner never shows
- Reconnect while banner showing → exit animation, banner unmounts

### CFIX-10 — Mute Toggle

| Element | Copy | Locale | Notes |
|---------|------|--------|-------|
| `aria-label` (unmuted) | `Mute notifications` | en | Explicit verb + noun for screen reader |
| `aria-label` (muted) | `Unmute notifications` | en | Explicit verb + noun for screen reader |
| Visible text | *(none)* | — | Icon-only button |
| Post-click toast | *(none)* | — | Icon swap is sufficient feedback |

**Accessibility:**
- `aria-label` updates with state (above table)
- `aria-pressed={isMuted}` — conveys toggle state to assistive tech
- `title={isMuted ? "Unmute notifications" : "Mute notifications"}` — visible tooltip on hover
- 44px minimum touch target

### TRAK-01 — Bottom Sheet (Drawer wrapper)

Sheet contents are largely **inherited** from the existing `TrackingPageClient.tsx` info pane — driver card, status stepper, ETA, share button row. Phase 112 does NOT rewrite sheet body content; it wraps the existing info pane in `<Drawer>`.

**New strings introduced by the sheet wrapper:**

| Element | Copy | Locale | Notes |
|---------|------|--------|-------|
| Sheet drag handle `aria-label` | `Drag to expand or collapse tracking details` | en | Inherited from Drawer.tsx if already declared; else add |
| Sheet peek state visible row | *(inherits existing driver name + ETA from info pane)* | — | No new copy |

**Tone rules:** Inherits the existing tracking page tone — warm, conversational, Burmese-family-business undertone ("Your driver", "Your delicious meal").

### Forbidden Copy (Phase 112 must NOT ship)

| Forbidden | Why | Use instead |
|-----------|-----|-------------|
| `Connection lost` | Alarming | `Reconnecting...` |
| `Error: WebSocket disconnected` | Technical jargon | `Reconnecting...` |
| `Reconnecting... (attempt 3)` | Exposes internal state | `Reconnecting...` (no count) |
| `Failed to connect` | Failure framing | `Reconnecting...` |
| `Sound off` / `Sound on` | Ambiguous (playback? volume?) | `Mute notifications` / `Unmute notifications` |
| `Audio muted` banner | Mute is silent — no banner | *(nothing — icon swap only)* |
| `Tap to reconnect` | Reconnect is automatic | *(nothing — no manual control)* |

### Destructive Confirmations

**None.** Phase 112 has no destructive flows.

---

## State Matrix

Phase 112 surfaces by state. Executor MUST render all of these.

### Reconnecting Banner (`ReconnectingBanner` — new)

| State | Trigger | Visual |
|-------|---------|--------|
| **Hidden (connected)** | `isConnected === true` | Not rendered |
| **Hidden (debouncing)** | `isConnected === false` for < 2s | Not rendered (2s debounce timer active) |
| **Shown (reconnecting)** | `isConnected === false` for ≥ 2s | Banner mounts via `<AnimatePresence>` with enter spring (y -50→0, opacity 0→1) |
| **Exiting (reconnected)** | `isConnected` flips true while banner shown | Exit via `duration: 0.15s easeIn` (Drawer pattern) |
| **Persistent (extended outage)** | Stays disconnected for 30s+ | Banner remains visible with same copy — no escalation to error state (infinite retries per CONTEXT D-11) |

### Mute Toggle (`MuteToggle` — new)

| State | Trigger | Visual |
|-------|---------|--------|
| **Unmuted (default)** | `isMuted === false`, `isHydrated === true` | `<Volume2>` icon, `aria-pressed="false"`, label "Mute notifications" |
| **Muted** | `isMuted === true`, `isHydrated === true` | `<VolumeX>` icon, `aria-pressed="true"`, label "Unmute notifications", icon color `text-text-muted` |
| **Hydrating (SSR)** | `isHydrated === false` | Render `<Volume2>` (default unmuted) to prevent hydration mismatch — real value loads post-mount |
| **Hover** | Mouse over | `bg-surface-secondary` background |
| **Focus** | Keyboard focus | Focus ring inherits shadcn button primitive |
| **Active (click)** | Mousedown | Optional scale pulse `spring.snappy` (planner discretion — acceptable to omit) |

### Bottom Sheet (`Drawer` wrapper on TrackingPageClient)

| State | Trigger | Visual |
|-------|---------|--------|
| **Collapsed (peek)** | Initial mount on mobile, or user swipes down | Sheet at peek height (`120px`), drag handle visible, driver name + ETA row visible at top, map fills rest of viewport |
| **Expanded (full)** | User swipes up or taps drag handle region | Sheet at `95svh`, full driver card + status stepper + ETA visible, map peek above sheet |
| **Dragging** | User active touch drag | Sheet follows finger, backdrop opacity interpolates, `willChange: transform` active |
| **Swipe-to-dismiss (collapse)** | User drags past 150px threshold | Sheet animates to peek state via spring (NOT full dismiss — tracking sheet cannot fully close on mobile) |
| **Desktop (`lg:` and up)** | Viewport ≥ `lg` breakpoint | Sheet wrapper is `lg:hidden`; desktop renders existing `lg:grid-cols-2` layout unchanged |
| **Reduced motion** | `prefers-reduced-motion: reduce` | Instant snap between peek and full, no drag animation, backdrop fades via `duration-0` |

**Sheet cannot fully dismiss on mobile.** Unlike a modal, the tracking sheet always stays mounted in at least peek state while the tracking page is active — user never sees the tracking page without tracking info. Swipe-down past threshold snaps to peek, not to hidden.

### Visibility Pause (TRAK-03, plumbing — no visible state change)

| State | Trigger | Effect |
|-------|---------|--------|
| **Tab hidden** | `document.visibilityState === "hidden"` | `removeChannel(tracking)`, `removeChannel(location)`, `stopPolling()`, `clearTimeout(reconnectTimeout)` |
| **Tab visible (resume)** | `document.visibilityState === "visible"` | `fetchTrackingData()` (immediate refresh), `setupSubscriptions()`, `setupLocationSubscription()` |

No user-visible banner, no toast, no indicator when the page pauses/resumes. The user's perception is "I came back and it's still up-to-date."

### Exponential Backoff (TRAK-04, plumbing — no visible state change)

| Attempt | Delay | Visible? |
|---------|-------|----------|
| 1 | 1s | No |
| 2 | 2s | No |
| 3 | 4s | Banner MAY appear (2s debounce elapsed) |
| 4 | 8s | Banner visible |
| 5 | 16s | Banner visible |
| 6+ | 30s (capped) | Banner visible |

Banner visibility is driven by the 2s debounce, not by the attempt counter. Executor must not expose attempt number in the UI.

---

## Animation / Motion Contract

Phase 112 introduces **zero new keyframes, zero new springs, zero new durations.** All motion composes from Phase 110/111 tokens.

| Surface | Motion | Token | Source |
|---------|--------|-------|--------|
| Sheet open (peek → full) | Spring `damping: 30, stiffness: 300` | `overlayMotion.sheetOpen` | `Drawer.tsx:52` — already implemented |
| Sheet exit (full → peek, or unmount) | `duration: 0.15s easeIn` — **MUST NOT BECOME SPRING** | Drawer.tsx existing | Mobile Safari GPU crash protection, commit `4087d3bf` |
| Sheet backdrop | Opacity fade `duration: 0.2s easeOut` | `overlayMotion.backdrop` | Drawer.tsx existing |
| Sheet drag handle visual | Scale + darken on drag | Inherited | Drawer.tsx existing |
| Banner enter | `initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}` | Spring `stiffness: 300, damping: 25` | Mirrors `NearbyBanner.tsx:81-86` |
| Banner exit | `duration: 0.15s easeIn` | Matches Drawer exit pattern | Same |
| Mute icon swap | Instant (or optional scale pulse `spring.snappy`) | `spring.snappy` (600/35/1) if pulse used | `src/lib/motion-tokens` |
| Visibility pause/resume | **Zero motion** | — | Plumbing is invisible |
| Backoff retry | **Zero motion** | — | Retries are silent (banner handles visible state) |

**Reduced motion:** Every `m.div` transition MUST pass through `useAnimationPreference().getSpring(spring.X)`. When `prefers-reduced-motion: reduce` is set, `getSpring()` returns `{ duration: 0 }`. Executor MUST verify:
1. `ReconnectingBanner` wraps transition in `getSpring()`
2. `MuteToggle` pulse (if implemented) wraps in `getSpring()`
3. `Drawer.tsx` already honors reduced motion — nothing to add there

**Forbidden:**
- New `@keyframes` declarations
- Raw `spring.default` / `spring.snappy` imports (must go through `getSpring()`)
- GSAP timelines — Framer Motion `<m.div>` only
- Delay chains > 200ms (banner must appear at 2s debounce + immediately after)
- Bouncy overshoot (`spring.bouncy`) — not appropriate for status surfaces
- **Touching `Drawer.tsx` exit animation** — NEVER change `duration: 0.15s easeIn` to a spring (mobile Safari GPU crash, commit `4087d3bf`)

---

## Component Inventory

### Components to CREATE

| Component | Path | Purpose | Est. LOC |
|-----------|------|---------|----------|
| `ReconnectingBanner` | `src/components/ui/orders/tracking/ReconnectingBanner.tsx` | Fixed-top warning banner with 2s debounce, aria-live polite, reduced-motion gate | ~80 |
| `MuteToggle` | `src/components/ui/orders/tracking/MuteToggle.tsx` | Icon button with aria-pressed, lucide Volume2/VolumeX, SSR-safe hydration | ~50 |
| `useMutePreference` | `src/lib/hooks/useMutePreference.ts` | localStorage-backed mute hook, `isHydrated` flag for SSR, `trackingAudioMuted` key | ~40 |
| `backoff` util | `src/lib/utils/backoff.ts` | Shared exponential backoff (`Math.min(1000 * 2 ** i, 30000)`) — extracted from query-provider | ~20 |

### Components to EXTEND

| Component | Path | Change |
|-----------|------|--------|
| `TrackingPageClient` | `src/components/ui/orders/tracking/TrackingPageClient.tsx` | Wrap mobile layout in `<Drawer>` (via `lg:hidden` conditional), mount `<ReconnectingBanner>` below sticky header, mount `<MuteToggle>` between `<ShareButton>` and `<RefreshCw>` in header, gate `new Audio()` call with `!isMuted && !document.hidden` |
| `useTrackingSubscription` | `src/lib/hooks/useTrackingSubscription.ts` | Import `backoff` util, replace inline `RECONNECT_DELAY`, add `visibilitychange` listener with `useEffectEvent` (React 19), `removeChannel` BOTH channels on hidden, `clearInterval` + `clearTimeout` on hidden, re-subscribe on visible, emit `isReconnecting` state for banner |
| `query-provider` | `src/lib/providers/query-provider.tsx` | Import from new `lib/utils/backoff.ts` instead of inline formula (zero behavior change) |

### Components to CONSUME (no change)

| Component | Path | Usage |
|-----------|------|-------|
| `Drawer` | `src/components/ui/Drawer.tsx` | Bottom sheet wrapper — battle-tested, mobile Safari GPU hardened |
| `useAnimationPreference` | `src/lib/hooks/useAnimationPreference.ts` | `getSpring()` gate for banner + optional mute pulse |
| `useBodyScrollLock` | Existing | Drawer handles this internally — do not invoke directly |
| `Button` / button primitives | shadcn | Mute toggle wrapper (ghost variant) |
| `m` from `framer-motion` | framer-motion | Banner enter/exit `<m.div>` |
| `Volume2`, `VolumeX`, `WifiOff` | `lucide-react` | Icons (all pre-installed) |

### Components NOT TOUCHED

- `LazyDeliveryMap` — map internals are OUT of scope (CONTEXT D-43)
- `StatusStepper` — status step visuals unchanged; reduced-motion fix deferred to Phase 113 A11Y
- `ShareButton` — unchanged, mute toggle mounts adjacent
- All driver, admin, and public route components — Phase 112 is customer tracking only
- `useSoundPreference` — mute uses NEW `useMutePreference` (tracking-specific key) so existing sound preferences are not disturbed

---

## Accessibility Contract

Phase 112 MUST NOT regress any a11y surface. Explicit checks:

### Keyboard

- **Mute toggle** reachable via tab order between `ShareButton` and `RefreshCw` in header
- **Enter / Space** triggers toggle
- **Sheet drag handle** reachable via tab when sheet is focused; Enter/Space expands/collapses (Drawer.tsx primitive handles this)
- **Sheet content** traps focus when expanded; Escape collapses to peek (Drawer.tsx primitive handles this)
- **Banner** is non-interactive — not in tab order

### Screen Reader

- Banner wrapped in `role="status" aria-live="polite"` (NOT `assertive` — don't interrupt for reconnect)
- Banner icon is `aria-hidden="true"` (decorative)
- Mute button `aria-label` updates with state: "Mute notifications" / "Unmute notifications"
- Mute button `aria-pressed={isMuted}` — conveys toggle state
- Sheet announcements: Drawer.tsx primitive already provides `role="dialog"` / `aria-modal="true"` when expanded — inherit, do not re-implement

### Touch targets

- Mute button: **44px minimum** (`h-11 w-11` or equivalent padding around 24px icon)
- Sheet drag handle: 44px tall hit area (even if visual handle is 6px — Drawer.tsx already handles)
- Banner is non-interactive — no touch target requirement

### Color contrast

- Banner `text-status-warning` on `bg-status-warning-bg`: already passes WCAG AA (Phase 110 verified)
- Mute icon `text-text-muted` on `bg-cream`: already passes WCAG AA (existing token pair)
- **Do not introduce new hex values** that could fail contrast

### Motion

- All animations gated by `useAnimationPreference().shouldAnimate`
- Banner appears instantly (no slide/scale) when reduced motion is preferred
- Sheet drag follows Drawer.tsx reduced-motion handling (instant snap)
- Mute icon swap is instant in both motion modes (pulse, if any, is motion-gated)

### Hydration

- `useMutePreference` returns `{ isMuted: false, isHydrated: false }` during SSR
- Post-mount `useEffect` reads localStorage, flips `isHydrated: true`
- `MuteToggle` renders `Volume2` (default unmuted) during `isHydrated: false` — prevents hydration mismatch
- Prop-drilling or context is acceptable; avoid making the hook a context provider unless multiple consumers emerge

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official (new-york) | None added in Phase 112 — Button, Drawer (custom V8 wrapper around Radix primitives) already present | not required |
| Third-party registries | **none** | not applicable |

**Phase 112 adds zero new registry components.** `Drawer.tsx` is a pre-existing V8 custom component built on Radix Dialog. `ReconnectingBanner` and `MuteToggle` are net-new local components authored in this phase.

**Vaul rejected.** Evaluated in research §1 and §9 D-1. Rejected because: (a) +12KB gzipped, (b) new dependency, (c) would reintroduce mobile Safari GPU crash risk that Drawer.tsx already mitigates per commit `4087d3bf`, (d) Drawer.tsx already provides every feature vaul offers (swipe, focus trap, scroll lock, reduced motion).

---

## Open Questions & Assumptions

### Already resolved in CONTEXT.md (no action for executor)

- Bottom sheet primitive (Drawer.tsx) — D-01
- Binary snap (peek ↔ full) — D-02
- Mobile-only scope — D-03
- Drawer exit animation untouchable — D-07
- Backoff extracted to util — D-08/D-09
- Infinite retries — D-11
- `removeChannel` BOTH on hidden — D-12/D-13
- Re-subscribe on visible — D-15
- Banner 2s debounce — D-18
- Banner below header z-30 — D-19 (codebase convention: `z-30` maps to Tailwind semantic `fixed` layer between sticky z-20 and modal-backdrop z-40; `z-25` was a research typo — does not exist in the Tailwind scale)
- Global localStorage mute — D-28
- Mute header placement — D-30
- `aria-pressed` for mute — D-32
- Audio gate mirrors NearbyBanner — D-34/D-36
- Test-first (baseline before refactor) — D-37/D-38
- Inherit RLS (no Realtime filter changes) — D-41

### Deferred to executor judgment (planner may lock)

| Question | Guidance |
|----------|----------|
| Banner icon exact choice (`WifiOff` recommended) | Ship `WifiOff`. If accessibility review flags ambiguity, swap to `AlertCircle`. Do NOT use `Radio` (ambiguous). |
| Mute toggle entry pulse (scale animation) | Planner discretion. Instant swap is acceptable and matches the "don't shout" principle for user preferences. If included, MUST pass through `getSpring()`. |
| Sheet peek height exact value | `120px` recommended (fits header row + status row comfortably). Planner may adjust ±20px based on driver card content measurement. |
| Telemetry (Sentry breadcrumbs on backoff events) | NICE-TO-HAVE — defer if plan is budget-constrained (CONTEXT D-46) |
| Burmese copy for new strings | Ship defaults in this spec. Mark `// BURMESE-REVIEW`. Native review before next prod deploy. |

### Hard no — do NOT ship

- Dark-mode-only treatments (project supports both; no Phase 112 surface is dark-mode exclusive)
- Changes to `Drawer.tsx` exit animation timing or easing (mobile Safari GPU crash, commit `4087d3bf`)
- New `@keyframes`
- `aria-live="assertive"` on banner (rude interruption)
- Mute banner/toast (icon swap only)
- Attempt counter in banner copy
- Vaul library (superseded by Drawer.tsx)
- Map internals modifications (LazyDeliveryMap is untouchable per CONTEXT D-43)
- Any backend / DB / RLS / migration changes (Phase 112 is client-only per CONTEXT D-41/D-42)
- 3-tier snap points (binary only — YAGNI per D-02)
- Desktop layout rewrite (mobile-only scope per D-03)
- New Realtime channel filters (inherit RLS, per D-41)

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS — 4 user-visible strings specified, bilingual pattern preserved, forbidden copy listed, tone rules explicit, no technical jargon
- [ ] Dimension 2 Visuals: PASS — 3 new components + 3 extended components, composes from existing Drawer/banner primitives, no new registry blocks, zero desktop changes
- [ ] Dimension 3 Color: PASS — 1 minor token alias (`border-status-warning`), zero new hex values, 60/30/10 split honored, accent reserved list explicit, mute uses neutral not warning
- [ ] Dimension 4 Typography: PASS — exactly 4 sizes (12/14/16/20), 2 weights (500/600), bilingual Burmese companion rule locked, icon-only buttons have aria-label
- [ ] Dimension 5 Spacing: PASS — Tailwind v4 default scale, 2 arbitrary viewport values (`120px` peek, `95svh` full) both pre-approved per research §15
- [ ] Dimension 6 Registry Safety: PASS — no new registry blocks, no third-party registries, vaul explicitly rejected with rationale

**Approval:** pending (awaiting gsd-ui-checker verification or planner hand-off)

---

## Executor Quick Reference

**If an executor is implementing a Phase 112 task, these are the exact token strings to use:**

```tsx
// Reconnecting banner (fixed top, below sticky header)
<m.div
  role="status"
  aria-live="polite"
  initial={shouldAnimate ? { y: -50, opacity: 0 } : undefined}
  animate={shouldAnimate ? { y: 0, opacity: 1 } : undefined}
  exit={shouldAnimate ? { y: -50, opacity: 0 } : { opacity: 0 }}
  transition={getSpring({ stiffness: 300, damping: 25 })}
  className="fixed top-14 left-0 right-0 z-30 mx-4 rounded-xl border border-status-warning/20 bg-status-warning-bg p-3 shadow-sm"
>
  <div className="flex items-center gap-2">
    <div className="p-1.5 rounded-lg bg-status-warning/10">
      <WifiOff aria-hidden="true" className="w-4 h-4 text-status-warning" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-status-warning">Reconnecting...</p>
      <p className="text-xs text-text-muted">We're updating your driver's location</p>
    </div>
  </div>
</m.div>

// Mute toggle (header, between ShareButton and RefreshCw)
<button
  type="button"
  onClick={toggleMute}
  aria-label={isMuted ? "Unmute notifications" : "Mute notifications"}
  aria-pressed={isMuted}
  title={isMuted ? "Unmute notifications" : "Mute notifications"}
  className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
>
  {isMuted ? (
    <VolumeX className="w-5 h-5 text-text-muted" />
  ) : (
    <Volume2 className="w-5 h-5 text-text-primary" />
  )}
</button>

// Audio gate (in status transition effect)
if (!isMuted && !document.hidden) {
  try {
    const audio = new Audio("/sounds/notification.mp3");
    audio.volume = 0.2;
    void audio.play().catch(() => { /* graceful */ });
  } catch { /* skip */ }
}

// Bottom sheet wrap (mobile only)
<div className="lg:hidden">
  <Drawer
    open={true /* always open on tracking page */}
    onOpenChange={() => { /* no-op — cannot fully close */ }}
    snapPoints={["120px", "95svh"]}
    defaultSnap="120px"
  >
    <DrawerContent>
      {/* existing info pane content */}
    </DrawerContent>
  </Drawer>
</div>
<div className="hidden lg:block">
  {/* existing lg:grid-cols-2 layout UNCHANGED */}
</div>

// Exponential backoff util (src/lib/utils/backoff.ts)
export const RETRY_BACKOFF_BASE_MS = 1000;
export const RETRY_BACKOFF_MAX_MS = 30_000;

export function getBackoffDelay(attempt: number): number {
  return Math.min(RETRY_BACKOFF_BASE_MS * 2 ** attempt, RETRY_BACKOFF_MAX_MS);
}

// Visibility pause handler (useTrackingSubscription.ts)
const onVisibilityChange = useEffectEvent(() => {
  if (document.visibilityState === "hidden") {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    if (locationChannelRef.current) supabase.removeChannel(locationChannelRef.current);
    stopPolling();
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
  } else {
    void fetchTrackingData();
    setupSubscriptions();
    setupLocationSubscription();
  }
});

useEffect(() => {
  document.addEventListener("visibilitychange", onVisibilityChange);
  return () => document.removeEventListener("visibilitychange", onVisibilityChange);
}, []);
```

---

**Phase 112 UI-SPEC complete.**
