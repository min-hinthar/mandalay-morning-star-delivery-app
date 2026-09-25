import { randomInt } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/database";

import { couponEffect, couponLabel, type CouponKind } from "./effect";
import { STALE_PENDING_MS } from "./status";

export { couponEffect, couponLabel, type CouponEffect, type CouponKind } from "./effect";

export type CouponRow = Database["public"]["Tables"]["coupons"]["Row"];

/** Readable alphabet — no 0/O/1/I/L so codes survive being read aloud or printed. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const RANDOM_LENGTH = 6;

/** Prefixes owned by other code systems (Stripe loyalty codes). */
const RESERVED_PREFIXES = ["KYAYZU-"];

/** Postgres undefined_table / PostgREST "table not in schema cache". */
const MISSING_TABLE_CODES = new Set(["42P01", "PGRST205"]);

export const COUPON_CODE_PATTERN = /^[A-Z0-9-]{4,32}$/;

export function normalizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isReservedCouponCode(code: string): boolean {
  return RESERVED_PREFIXES.some((p) => code.startsWith(p));
}

export function defaultCouponPrefix(kind: CouponKind): string {
  return kind === "free_delivery" ? "FREEDEL" : "GIFT";
}

/** `<PREFIX>-XXXXXX` from a CSPRNG (codes are bearer tokens — never Math.random). */
export function generateCouponCode(prefix: string): string {
  let suffix = "";
  for (let i = 0; i < RANDOM_LENGTH; i++) suffix += ALPHABET[randomInt(ALPHABET.length)];
  return `${prefix}-${suffix}`;
}

export type CouponLookup =
  | { status: "none" }
  | { status: "invalid"; message: string }
  | { status: "valid"; coupon: CouponRow };

/**
 * Pre-check an app-issued coupon for a checkout. `none` means the code isn't an
 * app coupon (caller falls through to Stripe promotion codes). Advisory only —
 * the authoritative single-use gate is `claimCoupon` after the order row exists.
 * Every failure is `invalid` (never `none`): a read error must not fall through
 * to a different discount system.
 */
export async function lookupCoupon(
  service: SupabaseClient<Database>,
  code: string,
  opts: { userId: string | null; subtotalCents: number | null }
): Promise<CouponLookup> {
  const normalized = normalizeCouponCode(code);
  if (!COUPON_CODE_PATTERN.test(normalized) || isReservedCouponCode(normalized)) {
    return { status: "none" };
  }

  const { data: coupon, error } = await service
    .from("coupons")
    .select("*")
    .eq("code", normalized)
    .maybeSingle();
  if (error) {
    // Table not deployed yet (code shipped before the migration was applied):
    // no app coupons can exist, so let Stripe codes keep working instead of
    // rejecting every promo at checkout.
    if (MISSING_TABLE_CODES.has(error.code)) return { status: "none" };
    logger.exception(error, { api: "coupons/lookup" });
    return { status: "invalid", message: "Failed to validate promo code" };
  }
  if (!coupon) return { status: "none" };

  if (coupon.revoked_at) return { status: "invalid", message: "Invalid or expired promo code" };
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() <= Date.now()) {
    return { status: "invalid", message: "This code has expired." };
  }
  if (coupon.assigned_user_id && opts.userId && coupon.assigned_user_id !== opts.userId) {
    return { status: "invalid", message: "This code is linked to a different account." };
  }
  if (opts.subtotalCents !== null && opts.subtotalCents < coupon.min_subtotal_cents) {
    return {
      status: "invalid",
      message: `This code needs a subtotal of at least $${(coupon.min_subtotal_cents / 100).toFixed(2)}.`,
    };
  }

  if (coupon.order_id) {
    const held = await isHolderLive(service, coupon.order_id, opts.userId, coupon.redeemed_at);
    if (held === "error") {
      return { status: "invalid", message: "Failed to validate promo code" };
    }
    if (held === "live") {
      return { status: "invalid", message: "This code has already been used." };
    }
  }

  return { status: "valid", coupon };
}

