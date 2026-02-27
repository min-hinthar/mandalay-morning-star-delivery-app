# Agent Handoff Report — 2026-02-27

> **Purpose:** This report documents what was audited, what was fixed, what remains, and where future agents should focus. Written so any agent picking up this repo can immediately understand the state of play.

---

## What Was Done

### Full Critical Analysis
- Audited 48+ pages, 100+ API routes, 27 migrations, 496 UI component files
- Examined all three role flows: customer, admin, driver
- Analyzed security (auth, RLS, CORS, headers, rate limiting, secrets)
- Analyzed data integrity (race conditions, transactions, state machines)
- Analyzed UI/UX (accessibility, animations, empty states, error boundaries)
- Analyzed operational readiness for real Saturday deliveries

### Bugs Fixed (This Session)

| ID | Issue | File(s) Changed | What Was Done |
|----|-------|-----------------|---------------|
| **C-01** | Webhook TOCTOU race condition | `src/app/api/webhooks/stripe/route.ts` | Removed SELECT-then-INSERT. Now uses `upsert` with `ignoreDuplicates: true`. Single atomic operation — no race window. |
| **C-02** | Cron endpoint fails open when CRON_SECRET missing | `src/app/api/cron/delivery-reminders/route.ts` | Changed `if (!CRON_SECRET) return true` to `return false` with error log. No more unauthenticated mass email triggers. |
| **C-03** | Admin cancel has no status guard | `src/app/api/admin/orders/[id]/cancel/route.ts` | Added `.neq("status", "delivered").neq("status", "cancelled")` guard + 409 response when race detected. |
| **C-04** | Cart items not re-validated before Stripe session | `src/app/api/checkout/session/route.ts` | Added fresh `menu_items.is_active` check right before Stripe session creation. Cleans up order if items went unavailable. |
| **H-01** | payment_intent stored as null | `src/app/api/webhooks/stripe/route.ts` | Safe extraction handles string, object, and null cases. Falls back to `session_${session.id}` when null. |
| **H-04** | Driver invite metadata update fails silently | `src/app/api/admin/drivers/invite/route.ts` | Added error handling around `updateUserById`. On failure: logs, cleans up invite, returns 500. No more silent wrong-role assignment. |
| **H-05** | Rate limiter fails open when Redis down | `src/lib/rate-limit/check.ts` | Added in-memory fallback rate limiter with 15 req/min window. Redis errors now caught and routed to fallback instead of failing open. Includes periodic cleanup to prevent memory leak. |
| **H-08** | Refund handler ignores order state machine | `src/app/api/webhooks/stripe/route.ts` | Full refund only sets status to 'cancelled' for pre-delivery orders. Delivered orders preserve their status (delivery record intact). |
| **H-09** | No payment failure handling in webhook | `src/app/api/webhooks/stripe/route.ts` | Terminal payment failures (card_declined, expired_card, etc.) now cancel the order. Non-terminal failures left pending for retry/session-expiry cleanup. |
| **H-10** | Non-transactional order item insertion | `src/app/api/checkout/session/route.ts` + new migration `027_create_order_atomic.sql` | Created `create_order_with_items` RPC function wrapping order+items+modifiers in a single PostgreSQL transaction. Checkout route now calls this instead of 3 separate inserts. |

### Migration Added
- `supabase/migrations/027_create_order_atomic.sql` — **Must be applied before deploying the checkout fix (H-10)**. Run `supabase db push` or apply via your migration pipeline.

---

## What Still Needs Attention

### Must Do Before Saturday Launch

1. **Apply migration 027**: The H-10 fix requires the new `create_order_with_items` RPC function. Deploy it to Supabase before deploying the code changes.

2. **Test the webhook idempotency change (C-01)**: The upsert with `ignoreDuplicates` behaves differently from raw INSERT on some Supabase versions. Verify with a manual test: send the same Stripe event twice and confirm only one processes.

3. **Verify checkout flow end-to-end**: The C-04 and H-10 changes fundamentally alter checkout. Test: add items → checkout → verify order created → payment succeeds → confirmation email arrives.

4. **Environment check**: Ensure `CRON_SECRET` is set in all environments (C-02 now rejects requests without it).

### Repo Cleanup (File Deletion Required)

These files should be deleted but could not be removed in this session due to filesystem mount restrictions:

```bash
# Dead files at root
rm nul bash.exe.stackdump build-output.txt contrast-audit-output.txt env.example

# Empty planning file
rm .planning/v1.6-INTEGRATION-CHECK.md

# Build artifacts that should be .gitignored (remove from git tracking)
git rm -r --cached storybook-static/ playwright-report/ test-results/ .playwright-mcp/ tsconfig.tsbuildinfo

# Add to .gitignore if not already present:
echo "tsconfig.tsbuildinfo" >> .gitignore
echo ".playwright-mcp/" >> .gitignore
```

