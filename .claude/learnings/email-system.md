# Email System Learnings

## EmailType Split: Customer vs Admin

**Context:** Added admin notification emails (`admin_new_order`, `admin_daily_digest`). DB `notification_logs.notification_type` enum only covers customer types.

**Learning:** Two type layers:
- `CustomerEmailType` — matches DB enum, safe for `notification_logs` inserts
- `EmailType = CustomerEmailType | "admin_new_order" | "admin_daily_digest"` — full union used by `sendEmail()`
- `ADMIN_EMAIL_TYPES` constant guards `notification_logs` inserts in `send.ts`
- Admin types are always `mandatory: true` (skip user preference checks)

**Apply when:** Adding new email types — check if DB enum includes them.

---

## Admin Email Recipients

**Context:** Need to send notifications to all admins.

**Learning:** Query `profiles` table with `role = 'admin'`, NOT `auth.admin.listUsers()`. The `getAdminEmails()` helper in `src/lib/email/admin-recipients.ts` returns `{ id, email, full_name }[]`. Filter out null emails.

**Apply when:** Sending admin notifications of any kind.

---

## Cron Dedupe for Admin Emails

**Context:** Daily digest cron needs deduplication but can't use `notification_logs` (admin types excluded from DB enum).

**Learning:** Use `app_settings` table as lightweight dedupe store:
- Key pattern: `cron_digest_sent_admin-digest-{date}-{period}`
- Insert marker row after successful sends
- Check for existing key before sending

**Apply when:** Building cron jobs that need deduplication for non-customer notifications.

---

## Email Send Pattern on Vercel

**Context:** Vercel serverless kills fire-and-forget async calls.

**Learning:** Always use `after()` from `next/server` for email sends in API routes:
- `after(() => sendEmail(...))` — keeps function alive after response
- For multiple admin recipients, loop inside `after()` with 100ms stagger
- Never `void sendEmail(...)` — function terminates before send completes

**Apply when:** Any email send in API routes or webhook handlers.

---

## sendCODOrderEmail Interface

**Context:** Function was missing `userId` field, used `orderId` in its place.

**Learning:** Always include `userId` in email helper interfaces. Map it from auth context (`user.id`), never reuse `orderId`. TypeScript won't catch `string` → `string` field misuse.

```typescript
// Correct
sendCODOrderEmail({ orderId: result.orderId, userId: user.id, ... })

// Bug (was)
sendEmail({ ..., userId: opts.orderId }) // orderId stored as userId
```

**Apply when:** Building email wrapper functions that call `sendEmail()`.
