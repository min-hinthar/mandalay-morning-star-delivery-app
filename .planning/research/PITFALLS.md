# Pitfalls Research: v1.9 Launch-Ready MVP

**Domain:** Ops dashboard bulk operations, route assignment, configurable business rules, email reliability, driver simplification, production cutover for Saturday-only meal delivery (20-50 orders, family/friend drivers)
**Researched:** 2026-03-01
**Confidence:** HIGH (codebase audit + official docs + WebSearch verified + project error history)

---

## Critical Pitfalls

### Pitfall 1: Bulk Status Change Without Atomic Transaction

**What goes wrong:**
Operator clicks "Confirm All" on 40 pending orders. The API processes them sequentially with individual `.update()` calls. Order #23 fails (e.g., already cancelled by customer). Orders 1-22 are confirmed, 23-40 are not. UI shows "success" via optimistic update, but 17 orders are still pending. Operator doesn't notice until drivers report missing orders.

**Why it happens:**
The existing `admin/orders/[id]/status/route.ts` handles single-order status changes. The natural approach is to loop over selected orders and call the same endpoint N times from the client. Each call is independent -- no transactional guarantee. The current code also sends emails per status change (`sendStatusEmail`), so 40 bulk confirms trigger 40 email renders + 40 Resend API calls in sequence, creating a ~20-second blocking operation.

Existing code pattern (line 120-127 of `admin/orders/[id]/status/route.ts`):
```typescript
// Single update -- no batch capability
const { error: updateError } = await supabase
  .from("orders")
  .update(updateData)
  .eq("id", orderId);
```

**How to avoid:**
- Create a dedicated `POST /api/admin/orders/bulk-status` endpoint that accepts `{ orderIds: string[], status: OrderStatus }`.
- Use a Supabase RPC function (`bulk_update_order_status`) wrapping the update in a single transaction. If any order fails validation (wrong current status), the entire batch rolls back.
- Return per-order results: `{ succeeded: string[], failed: { id: string, reason: string }[] }`.
- Queue emails asynchronously after the transaction succeeds -- never inside the transaction.
- UI should show partial failure clearly: "38 confirmed, 2 failed (already cancelled)".

**Warning signs:**
- API response time > 3 seconds for bulk operations
- Sentry errors showing "status transition invalid" during bulk operations
- Orders stuck in intermediate states after Saturday morning triage

**Phase to address:** Phase 1 (Saturday Ops Dashboard)

---

### Pitfall 2: Optimistic UI Without Proper Rollback Corrupts Dashboard State

**What goes wrong:**
Operator clicks "Confirm All". UI instantly shows all 40 orders as "confirmed" (optimistic update). API returns partial failure -- 5 orders were already cancelled. The Zustand/React Query cache now shows 5 cancelled orders as "confirmed". Operator assigns these phantom-confirmed orders to routes. Drivers show up at addresses for orders that don't exist.

**Why it happens:**
Optimistic UI is the standard pattern for responsive admin dashboards, but most implementations only handle the happy path. The existing codebase uses this pattern for single-order status changes (toast confirmation in `admin/orders/[id]/status`), but bulk operations multiply the failure surface area. React Query's `onMutate` → `onError` rollback pattern requires storing the exact previous state snapshot, which is error-prone with 40+ items.

**How to avoid:**
- For bulk operations, do NOT use optimistic updates. Instead, use a "pending" intermediate state with a loading spinner overlay on affected rows.
- After the API responds, update all rows atomically based on the response.
- Use React Query's `useMutation` with `onSettled` that triggers a hard refetch (`queryClient.invalidateQueries`) rather than manual cache patching.
- Display a summary toast: "38 orders confirmed. 2 failed -- see details."
- Keep the "pending" visual state (dimmed rows, spinner) until the refetch completes.

**Warning signs:**
- Order counts in the dashboard don't match database counts after bulk operations
- Assigned orders showing wrong status on driver's route view
- "Order not found" errors when drivers try to deliver

**Phase to address:** Phase 1 (Saturday Ops Dashboard)

