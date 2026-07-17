# Grocery aisle — delivery integration plan (G-track)

**Goal:** the #1 online Burmese grocery app in the US that also delivers. This doc is the
delivery-repo half of that plan: how the grocery catalog (owned by the QR repo /
`mms-platform`) becomes a shoppable, deliverable aisle inside this PWA. The market/competitive
research + catalog strategy live in the sibling repo:
`mms-platform/docs/GROCERY_MARKET_PLAN.md`.

## Why this app is the delivery half

This PWA already owns everything an online grocer needs EXCEPT the catalog:

| Asset (already live here)                                                      | Grocery reuse                                                           |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Multi-day delivery (Mon/Wed/Thu/Sat, `delivery_days`, per-day cutoffs)         | Grocery rides the same routes — zero new logistics                      |
| Direction-based routing (East/West/South/All), 50mi/90min coverage from Covina | Same coverage promise for groceries                                     |
| Distance-tiered fees (>25mi flat $20; ≤25mi $15 or free ≥$100)                 | Same fee engine; grocery subtotal counts toward free-delivery threshold |
| Stripe + COD checkout, loyalty Stars/tiers, coupons                            | One basket, one payment, Stars on groceries                             |
| Hero design system, bilingual EN/MY type (Padauk), dietary/allergen filters    | Aisle UI ships on the existing system                                   |
| Driver app, offline-safe stop lifecycle, admin dashboard                       | Grocery orders are just heavier bags                                    |

The QR repo owns the **catalog truth**: `grocery_items` (395 real SKUs as of 2026-07-17 —
bilingual names, brand, 10-aisle taxonomy, pack sizes, EBT/tax flags, romanization search
synonyms, prices pending owner confirmation). See
`mms-platform/supabase/data/grocery_catalog.json`.

## Architecture decision — catalog transport

Two Supabase projects (delivery `ukuzkhuppqwtrdkjqrkv`, QR `fasnpdhtvqtzjlvruqcu`), one Stripe
account. Options:

1. **Seed-sync (recommended for G0/G1).** Export the QR catalog JSON into this repo's `data/`
   (the menu already seeds from YAML — same pattern), migrate a `grocery_items` table into the
   delivery project, and sync via a script (`pnpm seed:grocery`). Pros: no cross-project runtime
   coupling, RLS stays simple, offline/ISR-friendly, CI `db-drift` covers it. Cons: manual sync
   cadence — acceptable while the catalog changes weekly, revisit when inventory counts go live.
2. **Cross-project API read.** Delivery server reads QR's `grocery_items` via PostgREST with a
   scoped key. Pros: one source of truth. Cons: runtime coupling across projects, a second
   failure domain in the money path, RLS/key management. **Defer** until real-time stock levels
   matter (G3+).

Inventory/stock truth stays in the QR project (the store's POS side); the delivery aisle sells
from the synced snapshot with an "availability confirmed at pack time" promise + substitution
flow (G2) — the same model Weee!/Instacart use, and honest about a small store's stock reality.

## Phases

- **G0 — the aisle (browse only).** `/grocery` route group on `PublicShell`: 10 bilingual aisle
  tiles → item grid (Weee!-anatomy cards: photo/placeholder · EN+MY name · brand + pack size ·
  price + $/100g · EBT tag). Search with the QR repo's romanization-synonym model. Purely
  additive; no checkout change. Gate: catalog sync script + `grocery_items` migration +
  `gen:types`.
- **G1 — one basket, one checkout.** Grocery lines join the food cart with a per-line `kind`
  (the QR repo's per-line-fulfillment pattern). Checkout: grocery lines are tax-exempt
  (CA grocery staples) vs taxable non-food — port the category-aware tax rule; fee engine
  unchanged (grocery counts toward the $100 free-delivery bar — a deliberate basket-builder).
  Delivery-day picker copy: "Groceries arrive with your delivery day." COD stays available.
- **G2 — trust: stock + substitutions.** Pack-time availability confirmation in the admin
  packing view; shopper-chosen substitution preference per line (replace with similar / refund
  line / call me); refund-line path already exists (payments hardening #197–#199).
- **G3 — habit: reorder + Stars.** "Buy again" grocery rail from order history; Stars accrue on
  grocery net spend (tiers already count lifetime net); pantry-restock reminders (opt-in, the
  existing notification-prefs surface).
- **G4 — EBT/SNAP (2027, federal-gated).** Forage tender + FNS authorization (likely a separate
  FNS firm for the grocery side — restaurant is >50% of sales). Until then: EBT-eligible
  subtotal shown, undated honest copy (never promise a date).

## Guardrails

- **No fabricated freshness/stock claims** — availability language must match what the sync
  actually knows.
- **Server-authoritative pricing** — the synced catalog is the price source; the client never
  sends amounts (house rule in both repos).
- **Mobile budget** — the aisle grid ships within the existing GPU/memory limits (no new
  backdrop-filter layers; placeholder tiles are gradients, not blurs).
- **Bilingual is not optional** — every aisle tile, card, and empty state carries EN + MY from
  the first commit (Padauk is already loaded).
- One phase = one PR, verified locally (`lint · lint:css · format:check · typecheck · test ·
build`), adversarial self-review before merge, owner's explicit "go" to merge.

## Open items (owner)

1. Confirm current retail prices before any customer-facing grocery launch (the 2022 list is
   the seed; see `mms-platform` C6).
2. Real shelf UPCs + per-SKU photos (shared asset with the QR scan-and-go flow).
3. Decide grocery delivery scope at launch: shelf-stable only (safe) vs +frozen (needs cooler
   bags + route-time limits).
