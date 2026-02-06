# Phase 43: Provider & Route Layout Refactoring - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Scope cart components (CartBar, CartDrawer, FlyToCart) to customer/public routes only, removing ~60KB from admin/driver/auth bundles. Audit other global providers for future scoping opportunities. Does NOT add new capabilities — restructures existing provider tree for performance.

</domain>

<decisions>
## Implementation Decisions

### Cart Scoping Boundary
- Cart components load on Home, Menu, Cart, and Checkout pages only
- Route group determines cart behavior, not user role — admin/driver users get full cart experience on customer pages
- CartBar visible on all four cart-enabled pages (Home + Menu + Cart + Checkout)
- CartBar hidden when cart is empty; appears after first item added
- Header cart icon always visible (badge appears when items > 0)
- CartBar + header icon both trigger CartDrawer
- Route group structure: Claude's discretion (single vs split groups based on codebase)

### Layout Transition Behavior
- Instant switch when navigating between cart-enabled and non-cart routes (no fade animation)
- CartDrawer: close drawer animation completes before route navigation occurs
- Use existing RouteLoading infrastructure (Phase 41) for loading states
- Cart state restoration on return to cart routes: Claude's discretion
- CartBar count and price both animate (counting up/down) on item changes
- CartBar bounce/pop animation on item add, debounced for rapid additions
- Total price also animates with counting animation — cohesive with count

### Checkout & Cart Navigation Guards
- Custom styled modal (not browser native) on both checkout AND cart pages when navigating away with items
- Playful/warm tone: e.g., "Your delicious items are waiting! Ready to checkout?"
- Cart page guard includes positive nudge toward checkout

### Provider Consolidation
- Theme provider: keep global
- Toast/notification provider: keep global
- Service worker registration: keep global
- Auth provider scope: Claude's discretion
- Primary focus: move cart components out of global providers
- Secondary: audit other providers and document scoping opportunities in Deferred Ideas
- React Query scoping: Claude's discretion during audit
- Zustand store scoping: Claude's discretion during audit
- Global providers.tsx file structure: Claude's discretion (single vs split files)
- Provider count target: Claude's discretion

### Deep Link & State Handling
- Cart state persists across browser sessions via localStorage
- No cart expiry — items persist until user clears or completes checkout
- Cart hydration timing: Claude's discretion (immediate vs lazy)
- Cart validation against menu changes: Claude's discretion
- No cart state in URLs — client state only (Zustand/localStorage)
- Tab sync for cart state: Claude's discretion
- Basic UTM parameter support — preserve UTM params through route changes
- Empty /checkout deep link → redirect to /menu with toast message
- /checkout requires authentication; /cart is public
- Auth redirect: /login?redirect=/checkout pattern (URL param)
- After login, redirect back to /checkout with cart intact
- Cross-role navigation: allowed — admin can access customer pages via direct link

</decisions>

<specifics>
## Specific Ideas

- CartBar bounce animation should debounce for rapid item additions (not queue)
- Leave-page modal should feel playful and warm, matching the app's personality ("Your delicious items are waiting!")
- Cart page guard should positively nudge toward checkout, not just warn about leaving
- Admin/driver users who navigate to customer routes get full cart experience — route group is the boundary, not user role

</specifics>

<deferred>
## Deferred Ideas

- **Provider scoping audit results** — Document which other providers (React Query, Zustand, auth) could benefit from route-group scoping in future phases
- **Analytics/UTM deep integration** — Basic UTM preservation in this phase; full analytics tracking is a separate concern
- **Guest checkout flow** — Currently requires login; guest checkout could reduce friction but is a new capability

</deferred>

---

*Phase: 43-provider-route-layout-refactoring*
*Context gathered: 2026-02-05*
