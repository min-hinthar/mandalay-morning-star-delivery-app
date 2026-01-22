## PRD — Morning Star Weekly Delivery App (V7)

### 1) Product summary

A full-stack meal-delivery subscription app (customer + admin/ops) built in Next.js (App Router) with Supabase (Auth/Postgres/RLS) and Stripe (subscriptions/checkout). V7 is the consolidated “current” version after multiple migrations/renames and token cleanup.

---

### 2) Why this PRD (current blockers + motivation)

**V7 is functionally blocked by UI layering/interaction defects** (header/nav/tooltips not clickable, overlays intercepting clicks, cart modal layers behaving transparent). Root cause patterns include z-index collisions, uncontrolled stacking contexts (blur/transform), and overlay state persisting across route changes. 

This PRD defines a **complete UI/UX rewrite** (layouts, components, contexts/stores, styling) with a **single, enforceable layer system** and an **animation-forward design direction**.

---

### 3) Vision (design direction)

**Over-the-top animated + playful UI** inspired by the “Pepper” template but pushed much further: lively motion everywhere, interactive transitions, and modern food-delivery aesthetics (DoorDash/Uber Eats/Panda Express vibes). Use **GSAP + Framer Motion** deliberately (GSAP for timelines/scroll choreography, Framer for component-level interactions).

Key style constraints:

* **Motion-first experience** (full animation by default; reduced-motion not automatically applied; optional manual toggle is allowed later).
* **Avoid “boring” accordions** → replace with interactive cards, sliders, reveal patterns, tabs, scroll-triggered reveals. 
* Maintain coherence: consistent easings/springs/durations via motion tokens.

---

### 4) Goals

**Primary**

1. **Ship a full UI rewrite** with a clean design system: tokens, components, layouts, and state ownership.
2. **Eliminate layering/clickability failures** by implementing a strict, documented overlay & z-index architecture.
3. **Deliver “native-feeling” motion** without breaking usability/performance.

**Success metrics**

* Header/nav/tooltips are reliably clickable on all routes and breakpoints (no invisible blockers).
* Cart modals/drawers/backdrops always render with correct opacity and stacking.
* No hardcoded z-index numbers in app UI (only tokenized layers).
* Motion system is consistent and reusable (not one-off animation spaghetti). 

---

### 5) Target users & core journeys

**Customer**

* Browse weekly menu → view item → customize → add to cart
* Cart edit → checkout → pay/subscribe → confirmation
* Manage account: orders, schedule, billing portal

**Admin / Ops**

* Menu management (items, categories, sold-out states)
* Order monitoring & operational dashboards
* UI-UX flows improvements

**Driver / Ops**

* Driver UI-UX flows improvements

---

### 6) Scope (what gets rewritten)

**Full rewrite of front-end UI layer**

* App shell layouts (header/nav, mobile nav, footers, page containers)
* Component library (buttons/inputs/cards/modals/drawers/toasts/tooltips)
* Cart UX (drawer/sheet, item rows, swipe interactions)
* Menu browsing UX (categories, search, item detail)
* State management + provider boundaries (contexts/stores)
* Styling system (tokens + Tailwind usage + CSS layering rules)
* Animation system (motion tokens + shared patterns + scroll choreography)

**Backend remains mostly stable**

* Supabase + Stripe flows should keep existing contracts unless a UI change forces a minimal API adjustment. 

---

### 7) Non-goals

* Large schema redesign (unless required to unblock key flows)
* New business features unrelated to core ordering/subscription
* Multi-restaurant marketplace features

---

### 8) Key technical requirements

#### A) Layering & overlay architecture (must-have)

Deliverables:

1. **Layer Map (bottom → top)** used across the app
2. Centralized z-index tokens and enforcement
3. A single, consistent “overlay root/portal strategy” for Radix + custom overlays

**Canonical layer hierarchy (token-driven)**
Use semantic tokens (example values already established in V7 learnings):

* dropdown (10), sticky (20), fixed header (30), modal backdrop (40), modal (50), popover (60), tooltip (70), max/decorative (100). 

Rules:

* All overlays (Radix Dialog/Popover/Tooltip, cart drawer, mobile menu) must use **tokenized z-index** only. 
* Decorative/WebGL/confetti layers must be **pointer-events-none** and live in the top-most token layer to avoid click blocking. 
* Prevent hidden overlays from intercepting clicks (visibility + pointer-events + unmounting via AnimatePresence patterns).

**Known failure modes to explicitly prevent**

* Mobile menu overlay state persisting across route changes → must auto-close on pathname change. 
* Backdrop-blur / transforms creating new stacking contexts that trap z-index. 

#### B) Token + styling system

* Keep the consolidated token approach: single namespace tokens (no V4/V5/V6 prefixes in new code) with legacy aliases only where required. 
* Tailwind should consume tokens via `bg-[var(--...)]`, `shadow-[var(--...)]`, `z-[var(--z-...)]`. 
* Add lint-style enforcement to catch hardcoded hex colors and z-index values (warn-level OK). 

#### C) Motion system

* Standardize on motion tokens (springs/durations/easings) and reuse patterns via `src/lib/animations/*` and micro-interactions library. 
* V7 behavior: full motion by default via the existing animation preference pattern; manual opt-out can exist but is not automatic.

#### D) Radix integration constraints

* Avoid form submissions inside Radix dropdown items (use onSelect handlers / action components). 
* Avoid preventDefault patterns that block Next.js redirects in dropdown actions. 

---

### 9) UX requirements (what “good” looks like)

* Mobile-first: bottom nav patterns, cart as bottom sheet on mobile + side drawer on desktop (responsive animations are standardized). 
* Menu browsing feels fast: category tabs/scrollspy, search, delightful micro-interactions (favorites, add-to-cart feedback).
* Checkout feels guided and minimal (reduce cognitive load; clear states).

---

### 10) QA / Verification

* Add E2E coverage for: header clickability, cart open/close, tooltip/popover visibility, and “overlay does not block background when closed.”
* Visual regression snapshots for main shells + overlays. 

---

### 11) Deliverables

* New design system docs: tokens, z-index/layer map, motion rules
* Rebuilt component library + layout primitives
* Rebuilt customer flows (menu → cart → checkout → confirmation)
* Rebuilt nav + overlay infrastructure (Radix + custom)
* Rebuilt admin + driver flows
* Test suite updates (E2E + visual regression where feasible)

---