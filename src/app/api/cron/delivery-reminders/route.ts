/**
 * Delivery Reminder Cron Endpoint (MAIL-04)
 *
 * Called daily at 8:00 AM PT. Configure via vercel.json cron or external scheduler.
 * Queries orders with today's delivery window, deduplicates against notification_logs,
 * and sends DeliveryReminder emails with 100ms stagger to respect Resend rate limits.
 */

import { NextResponse } from "next/server";

import { DeliveryReminder } from "@/emails/DeliveryReminder";
import { sendEmail } from "@/lib/email/send";
import { createServiceClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/utils/api-error";
import { toISOWithTimezone } from "@/lib/utils/delivery-timezone";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, webhookLimiter, getClientIp } from "@/lib/rate-limit";
import { TIMEZONE } from "@/types/delivery";

const CRON_SECRET = process.env.CRON_SECRET;
const STAGGER_DELAY_MS = 100;
const FLOW_ID = "delivery-reminders";

function getTodayInTimezone(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

// ===========================================
// AUTH GUARD
// ===========================================

function isAuthorized(request: Request): boolean {
  // SECURITY: Fail CLOSED when secret is not configured.
  // Without a secret, no one should be able to trigger mass email sends.
  if (!CRON_SECRET) {
    logger.error("CRON_SECRET is not configured — rejecting cron request", {
      flowId: FLOW_ID,
      api: "cron",
    });
    return false;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${CRON_SECRET}`;
}

// ===========================================
// GET HANDLER
// ===========================================

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return apiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  const ip = getClientIp(request);
  const rl = await checkRateLimit({
    limiter: webhookLimiter,
    identifier: ip,
    role: "anon",
    route: "cron/delivery-reminders",
  });
  if (rl.limited) return rl.response;

  const supabase = createServiceClient();
  const today = getTodayInTimezone(); // YYYY-MM-DD in LA timezone

  // -----------------------------------------------
  // Step 1: Query qualifying orders for today
  // -----------------------------------------------
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(
      `
      id,
      delivery_window_start,
      delivery_window_end,
      special_instructions,
      user_id,
      assigned_driver_id,
      subtotal_cents,
      delivery_fee_cents,
      tax_cents,
      tip_cents,
      discount_cents,
      total_cents,
      payment_method,
      profiles!orders_user_id_fkey!inner (
        id,
        full_name,
        email
      ),
      addresses (
        line_1,
        line_2,
        city,
        state,
        postal_code
      )
    `
    )
    .gte("delivery_window_start", toISOWithTimezone(today, "00:00"))
    .lt("delivery_window_start", toISOWithTimezone(today, "23:59"))
    .in("status", ["confirmed", "preparing"]);

  if (ordersError) {
    logger.error("Failed to query orders for delivery reminders", {
      flowId: FLOW_ID,
      api: "cron",
    });
    logger.exception(ordersError, { flowId: FLOW_ID, api: "cron" });
    return apiError("INTERNAL_ERROR", "Failed to query orders", 500);
  }

  if (!orders || orders.length === 0) {
    logger.info("No qualifying orders for delivery reminders today", {
      flowId: FLOW_ID,
      api: "cron",
    });
    return NextResponse.json({ sent: 0, skipped: 0, failed: 0, total: 0 });
  }

  // -----------------------------------------------
  // Step 2: Check for already-sent reminders today
  // -----------------------------------------------
  const orderIds = orders.map((o) => o.id);

  const { data: existingLogs } = await supabase
    .from("notification_logs")
    .select("order_id")
    .in("order_id", orderIds)
    .eq("notification_type", "delivery_reminder")
    .gte("created_at", toISOWithTimezone(today, "00:00"));

  const alreadySentOrderIds = new Set((existingLogs ?? []).map((log) => log.order_id));

  // -----------------------------------------------
  // Step 3: Fetch full order items (with modifiers) for each qualifying order
  // -----------------------------------------------
  const { data: allOrderItems } = await supabase
    .from("order_items")
    .select(
      `order_id, name_snapshot, name_my_snapshot, special_instructions, quantity, line_total_cents,
       order_item_modifiers ( name_snapshot, price_delta_snapshot )`
    )
    .in("order_id", orderIds);

  interface ReminderItem {
    name_snapshot: string;
    name_my_snapshot: string | null;
    special_instructions: string | null;
    quantity: number;
    line_total_cents: number;
    order_item_modifiers: Array<{ name_snapshot: string; price_delta_snapshot: number }> | null;
  }

  const orderItemsMap = new Map<string, ReminderItem[]>();
  for (const raw of (allOrderItems ?? []) as Array<ReminderItem & { order_id: string }>) {
    const existing = orderItemsMap.get(raw.order_id) ?? [];
    existing.push({
      name_snapshot: raw.name_snapshot,
      name_my_snapshot: raw.name_my_snapshot,
      special_instructions: raw.special_instructions,
      quantity: raw.quantity,
      line_total_cents: raw.line_total_cents,
      order_item_modifiers: raw.order_item_modifiers,
    });
    orderItemsMap.set(raw.order_id, existing);
  }

  // -----------------------------------------------
  // Step 4: Fetch driver names for assigned orders
  // -----------------------------------------------
  const driverIds = orders
    .map((o) => o.assigned_driver_id)
    .filter((id): id is string => id !== null);

  let driverNameMap = new Map<string, string>();
  if (driverIds.length > 0) {
    // drivers table is not in Database type — cast results
    const { data: drivers } = (await supabase
      .from("drivers")
      .select("id, user_id")
      .in("id", driverIds)) as {
      data: { id: string; user_id: string }[] | null;
    };

    if (drivers && drivers.length > 0) {
      const driverUserIds = drivers.map((d) => d.user_id);
      const { data: driverProfiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", driverUserIds);

      const userToName = new Map<string, string | null>(
        (driverProfiles ?? []).map((p) => [p.id, p.full_name])
      );

      driverNameMap = new Map(
        drivers.map((d) => [d.id, userToName.get(d.user_id) ?? "Your driver"])
      );
    }
  }

  // -----------------------------------------------
  // Step 5: Send emails with staggering
  // -----------------------------------------------
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];

    // Deduplicate: skip if already sent today
    if (alreadySentOrderIds.has(order.id)) {
      skipped++;
      continue;
    }

    // Extract profile (inner join guarantees existence)
    const profile = order.profiles as unknown as {
      id: string;
      full_name: string | null;
      email: string | null;
    };

    if (!profile?.email) {
      logger.warn("Order has no email on profile, skipping", {
        flowId: FLOW_ID,
        orderId: order.id,
      });
      skipped++;
      continue;
    }

    // Extract address
    const addr = order.addresses as unknown as {
      line_1: string;
      line_2: string | null;
      city: string;
      state: string;
      postal_code: string;
    } | null;

    const address = addr
      ? {
          line1: addr.line_1,
          line2: addr.line_2 ?? undefined,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postal_code,
        }
      : {
          line1: "Address on file",
          city: "",
          state: "",
          postalCode: "",
        };

    // Build item data
    const rawItems = orderItemsMap.get(order.id) ?? [];
    const itemCount = rawItems.reduce((sum, item) => sum + item.quantity, 0);
    const itemNames = rawItems.slice(0, 3).map((item) => item.name_snapshot);
    const items = rawItems.map((item) => ({
      name: item.name_snapshot,
      nameMy: item.name_my_snapshot,
      quantity: item.quantity,
      lineTotalCents: item.line_total_cents,
      notes: item.special_instructions,
      modifiers: (item.order_item_modifiers ?? []).map((m) => ({
        name: m.name_snapshot,
        priceDelta: m.price_delta_snapshot,
      })),
    }));

    // Get driver name if assigned
    const driverName = order.assigned_driver_id
      ? (driverNameMap.get(order.assigned_driver_id) ?? undefined)
      : undefined;

    // Send the email
    const result = await sendEmail({
      to: profile.email,
      subject: `Your order is arriving today! - Order #${order.id.slice(0, 8).toUpperCase()}`,
      react: DeliveryReminder({
        customerName: profile.full_name ?? "Valued Customer",
        orderId: order.id,
        itemCount,
        itemNames,
        deliveryWindowStart: order.delivery_window_start ?? "",
        deliveryWindowEnd: order.delivery_window_end ?? "",
        address,
        specialInstructions: order.special_instructions ?? undefined,
        driverName,
        items,
        subtotalCents: order.subtotal_cents ?? undefined,
        deliveryFeeCents: order.delivery_fee_cents ?? undefined,
        taxCents: order.tax_cents ?? undefined,
        tipCents: order.tip_cents ?? undefined,
        discountCents: order.discount_cents ?? undefined,
        totalCents: order.total_cents ?? undefined,
        paymentMethod: order.payment_method ?? undefined,
      }),
      type: "delivery_reminder",
      orderId: order.id,
      userId: profile.id,
      idempotencyKey: `delivery-reminder-${order.id}-${today}`,
      mandatory: false, // Respects reminders preference
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
      logger.warn("Failed to send delivery reminder", {
        flowId: FLOW_ID,
        orderId: order.id,
      });
    }

    // Stagger sends (100ms) to stay under Resend's 10/s rate limit
    if (i < orders.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, STAGGER_DELAY_MS));
    }
  }

  // -----------------------------------------------
  // Step 6: Log summary and return
  // -----------------------------------------------
  logger.info("Delivery reminder cron completed", {
    flowId: FLOW_ID,
    api: "cron",
    sent,
    skipped,
    failed,
    total: orders.length,
  } as Record<string, unknown>);

  return NextResponse.json({
    sent,
    skipped,
    failed,
    total: orders.length,
  });
}
