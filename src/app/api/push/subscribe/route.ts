import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, customerLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";

const subscribeSchema = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({
    p256dh: z.string().max(500),
    auth: z.string().max(500),
  }),
  userAgent: z.string().max(500).optional(),
});

const unsubscribeSchema = z.object({ endpoint: z.string().url().max(2000) });

const UNAUTHORIZED = NextResponse.json(
  { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
  { status: 401 }
);

/** POST /api/push/subscribe — register this device's push subscription. */
export async function POST(request: NextRequest) {
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
      route: "push/subscribe",
    });
    if (rl.limited) return rl.response;

    const parsed = subscribeSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid subscription" } },
        { status: 400 }
      );
    }

    const { endpoint, keys, userAgent } = parsed.data;
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: userAgent ?? null,
      },
      { onConflict: "endpoint" }
    );
    if (error) throw error;

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    logger.exception(error, { api: "push/subscribe" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to subscribe" } },
      { status: 500 }
    );
  }
}

/** DELETE /api/push/subscribe — remove this device's subscription. */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return UNAUTHORIZED;

    const parsed = unsubscribeSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid endpoint" } },
        { status: 400 }
      );
    }

    // RLS scopes the delete to the caller's own rows.
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", parsed.data.endpoint);
    if (error) throw error;

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    logger.exception(error, { api: "push/subscribe" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to unsubscribe" } },
      { status: 500 }
    );
  }
}
