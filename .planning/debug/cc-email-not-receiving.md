---
status: awaiting_human_verify
trigger: "Admin order details email history shows emails as correctly sent to customers, but the CC recipient (min@mandalaymorningstar.com) is not actually receiving copies of the emails."
created: 2026-03-28T22:00:00Z
updated: 2026-03-29T00:30:00Z
---

## Current Focus

hypothesis: CONFIRMED — sendStatusEmail() in status route only handles "order_confirmation" and "cancelled" types. For "out_for_delivery" and "delivered" status changes, emailType is truthy but !== "order_confirmation", so the code falls through to "No email template available" log and returns false. No email is ever sent, no notification_log is created.
test: Code trace of sendStatusEmail function confirms the logic gap
expecting: N/A — root cause confirmed via code analysis
next_action: Awaiting human verification — deploy and test status change emails in real workflow

## Symptoms

expected: When an email is sent to a customer, a CC copy should also be delivered to min@mandalaymorningstar.com
actual: Customer receives the email, but CC address does not receive any copy. No errors visible in UI.
errors: None — emails appear successful in admin email history
reproduction: Send any email to a customer from an order and check if CC address receives it
started: Likely since CC feature was added in commit f832ca5f (2026-03-28)

## Eliminated

- hypothesis: CC field missing from some or all resend.emails.send() call sites
  evidence: All 5 call sites confirmed to include `cc: EMAIL_CC` — verified by reading src/lib/email/send.ts, src/app/api/emails/test/route.ts, src/app/api/admin/emails/compose/route.ts, src/app/api/admin/drivers/invite/route.ts, src/app/api/admin/drivers/[id]/resend-invite/route.ts
  timestamp: 2026-03-28

- hypothesis: EMAIL_CC constant has wrong value or format
  evidence: EMAIL_CC = ["min@mandalaymorningstar.com"] in src/lib/email/constants.ts. Resend type accepts `string | string[]` for cc. Array format is valid.
  timestamp: 2026-03-28

- hypothesis: CC field overwritten by spread operator in send.ts
  evidence: The idempotencyKey spread only overwrites `headers`, not `cc`. CC is preserved in all code paths.
  timestamp: 2026-03-28

- hypothesis: Resend API type mismatch for cc field
  evidence: node_modules/resend/dist/index.d.mts confirms `cc?: string | string[]`. Our usage matches.
  timestamp: 2026-03-28

- hypothesis: `to` and `cc` are same address causing dedup
  evidence: For customer emails, `to` is customer email (not min@). Only admin-type emails send `to: admin.email` which could match, but user reports issue with customer emails specifically.
  timestamp: 2026-03-28

- hypothesis: DB records email as delivered without actually sending via Resend (silent failure / mock path)
  evidence: Traced full code path in send.ts — notification_logs insert at line 170-181 ONLY executes after Resend returns data (no error) at line 150. "delivered" status only set by Resend webhook handler (src/app/api/webhooks/resend/route.ts) which processes email.delivered events from Resend's servers. Kill switch returns early WITHOUT logging. Preference opt-out returns early WITHOUT logging. No mock/test path exists. RESEND_API_KEY is a production key (starts with re_, not re_test_).
  timestamp: 2026-03-29

- hypothesis: App uses alternative email transport that bypasses Resend
  evidence: Searched entire codebase for nodemailer, smtp, sendgrid, mailgun, ses, postmark — no alternative email providers. Only Resend client in src/lib/email/client.ts.
  timestamp: 2026-03-29

- hypothesis: Email history in admin UI is fake/hardcoded/mocked data
  evidence: EmailHistory component fetches from /api/admin/emails which queries notification_logs table directly. Order details route also queries notification_logs. All real DB data, no mocking.
  timestamp: 2026-03-29

## Evidence

- timestamp: 2026-03-28
  checked: Commit f832ca5f diff
  found: 7 files changed, EMAIL_CC constant added and wired into all 5 resend.emails.send() call sites
  implication: Code change was correctly implemented