### Branch Cleanup

35 stale branches exist. All appear merged or abandoned. Safe to prune:

```bash
# Delete all merged local branches except main
git branch --merged main | grep -v main | xargs git branch -d

# For unmerged but abandoned branches, review then:
git branch -D V1-finalize-tests V2-Plan-Implement V2-Sprint3-Customer-Tracking
# ... etc (see full list in audit)
```

### Medium-Priority Issues (Post-Launch)

| ID | Issue | Location | Recommendation |
|----|-------|----------|----------------|
| M-04 | Email idempotency header double-merge | `src/lib/email/send.ts` | Fix the Resend `Idempotency-Key` header construction |
| M-06 | DST vulnerability in delivery reminder cron | `src/app/api/cron/delivery-reminders/route.ts` | Use timezone-aware date comparison instead of `YYYY-MM-DD` string |
| M-07 | Email retry timing exceeds webhook timeout | `src/lib/email/send.ts` | Move email sending to a background queue (Inngest/QStash) |
| M-13 | Cron dedup skips failed retries | `src/app/api/cron/delivery-reminders/route.ts` | Check for `status = 'sent'` in dedup query, not just existence |
| M-15 | Partial refund not shown in customer UI | `src/components/ui/orders/` | Add refund_amount display on order detail page |

### Files Over 400 Lines (Violating ESLint Rule)

| File | Lines | Action |
|------|-------|--------|
| `src/types/database.ts` | 968 | Exempt per CLAUDE.md rules |
| `src/app/api/webhooks/stripe/route.ts` | ~470 (after fixes) | Consider splitting handlers into separate files |
| `src/components/ui/menu/ItemDetailSheet.tsx` | 451 | Split into subcomponents |
| `src/components/ui/homepage/SettingsNudgeBanner.tsx` | 452 | Split into subcomponents |
| `src/components/ui/orders/tracking/DeliveryMap/DeliveryMap.tsx` | 422 | Split map logic from UI |

### Component Test Coverage Gap

Strong E2E coverage (30+ Playwright tests) but limited component unit tests. Priority areas for unit tests:
- Checkout step transitions
- Cart quantity edge cases
- Order status badge rendering
- Admin order filter logic

---

## Architecture Notes for Future Agents

### Key Patterns to Know

1. **Auth layers**: RLS (database) → requireAdmin/requireDriver (API) → layout role check (UI). All three must agree.
2. **Server-side pricing**: Never trust client-sent prices. `calculateOrderTotals()` always recalculates from DB.
3. **Audit log**: Every order state change writes to `order_audit_log` with actor, role, old/new values, reason.
4. **Email system**: React Email → Resend with exponential backoff. Kill switch in `app_settings.email_sending_enabled`.
5. **Rate limiting**: Tiered by role (admin 120/min, customer 30/min). Now has in-memory fallback.

### Common Pitfalls

- **Supabase type casting**: Many queries require `as unknown as Type` casts due to PostgREST join type limitations. This is expected, not a bug.
- **void sendEmail()**: Fire-and-forget pattern used in webhooks. If you need guaranteed delivery, use the `await` version and accept the latency.
- **Menu items have dual names**: `name_en` (English) and `name_my` (Myanmar). Always use `name_en` for order snapshots.
- **Driver model**: `drivers` table links to `profiles` via `user_id`. A driver is a user with an entry in `drivers` + role metadata.

### Where Previous Agents Fell Short

1. **Race conditions overlooked**: Multiple agents added features without considering concurrent access. Always add WHERE guards on status updates.
2. **Error handling gaps**: Silent `void` calls and empty `.catch(() => {})` blocks hide real failures. When something can fail, handle it explicitly.
3. **Non-atomic multi-table operations**: Inserting across tables without transactions leads to orphaned records. Use RPC functions for multi-table writes.
4. **Fail-open defaults**: Security features (rate limiting, auth) defaulted to "allow" on error. Always fail closed for sensitive endpoints.
5. **State machine violations**: Order status transitions weren't guarded — any status could overwrite any other. Always validate the current status before updating.

---

## Files Modified This Session

```
src/app/api/webhooks/stripe/route.ts           — C-01, H-01, H-08, H-09
src/app/api/cron/delivery-reminders/route.ts    — C-02
src/app/api/admin/orders/[id]/cancel/route.ts   — C-03
src/app/api/checkout/session/route.ts           — C-04, H-10
src/app/api/admin/drivers/invite/route.ts       — H-04
src/lib/rate-limit/check.ts                     — H-05
supabase/migrations/027_create_order_atomic.sql — H-10 (NEW)
.planning/Pre-Launch-Critical-Analysis-Report.docx — Full audit report
.planning/AGENT-HANDOFF-2026-02-27.md           — This file
```
