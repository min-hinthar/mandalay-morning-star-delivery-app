# Feature Landscape

**Domain:** Saturday meal delivery — route operations, driver execution, admin mobile UX
**Researched:** 2026-03-14
**Milestone:** v2.1 Route Operations & Admin Mobile
**Confidence:** HIGH (existing codebase fully audited + industry patterns verified)

## Existing Foundation (What's Already Built)

| Component | State | Key Files |
|-----------|-------|-----------|
| Route creation (Leaflet map, greedy clustering) | Working | `RouteBuilderClient.tsx`, `RouteBuilderMap.tsx` |
| Route detail (stats, map, timeline, driver assign) | Working | `RouteDetailClient.tsx`, `StopsList.tsx` |
| Stop status change (admin) | Working | `RouteStopCard.tsx` — PATCH per stop |
| Stop removal + reassignment to other routes | Working | `handleRemoveStop`, `handleReassign` in RouteDetailClient |
| Optimization modal (before/after, Google Directions) | Working | `OptimizationModal.tsx` — POST to `/api/admin/routes/optimize` |
| Add stops modal | Working | `AddStopsModal.tsx` |
| Driver ActiveRouteView (progress bar, start/complete) | Working | `ActiveRouteView.tsx` — start/complete route APIs exist |
| Driver SimpleStopView (photo-gated, one stop at a time) | Working | `SimpleStopView.tsx` — offline sync, photo upload |
| DeliveryActions (arrived/delivered/skipped) | Working | `DeliveryActions.tsx` — offline queue, exception report |
| Stop detail page (`/driver/route/[stopId]`) | Exists | `StopDetailView.tsx`, `StopDetail.tsx` |
| Location tracker | Exists | `LocationTracker.tsx` |
| Exception modal | Exists | `ExceptionModal.tsx` |
| Order detail (header, items, customer, payment, timeline, email) | Working | `OrderDetailClient.tsx` — 2-column `lg:grid-cols-2` layout |
| Driver simple mode toggle | Working | DB-backed `simple_mode` column |
| Offline sync (IndexedDB queue) | Working | `useOfflineSync` hook |
| Route stop status types | Defined | `pending | enroute | arrived | delivered | skipped` |
| DB columns for tracking | Exist | `arrived_at`, `delivered_at`, `delivery_photo_url`, `delivery_notes` on `route_stops` |

## Table Stakes

Features the operator and drivers expect for Saturday route ops. Missing = broken workflow.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Drag-reorder stops (admin)** | Every route planner has it; admin needs manual override after optimization | Medium | `@dnd-kit/sortable` (new dep) | `StopsList` renders sorted by `stop_index`; need DnD wrapper + PATCH to persist new indices. Desktop DnD + mobile move-up/down buttons |
| **Remove stop from route** | Admin drops last-minute cancellations | **Already built** | -- | `handleRemoveStop` in RouteDetailClient works |
| **Add stops to route** | Late orders need assignment | **Already built** | -- | `AddStopsModal` exists and works |
| **Auto-sort by proximity** | Admin clicks "Optimize" and gets distance-sorted order | **Already built** | Google Directions API | `OptimizationModal` with before/after comparison exists |
| **Driver status progression** | Core delivery workflow: pending -> arrived -> delivered | **Already built** | -- | `DeliveryActions.tsx` handles all transitions with offline fallback |
| **Navigate to stop** | Drivers need turn-by-turn directions | **Already built** | -- | `SimpleStopView.openMaps()` deep-links Google Maps |
| **Mark delivered with confirmation** | Prevent accidental taps | **Already built** | -- | `DeliveryConfirmDialog` exists |
| **Photo proof of delivery** | Dispute resolution, accountability | **Already built** | Supabase Storage | `PhotoCapture.tsx` with offline queue |
| **Auth routing fix** | Admin/driver must land on dashboard after login, not homepage | Low | `auth/callback/route.ts` | Role redirect logic exists but has edge cases — needs audit |
| **Order detail: items with modifiers** | Admin needs full order breakdown during Saturday ops | Low | Existing `OrderItemsCard` | Verify modifier rendering; may need to add modifier display |
| **Order detail: delivery address on detail page** | Admin needs address for phone support | **Already built** | -- | `CustomerInfoCard` renders address |
| **Order detail: payment/tip visibility** | Admin needs to know COD vs paid, tip amount | Low | Existing `PaymentInfoCard`, `TotalsCard` | Verify tip_cents renders; add if missing |
| **Manual tracking display (admin)** | Admin sees which stop driver is on + timestamps | Low | Existing `arrived_at`, `delivered_at` columns | Data already collected by driver actions; need admin-facing display in `RouteDetailClient` |

