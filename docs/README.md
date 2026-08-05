# Docs index

> Reconciled **2026-08-05** by a per-file staleness audit — every status below was
> verified against the tree (real files, migrations, tokens), not the docs' own
> status lines. When a doc here disagrees with `.claude/CLAUDE.md`,
> `src/types/database.generated.ts`, or the code, the doc is wrong.

| Category             | Meaning                                                         |
| -------------------- | --------------------------------------------------------------- |
| **Living reference** | Current and verified — trust it.                                |
| **Plan — pending**   | Still the live to-do list.                                      |
| **Plan — completed** | The work shipped; kept as a design record.                      |
| **Historical**       | Dated write-up of past work; read as history.                   |
| **Superseded**       | Actively misleading — carries a stale banner; do not act on it. |

## Living reference

| Doc                                                      | What                                                                               |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [hero-design-language.md](hero-design-language.md)       | **The** design-language standard — mandated reading before any visual/motion work. |
| [collaborative-pr-review.md](collaborative-pr-review.md) | Cross-session PR review, stacking, and merge protocol.                             |
| [open-prs.md](open-prs.md)                               | Live PR registry — reconcile at session start.                                     |
| [loading-hierarchy.md](loading-hierarchy.md)             | Loading-state guidance (shimmer/spinner bounds verified in-tree).                  |
| [loyalty-orphan-backfill.md](loyalty-orphan-backfill.md) | Ops runbook for the idempotent orphaned-reward sweep (`pnpm backfill:loyalty`).    |

## Plans — still pending

| Doc                                                                | Open work                                                                                                                                                                            |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [grocery-delivery-plan.md](grocery-delivery-plan.md)               | Plan-of-record for the grocery aisle (G0–G4); none of it is built. Its reuse-table fee row predates the graduated bands.                                                             |
| [holistic-improvement-plan.md](holistic-improvement-plan.md)       | D1–D3 shipped; still open: D5 refunded-shipping, D7 SW denylist (`/admin` `/driver` `/account`), D9 CSP `unsafe-inline`/`unsafe-eval`, D10 `sendDefaultPii`, legacy font `@import`s. |
| [gate-confirm-on-payment-plan.md](gate-confirm-on-payment-plan.md) | App-level payment gates shipped; the `app_private.enforce_paid_before_fulfillment` DB trigger still needs a Docker session.                                                          |

## Plans — completed (design records)

