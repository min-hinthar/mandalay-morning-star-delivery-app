---
status: resolved
trigger: "Order confirmation emails not working on production (Vercel). No email received, no error shown. Driver invite emails via Resend ARE working."
created: 2026-03-07T00:00:00Z
updated: 2026-03-07T00:05:00Z
---

## Current Focus

hypothesis: CONFIRMED - fire-and-forget email sends (void sendEmail) killed by Vercel serverless runtime
test: All 614 tests pass, build succeeds, typecheck clean
expecting: Emails will now be sent reliably on Vercel after deploying
next_action: Await human verification on production

## Symptoms

expected: Order confirmation email sent after successful order placement
actual: No email received at all, no error displayed to user
errors: None visible - silent failure
reproduction: Place an order on production; no confirmation email arrives
started: Worked before, stopped at some point
additional: Driver invite emails via Resend ARE working

## Eliminated

## Evidence

- timestamp: 2026-03-07T00:00:30Z
  checked: All email sending points in codebase (12 total)
  found: |
    PATTERN: Working emails are AWAITED, broken ones are fire-and-forget (void).
    Working: driver invite (awaits resend.send()), cron reminders (awaits sendEmail()),
             admin status change (awaits sendStatusEmail())
    Broken: COD order, Stripe webhook order confirmation, COD approval, refund,
            cancellation (admin), cancellation (customer), manual admin email
  implication: Vercel kills serverless function after response, orphaning fire-and-forget promises

- timestamp: 2026-03-07T00:01:00Z
  checked: Next.js after() API availability
  found: Next.js 16.1.2 has stable after() API. Not used anywhere in codebase.
  implication: after() is the correct fix - keeps function alive to complete background work

- timestamp: 2026-03-07T00:04:00Z
  checked: Full verification suite after fix
  found: |
    lint: 0 errors (3 pre-existing warnings)
    lint:css: pass
    format:check: pass
    typecheck: pass
    test: 614/614 pass
    build: pass
  implication: Fix is safe to deploy

## Resolution

root_cause: |
  Fire-and-forget email sends (`void sendEmail(...)`) are terminated by Vercel's
  serverless runtime before completing. Vercel kills function execution once the
  HTTP response is sent. The `sendEmail()` function itself works correctly (proven
  by awaited calls in driver invite and cron routes), but when called with `void`
  the Promise is abandoned when the response returns.

fix: |
  Replaced all `void sendEmail(...)` patterns with `after(async () => { await sendEmail(...) })`
  using Next.js `after()` API (stable since Next.js 15). The `after()` API schedules
  work to run after the response is sent while keeping the serverless function alive
  until the callback completes. Added try/catch with logger.error in each after() block.

  Also added `after()` mock to webhook test file to support the new pattern.

verification: |
  All 614 tests pass. Build succeeds. Typecheck clean. Format/lint clean.
  Webhook tests specifically verified with after() mock that executes callbacks immediately.

files_changed:
  - src/app/api/checkout/session/route.ts (COD email: void -> after())
  - src/app/api/webhooks/stripe/handlers.ts (order confirmation + refund: void -> after())
  - src/app/api/admin/orders/[id]/approve-cod/route.ts (COD approval email: void -> after())
  - src/app/api/admin/orders/[id]/cancel/route.ts (admin cancel email: void -> after())
  - src/app/api/account/orders/[id]/cancel/route.ts (customer cancel email: void -> after())
  - src/app/api/admin/orders/[id]/refund/route.ts (refund email: void -> after())
  - src/app/api/admin/emails/send/route.ts (manual email: void -> after())
  - src/app/api/webhooks/stripe/__tests__/route.test.ts (added after() mock)