/**
 * Mirrors claim_coupon's release rule so the preview matches the claim.
 * A holder that is the SAME customer's still-open Stripe checkout reads as
 * free here: the retry will create a new order, and the claim then fails
 * with a clear message only if that old session is genuinely still live.
 */
async function isHolderLive(
  service: SupabaseClient<Database>,
  orderId: string,
  userId: string | null,
  /** The coupon's last claim time — staleness is measured from here. */
  claimedAt: string | null
): Promise<"live" | "free" | "error"> {
  const { data: holder, error } = await service
    .from("orders")
    .select("status, user_id")
    .eq("id", orderId)
    .maybeSingle();
  if (error) {
    logger.exception(error, { api: "coupons/lookup", orderId });
    return "error";
  }
  if (!holder || holder.status === "cancelled") return "free";
  if (holder.status === "pending") {
    if (claimedAt && Date.now() - new Date(claimedAt).getTime() > STALE_PENDING_MS) return "free";
    if (userId && holder.user_id === userId) return "free";
  }
  return "live";
}

export type ClaimResult = "ok" | "not_found" | "revoked" | "expired" | "wrong_user" | "in_use";

/** Atomic single-use claim (row lock in `claim_coupon`, service_role only). */
export async function claimCoupon(
  service: SupabaseClient<Database>,
  couponId: string,
  orderId: string,
  userId: string
): Promise<ClaimResult | "error"> {
  const { data, error } = await service.rpc("claim_coupon", {
    p_coupon_id: couponId,
    p_order_id: orderId,
    p_user_id: userId,
  });
  if (error) {
    logger.exception(error, { api: "coupons/claim", couponId, orderId });
    return "error";
  }
  return data as ClaimResult;
}

/**
 * Retry-payment gate: if `promoCode` is an app coupon, re-claim it for the
 * SAME order. `claim_coupon` is idempotent for the current holder and bumps
 * `redeemed_at`, which is what the 2h stale-release rule measures — so each
 * new payment session restarts the hold. "lost" = another order took it.
 */
export async function reconfirmCouponHold(
  service: SupabaseClient<Database>,
  promoCode: string | null,
  orderId: string,
  userId: string
): Promise<"ok" | "lost" | "error"> {
  if (!promoCode) return "ok";
  const code = normalizeCouponCode(promoCode);
  if (!COUPON_CODE_PATTERN.test(code) || isReservedCouponCode(code)) return "ok";
  const { data: coupon, error } = await service
    .from("coupons")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (error) {
    if (MISSING_TABLE_CODES.has(error.code)) return "ok";
    logger.exception(error, { api: "coupons/reconfirm", orderId });
    return "error";
  }
  if (!coupon) return "ok";
  const result = await claimCoupon(service, coupon.id, orderId, userId);
  if (result === "ok") return "ok";
  return result === "error" ? "error" : "lost";
}

export function claimFailureMessage(result: ClaimResult | "error"): string {
  switch (result) {
    case "in_use":
      return "This code is already in use on another order. If you just left a checkout, wait a few minutes and try again.";
    case "expired":
      return "This code has expired.";
    case "wrong_user":
      return "This code is linked to a different account.";
    case "error":
      return "We couldn't apply your code. Please try again.";
    default:
      return "Invalid or expired promo code";
  }
}

/** Public label for a coupon row (admin list + customer preview). */
export function labelFor(coupon: CouponRow): string {
  return couponLabel(coupon.kind as CouponKind, coupon);
}

/** Resolve the monetary effect of a coupon row for a given cart. */
export function effectFor(coupon: CouponRow, subtotalCents: number, deliveryFeeCents: number) {
  return couponEffect(coupon.kind as CouponKind, coupon, subtotalCents, deliveryFeeCents);
}
