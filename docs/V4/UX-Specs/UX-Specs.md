# V4 UX Specification — Refinement & Polish

> **Source**: V4 PRD (Clarified) + 35-question clarification session
> **Scope**: Bug fixes, consistency, polish, performance
> **Sprints**: 4 sprints, 28 tasks
> **Quality Target**: 80% → 95%+

---

## Pass 1: Mental Model

**Primary user intent:** "I want to order Burmese food quickly and feel like I'm using a premium, well-crafted app."

**Current mental model gaps (V3):**
- User expects text to always be readable → white-on-white text breaks this
- User expects clicking will work → signout button does nothing
- User expects smooth scrolling → category click jumps page awkwardly
- User expects checkout to progress → steps don't load properly
- User expects visual consistency → two different card styles feel unpolished

**Likely misconceptions after V4:**
- User might expect animation toggle in system settings (it's in localStorage)
- User might expect collapsed header to stay collapsed (it's scroll-direction-aware)
- User might not notice shimmer vs pulse difference (contextual loading states)

**UX principle to reinforce:**
> "Premium software works invisibly. The user should never notice the interface—only accomplish their goal."

V4 removes all friction that makes users notice the interface (bugs) and adds subtle polish that makes the experience feel "expensive" without being noticed explicitly.

---

## Pass 2: Information Architecture

**V4 changes NO information architecture.** All concepts remain from V3.

### Changed Concepts (UX refinement only)

| Concept | V3 State | V4 State |
|---------|----------|----------|
| **Menu Item Card** | Two competing styles (4:3, 16:9) | Single unified style (16:9) |
| **Cart Badge** | Static number | Animated pulse on change |
| **Loading States** | Basic skeleton pulse | Contextual shimmer/pulse |
| **Headers** | Fixed height, inconsistent | Collapsible, scroll-aware |
| **CTAs** | Flat color | Gradient with subtle shimmer |
| **Badges** | Generic shadcn | Semantic variants (featured, allergen, price, status) |

### New Concepts (V4 additions)

| Concept | Classification | Rationale |
|---------|---------------|-----------|
| **Animation Preference** | Hidden (Settings) | Power user feature, not core flow |
| **A/B Test Variants** | Hidden (System) | Users never see this, server-side only |
| **Token Enforcement** | Hidden (Dev tooling) | Prevents future inconsistency |

### Grouped Structure

#### User-Facing (Primary)
- Menu item cards: Primary → unified 16:9 aspect ratio
- Cart interactions: Primary → pulse feedback on all changes
- Checkout flow: Primary → 3 steps with integrated layout
- Navigation headers: Primary → collapsible, scroll-aware

#### System Feedback (Secondary)
- Loading shimmer: Secondary → contextual (initial vs refetch)
- Progress animations: Secondary → elastic spring physics
- Error states: Secondary → same as V3, no changes
- Success states: Secondary → same as V3, no changes

#### Settings & Preferences (Hidden)
- Animation level toggle: Hidden → localStorage, overrides system
- High contrast mode: Hidden → data attribute, driver-focused

---

## Pass 3: Affordances

| Action | V3 Signal | V4 Signal (Improved) |
|--------|-----------|---------------------|
| **Click menu card** | Image + title visible | Image + title + continuous subtle hover lift |
| **Add to cart** | Primary button | Primary button with gradient shimmer (always active) |
| **Scroll categories** | Sticky tabs | Tabs + header collapse on scroll down, expand on scroll up |
| **View cart** | Badge shows count | Badge shows count + pulses on change |
| **Navigate checkout** | Step indicators | Step indicators with integrated CheckoutLayout wrapper |
| **Sign out** | Dropdown menu item | DropdownAction component with loading state |

### Affordance Rules

**If user sees shimmer → they understand content is loading (first time)**
**If user sees pulse → they understand content is refreshing (already seen)**
**If header shrinks → they understand they're scrolling into content**
**If header expands → they understand they're scrolling back to top**
**If badge pulses → they understand cart just changed**
**If CTA shimmers → they understand this is the primary action**

### Breaking Affordances (Bugs Being Fixed)

| Broken Affordance | Fix |
|-------------------|-----|
| Text on hero looked clickable (it wasn't visible) | Dynamic contrast makes text readable |
| Category tab looked like it would scroll smoothly | Intersection Observer provides smooth scroll |
| Signout button looked clickable (it wasn't working) | DropdownAction pattern ensures click works |
| Checkout stepper looked functional (steps didn't load) | CheckoutLayout with 3 steps integrated |

---

## Pass 4: Cognitive Load

### Friction Points (V3 Issues)

| Moment | Type | V3 Problem | V4 Simplification |
|--------|------|------------|-------------------|
| Homepage hero text | Uncertainty | Can't read text on gradient | Dynamic luminance detection |
| Category tab click | Choice + Uncertainty | Jumps page, disorienting | Intersection Observer, smooth scroll |
| Checkout progression | Uncertainty | Steps don't load, blocked | CheckoutLayout wrapper, 3 steps |
| Signing out | Uncertainty | Button doesn't respond | DropdownAction with loading state |
| Recognizing menu items | Choice | Two card styles, inconsistent | Single 16:9 card style |
| Understanding cart state | Uncertainty | No feedback on changes | Pulse animation on any change |
| Waiting for images | Waiting | Generic pulse skeleton | Shimmer (initial) / pulse (refetch) |

### Friction Points (New Decisions)

| Moment | Type | Risk | Mitigation |
|--------|------|------|------------|
| Animation preference | Choice | Where to find it? | Settings page, clear label |
| Header behavior | Uncertainty | Why did header shrink/grow? | Consistent scroll-direction behavior |
| Different loading states | Uncertainty | Why shimmer vs pulse? | Shimmer = new, pulse = refresh (implicit) |

### Defaults Introduced

| Default | Rationale |
|---------|-----------|
| **animation-preference: "full"** | Most users expect premium animations |
| **Header expanded on page load** | Show full navigation context initially |
| **16:9 card aspect** | Cinematic, matches food photography |
| **backdrop-blur-lg (16px)** | Premium glassmorphism feel |
| **Spring stiffness: 400, damping: 25** | Apple-like crisp, responsive feel |

---

## Pass 5: State Design

### Menu Item Card

| State | User Sees | User Understands | User Can Do |
|-------|-----------|------------------|-------------|
| Loading (initial) | Shimmer animation (1.5s loop) | "Content is loading first time" | Wait |
| Loading (refetch) | Subtle pulse (0.5s) | "Content is refreshing" | Wait, see cached data |
| Loaded | 16:9 image, title, price, badges | "This is a menu item" | Tap to view details |
| Hover (desktop) | Lift + shadow increase | "This is interactive" | Click to open |
| Sold out | Grayscale + "Sold Out" overlay | "Can't order this" | View only |

### Cart Badge

| State | User Sees | User Understands | User Can Do |
|-------|-----------|------------------|-------------|
| Empty | No badge | "Cart is empty" | Add items |
| Has items | Badge with count | "X items in cart" | Tap to view cart |
| Item added | Badge + scale pulse | "Just added to cart" | Continue or checkout |
| Item removed | Badge + scale pulse | "Just removed from cart" | Continue or checkout |
| Quantity changed | Badge + scale pulse | "Cart updated" | Continue or checkout |

### Header (Collapsible)

| State | User Sees | User Understands | User Can Do |
|-------|-----------|------------------|-------------|
| Expanded (initial) | Full header with logo, nav, search | "I'm at the top" | Navigate, search |
| Collapsed (scrolling down) | Compact 56px header | "I'm in content" | Continue scrolling |
| Expanding (scrolling up) | Header growing | "I'm going back up" | Access full nav |
| Fully expanded | Full header restored | "I'm near top again" | Navigate, search |

### Primary CTA Button

| State | User Sees | User Understands | User Can Do |
|-------|-----------|------------------|-------------|
| Idle | Gradient with subtle shimmer (3s loop) | "This is the main action" | Click |
| Hover | Brighter shimmer, lift | "Ready to activate" | Click |
| Pressed | Scale down (0.98) | "Activating" | Wait |
| Loading | Spinner, dimmed | "Processing" | Wait |
| Disabled | No shimmer, muted | "Not available" | Nothing |

### Checkout Flow

| State | User Sees | User Understands | User Can Do |
|-------|-----------|------------------|-------------|
| Step 1 (Address) | Address form, step 1/3 highlighted | "Enter delivery address" | Fill form, continue |
| Step 2 (Time) | Time slots, step 2/3 highlighted | "Choose delivery time" | Select slot, continue |
| Step 3 (Payment) | Payment form, step 3/3 highlighted | "Complete payment" | Pay, confirm |
| Loading | Skeleton stepper | "Loading checkout" | Wait |
| Error | Error banner, retry button | "Something went wrong" | Retry |

### DropdownAction (Signout)

| State | User Sees | User Understands | User Can Do |
|-------|-----------|------------------|-------------|
| Idle | Menu item with icon | "Click to sign out" | Click |
| Hover | Highlighted background | "Ready to activate" | Click |
| Loading | Spinner replacing icon | "Signing out..." | Wait |
| Success | Redirect to login | "Signed out" | Log back in |
| Error | Error toast | "Failed to sign out" | Try again |

---

## Pass 6: Flow Integrity

### Flow Risks

| Risk | Where | Mitigation |
|------|-------|------------|
| User doesn't notice cart pulse | Cart badge | Pulse is 0.3s, scale 1.2x — visible but not disruptive |
| User confused by header collapsing | All pages with scroll | Consistent behavior everywhere, fast animation |
| User can't find animation toggle | Settings | Clear label, grouped with accessibility options |
| A/B test causes inconsistent experience | Hero variants | Edge Config ensures consistent experience per user |
| Dark mode regressions | All components | E2E tests cover both modes |
| Performance degrades with animations | All animations | 60fps target, animation toggle for users on slow devices |

### Visibility Decisions

**Must be visible:**
- Cart item count (badge)
- Loading state (shimmer or pulse)
- Active checkout step
- Error messages
- Primary CTA (gradient shimmer draws attention)

**Can be implied:**
- Header collapse trigger (scroll direction)
- Shimmer vs pulse distinction (contextual)
- Animation preference (settings, not main UI)
- Token enforcement (dev tooling only)

### UX Constraints for Visual Phase

1. **No new information architecture** — V4 is refinement only
2. **No new user flows** — same flows, better execution
3. **All animations must respect reduced-motion** — check localStorage + system preference
4. **All colors must use tokens** — no hardcoded hex values
5. **All cards must be 16:9** — no 4:3 aspect ratio
6. **All headers must collapse to 56px** — consistent collapsed state
7. **All CTAs must have gradient shimmer** — continuous subtle animation
8. **All loading states must be contextual** — shimmer (initial) vs pulse (refetch)

---

## Visual Specifications

### Design Tokens (Existing, Enforced)

| Token Category | Usage |
|----------------|-------|
| `--color-*` | All colors, no hex values |
| `--space-*` | All spacing |
| `--radius-*` | All border-radius |
| `--shadow-*` | All shadows |
| `--z-*` | All z-index (expanded with CSS Layers) |
| `--opacity-*` | New: all opacity values |

### Animation Specifications

| Animation | Timing | Easing |
|-----------|--------|--------|
| **Shimmer** | 1.5s infinite | linear (gradient translateX) |
| **Pulse (refetch)** | 0.5s once | ease-out |
| **Cart badge pulse** | 0.3s once | spring (400/25) |
| **Stagger (list)** | 30ms → 80ms variable | spring (400/25) |
| **Progress bar** | dynamic | spring (400/25) |
| **Header collapse** | 200ms | ease-out |
| **CTA shimmer** | 3s infinite | linear (gradient) |

### Component Specifications

#### MenuItemCard (Unified)
- Aspect ratio: 16:9 (`aspect-video`)
- Hover: translateY(-4px), shadow increase
- Badges: featured (gold), allergen (amber), price (green/red), status (semantic)
- Loading: shimmer skeleton

#### CartBadge
- Position: top-right of cart icon
- Size: min-width 20px, height 20px
- Pulse: scale [1, 1.2, 1] over 0.3s on any cart change

#### Collapsible Header
- Expanded height: variable (with search, tabs)
- Collapsed height: 56px (h-14)
- Backdrop: blur-lg (16px)
- Z-index: `--z-sticky` (CSS Layer: components)
- Trigger: scroll direction (down = collapse, up = expand)

#### Primary CTA Button
- Background: gradient from `--color-cta` to `--color-primary`
- Shimmer: translateX gradient, 3s infinite
- Hover: brightness increase, translateY(-2px)
- Active: scale(0.98)

#### DropdownAction
- Props: onClick, loading, disabled, icon, variant
- Loading state: spinner replaces icon
- Consistent with other dropdown items

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| 375px (mobile) | 2-column menu grid, bottom cart bar |
| 768px (tablet) | 3-column menu grid, cart drawer |
| 1024px (desktop) | 4-column menu grid, cart sidebar |
| 1440px (large) | Same as 1024px, wider content |

### Dark Mode Parity

All V4 changes must be tested in both light and dark mode:
- Dynamic luminance detection works in both modes
- Token-based colors automatically adapt
- Animations maintain 60fps in both modes
- No regressions from V3 dark mode

---

## Implementation Prompts

See [UX-Prompts.md](./UX-Prompts.md) for the 28 implementation prompts organized into 4 sprints:
- Sprint 1: Bug Fixes (7 tasks)
- Sprint 2: Consistency (8 tasks)
- Sprint 3: Polish (7 tasks)
- Sprint 4: Performance & Docs (6 tasks)

---

## References

- [V4 PRD](../PRD.md)
- [V4 Clarification Session](../PRD-clarification-session.md)
- [V3 UX-Specs](../../V3/UX-Specs/UX-Specs.md)
- [Design Tokens](../../../src/styles/tokens.css)
