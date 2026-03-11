/**
 * Admin Daily Digest Cron Endpoint
 *
 * Morning run (6 AM PT / 14:00 UTC): summarizes previous day's orders
 * Evening run (10 PM PT / 06:00 UTC): summarizes today's orders so far
 * Deduplicates via notification_logs keyed by date + period.
 */

import React from "react";
import { NextResponse } from "next/server";

import { AdminDailyDigest } from "@/emails/AdminDailyDigest";
import { getAdminEmails } from "@/lib/email/admin-recipients";
import { sendEmail } from "@/lib/email/send";
import { createServiceClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/utils/api-error";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, webhookLimiter, getClientIp } from "@/lib/rate-limit";

const CRON_SECRET = process.env.CRON_SECRET;
const STAGGER_DELAY_MS = 100;
const FLOW_ID = "admin-daily-digest";

// ===========================================
// AUTH GUARD
// ===========================================

function isAuthorized(request: Request): boolean {
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
// HELPERS
// ===========================================

function getDateRange(period: "morning" | "evening"): {
  start: string;
  end: string;
  label: string;
} {
  const now = new Date();

  if (period === "morning") {
    // Summarize yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split("T")[0];
    return {
      start: `${dateStr}T00:00:00`,
      end: `${dateStr}T23:59:59`,
      label: yesterday.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };
  }

  // Evening: summarize today so far
  const dateStr = now.toISOString().split("T")[0];
  return {
    start: `${dateStr}T00:00:00`,
    end: now.toISOString(),
    label: now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };
}

function detectPeriod(): "morning" | "evening" {
  const hour = new Date().getUTCHours();
  // 14:00 UTC = 6 AM PT (morning), 06:00 UTC = 10 PM PT (evening)
  return hour >= 10 && hour < 20 ? "morning" : "evening";
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
    route: "cron/admin-daily-digest",
  });
  if (rl.limited) return rl.response;

  // Determine period from query or auto-detect
  const url = new URL(request.url);
  const periodParam = url.searchParams.get("period");
  const period: "morning" | "evening" =
    periodParam === "morning" || periodParam === "evening" ? periodParam : detectPeriod();

  const supabase = createServiceClient();
  const today = new Date().toISOString().split("T")[0];
  const dedupeKey = `admin-digest-${today}-${period}`;

  // -----------------------------------------------
  // Step 1: Deduplicate — check if already sent today for this period
  // Admin emails are not logged to notification_logs (DB enum excludes admin types).
  // Use app_settings as a lightweight dedupe key store.
  // -----------------------------------------------
  const dedupeSettingKey = `cron_digest_sent_${dedupeKey}`;
  const { data: existingLog } = await supabase
    .from("app_settings")
    .select("key")
    .eq("key", dedupeSettingKey)
    .single();

  if (existingLog) {
    logger.info("Daily digest already sent for this period, skipping", {
      flowId: FLOW_ID,
      period,
      date: today,
    });
    return NextResponse.json({ sent: 0, skipped: true, reason: "already_sent" });
  }

  // -----------------------------------------------
  // Step 2: Get date range and query orders
  // -----------------------------------------------
  const { start, end, label } = getDateRange(period);

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(
      `
      id, status, total_cents, payment_method, user_id, placed_at,
      profiles!orders_user_id_fkey ( full_name ),
      order_items ( id )
    `
    )
    .gte("placed_at", start)
    .lte("placed_at", end)
    .order("placed_at", { ascending: false });

  if (ordersError) {
    logger.error("Failed to query orders for daily digest", {
      flowId: FLOW_ID,
      api: "cron",
    });
    logger.exception(ordersError, { flowId: FLOW_ID, api: "cron" });
    return apiError("INTERNAL_ERROR", "Failed to query orders", 500);
  }

  if (!orders || orders.length === 0) {
    logger.info("No orders found for daily digest period", {
      flowId: FLOW_ID,
      period,
      date: today,
    });
    return NextResponse.json({ sent: 0, totalOrders: 0, period });
  }

  // -----------------------------------------------
  // Step 3: Build aggregate stats
  // -----------------------------------------------
  const totalRevenueCents = orders.reduce((sum, o) => sum + (o.total_cents ?? 0), 0);

  const statusBreakdown: Record<string, number> = {
    pending_approval: 0,
    confirmed: 0,
    preparing: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
  };
  for (const order of orders) {
    const status = order.status ?? "unknown";
    statusBreakdown[status] = (statusBreakdown[status] ?? 0) + 1;
  }

  const orderSummaries = orders.map((order) => {
    const profile = order.profiles as unknown as { full_name: string | null } | null;
    const items = order.order_items as unknown as Array<{ id: string }> | null;
    return {
      id: order.id,
      customerName: profile?.full_name ?? "Unknown Customer",
      totalCents: order.total_cents ?? 0,
      status: order.status ?? "unknown",
      paymentMethod: order.payment_method ?? "stripe",
      itemCount: items?.length ?? 0,
    };
  });

  // -----------------------------------------------
  // Step 4: Get admin recipients and send
  // -----------------------------------------------
  const admins = await getAdminEmails();

  if (admins.length === 0) {
    logger.warn("No admin emails found for daily digest", { flowId: FLOW_ID });
    return NextResponse.json({ sent: 0, reason: "no_admins" });
  }

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < admins.length; i++) {
    const admin = admins[i];

    const result = await sendEmail({
      to: admin.email,
      subject: `Daily Order Digest — ${label}`,
      react: React.createElement(AdminDailyDigest, {
        period,
        dateLabel: label,
        totalOrders: orders.length,
        totalRevenueCents,
        statusBreakdown: statusBreakdown as AdminDailyDigestProps["statusBreakdown"],
        orders: orderSummaries,
      }),
      type: "admin_daily_digest",
      orderId: dedupeKey,
      userId: admin.id,
      mandatory: true,
      idempotencyKey: `${dedupeKey}-${admin.id}`,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
      logger.warn("Failed to send daily digest to admin", {
        flowId: FLOW_ID,
        adminId: admin.id,
      });
    }

    if (i < admins.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, STAGGER_DELAY_MS));
    }
  }

  // -----------------------------------------------
  // Step 5: Mark as sent in app_settings for dedupe on next cron run
  // -----------------------------------------------
  if (sent > 0) {
    await supabase.from("app_settings").insert({
      key: dedupeSettingKey,
      category: "cron",
      description: `Dedupe marker for admin digest cron — ${dedupeKey}`,
      value: { sent, period, date: today },
    });
  }

  // -----------------------------------------------
  // Step 6: Log summary
  // -----------------------------------------------
  logger.info("Admin daily digest cron completed", {
    flowId: FLOW_ID,
    api: "cron",
    period,
    totalOrders: orders.length,
    sent,
    failed,
  } as Record<string, unknown>);

  return NextResponse.json({
    sent,
    failed,
    totalOrders: orders.length,
    totalRevenueCents,
    period,
  });
}

// Import type for createElement usage
type AdminDailyDigestProps = import("@/emails/AdminDailyDigest").AdminDailyDigestProps;
