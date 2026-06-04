# Open PRs — live registry

> Shared state for cross-session collaborative review. See
> [collaborative-pr-review.md](./collaborative-pr-review.md) for the process.
> Update this in the same change that alters a PR's state.

_Last reconciled: 2026-06-04._

## In flight

The admin–driver overhaul is a **stack** — review/merge bottom-up
(#129 → #130 → #131). #132 is independent (off `main`).

| PR                                                                                 | Title                                                                                             | Branch                                      | Base                              | CI    | Status / outstanding findings                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [#129](https://github.com/min-hinthar/mandalay-morning-star-delivery-app/pull/129) | Driver correctness fixes (route-start, stop-promotion, exception-resolve)                         | `claude/driver-correctness-fixes`           | `main`                            | green | Reviewed. **Med:** make Resolve-dialog validation visible/announced (`aria-live` + error color). Lows: char counter, mobile dismissal affordance. Merge-safe.                                                                                                                   |
| [#130](https://github.com/min-hinthar/mandalay-morning-star-delivery-app/pull/130) | Route-complete close-out + simple-mode completion fix                                             | `claude/driver-flow-polish`                 | `claude/driver-correctness-fixes` | green | Reviewed. **High (open):** simple-mode shows "Route Complete!" before `/complete` confirms — prefer server-side complete on last-stop, or a "Finishing…" gate. Meds: two `h1`s, ephemeral `isCompleted`.                                                                        |
| [#131](https://github.com/min-hinthar/mandalay-morning-star-delivery-app/pull/131) | Admin Delivery Day hub — single-screen command center + live fleet map                            | `claude/admin-driver-ui-redesign-emz5W`     | `claude/driver-flow-polish`       | green | Reviewed → **author addressed all 3 review findings** in `2e00c29` (date-scoped live-map query, `<a>`→`<Link>`, motion-pref, honest `role=group` tabs). Remaining Lows (color-only fresh/stale, raw green hex) optional.                                                        |
| [#132](https://github.com/min-hinthar/mandalay-morning-star-delivery-app/pull/132) | Customer world-class signature UX components (foundation) + cross-session PR-review workflow docs | `claude/review-pr129-pr130-workclass-g5n4W` | `main`                            | green | Open for review. Presentational components (`CutoffCountdown`, `RewardRail`, `StarsBalance`) + countdown util/tests + Storybook; plus `collaborative-pr-review.md` + this registry + CLAUDE.md/README/WORKFLOW wiring. Component wiring into live surfaces follows per-surface. |

## Watching

This session is subscribed to PR activity for **#129, #130, #131, #132**
(`subscribe_pr_activity`) and will react to CI failures / review comments.

## Recently closed

_None yet._
