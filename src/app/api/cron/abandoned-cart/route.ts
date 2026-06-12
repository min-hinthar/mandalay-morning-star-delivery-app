/**
 * Abandoned-Cart Recovery Cron
 *
 * Finds signed-in customers who left items in their (server-synced) cart and
 * haven't ordered, then sends one branded recovery email per abandonment.
 *
 * Targeting: item_count > 0, last touched 2h–72h ago, not yet reminded for this
 * abandonment (carts.reminded_at IS NULL — reset to NULL on every cart change),
 * marketing-opted-in, and no order placed since the cart was last updated.
 */

import React from "react";
import { NextResponse } from "next/server";

import { AbandonedCart } from "@/emails/AbandonedCart";
import { getResendClient } from "@/lib/email/client";
import { getNextDeliveryCutoffText } from "@/lib/email/nudges";
import { EMAIL_CC, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/constants";
import { getAppUrl } from "@/lib/supabase/actions";
import { createServiceClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/utils/api-error";
import { logger } from "@/lib/utils/logger";
import { render } from "@react-email/render";
import { checkRateLimit, webhookLimiter, getClientIp } from "@/lib/rate-limit";
import type { ServerCartItem } from "@/app/api/cart/schemas";
import { mapCartItemsToEmail, amountToFreeDelivery } from "./helpers";

const CRON_SECRET = process.env.CRON_SECRET;
const FLOW_ID = "abandoned-cart";
const STAGGER_DELAY_MS = 100;
const ABANDON_AFTER_MS = 2 * 60 * 60 * 1000; // 2h quiet window before reminding
const ABANDON_BEFORE_MS = 72 * 60 * 60 * 1000; // don't chase carts older than 3 days
const MAX_PER_RUN = 100;

interface CartRow {
  user_id: string;
  items: ServerCartItem[] | null;
  subtotal_cents: number;
  item_count: number;
  updated_at: string;
}

function isAuthorized(request: Request): boolean {
  if (!CRON_SECRET) {
    logger.error("CRON_SECRET is not configured — rejecting cron request", {
      flowId: FLOW_ID,
      api: "cron",
    });
    return false;
  }
  return request.headers.get("authorization") === `Bearer ${CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return apiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  const rl = await checkRateLimit({
    limiter: webhookLimiter,
    identifier: getClientIp(request),
    role: "anon",
    route: "cron/abandoned-cart",
  });
  if (rl.limited) return rl.response;

  const supabase = createServiceClient();
  const now = Date.now();
  const abandonedBefore = new Date(now - ABANDON_AFTER_MS).toISOString();
  const abandonedAfter = new Date(now - ABANDON_BEFORE_MS).toISOString();

  const { data: carts, error } = await supabase
    .from("carts")
    .select("user_id, items, subtotal_cents, item_count, updated_at")
    .gt("item_count", 0)
    .lte("updated_at", abandonedBefore)
    .gte("updated_at", abandonedAfter)
    .is("reminded_at", null)
    .order("updated_at", { ascending: true })
    .limit(MAX_PER_RUN)
    .returns<CartRow[]>();

  if (error) {
    logger.exception(error, { flowId: FLOW_ID, api: "cron" });
    return apiError("INTERNAL_ERROR", "Failed to query carts", 500);
  }

  if (!carts || carts.length === 0) {
    return NextResponse.json({ sent: 0, candidates: 0 });
  }

  const appUrl = await getAppUrl();
  const cartUrl = `${appUrl}/menu`;
  const resend = getResendClient();

  // Same for every recipient in this run — the real "order by" line.
  const nextDeliveryCutoffText = await getNextDeliveryCutoffText();

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < carts.length; i++) {
    const cart = carts[i];
    const items = cart.items ?? [];

    // Mark as processed up-front so a mid-run failure can't double-send.
    await supabase
      .from("carts")
      .update({ reminded_at: new Date().toISOString() })
      .eq("user_id", cart.user_id);

    if (items.length === 0) {
      skipped++;
      continue;
    }

    // Recipient (profiles) + marketing opt-in (customer_settings — prefs live
    // there, not on profiles). Missing settings row = opted in (new-customer
    // default), matching email/send.ts and the loyalty/win-back cron readers.
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", cart.user_id)
      .maybeSingle();

    const { data: settings } = await supabase
      .from("customer_settings")
      .select("notification_prefs")
      .eq("user_id", cart.user_id)
      .maybeSingle();

    const prefs = (settings?.notification_prefs as { marketing?: boolean } | null) ?? null;
    if (!profile?.email || prefs?.marketing === false) {
      skipped++;
      continue;
    }

    // Converted already? Skip if any order was placed since the cart was touched.
    const { data: recentOrder } = await supabase
      .from("orders")
      .select("id")
      .eq("user_id", cart.user_id)
      .gte("placed_at", cart.updated_at)
      .limit(1)
      .maybeSingle();
    if (recentOrder) {
      skipped++;
      continue;
    }

    try {
      const emailComponent = React.createElement(AbandonedCart, {
        customerName: profile.full_name?.split(" ")[0] || "there",
        items: mapCartItemsToEmail(items),
        itemCount: cart.item_count,
        subtotalCents: cart.subtotal_cents,
        cartUrl,
        amountToFreeDeliveryCents: amountToFreeDelivery(cart.subtotal_cents),
        nextDeliveryCutoffText,
      });
      const [html, text] = await Promise.all([
        render(emailComponent),
        render(emailComponent, { plainText: true }),
      ]);

      await resend.emails.send({
        from: EMAIL_FROM,
        to: profile.email,
        cc: EMAIL_CC,
        replyTo: EMAIL_REPLY_TO,
        subject: "Your Burmese feast is waiting 🍜",
        html,
        text,
      });
      sent++;
    } catch (sendError) {
      failed++;
      logger.exception(sendError, { flowId: FLOW_ID, api: "cron", userId: cart.user_id });
    }

    if (i < carts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, STAGGER_DELAY_MS));
    }
  }

  logger.info("Abandoned-cart cron completed", {
    flowId: FLOW_ID,
    api: "cron",
    candidates: carts.length,
    sent,
    skipped,
    failed,
  } as Record<string, unknown>);

  return NextResponse.json({ candidates: carts.length, sent, skipped, failed });
}