## Differentiators

Features that set the app apart. Not expected at 20-50 order scale, but high value.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **Split route** | Route overloaded; split stops into two routes | Medium | New API: POST `/api/admin/routes/{id}/split` | Admin selects stops -> new route created with those stops + new driver. Re-index remaining stops |
| **Merge routes** | Two light routes combine when driver cancels | Medium | New API: POST `/api/admin/routes/merge` | Select source + target route -> move all stops -> delete empty source. Re-index combined stops |
| **Driver route acceptance** | Driver explicitly accepts assigned route before starting | Low | New `accepted_at` column on `routes` + driver API | Current flow: admin assigns, driver sees route. Add intermediate "Accept Route" step in ActiveRouteView |
| **Driver stop reordering** | Driver knows shortcuts; reorders remaining pending stops | Medium | `@dnd-kit/sortable` in driver UI | Advanced mode only (not simple mode); PATCH stop_index array |
| **Admin mobile UX** | Solo operator runs Saturday kitchen from phone | High | Responsive audit of 20+ admin pages | Most admin pages use `p-8`, `lg:grid-cols-2`, wide tables. Need: stacked cards on mobile, collapsible sections, touch-friendly actions |
| **Delivery notes per stop** | Driver adds context ("left at door", "gave to neighbor") | Low | Existing `delivery_notes` column on `route_stops` | Add text input in StopDetailView or DeliveryActions after marking delivered |
| **Order detail: special instructions prominent** | Cooking/delivery instructions visible during ops | Low | Existing `special_instructions` column | Already in `StopDetail` type; ensure prominent rendering with visual callout |
| **Route progress widget on ops dashboard** | Saturday ops shows route completion at a glance | Low | Existing ops dashboard polling | Add compact route cards: driver name + progress bar + delivered/total |
| **Reassign driver mid-route** | Driver calls in sick mid-delivery; reassign remaining stops | Low | Existing `handleDriverChange` in RouteDetailClient | Already works for planned routes; verify it handles `in_progress` routes safely |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Real-time GPS tracking map** | Out of scope (PROJECT.md), overkill at 20-50 orders, battery drain, WebSocket complexity | Manual status updates (arrived/delivered) + timestamps displayed in admin |
| **Auto-dispatch / auto-assignment** | Solo operator with 2-4 family drivers; manual control preferred and faster | Keep click-to-assign pattern from v1.9 |
| **Cross-route drag-and-drop** | Complex multi-container DnD context; high misfire rate, error-prone | Use existing "Reassign" dropdown to move single stop to another route |
| **Drag-reorder on mobile for admin** | Touch DnD on long scrollable lists causes misfires and frustration | Move-up/move-down buttons on mobile; DnD on desktop only |
| **Complex TSP solver** | Over-engineered for 5-15 stops per route; Google Directions waypoint optimization is sufficient | Keep existing "Optimize" button using Google Directions API |
| **Live ETA updates to customers** | Requires WebSocket + continuous driver location polling | Text-based status updates via email ("Out for delivery", "Delivered") |
| **Driver chat / messaging system** | Family drivers; text/call handles communication fine | Keep "Call for Help" button + direct phone/SMS links |
| **Offline map tiles** | Drivers in urban Southern California; cellular coverage is reliable | Google Maps deep-link handles offline navigation gracefully |
| **Batch photo upload** | One photo per stop is sufficient for proof of delivery | Keep single photo capture per stop |
| **Route scheduling (future dates)** | Saturday-only model; routes are created same-day or day-before | Keep single-date route creation workflow |

## Feature Dependencies