---

### Pitfall 3: Route Creation Non-Atomic -- Stops Insert Fails, Route Orphaned

**What goes wrong:**
Admin creates a route with 8 orders. Route row inserts successfully, but `route_stops` insert fails (e.g., one order already assigned to another active route). The existing code (line 266-269 of `admin/routes/route.ts`) attempts manual rollback by deleting the route, but if the rollback also fails (network issue, RLS, timeout), an empty route orphan exists in the database.

**Why it happens:**
The current route creation code uses two separate operations (insert route, then insert stops) with manual rollback on failure:
```typescript
// Current pattern -- manual rollback is fragile
const { error: stopsError } = await supabase.from("route_stops").insert(stops);
if (stopsError) {
  await supabase.from("routes").delete().eq("id", newRoute.id);
  return NextResponse.json({ error: "Failed to create route stops" }, { status: 500 });
}
```
This is not transactional. If the delete fails, the route orphan persists.

**How to avoid:**
- Create an RPC function `create_route_with_stops(p_route, p_stops)` that wraps both inserts in a PostgreSQL transaction. If `route_stops` insert fails, the entire transaction rolls back automatically -- no orphaned routes.
- The checkout flow already uses this pattern successfully (`create_order_with_items` RPC, line 171-185 of `checkout/session/route.ts`). Follow the same approach.
- Add a unique constraint or check in the RPC: `SELECT COUNT(*) FROM route_stops WHERE order_id = ANY(p_order_ids) AND routes.status != 'completed'` to prevent double-assignment atomically.

**Warning signs:**
- Routes with 0 stops appearing in the admin dashboard
- "Some orders are already assigned" errors during route creation
- Sentry errors from the manual rollback delete call

**Phase to address:** Phase 2 (Route & Driver Assignment)

---

### Pitfall 4: Configurable Business Rules Cache Causes Stale Cutoff Enforcement

**What goes wrong:**
Operator changes cutoff from Friday 3PM to Friday 5PM at 4:30PM. The `isPastCutoff()` function still uses the old hardcoded `CUTOFF_HOUR` constant (imported from `@/types/delivery`). Customer tries to order at 4:45PM, gets "ordering closed" despite the new 5PM cutoff. Or worse: the API route reads the new setting but the client-side countdown timer still shows the old cutoff, creating a confusing mismatch.

**Why it happens:**
The current cutoff logic imports a compile-time constant:
```typescript
// delivery-dates.ts line 1
import { CUTOFF_HOUR, TIMEZONE, type DeliveryDate } from "@/types/delivery";
```
Moving to a database-driven setting requires every consumer of `CUTOFF_HOUR` to read from `app_settings` instead. With Next.js App Router caching, the server-side read may be cached, and the client-side components won't re-render until the cache is invalidated.

Additionally, Supabase + Next.js has a documented stale data issue: GET requests immediately following PUT/POST operations may return stale data.

**How to avoid:**
- Create a `getBusinessRules()` server function that reads from `app_settings` with `{ cache: 'no-store' }` or a short TTL (5 minutes as planned).
- Use `revalidateTag('business-rules')` in the settings PATCH handler to bust the cache immediately on admin update.
- Client-side countdown timers must fetch the cutoff from the API, not from a hardcoded constant.
- Audit EVERY import of `CUTOFF_HOUR`, `DELIVERY_FEE_CENTS`, `FREE_DELIVERY_THRESHOLD_CENTS` from constants and replace with the dynamic `getBusinessRules()` call.
- The existing `src/lib/utils/order.ts` hardcodes `DELIVERY_FEE_CENTS = 1500` and `FREE_DELIVERY_THRESHOLD_CENTS = 10000` -- both must come from the database.

**Warning signs:**
- Customer successfully orders after cutoff (or gets rejected before cutoff)
- Client countdown timer and server-side validation disagree
- Settings page shows new value, but checkout still uses old value
- "Ordering closed" errors immediately after changing cutoff to a later time

**Phase to address:** Phase 4 (Configurable Business Rules)

---

