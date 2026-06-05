# Open PRs — live registry

> Shared state for cross-session collaborative review. See
> [collaborative-pr-review.md](./collaborative-pr-review.md) for the process.
> Update this in the same change that alters a PR's state.

_Last reconciled: 2026-06-04._

## In flight

Two stacks — review/merge each bottom-up:

- Admin–driver: **#129 → #130 → #131**.
- Customer UX: **#132 → #133** (#132 is off `main`).

| PR                                                                                 | Title                                                                                             | Branch                                      | Base                                        | CI    | Status / outstanding findings                                                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [#129](https://github.com/min-hinthar/mandalay-morning-star-delivery-app/pull/129) | Driver correctness fixes (route-start, stop-promotion, exception-resolve)                         | `claude/driver-correctness-fixes`           | `main`                                      | green | Reviewed. **Med fixed** (`386be7e`): Resolve-dialog validation now announced (`aria-live` + `text-destructive` + `aria-invalid`/error ring), char counter added, visual `<h3>` `aria-hidden` (drops double SR read-out); focused tests added. Remaining Low (mobile dismissal affordance) is an intentional `showCloseButton={false}` tradeoff — left as-is. Merge-safe. |
| [#130](https://github.com/min-hinthar/mandalay-morning-star-delivery-app/pull/130) | Route-complete close-out + simple-mode completion fix                                             | `claude/driver-flow-polish`                 | `claude/driver-correctness-fixes`           | green | **High fixed** (`5890d5e`): simple-mode celebration now gated on confirmed `/complete` via `RouteFinishingCard`; adversarial review caught + fixed a 401/403/404 trap (retry + call-for-help). `h1`→`h2` done. Remaining (non-blocking): ephemeral standard-mode `isCompleted`.                                                                                          |
| [#131](https://github.com/min-hinthar/mandalay-morning-star-delivery-app/pull/131) | Admin Delivery Day hub — single-screen command center + live fleet map                            | `claude/admin-driver-ui-redesign-emz5W`     | `claude/driver-flow-polish`                 | green | Reviewed → **author addressed all 3 review findings** in `2e00c29` (date-scoped live-map query, `<a>`→`<Link>`, motion-pref, honest `role=group` tabs). Remaining Lows (color-only fresh/stale, raw green hex) optional.                                                                                                                                                 |
| [#132](https://github.com/min-hinthar/mandalay-morning-star-delivery-app/pull/132) | Customer world-class signature UX components (foundation) + cross-session PR-review workflow docs | `claude/review-pr129-pr130-workclass-g5n4W` | `main`                                      | green | Open for review. Component **library** (`CutoffCountdown`, `RewardRail`, `StarsBalance`) + countdown util/tests + Storybook; plus `collaborative-pr-review.md` + this registry + CLAUDE.md/README/WORKFLOW wiring. Base of #133.                                                                                                                                         |
| [#133](https://github.com/min-hinthar/mandalay-morning-star-delivery-app/pull/133) | "Locked in" delivery ritual on order confirmation                                                 | `claude/order-cutoff-ritual`                | `claude/review-pr129-pr130-workclass-g5n4W` | green | Wires `CutoffCountdown` (new `forceLocked`) into `OrderConfirmationV8` — the one surface with no countdown. Adversarial review → fixed LA-tz weekday + gated ritual to confirmed (not the `pending` poller phase). Pre-order surfaces left as-is (already covered).                                                                                                      |

> **#132 strategy (decided with maintainer):** treat as a reusable component
> library; wire each piece only where it beats what's already shipped.
> `StarsBalance`/`RewardRail` intentionally **not** wired — the rewards hub
> already has a Stars ring + tier badge, and the cart has `FreeDeliveryProgress`.

## Watching

This session is subscribed to PR activity for **#129, #130, #131, #132, #133**
(`subscribe_pr_activity`) and will react to CI failures / review comments.

## Recently closed

_None yet._
