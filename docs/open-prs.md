# Open PRs — live registry

> Shared state for cross-session collaborative review. See
> [collaborative-pr-review.md](./collaborative-pr-review.md) for the process.
> Update this in the same change that alters a PR's state.

_Last reconciled: 2026-06-05._

## In flight

- Admin–driver: **#131** (last of the #129 → #130 → #131 stack; #129 + #130
  merged, so #131 auto-retargeted to `main`).
- Customer UX: **#132 → #133** (#132 is off `main`).

| PR                                                                                 | Title                                                                                             | Branch                                      | Base                                        | CI    | Status / outstanding findings                                                                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [#131](https://github.com/min-hinthar/mandalay-morning-star-delivery-app/pull/131) | Admin Delivery Day hub — single-screen command center + live fleet map                            | `claude/admin-driver-ui-redesign-emz5W`     | `main`                                      | green | Reviewed → **author addressed all 3 review findings** in `2e00c29` (date-scoped live-map query, `<a>`→`<Link>`, motion-pref, honest `role=group` tabs). Retargeted to `main` after #130 merged; briefly closed+reopened. Remaining Lows (color-only fresh/stale, raw green hex) optional. Merge-ready. |
| [#132](https://github.com/min-hinthar/mandalay-morning-star-delivery-app/pull/132) | Customer world-class signature UX components (foundation) + cross-session PR-review workflow docs | `claude/review-pr129-pr130-workclass-g5n4W` | `main`                                      | green | Open for review. Component **library** (`CutoffCountdown`, `RewardRail`, `StarsBalance`) + countdown util/tests + Storybook; plus `collaborative-pr-review.md` + this registry + CLAUDE.md/README/WORKFLOW wiring. Base of #133. Merge-ready.                                                          |
| [#133](https://github.com/min-hinthar/mandalay-morning-star-delivery-app/pull/133) | "Locked in" delivery ritual on order confirmation                                                 | `claude/order-cutoff-ritual`                | `claude/review-pr129-pr130-workclass-g5n4W` | green | Wires `CutoffCountdown` (new `forceLocked`) into `OrderConfirmationV8` — the one surface with no countdown. Adversarial review → fixed LA-tz weekday + gated ritual to confirmed (not the `pending` poller phase). Merge after #132.                                                                   |

> **#132 strategy (decided with maintainer):** treat as a reusable component
> library; wire each piece only where it beats what's already shipped.
> `StarsBalance`/`RewardRail` intentionally **not** wired — the rewards hub
> already has a Stars ring + tier badge, and the cart has `FreeDeliveryProgress`.

## Watching

This session is subscribed to PR activity for **#131, #132, #133**
(`subscribe_pr_activity`) and will react to CI failures / review comments.

## Recently closed

- **#129** — Driver correctness fixes (route-start, stop-promotion,
  exception-resolve). **Merged.** Included the Resolve-dialog a11y fix
  (`386be7e`: announced validation + char counter + de-duped SR heading).
- **#130** — Route-complete close-out + simple-mode completion fix. **Merged.**
