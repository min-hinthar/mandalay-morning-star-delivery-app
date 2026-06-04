# Customer UX — World-Class Holistic Plan

Program to elevate the customer experience end-to-end. The through-line is the
two things no competitor can copy: **scheduled multi-day delivery as
anticipation** (not a limitation) and **Burmese cultural identity**. Sequenced
as small, reviewable PRs — one logical change each, verified before merge.

## Design language (the holistic spine)

- **Palette:** brand gold (`--color-primary`), jade `green`, teal `accent-teal`,
  magenta accents — thanaka-cream / teak / jade feel. Reuse, don't invent tokens.
- **Motion:** a few signature springs from `motion-tokens` reused everywhere
  (page, sheet, add-to-cart, reward) so the app feels coherent, not assembled.
  Always honor `useAnimationPreference`.
- **Haptics:** `triggerHaptic` on key moments (add-to-cart, order placed, Star
  earned). Most web apps skip this and feel cheap by comparison.
- **Dual-script:** Myanmar + English on dish names with correct `lang` attrs.
- **Accessibility is polish:** live regions, text equivalents for glyphs,
  reduced-motion paths on every signature animation.

## Shipped — PR: signature components (foundation)

Presentational, story-backed, zero-regression building blocks:

| Component                | Purpose                                                                 |
| ------------------------ | ----------------------------------------------------------------------- |
| `CutoffCountdown`        | "Order by Thu 6pm for Saturday" → calm→urgent→locked ritual             |
| `RewardRail`             | Dual-rail progress: one subtotal powers free-delivery **and** next-Star |
| `StarsBalance`           | Loyalty balance as an animated constellation toward next reward         |
| `lib/utils/countdown.ts` | Pure, tested phase math behind the countdown                            |

## Sequenced backlog

### 1. Discover / Home

- **Personalized hero** — returning customers: one-tap "Reorder last Saturday";
  new visitors: guided "Build your first feast."
- **Community proof** — "32 families in West Covina ordering this week," tied to
  direction-based zones. Honest, local, not vanity.
- **Saturday-arrival home transform** — on delivery day the home becomes a warm
  "Your feast arrives today" hero with live ETA.

### 2. Menu

- **Wire `CutoffCountdown`** into `MenuHeader` using `delivery_days` + per-day
  cutoffs (LA tz via `getZonedDayOfWeek`).
- **Dual-script dish names** + provenance line in `ItemDetailSheet` (region,
  when eaten, heat as chili glyphs, "Auntie's recipe" voice).
- **Heat & dietary glyph filters** — chili level, veg/vegan, contains-shrimp-paste.
- **Feast-builder intelligence** — "Mohinga pairs with…", gentle balance nudge.
- **Romanization-tolerant search** — laphet ↔ lahpet ↔ tea-leaf salad.

### 3. Cart / Checkout

- **Wire `RewardRail`** into the cart, replacing the single `FreeDeliveryProgress`
  rail — needs loyalty balance + next-reward target plumbed into cart state.
- **Time-slot as a calm calendar** with capacity ("Saturday — 3 windows left").
- **Tip trust signal** — "100% goes to your driver" on `TipSelector`.
- **Haptic + celebratory order-placed** moment (reuse `RouteCompleteCard` motion
  language on the customer side).

### 4. Track / Post-order

- **Customer-side live map + warm status** — "Aung is 3 stops away" from existing
  route/stop data (respect driver-location privacy scope).
- **Delivery confirmation moment** — photo proof + one-tap reorder/rate, not a
  dead receipt.
- **Per-dish reheating/leftover tips** in order detail.

### 5. Loyalty & retention

- **Wire `StarsBalance`** into `account` + a post-delivery "＋1 Star" mint
  animation (reuse `FlyToCart` motion).
- **Tier identity** — Star → Moon → Sun naming + badge (`lib/loyalty/tier.ts`).
- **Anniversary surprise** — turn `lib/loyalty/anniversary.ts` into a celebratory
  free-dish / bonus-Stars screen on the first-order anniversary.
- **"Save your Saturday" subscriptions** — opt-in recurring favorite order with
  skip/modify. Predictable revenue + frictionless loyalty.

### 6. Cross-cutting

- **PWA as a real app** — install prompt after first happy order, offline menu
  browse, push for "window closing soon" / "driver nearby."
- **Empty/loading states with personality** — warm Burmese illustration + a path
  forward, never a dead end.

## Wiring notes (why the shipped components aren't yet live)

Each shipped component is presentational by design. Going live needs data
plumbed into the host surface, which is a separate, regression-sensitive PR:

- `CutoffCountdown` ← next cutoff instant per delivery day (`delivery_days`,
  `app_settings`), computed in LA time.
- `RewardRail` ← cart subtotal (present) **plus** loyalty balance + next-reward
  target (not currently in cart state).
- `StarsBalance` ← loyalty read (`lib/loyalty`) on the account route.

Do these one surface at a time, each behind its own verified PR.
