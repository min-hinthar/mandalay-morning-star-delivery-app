# Phase 74: Guided Walkthrough & Driver UI Polish - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

New drivers get a guided first-delivery experience and the driver interface reaches customer-side visual quality. Covers: onboarding checklist, test delivery page, mobile touch target fixes, and animation/glassmorphism polish. Does NOT add new driver features or change business logic.

</domain>

<decisions>
## Implementation Decisions

### Onboarding Checklist
- Create a **separate `OnboardingWalkthroughCard`** — do NOT extend `ProfileCompletenessCard` (that card is profile-scoped and auto-hides at 100%)
- Appears only when `deliveriesCount === 0` (new driver, pre-first-delivery)
- 3 milestones: (1) Complete your profile, (2) View today's route, (3) Complete your first delivery
- Card style: match established driver glass shell — `rounded-2xl border-2 shadow-card bg-surface-primary/80 backdrop-blur-sm`
- Progress: same `h-1.5` bar + `X/3` count pattern as `ProfileCompletenessCard`
- Not dismissible — persists until all 3 complete, then 3-second celebration + auto-hide via `localStorage` key `"walkthrough-dismissed"`
- Position: below `ProfileCompletenessCard`, above `EarningsSummaryCard`
- Milestone 1 reads completion state from `ProfileCompletenessCard`; milestones 2-3 tracked independently

### Test Delivery Flow
- Page at `/driver/test-delivery` — fully client-side, zero DB writes
- Mock data: static constants matching `StopData[]` interface, clearly labeled ("Test Customer", "123 Practice Lane")
- All 5 delivery steps included: route overview → start route → stop detail (pending→enroute→arrived→delivered) → photo capture → exception modal
- Reuse existing components: `ActiveRouteView`, `StopDetailView`, `StopDetail`, `DeliveryActions`, `PhotoCapture`, `ExceptionModal`
- `testMode` prop on components that make API calls — intercepts with simulated delay + local state update instead of fetch
- Navigation button: tap shows toast "Navigation not active in test mode" (no real Maps URL)
- Location tracking: disabled in test mode
- Completion: client-side "Practice Complete!" screen with stats summary + "Run Again" button + "Back to Home" button
- Unconditionally re-runnable — all state in `useState`, reset on re-run
- No `router.push` — swap views within page using local state + `AnimatePresence`

### Mobile Touch Targets & Scan Hierarchy
- Token standard already established: `--touch-target-min: 44px`, `--touch-target-driver: 56px`
- Target: 44px minimum all interactive elements, 56px for primary CTAs

**Specific fixes needed (from audit):**
| Component | Issue | Fix |
|---|---|---|
| `StopCard` | No min-h, small badge | `min-h-[72px]`, badge `h-8 w-8`, name `font-medium text-base` |
| `DriverHeader` avatar button | No size enforcement | `min-h-[44px] min-w-[44px]` wrapper |
| `DriverHeader` dropdown items | ~36px total | `min-h-[44px]` on links/buttons |
| `StopDetail` copy address | `h-10 w-10` (40px) | `min-h-[44px] min-w-[44px]` |
| `StopDetail` call button | No min-h | `min-h-[56px]` (primary action) |
| Period toggle buttons (Earnings + History) | `py-1.5`, no min-h | `min-h-[44px]` |
| History `MonthGroup` collapse | No min-h | `min-h-[44px]` |

**Scan hierarchy for stop detail (urgency order):**
1. Current stop status/action — visually dominant (56px+ CTA, high-contrast bg)
2. Stop identity (customer + address) — `text-lg`+, not truncated
3. Time/ETA — secondary, smaller but not muted
4. Supporting info (items, notes, nav) — tertiary, discoverable

### Animation & Visual Polish
- **Animation library:** Framer Motion (`m`, `AnimatePresence`) only. Do NOT introduce GSAP into driver side.
- **Entrance pattern:** `initial/animate` (mount-triggered). Do NOT use `whileInView` — driver pages are shallow-scroll, not long marketing pages.
- **Glassmorphism:** Use established Phase 72 driver glass variant: `bg-surface-primary/80 sm:backdrop-blur-sm rounded-2xl border-2 shadow-card`. Do NOT port 30px `glass-menu-card` — that's customer-scoped. 4px blur is deliberate for mobile-only driver UI.
- **Patterns to apply consistently:**
  - `staggerContainer` + `staggerItem` for all list surfaces (walkthrough steps, stop lists)
  - `spring.ultraBouncy` for badge/celebration entry animations
  - `AnimatedValue` count-up for numeric displays
  - `hover: { y: -4, scale: 1.03 }` lift on tappable cards
- **`animate-shine-sweep`:** Apply selectively to single high-emphasis CTA (e.g., "Start Route"), not every card
- **Token alignment:** Use `shadow-card` (not `shadow-colorful`), `shadow-glow-primary` only for active/in-progress states, `bg-gradient-to-r from-accent-teal/10 to-secondary/10` for card headers

### Claude's Discretion
- Loading skeleton designs for walkthrough card
- Exact mock data content (item names, addresses)
- 3D tilt: do NOT port (touch-only app, explicitly disabled on mobile)
- Exact stagger timing values
- Completion celebration animation details (scale bounce, confetti vs particle burst)

</decisions>

<specifics>
## Specific Ideas

- Walkthrough card mirrors `ProfileCompletenessCard` celebration pattern (3-second animation → auto-hide)
- Test delivery reuses real component tree with `testMode` bypass — not a separate simplified version
- Touch target tokens already exist in `tokens.css` — use them, don't create new ones
- Driver glass shell (`bg-surface-primary/80 sm:backdrop-blur-sm`) is deliberately lighter than customer glass — maintain this distinction

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 74-guided-walkthrough-driver-ui-polish*
*Context gathered: 2026-02-19*