### Pitfall 5: Email Retry Creates Duplicate Emails to Customer

**What goes wrong:**
Admin clicks "Retry" on a failed email. The original email was actually delivered (Resend returned success, but the webhook status update failed). Customer receives the same "Order Confirmed" email twice. Or: retry is triggered while original send is still being retried by the internal retry loop (3 attempts with exponential backoff), resulting in overlapping sends.

**Why it happens:**
The current `sendEmail()` function (in `lib/email/send.ts`) already has a 3-retry internal loop. The admin retry feature adds a second layer of retry. The idempotency key uses `Date.now()` (line 248, 316 of `admin/orders/[id]/status/route.ts`):
```typescript
idempotencyKey: `status-confirmed-${orderId}-${Date.now()}`,
```
This generates a unique key every time, defeating idempotency. Each retry is treated as a new send by Resend.

**How to avoid:**
- Use a stable idempotency key based on `orderId + emailType + attemptNumber`, not `Date.now()`.
- Before retry, check the `notification_logs` table for the latest status. If status is "delivered" or "opened" (from Resend webhook), don't retry.
- Add a `retry_count` column to `notification_logs`. Cap retries at 3 total (across both automatic and manual retries).
- The admin retry button should be disabled when status is "delivered", "opened", or "clicked".
- Add a confirmation dialog: "This email was sent 2 hours ago. Resend hasn't confirmed delivery yet. Send again?"

**Warning signs:**
- Customers report receiving duplicate emails
- `notification_logs` has multiple "sent" entries for the same `order_id + notification_type`
- Resend dashboard shows higher email count than expected

