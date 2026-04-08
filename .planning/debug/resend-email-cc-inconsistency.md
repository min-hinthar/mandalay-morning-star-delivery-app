---
status: awaiting_human_verify
trigger: "All Resend emails should CC admin@mandalaymorningstar.com but only some do"
created: 2026-03-28T00:00:00Z
updated: 2026-03-28T00:00:00Z
---

## Current Focus

hypothesis: No call site includes cc: field — zero emails CC admin. Fix by adding CC to centralized sendEmail + all 4 direct call sites.
test: grep for cc: in src/ — zero results
expecting: after fix, all 5 call sites include cc
next_action: add EMAIL_CC constant and wire into all send calls

## Symptoms

expected: Every email sent via Resend includes cc: admin@mandalaymorningstar.com
actual: Only some emails include the CC — others are sent without it
errors: None — emails send successfully, just missing CC on some
reproduction: Send different email types and check which ones CC admin
started: Likely since email sending was implemented

## Eliminated

- hypothesis: Some call sites have CC and others don't
  evidence: grep for "cc:" in src/ returned zero email-related results — NO call site has CC
  timestamp: 2026-03-28

## Evidence

- timestamp: 2026-03-28
  checked: All 5 resend.emails.send call sites
  found: Zero include cc: field
  implication: This is not "inconsistent" — CC is universally missing

- timestamp: 2026-03-28
  checked: Call site inventory
  found: |
    1. src/lib/email/send.ts:124 — centralized sendEmail (order confirmations, cancellations, refunds, delivery reminders, admin notifications)
    2. src/app/api/emails/test/route.ts:72 — test email sender (admin only)
    3. src/app/api/admin/emails/compose/route.ts:136 — manual compose email
    4. src/app/api/admin/drivers/invite/route.ts:213 — driver invite
    5. src/app/api/admin/drivers/[id]/resend-invite/route.ts:142 — resend driver invite
  implication: Need CC added to all 5 sites. Best approach: add EMAIL_CC constant, wire into centralized send.ts, add to 4 direct call sites.

## Resolution

root_cause: No call site includes cc: field in the resend.emails.send payload
fix: Add EMAIL_CC constant to constants.ts, add cc field to all 5 call sites
verification: lint + lint:css + format:check + typecheck + 851 tests + build all pass. All 5 call sites confirmed with cc: EMAIL_CC via grep.
files_changed:
  - src/lib/email/constants.ts
  - src/lib/email/send.ts
  - src/app/api/emails/test/route.ts
  - src/app/api/admin/emails/compose/route.ts
  - src/app/api/admin/drivers/invite/route.ts
  - src/app/api/admin/drivers/[id]/resend-invite/route.ts