```
Auth routing fix ─────────────────────────────> (independent, no deps)
Order detail completeness ────────────────────> (independent, enhances existing cards)

Manual tracking display ──────────────────────> (independent, render existing DB data)
  └── enhanced by: Order detail completeness

Drag-reorder stops (admin) ───────────────────> (independent, new DnD in StopsList)
  └── requires: @dnd-kit/sortable install

Split route ──────────────────────────────────> Drag-reorder stops (selecting stops for split)
Merge routes ─────────────────────────────────> (independent, but test after split)

Driver route acceptance ──────────────────────> (independent, new column + API)
Driver execution flow audit ──────────────────> Driver route acceptance (accept first)
Driver stop reordering ───────────────────────> Drag-reorder stops (same DnD lib + pattern)

Delivery notes ───────────────────────────────> (independent, text input + existing column)

Admin mobile UX ──────────────────────────────> ALL other features (responsive after final)
```

Build order:
```
Phase 1: Auth fix + Order detail completeness + Delivery notes + Manual tracking display
         (all independent, low risk, immediate ops value)

Phase 2: Drag-reorder stops (admin) + Route split/merge
         (core route editing, needs @dnd-kit)

Phase 3: Driver acceptance + Driver execution flow audit + Driver stop reorder
         (driver-facing changes, builds on Phase 2 DnD)

Phase 4: Admin mobile UX
         (responsive overhaul after all features are finalized)

Phase 5: Driver page audit
         (end-to-end fix of all driver pages, integration testing)
```

## MVP Recommendation

**Prioritize (immediate Saturday ops value):**

1. **Auth routing fix** — Blocks every login; ~30 lines, highest ROI
2. **Order detail completeness** — Add modifiers, tip, special instructions to existing cards; ~150 lines
3. **Manual tracking display** — Show arrived_at/delivered_at in admin route detail; ~80 lines, data exists
4. **Delivery notes** — Text input for driver per-stop notes; ~60 lines, column exists
5. **Drag-reorder stops** — Admin manual override after optimization; ~200 lines + new dep
6. **Driver page audit** — Fix broken/placeholder features end-to-end; ~400 lines

**Defer:**

- **Split/merge routes** — Admin can manually create route + reassign stops (already possible via existing UI). Formal split/merge is convenience, not necessity
- **Driver route acceptance** — Family drivers; operator texts them. Formal acceptance is overhead at 2-4 drivers
- **Driver stop reordering** — Most drivers use simple mode. Optimization handles stop ordering
- **Admin mobile UX** — High effort (~800 lines, 20+ pages). Build after features are stable, not before

## Complexity Assessment

| Feature | Est. Lines | New Dependencies | Risk | Touches |
|---------|-----------|------------------|------|---------|
| Auth routing fix | ~30 | None | Low | auth callback |
| Order detail completeness | ~150 | None | Low | 3-4 existing card components |
| Manual tracking display | ~80 | None | Low | RouteDetailClient, StopsList |
| Delivery notes input | ~60 | None | Low | DeliveryActions or StopDetailView |
| Drag-reorder stops | ~200 | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` | Medium | StopsList, new PATCH endpoint |
| Split route | ~300 | None | Medium | New API + new modal component |
| Merge routes | ~250 | None | Medium | New API + route selection UI |
| Driver acceptance | ~150 | None | Low | New column, ActiveRouteView |
| Driver page audit | ~400 | None | Medium | Multiple driver pages |
| Admin mobile UX | ~800 | None | High | 20+ admin pages, regression risk |

## Sources

- Existing codebase audit — direct file reads of all route, driver, and admin components (HIGH confidence)
- [EZRoutePlanner — Multi-Stop Route Planners 2026](https://www.ezrouteplanner.com/blog/best-free-multi-stop-route-planners)
- [Track-POD — Delivery Driver App workflow](https://www.track-pod.com/delivery-driver-app/)
- [DispatchTrack — 6 Features for Delivery Apps](https://www.dispatchtrack.com/blog/app-delivery-driver/)
- [Appscrip — Workflow of a Delivery App](https://appscrip.com/blog/workflow-of-a-delivery-app-2/)
- [Puck — Top 5 DnD Libraries for React 2026](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react)
- [dnd-kit Sortable Docs](https://docs.dndkit.com/presets/sortable)
- [Pencil & Paper — Dashboard UX Patterns](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards)
- [Upper — Best Apps for Delivery Drivers 2026](https://www.upperinc.com/blog/best-apps-for-delivery-drivers/)

---
*Feature research for: v2.1 Route Operations & Admin Mobile*
*Researched: 2026-03-14*
