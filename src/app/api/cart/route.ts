import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, customerLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";
import type { Json } from "@/types/database";
import { cartUpsertSchema, computeCartTotals, type ServerCartItem } from "./schemas";

const UNAUTHORIZED = NextResponse.json(
  { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
  { status: 401 }
);

/**
 * GET /api/cart — the signed-in user's persisted cart (for cross-device restore).
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return UNAUTHORIZED;

    const rl = await checkRateLimit({
      limiter: customerLimiter,
      identifier: user.id,
      role: "customer",
      route: "cart",
    });
    if (rl.limited) return rl.response;

    const { data, error } = await supabase
      .from("carts")
      .select("items, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;

    return NextResponse.json({
      data: {
        items: (data?.items as ServerCartItem[] | null) ?? [],
        updatedAt: data?.updated_at ?? null,
      },
    });
  } catch (error) {
    logger.exception(error, { api: "cart" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to load cart" } },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cart — upsert the signed-in user's cart. Best-effort durable copy of
 * the client cart; checkout still re-validates authoritatively.
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return UNAUTHORIZED;

    const rl = await checkRateLimit({
      limiter: customerLimiter,
      identifier: user.id,
      role: "customer",
      route: "cart",
    });
    if (rl.limited) return rl.response;

    const body = await request.json().catch(() => null);
    const parsed = cartUpsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid cart payload" } },
        { status: 400 }
      );
    }

    const items = parsed.data.items;
    const { subtotalCents, itemCount } = computeCartTotals(items);

    const { error } = await supabase.from("carts").upsert(
      {
        user_id: user.id,
        items: items as unknown as Json,
        subtotal_cents: subtotalCents,
        item_count: itemCount,
        updated_at: new Date().toISOString(),
        // Any cart change is fresh activity — reset the reminder dedupe so a
        // later abandonment can re-trigger the recovery email.
        reminded_at: null,
      },
      { onConflict: "user_id" }
    );
    if (error) throw error;

    return NextResponse.json({ data: { ok: true, itemCount, subtotalCents } });
  } catch (error) {
    logger.exception(error, { api: "cart" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to save cart" } },
      { status: 500 }
    );
  }
}