**Phase to address:** Phase 5 (Email Reliability)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Client-side N sequential API calls for bulk ops | Reuse existing single-order endpoint | 40x network round-trips, no atomicity, 20s blocking | Never for bulk ops -- create dedicated endpoint |
| Hardcoded constants alongside app_settings table | Faster initial migration | Two sources of truth, stale values, missed consumers | Only during migration (< 1 sprint) |
| Manual rollback (delete after insert failure) | No RPC function needed | Orphaned records on rollback failure | Never when RPC is available |
| `Date.now()` in idempotency keys | Unique keys every time | Defeats idempotency entirely | Never for email/payment idempotency |
| Optimistic UI for bulk operations | Instant visual feedback | Complex rollback, phantom state, data corruption | Only for single-item operations at this scale |
| Fire-and-forget email in bulk status change | Non-blocking API response | 40 emails sent without tracking, no retry on partial failure | Acceptable for v1.0 single orders, not for bulk |
| Driver simple mode as CSS-only toggle | Fast to implement | Both modes ship to client, toggle adds conditional complexity everywhere | MVP only -- convert to separate route after validation |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Resend webhooks | Not verifying Svix signatures in production. Current code (line 62-90 of `webhooks/resend/route.ts`) falls back to simple secret header check or skips verification entirely if `RESEND_WEBHOOK_SECRET` is not set. | Install the `svix` package. Use `new Webhook(secret).verify(rawBody, headers)` for cryptographic verification. Verify timestamp to prevent replay attacks (Svix rejects > 5 min old). Raw body is critical -- do not parse then re-stringify. |
| Resend webhooks | Not handling webhook idempotency. Same event delivered multiple times (at-least-once delivery). | Track `svix-id` header in `notification_logs.metadata`. Before processing, check if this `svix-id` was already handled. Skip duplicates. |
| Supabase RPC | Passing complex objects to RPC without matching PostgreSQL function parameter types. | Define function parameters as `jsonb` or custom composite types. Test with actual Supabase client, not raw SQL, since the JS client serializes differently. |
| Supabase `.in()` queries | Passing empty arrays to `.in()` generates invalid SQL (`WHERE id IN ()`). | Guard with `if (ids.length === 0) return [];` or use a placeholder UUID (existing pattern in checkout, line 110-111). |
| Next.js `revalidatePath` | Using default `"page"` type when layout provides data. Already burned by this in v1.8 (driver avatar not syncing). | Always use `revalidatePath(path, "layout")` when layouts contain data-dependent components. See `.claude/ERROR_HISTORY.md` and `.claude/learnings/nextjs.md`. |
| Stripe checkout + Supabase | Creating order before payment confirmed, then failing to clean up on TOCTOU re-validation failure. Current cleanup code (lines 222-227 of `checkout/session/route.ts`) has a broken `.eq()` on order_item_modifiers. | Fix the CQ-01 TOCTOU bug first (Phase 0). Use `.in()` with actual `orderItemIds` array for modifier cleanup, not the broken empty-string comparison. |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| N+1 queries in ops dashboard | Dashboard takes 3+ seconds to load 40 orders. Each order triggers separate query for customer profile, delivery address, route assignment. | Use Supabase joins: `orders.select('*, profiles(*), addresses(*), route_stops(route_id)')`. Single query returns all data. Existing `admin/orders/route.ts` already joins `profiles` and `order_items` but is missing `addresses` and route assignment. | > 30 orders (current scale) |
| Unindexed `delivery_date` filter on routes | Route list page scans full `routes` table when filtering by Saturday date. | Add index: `CREATE INDEX idx_routes_delivery_date ON routes(delivery_date)`. Also add `CREATE INDEX idx_orders_status ON orders(status)` for the ops dashboard status counts. | > 100 routes (a few months of Saturdays) |
| Client-side geographic grouping | Calculating distances between all order addresses client-side using Google Maps Distance Matrix API. 40 orders = 40x40 = 1,600 API calls ($5/1,000 calls = $8 per dashboard load). | Pre-compute lat/lng at address verification time. Store in `addresses` table. Use Haversine formula server-side for simple geographic clustering. No external API needed for "group by neighborhood" at 20-50 orders. | Immediately (cost + rate limits) |
| Countdown timer re-renders | Cutoff countdown updating every second re-renders entire dashboard. | Isolate countdown in its own component with `React.memo`. Use `setInterval` with `useRef` for the timer value. Only re-render the countdown number, not parent. | > 20 components on dashboard |
| Bulk email rendering | 40 order confirmations each render a React Email template to HTML. `render()` is synchronous and CPU-intensive. Serverless function timeout at 10s. | Batch email rendering. Or better: decouple email sending from status change. Status change returns immediately; emails are queued via a separate process (Supabase Edge Function or cron). | > 20 emails in single request |
| Settings read on every request | `sendEmail()` reads `app_settings` for kill switch on every email. In bulk operations, 40 emails = 40 reads of the same row. | Cache the kill switch value in-memory with a 60-second TTL. Or read once at the start of the bulk operation and pass as parameter. | > 10 emails per request |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Bulk status endpoint without rate limiting | Malicious admin (or compromised session) could spam-confirm/cancel all orders in seconds | Apply existing `adminLimiter` to bulk endpoint. Additionally add per-operation limit: max 100 orders per bulk call |
| Route assignment without driver ownership verification | The V4 milestone doc flags SC-03: driver API queries need ownership checks. If missed, one driver could view/modify another driver's route data | All driver-facing endpoints must include `.eq('driver_id', currentDriverId)` in queries. Use `get_my_driver_id()` RLS function consistently |
| Resend webhook without Svix signature verification | Attacker can forge webhook payloads to mark all emails as "delivered" or "bounced", corrupting email status tracking | Install `svix` package. Implement proper HMAC-SHA256 signature verification. The current fallback (simple secret header check) is insufficient for production |
| Configurable business rules with no validation bounds | Admin accidentally sets delivery fee to $15,000 (15000 typed instead of 1500 cents) or cutoff hour to 25 | Add Zod schema validation with reasonable bounds: `cutoff_hour: z.number().min(0).max(23)`, `delivery_fee_cents: z.number().min(0).max(10000)`, etc. Current `updateSettingsSchema` validates structure but not business-logic bounds |
| Admin settings endpoint without audit trail | Business-critical values (cutoff time, delivery fee) changed with no record of who changed what when | Add `settings_audit_log` table or extend `order_audit_log` to track settings changes. Store `{ key, old_value, new_value, changed_by, changed_at }`. The existing `updated_by` column in `app_settings` only tracks the last change, not history |
| Production Supabase shared with staging | Same database for staging and production means test data pollutes real orders, or test operations affect real customers | Use separate Supabase projects for staging and production. Different API keys, different database. Migrate schema, not data |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Bulk operation with no progress indicator | Operator clicks "Confirm All" on 40 orders, nothing happens for 5 seconds, clicks again, now 80 confirmation emails are queued | Show inline progress bar: "Confirming orders... 23/40". Disable the button immediately on click. Show result summary on completion |
| Driver simple mode that hides too much | Non-technical family member can't find the "complete route" button because it's hidden in simple mode | Simple mode should show: customer name, address, phone, "Mark Delivered" button, and "Complete Route" button. Nothing else. Test with actual non-technical family member before launch |
| Driver simple mode toggle resets on refresh | Driver toggles to simple mode, closes browser, reopens -- back to complex mode. Has to ask operator for help every Saturday | Persist simple mode preference in `drivers` table (not localStorage -- different devices). Or better: make simple mode the default for drivers with `is_family: true` flag. Operator sets this once during driver setup |
| Past-cutoff messaging without next available date | Customer visits at 4PM Friday, sees "Ordering closed" with no context about when they can order | Always show: "Ordering closed for this Saturday. Order now for next Saturday, March 8th." Include the specific next date. Current `getDeliveryDate()` already calculates this but it's not surfaced in error modals |
| Route assignment without visual confirmation of address grouping | Operator assigns 8 orders to a route but can't see if they're geographically close. Results in inefficient routes with 30-minute detours | Show a mini-map preview with pins when orders are selected. Even without optimization algorithm, visual clustering helps the operator make better decisions. Use existing Google Maps integration |
| Email failure surfaced only in admin dashboard | Admin doesn't check email dashboard during hectic Saturday morning. Customer never gets order confirmation. Customer calls to ask if order was received | Add a visual indicator on the order row itself: red email icon = failed. Make it impossible to miss. Add to the ops dashboard status counts: "3 emails failed" badge |

