import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { defaultCouponPrefix, generateCouponCode, type CouponRow } from "@/lib/coupons";
import { couponStatus } from "@/lib/coupons/status";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";
import { validatePromoCode } from "@/lib/stripe/promo";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/database";

import { createCouponsSchema } from "./schemas";
import { findCustomerByEmail, type CouponCustomer } from "./find-customer";
import { sendCouponEmail } from "./send-email";

type CouponInsert = Database["public"]["Tables"]["coupons"]["Insert"];

const LIST_LIMIT = 300;
const MAX_CODE_ATTEMPTS = 4;

async function gate(route: string) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return { error: NextResponse.json({ error: auth.error }, { status: auth.status }) };
  }
  const rl = await checkRateLimit({
    limiter: adminLimiter,
    identifier: auth.userId,
    role: "admin",
    route,
  });
  if (rl.limited) return { error: rl.response };
  return { userId: auth.userId };
}

// ============================================
// GET — Admin: list recent coupons with live status
// ============================================

export async function GET() {
  try {
    const g = await gate("admin/coupons");
    if ("error" in g) return g.error;

    // Service client after the admin gate: writes are service-only by design,
    // and reads need the holder order + assignee profile regardless of RLS.
    const service = createServiceClient();
    const { data: rows, error } = await service
      .from("coupons")
      .select("*, orders ( status, payment_method, stripe_payment_intent_id )")
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT);
    if (error) {
      logger.exception(error, { api: "admin/coupons" });
      return NextResponse.json({ error: "Failed to load coupons" }, { status: 500 });
    }

    const userIds = Array.from(
      new Set((rows ?? []).flatMap((r) => [r.assigned_user_id, r.redeemed_by]).filter(Boolean))
    ) as string[];
    const emailById = new Map<string, string | null>();
    if (userIds.length > 0) {
      const { data: profiles } = await service
        .from("profiles")
        .select("id, email")
        .in("id", userIds);
      for (const p of profiles ?? []) emailById.set(p.id, p.email);
    }

    const coupons = (rows ?? []).map(({ orders: holder, ...c }) => ({
      ...c,
      status: couponStatus({ ...c, holder: holder ?? null }),
      assignedEmail: c.assigned_user_id ? (emailById.get(c.assigned_user_id) ?? null) : null,
      redeemedEmail: c.redeemed_by ? (emailById.get(c.redeemed_by) ?? null) : null,
    }));

    return NextResponse.json({ coupons });
  } catch (err) {
    logger.exception(err, { api: "admin/coupons" });
    return NextResponse.json({ error: "Failed to load coupons" }, { status: 500 });
  }
}

// ============================================
// POST — Admin: issue one or more one-time coupons
// ============================================

export async function POST(request: NextRequest) {
  try {
    const g = await gate("admin/coupons/create");
    if ("error" in g) return g.error;

    const parsed = createCouponsSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Invalid request",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }
    const input = parsed.data;
    const service = createServiceClient();

    // A custom code must not shadow a live Stripe promotion code: checkout
    // resolves app coupons first, so the Stripe code would silently stop
    // working for every customer.
    if (input.code && (await validatePromoCode(input.code)).valid) {
      return NextResponse.json(
        { error: "That code already exists as a Stripe promo code." },
        { status: 409 }
      );
    }

    let assignee: CouponCustomer | null = null;
    if (input.assignEmail) {
      const found = await findCustomerByEmail(service, input.assignEmail);
      if (found === "error") {
        return NextResponse.json({ error: "Failed to look up customer" }, { status: 500 });
      }
      if (!found) {
        return NextResponse.json(
          { error: "No customer account signs in with that email. They need to sign up first." },
          { status: 404 }
        );
      }
      assignee = found;
    }

    const base: Omit<CouponInsert, "code"> = {
      kind: input.kind,
      amount_off_cents: input.kind === "amount_off" ? input.amountOffCents : null,
      percent_off: input.kind === "percent_off" ? input.percentOff : null,
      max_discount_cents: input.kind === "amount_off" ? null : (input.maxDiscountCents ?? null),
      min_subtotal_cents: input.minSubtotalCents,
      expires_at: input.expiresAt ?? null,
      assigned_user_id: assignee?.id ?? null,
      note: input.note || null,
      created_by: g.userId,
    };

    const created: CouponRow[] = [];
    const prefix = defaultCouponPrefix(input.kind);
    for (let i = 0; i < input.quantity; i++) {
      const row = await insertWithUniqueCode(service, base, input.code, prefix);
      if (row === "taken") {
        return NextResponse.json({ error: "That code is already in use." }, { status: 409 });
      }
      if (!row) {
        return NextResponse.json(
          { error: "Failed to create coupons", created },
          { status: created.length > 0 ? 207 : 500 }
        );
      }
      created.push(row);
    }

    let emailSent = false;
    if (input.sendEmail && assignee?.email && created[0]) {
      emailSent = await sendCouponEmail(created[0], assignee);
    }

    return NextResponse.json({ coupons: created, emailSent }, { status: 201 });
  } catch (err) {
    logger.exception(err, { api: "admin/coupons/create" });
    return NextResponse.json({ error: "Failed to create coupons" }, { status: 500 });
  }
}

/** Insert one coupon, regenerating the random code on a unique collision. */
async function insertWithUniqueCode(
  service: ReturnType<typeof createServiceClient>,
  base: Omit<CouponInsert, "code">,
  customCode: string | undefined,
  prefix: string
): Promise<CouponRow | "taken" | null> {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = customCode ?? generateCouponCode(prefix);
    const { data, error } = await service
      .from("coupons")
      .insert({ ...base, code })
      .select("*")
      .single();
    if (!error && data) return data;
    if (error?.code === "23505") {
      if (customCode) return "taken";
      continue;
    }
    logger.exception(error, { api: "admin/coupons/create" });
    return null;
  }
  return null;
}