- timestamp: 2026-03-28
  checked: All 5 resend.emails.send() call sites
  found: All include `cc: EMAIL_CC` with correct import
  implication: Code is correct — issue is not in the application code

- timestamp: 2026-03-28
  checked: Resend SDK type definitions
  found: cc field accepts `string | string[]`, our `string[]` usage is correct
  implication: No type mismatch

- timestamp: 2026-03-28
  checked: sendEmail() in send.ts (primary email path, 20+ callers)
  found: cc: EMAIL_CC at line 128, not overwritten by any spread
  implication: CC is being passed to Resend API correctly for all order emails

- timestamp: 2026-03-28
  checked: Resend documentation and community reports
  found: Resend sending domains modify DNS (SPF, DKIM) but MX records for receiving are separate. If domain is configured only for sending in Resend, CC to same domain depends on external MX/mailbox config.
  implication: min@mandalaymorningstar.com delivery depends on the domain's receiving mail infrastructure (Google Workspace, Zoho, etc.), not Resend

- timestamp: 2026-03-28
  checked: Email addresses in play
  found: FROM=admin@mandalaymorningstar.com, CC=min@mandalaymorningstar.com — both on same domain
  implication: CC delivery to same sender domain may have deliverability issues (SPF alignment, DMARC, spam filtering)

- timestamp: 2026-03-29
  checked: Full sendEmail() code path for silent failure possibility
  found: notification_logs INSERT only executes after Resend API returns success data (line 150+170). "delivered" status only from webhook handler. No mock/skip path exists. API key is production (re_6qF...).
  implication: If DB says "delivered", Resend DID process the email and DID fire a delivery webhook. Email was actually sent.

- timestamp: 2026-03-29
  checked: Resend dashboard CC visibility
  found: Resend dashboard shows emails by primary `to` recipient, not CC. CC emails are not separate entries — they're headers on the same email. Searching Resend dashboard for min@ would show nothing.
  implication: User's observation "Resend dashboard doesn't show the email" is likely because they searched by CC address (min@), not by customer email. The email IS in Resend under the customer's email address.

- timestamp: 2026-03-29
  checked: Admin email endpoints (/api/admin/emails, /api/admin/orders/[id]/details)
  found: Both query notification_logs table directly. EmailHistory component fetches real DB data. "delivered" status reflects Resend webhook confirmation for PRIMARY recipient delivery.
  implication: Email history is real, status is real, but it tracks customer delivery — not CC delivery specifically.

## Resolution

root_cause: sendStatusEmail() in src/app/api/admin/orders/[id]/status/route.ts only handles "order_confirmation" and "cancelled" email types. The STATUS_EMAIL_MAP correctly maps out_for_delivery and delivered to email types, but the if-chain at line 273 only checks `emailType === "order_confirmation"`. For out_for_delivery/delivered transitions, the code falls through to a log-and-skip block. No email is sent, no notification_log entry is created. This is why "automatic" emails (triggered by Stripe webhook checkout-session-completed, which sends order_confirmation) work fine, but "manual" status changes (admin changing to out_for_delivery/delivered) produce no emails.
fix: Created OutForDelivery and OrderDelivered email templates. Added cases to buildEmailElement. Rewrote sendStatusEmail to use a unified data-fetch + buildEmailElement pattern for all status types instead of only handling order_confirmation. Also added out_for_delivery and delivered to admin manual send route.
verification: lint, typecheck, format, 851 tests, build — all pass
files_changed:
  - src/emails/OutForDelivery.tsx (new)
  - src/emails/OrderDelivered.tsx (new)
  - src/lib/email/build.ts (added out_for_delivery + delivered cases)
  - src/app/api/admin/orders/[id]/status/route.ts (rewrote sendStatusEmail to handle all types)
  - src/app/api/admin/emails/send/route.ts (added new types to valid list + schema)