| Doc                                                                | Note                                                                                                                                                          |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [driver-overhaul-kickoff.md](driver-overhaul-kickoff.md)           | Kickoff prompt consumed — the overhaul merged as PRs #223–#239.                                                                                               |
| [customer-surfaces-after-dark.md](customer-surfaces-after-dark.md) | All five surfaces shipped (#154–#162); guardrails section still useful.                                                                                       |
| [after-dark-levelup-plan.md](after-dark-levelup-plan.md)           | FX kit + auth shipped (#160–#171); gotchas folded into `.claude/CLAUDE.md`.                                                                                   |
| [menu-after-dark-v2-plan.md](menu-after-dark-v2-plan.md)           | Dish sheet, dietary filters, MenuRail shipped (#150–#155).                                                                                                    |
| [rewards-roadmap-plan.md](rewards-roadmap-plan.md)                 | All four phases shipped (ownership gate, tier status, CI drift guard).                                                                                        |
| [V5_MILESTONE_MVP.md](V5_MILESTONE_MVP.md)                         | 12-week launch plan; V6 records it complete.                                                                                                                  |
| [V4_MILESTONE_MVP.md](V4_MILESTONE_MVP.md)                         | Saturday-only-era launch plan; superseded by V5/V6 + multi-day. Checkboxes unchecked but the work shipped.                                                    |
| [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md)                         | Pre-launch checklist; the app is live. `scripts/launch-check.ts` still backs its validation step.                                                             |
| [05-menu.md](05-menu.md)                                           | Taxonomy + modifier groups shipped; its $15/$100 fee copy is obsolete (graduated bands now), seed path is `data/menul.seed.yaml`, live DB is source of truth. |

## Historical records

| Doc                                                                  | What it records                                                                               |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [adversarial-audit-2026-06.md](adversarial-audit-2026-06.md)         | June 2026 full-codebase audit; several "fix-later" items have since shipped (M-3, L-6, L-10). |
| [grocery-launch-review-2026-06.md](grocery-launch-review-2026-06.md) | Grocery-launch review; superseded by grocery-delivery-plan as plan-of-record (its own note).  |
| [V6_GSD_MILESTONE.md](V6_GSD_MILESTONE.md)                           | Multi-day + bilingual + COD completion report. (`delivery_days` is a table now, not JSONB.)   |
| [PERFORMANCE.md](PERFORMANCE.md)                                     | v1.5 performance journey. (Root provider is now domAnimation-only; no Lighthouse CI job.)     |
| [email-discount-row.md](email-discount-row.md)                       | Shipped-change writeup: email Discount row (audit L-10).                                      |
| [on-page-receipt-totals.md](on-page-receipt-totals.md)               | Shipped-change writeup: on-screen Tip/Discount rows.                                          |
| [loyalty-milestone-self-heal.md](loyalty-milestone-self-heal.md)     | Shipped-change writeup: self-healing milestone coupons (PR #188, audit M-3).                  |

## Superseded — do not act on these

Each carries a stale banner. Kept for history; the middle column is where the
truth lives now.

| Doc                                                                | Current authority                                                                       | Worst stale claim                                                            |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [00-context-pack.md](00-context-pack.md)                           | `.claude/CLAUDE.md` business rules + `src/lib/settings/business-rules.ts`               | Saturday-only delivery, flat $15/$100 fee, draft/paid lifecycle.             |
| [04-data-model.md](04-data-model.md)                               | `src/types/database.generated.ts` + `supabase/migrations/00000000000000_baseline.sql`   | Phantom columns/tables — exactly the #231 bug class.                         |
| [06-stripe.md](06-stripe.md)                                       | `src/app/api/checkout/session` + webhook route + `.claude/CLAUDE.md` payment gotchas    | `pending_payment`/`paid` statuses that don't exist; no COD.                  |
| [architecture.md](architecture.md)                                 | The tree itself + `.claude/CLAUDE.md`                                                   | React 18, root-level dirs, `getSession()` middleware.                        |
| [component-guide.md](component-guide.md)                           | [hero-design-language.md](hero-design-language.md) + `src/styles/tokens.css`            | Tailwind-v3 config theming — those classes emit nothing under v4.            |
| [frontend-design-system.md](frontend-design-system.md)             | [hero-design-language.md](hero-design-language.md)                                      | saffron/curry/jade palette — zero such tokens exist.                         |
| [customer-ux-world-class-plan.md](customer-ux-world-class-plan.md) | [hero-design-language.md](hero-design-language.md)                                      | Pre-hero gold/jade palette; tier naming that shipped differently.            |
| [CODEBASE-AUDIT.md](CODEBASE-AUDIT.md)                             | — (its P0s are fixed or deleted)                                                        | "Create `src/middleware.ts`" — session refresh lives in `src/proxy.ts`.      |
| [project_status.md](project_status.md)                             | `README.md` milestones + [open-prs.md](open-prs.md)                                     | "Current Phase: V3 In Progress" (abandoned 2026-01).                         |
| [WORKFLOW.md](WORKFLOW.md)                                         | `.claude/CLAUDE.md` Workflow + [collaborative-pr-review.md](collaborative-pr-review.md) | `feat/`-style branch naming; Edge-Function email architecture.               |
| [DEPLOYMENT.md](DEPLOYMENT.md)                                     | `src/app/api/webhooks/stripe/route.ts` + baseline buckets + `scripts/launch-check.ts`   | Wrong Stripe webhook event list; `menu-images` bucket (real: `menu-photos`). |
