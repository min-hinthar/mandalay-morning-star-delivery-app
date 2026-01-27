# Phase 23: Header & Nav Rebuild - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete rebuild of header and navigation with modern design and playful interactions. Includes desktop header, mobile header, hamburger drawer, cart/account indicators, and command palette search. Theme toggle integration from Phase 21.

</domain>

<decisions>
## Implementation Decisions

### Header Layout
- Hide on scroll down, reappear on scroll up (iOS Safari pattern)
- Velocity-aware animation: fast scroll = instant hide, slow scroll = gradual
- Immediate hide threshold (no delay)
- Glassmorphism blur background (consistent treatment always, no transparency change at top)
- Gradient color shadow + gradient color highlight + border for depth
- Left-aligned compact logo
- Standard height (64-72px)
- Fade + slide animation for show/hide
- Header pins during interaction with overlays (Claude's discretion on specifics)

### Desktop Navigation
- Icon-based with text labels
- Core links only: Menu, Orders, Account
- Multi-layered hover state: icon animation + underline animation + background highlight
- Right side arrangement: Theme, Search, Cart, Account

### Mobile Navigation
- Hamburger menu + drawer (slides from left)
- ~85% width drawer (shows content sliver behind)
- Combined backdrop: dark overlay + glassmorphism blur
- Hamburger icon morphs to X when open
- Staggered link reveal animation
- Large touch targets inside drawer
- Tap outside closes drawer
- Swipe left gesture to close
- User section at top when logged in (name/avatar)
- Social/contact links at bottom of drawer
- Search field inside drawer + icon in header
- Snappy spring animation for drawer
- Safe area handling for notch/Dynamic Island
- Separate cart icon always visible (not badge on hamburger)
- Theme toggle position: Claude's discretion

### Cart/Account Indicators
- Cart: circle badge with number
- Cart add animation: badge bounces AND icon has subtle shake
- Cart click opens existing drawer (keep current behavior)
- Account logged in: avatar image OR initials fallback, plus status dot
- Account dropdown: simple list (Profile, Orders, Sign out)
- Dropdown animation: slide down + scale + fade + gradient shadow/highlight

### Command Palette Search
- Linear-style command palette
- Triggers: icon click + Cmd/Ctrl+K keyboard shortcut
- Icon shows ⌘K hint on hover with gradient shadow/highlight
- Search scope: menu items only
- Results: list with thumbnail images, name, price
- Animation: scale up + fade + slide down (Linear-like feel)
- Keyboard nav: arrow keys + Enter to select
- Empty state: friendly message + popular item suggestions
- Recent searches shown when palette opens empty
- Mobile: same centered modal design scaled down

### Claude's Discretion
- Header pinning behavior during specific overlays
- Theme toggle position in mobile drawer
- Scroll behavior when drawer open (internal scroll vs locked)

</decisions>

<specifics>
## Specific Ideas

- "Linear-like feel" for command palette — clean, fast, keyboard-friendly
- Gradient color shadows and highlights throughout (premium feel)
- Multi-layered hover states combine icon animation + underline + background
- iOS Safari-style hide-on-scroll for header
- Velocity-aware animations (fast actions feel instant, slow feels smooth)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 23-header-nav-rebuild*
*Context gathered: 2026-01-26*
