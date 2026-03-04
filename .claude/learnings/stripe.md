# Stripe Learnings

## Webhook Error Handling — Never Return 200 on DB Errors

**Context:** Webhook catch block returned 200 for all errors. Stripe treats 2xx as success and won't retry. DB failures were silently lost — orders stuck in "pending" forever.

**Learning:**
- Return **500** for retryable errors (DB failures, network timeouts) → Stripe retries with exponential backoff
- Return **200** only for non-retryable errors (missing metadata, validation failures) or successful processing
- Stripe retries for up to 3 days on 4xx/5xx responses

```typescript
// BAD — swallows all errors
catch (err) {
  logger.exception(err);
  // silently returns 200 below
}
return NextResponse.json({ received: true }); // 200

// GOOD — DB errors trigger retry
catch (err) {
  logger.exception(err);
  return NextResponse.json({ error: "Processing failed" }, { status: 500 });
}
return NextResponse.json({ received: true }); // 200 only on success
```

**Apply when:** Writing any webhook handler (Stripe, Resend, etc.) that processes events with side effects.

---

## Supabase .update() Returns No Row Count by Default

**Context:** `.update().eq("id", orderId).eq("status", "pending")` returned `{ error: null }` even when 0 rows matched (order already confirmed). Handler logged "success" but nothing changed.

**Learning:** Chain `.select("id")` after `.update()` to get affected rows. Check `data.length === 0` to detect no-op updates:

```typescript
const { data: updated, error } = await supabase
  .from("orders")
  .update({ status: "confirmed" })
  .eq("id", orderId)
  .eq("status", "pending")
  .select("id"); // Returns matched rows

if (!updated?.length) {
  // 0 rows: order doesn't exist or already processed
}
```

**Apply when:** Any `.update()` where knowing whether rows were affected matters (status transitions, idempotent operations).

---

## Client-Side Verify-Payment Fallback for Webhook Delays

**Context:** After Stripe checkout, confirmation page rendered with "pending" status. Webhook sometimes delayed 5-30s (cold starts, retries). No client-side recovery.

**Learning:** Add a verify-payment API route as fallback:
1. Client polls order status every 3s
2. After ~12s, calls `POST /api/orders/[id]/verify-payment` with `sessionId`
3. Server calls `stripe.checkout.sessions.retrieve()` → if `payment_status === "paid"`, confirm order via service client
4. Idempotent — `.eq("status", "pending")` guard prevents double-confirm

**Apply when:** Any payment flow where webhooks are the primary confirmation mechanism. Always have a client-side fallback.
