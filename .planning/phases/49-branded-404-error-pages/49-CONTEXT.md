# Phase 49: Branded 404 & Error Pages - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace generic error and 404 pages with delightful, food-themed branded pages that guide users back. Covers the root not-found page, per-portal not-found pages (admin, driver), and upgrading the existing RouteError component with food-themed personality. Does NOT add new capabilities (search, suggestions, etc.).

</domain>

<decisions>
## Implementation Decisions

### Mascot design
- Animated food emoji as mascot — no illustrated character, uses existing emoji system
- Different emoji per error type via emoji swaps (e.g., 404 = 🥺, 500 = 🤯, offline = 😴)
- Balanced sizing (80-100px) — prominent but shares visual weight with copy and nav
- Gentle floating/bobbing CSS animation — alive but not distracting

### Page composition
- Animated gradient background (sunset orange → rose → violet) with floating food emojis layered on top
- Floating food emojis are purely decorative — no parallax or interaction, CSS-only
- Navigation via card grid — small cards with icons linking to relevant sections
- 404 pages = full-screen takeover (dramatic, no app shell)
- Route error pages (error.tsx) = within app shell (header/nav remain, less jarring)

### Error messaging tone
- Full food puns — lean into food humor for headlines
- Unique copy per error type (404 = lost dish, 500 = kitchen meltdown, offline = kitchen closed)
- Claude writes all copy during implementation — no pre-approval needed
- No search bar on 404 — card grid navigation is sufficient (search is Phase 55)

### Role-specific variants
- One shared visual design for all portals — same food-themed branding
- Per-portal not-found.tsx files: root, admin, driver — each with relevant navigation cards
- Navigation cards change per portal: customer (Home, Menu, Orders), admin (Dashboard, Orders, Drivers), driver (Dashboard, Routes, History)
- Same copy across portals — only navigation links differ
- RouteError component gets food-themed upgrade — all 14 existing error.tsx files benefit automatically

### Claude's Discretion
- Exact food pun copy for each error type
- Floating emoji selection, count, and animation timing
- Gradient animation speed and direction
- Card grid layout details (2-col, 3-col, responsive breakpoints)
- RouteError upgrade approach — balance food personality with maintaining Phase 48's retry/go-home functionality

</decisions>

<specifics>
## Specific Ideas

- Emoji swaps for error types: sad face for 404, explosion for 500, sleeping for offline
- Background combines animated sunset gradient + floating food emojis (🍜🍛🌶️🍚)
- Cards with emoji icons for navigation (🏠 Home, 🍜 Menu, 📦 Orders, etc.)
- CSS-only animations — carry over Phase 48 constraint (no Framer Motion in error pages)
- "Pepper Aesthetic" brand tokens for all styling (deep red primary, golden yellow secondary)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 49-branded-404-error-pages*
*Context gathered: 2026-02-08*