---

## "Looks Done But Isn't" Checklist

- [ ] **Bulk status change:** Often missing per-order error handling -- verify individual failures are surfaced, not swallowed
- [ ] **Bulk status change:** Often missing email deduplication -- verify same order doesn't get confirmation email twice (once from individual handler, once from bulk)
- [ ] **Route creation:** Often missing check for orders already assigned to other active routes -- verify `route_stops` uniqueness constraint or pre-check exists
- [ ] **Route creation:** Often missing order status update after assignment -- orders should transition to "preparing" or stay "confirmed", but driver should see them
- [ ] **Configurable settings:** Often missing migration of ALL hardcoded consumers -- verify `DELIVERY_FEE_CENTS` in `src/lib/utils/order.ts`, `CUTOFF_HOUR` in `src/types/delivery.ts`, and `TIME_WINDOWS` are all reading from database
- [ ] **Configurable settings:** Often missing client-side sync -- verify checkout page, cart drawer, and menu page all read cutoff/delivery fee from API, not constants
- [ ] **Email retry:** Often missing idempotency -- verify retried email uses same idempotency key, not a new `Date.now()` key
- [ ] **Email retry:** Often missing status check before retry -- verify "Retry" is disabled when Resend webhook confirmed delivery
- [ ] **Driver simple mode:** Often missing test with actual non-technical user -- verify family member can complete a 5-stop route without any guidance
- [ ] **Driver simple mode:** Often missing persistence -- verify mode preference survives browser close, device switch, and app update
- [ ] **Production cutover:** Often missing separate Supabase project -- verify production uses different API keys, URL, and database from staging
- [ ] **Production cutover:** Often missing Resend domain verification -- verify `delivery.mandalaymorningstar.com` domain is verified in Resend dashboard for production email sending
- [ ] **Production cutover:** Often missing Upstash Redis provisioning -- verify Upstash Redis is provisioned via Vercel Marketplace for production rate limiting
- [ ] **Saturday dry run:** Often missing full lifecycle test -- verify 10 orders through: place -> confirm -> assign route -> driver starts -> deliver -> complete route -> emails received

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Bulk status change partial failure | LOW | Refetch all orders from database. Update UI to match actual state. Retry failed orders individually with error details |
| Orphaned route (stops insert failed) | MEDIUM | Query for routes with 0 stops (`SELECT * FROM routes WHERE id NOT IN (SELECT DISTINCT route_id FROM route_stops)`). Delete orphans. Add periodic cleanup job |
| Stale business rules (cached cutoff) | LOW | Clear Next.js cache: `revalidateTag('business-rules')`. Hard refresh client. Worst case: restart Vercel deployment |
| Duplicate emails sent | LOW | Apologize to customer. No technical recovery needed. Add idempotency to prevent recurrence |
| Driver mode preference lost | LOW | Operator resets driver preference via admin panel. Low severity -- annoying but not data-corrupting |
| Production database corrupted by staging data | HIGH | Restore from Supabase point-in-time recovery. Audit all rows created during contamination window. This is why separate projects are critical |
| Resend webhook forgery (no signature verification) | MEDIUM | Audit `notification_logs` for suspicious patterns. Reset webhook secret. Implement proper Svix verification. Re-sync status from Resend API for affected emails |
| Settings changed to invalid values (no bounds checking) | MEDIUM | Restore from `app_settings` audit log (if implemented) or use the existing restore endpoint (`/api/admin/settings/restore`). Add validation bounds to prevent recurrence |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Bulk status change non-atomic | Phase 1 (Ops Dashboard) | Test: confirm 40 orders where 5 are already cancelled. All 35 should confirm; 5 should report failure. No orders in inconsistent state |
| Optimistic UI corruption | Phase 1 (Ops Dashboard) | Test: trigger a network error during bulk operation. Dashboard should show accurate state after retry, not phantom confirmed orders |
| Route creation non-atomic | Phase 2 (Route Assignment) | Test: create route with order already assigned to another route. Should fail entirely, no orphaned route created |
| N+1 queries on dashboard | Phase 1 (Ops Dashboard) + Phase 7 (Hardening) | Measure: dashboard load with 40 orders should be < 500ms. Check Supabase logs for query count (should be 1-3, not 40+) |
| Stale cutoff from cached settings | Phase 4 (Business Rules) | Test: change cutoff from 3PM to 5PM. Within 60 seconds, checkout page should accept orders between 3-5PM |
| Duplicate emails on retry | Phase 5 (Email Reliability) | Test: retry a "sent" email. Resend dashboard should show only 1 delivery (idempotency key prevents duplicate) |
| Driver simple mode not persisted | Phase 6 (Driver Simplification) | Test: toggle simple mode, close browser, reopen. Mode should persist |
| Resend webhook not verified | Phase 5 (Email Reliability) | Test: send forged webhook payload with wrong signature. Should return 401, not update notification_logs |
| Settings without bounds validation | Phase 4 (Business Rules) | Test: set `cutoff_hour` to 25, `delivery_fee_cents` to -100. Both should be rejected with validation error |
| Production database shared with staging | Phase 7 (Production Hardening) | Verify: production `.env` has different `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from staging |
| Email bulk rendering timeout | Phase 5 (Email Reliability) | Test: bulk confirm 40 orders. API should respond in < 3 seconds. Emails should send asynchronously after response |
| Checkout TOCTOU cleanup bug (CQ-01) | Phase 0 (Critical Bugs) | Test: checkout with item deactivated between validation and Stripe session creation. Order + items + modifiers should be fully cleaned up. Verify `.in()` used, not broken `.eq()` |

---

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation |
|-------|---------------|------------|
| Phase 0 (Critical Bugs) | Fix introduces regression in checkout flow | Run existing 335 unit tests + checkout test suite after every fix. Add new test for each bug fixed |
| Phase 1 (Ops Dashboard) | Dashboard becomes too complex -- operator overwhelmed on Saturday morning | Design for the "Saturday 10AM panic" scenario. Default view should answer "what needs attention NOW?" in < 3 seconds. Progressive disclosure for details |
| Phase 2 (Route Assignment) | Geographic grouping implementation scope creep (auto-optimization, Google Maps integration) | Keep it manual. Show pins on a map, let operator drag-select. No algorithm needed at 20-50 orders. Flag for post-launch if > 100 orders |
| Phase 3 (Customer Gate) | Saturday-only messaging confuses international customers or creates timezone issues | All cutoff logic uses `Asia/Yangon` timezone (TIMEZONE constant). Display times in customer's context: "Order by Friday 3PM Myanmar time" |
| Phase 4 (Business Rules) | Incomplete migration leaves some paths using old constants | Create a lint rule or grep search for all hardcoded values being migrated. Run before closing the phase: `grep -r "CUTOFF_HOUR\|DELIVERY_FEE_CENTS\|FREE_DELIVERY_THRESHOLD" src/` should return 0 results from non-migration files |
| Phase 5 (Email Reliability) | Retry storm from admin repeatedly clicking retry on "pending" emails | Disable retry button for 30 seconds after click. Show "Retrying..." state. Rate-limit the retry endpoint separately |
| Phase 6 (Driver Simplification) | Testing only with technical users, not actual family members | Mandatory user test: hand phone to non-technical family member, ask them to complete 3 mock deliveries. No verbal instructions allowed |
| Phase 7 (Production Hardening) | Production cutover treated as "just deploy" | Full checklist: separate Supabase project, Upstash Redis provisioned, Resend domain verified, Stripe webhook URL updated, DNS configured, Sentry DSN for production, Google Maps API billing enabled, CRON job scheduled, database backup strategy |

---

## Sources

- Codebase audit: `src/app/api/admin/orders/[id]/status/route.ts`, `src/app/api/admin/routes/route.ts`, `src/app/api/admin/settings/route.ts`, `src/app/api/webhooks/resend/route.ts`, `src/lib/email/send.ts`, `src/lib/utils/delivery-dates.ts`, `src/lib/utils/order.ts`
- Project error history: `.claude/ERROR_HISTORY.md` (driver avatar cache, NEXT_REDIRECT handling, storage migration permissions)
- Project learnings: `.claude/learnings/supabase-auth.md` (RLS patterns, metadata staleness), `.claude/learnings/state-management.md` (single mutation owner, debounce)
- [Resend webhook verification docs](https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests) -- Svix signature verification requirements
- [Svix verification guide](https://docs.svix.com/receiving/verifying-payloads/how) -- HMAC-SHA256 verification, replay attack prevention
- [Webhook security best practices](https://dev.to/digital_trubador/webhook-security-best-practices-for-production-2025-2026-384n) -- idempotency, retry storm prevention
- [Supabase query optimization](https://supabase.com/docs/guides/database/query-optimization) -- join performance, indexing strategies
- [Supabase joins and nesting](https://supabase.com/docs/guides/database/joins-and-nesting) -- avoiding N+1 with embedded selects
- [Supabase stale data troubleshooting](https://supabase.com/docs/guides/troubleshooting/nextjs-1314-stale-data-when-changing-rls-or-table-data-85b8oQ) -- Next.js cache + Supabase race conditions
- [Next.js caching guide](https://nextjs.org/docs/app/guides/caching) -- revalidatePath, revalidateTag patterns
- [Vercel production checklist](https://vercel.com/docs/production-checklist) -- DNS, environment variables, monitoring
- [Martin Fowler: Feature Toggles](https://martinfowler.com/articles/feature-toggles.html) -- toggle lifecycle management, testing complexity
- V4 Milestone doc: `V4_MILESTONE_MVP.md` -- Phase structure, acceptance criteria, pre-launch checklist

---
*Pitfalls research for: v1.9 Launch-Ready MVP*
*Researched: 2026-03-01*
