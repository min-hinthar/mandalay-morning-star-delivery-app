/**
 * Route-Day Invite Cron — "we're driving your way".
 *
 * Emails customers whose saved address sits on a delivery run whose ordering
 * deadline is imminent, with the day, the cutoff, and real dish photos. No
 * discount, no order counts, no social proof — the claim is purely the schedule,
 * so it's true and non-identifying at any volume.
 *
 * NOT registered in vercel.json on purpose: this is the only outbound MARKETING
 * send in the app, so it stays dormant until the owner adds a schedule entry.
 * Verify the audience first with `?dryRun=1`, which reports exactly who would be
 * mailed without sending anything.
 *
 * Suppressions, in order: marketing opt-out, no deliverable email, no saved
 * coords, address not served by any upcoming run, cutoff outside the notice
 * window, and customers who ALREADY ordered for that delivery date.
 */

import { NextResponse } from "next/server";
import React from "react";

import { RouteDayInvite } from "@/emails/RouteDayInvite";
import { fetchSuggestedItems } from "@/lib/email/suggestions";
import { sendEmail } from "@/lib/email/send";
import { getBusinessRules } from "@/lib/settings";
import { resolveRouteDayAwareness, routeDayHeadline } from "@/lib/delivery/route-awareness";
import { getZonedDateString } from "@/lib/utils/delivery-dates";
import { createServiceClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/utils/api-error";
import { logger } from "@/lib/utils/logger";
import type { NotificationPrefs } from "@/components/ui/account/SettingsTab/settings-types";

const CRON_SECRET = process.env.CRON_SECRET;
const STAGGER_DELAY_MS = 100;
const FLOW_ID = "route-day-invite";

/** Only nudge when the deadline is close enough to be actionable, but not past. */
const MIN_HOURS_BEFORE_CUTOFF = 2;
const MAX_HOURS_BEFORE_CUTOFF = 36;

/** Hard cap per run — a runaway audience query can never mass-mail. */
const MAX_SENDS_PER_RUN = 200;

function isAuthorized(request: Request): boolean {
  // Fail CLOSED: without a secret nobody may trigger a marketing send.
  if (!CRON_SECRET) {
    logger.error("CRON_SECRET is not configured — rejecting cron request", {
      flowId: FLOW_ID,
      api: "cron",
    });
    return false;
  }
  return request.headers.get("authorization") === `Bearer ${CRON_SECRET}`;
}

interface Candidate {
  userId: string;
  email: string;
  name: string;
  lat: number;
  lng: number;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return apiError("UNAUTHORIZED", "Unauthorized", 401);

  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";
  const supabase = createServiceClient();

  try {
    const rules = await getBusinessRules();
    if (rules.deliveryDays.filter((d) => d.isActive).length === 0) {
      return NextResponse.json({ ok: true, skipped: "no active delivery days" });
    }

    // ---- Audience: default addresses with real coords -----------------------
    const { data: addresses, error: addrError } = await supabase
      .from("addresses")
      .select("user_id, lat, lng, is_default")
      .not("lat", "is", null)
      .not("lng", "is", null)
      .order("is_default", { ascending: false });

    if (addrError) {
      logger.exception(addrError, { flowId: FLOW_ID, api: "cron" });
      return apiError("INTERNAL_ERROR", "Failed to load addresses", 500);
    }

    // First address per user wins (is_default ordered first).
    const coordsByUser = new Map<string, { lat: number; lng: number }>();
    for (const a of addresses ?? []) {
      if (a.lat == null || a.lng == null) continue;
      if (!coordsByUser.has(a.user_id)) coordsByUser.set(a.user_id, { lat: a.lat, lng: a.lng });
    }
    if (coordsByUser.size === 0) return NextResponse.json({ ok: true, candidates: 0, sent: 0 });

    const userIds = [...coordsByUser.keys()];

    const [{ data: profiles }, { data: settings }] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name").in("id", userIds),
      supabase
        .from("customer_settings")
        .select("user_id, notification_prefs")
        .in("user_id", userIds),
    ]);

    // Marketing is opt-OUT (absent row ⇒ opted in, matching sendEmail's rule),
    // but we filter here too so the dry run reports the true audience.
    const optedOut = new Set(
      (settings ?? [])
        .filter(
          (s) => (s.notification_prefs as unknown as NotificationPrefs | null)?.marketing === false
        )
        .map((s) => s.user_id)
    );

    const candidates: Candidate[] = [];
    for (const p of profiles ?? []) {
      const coords = coordsByUser.get(p.id);
      if (!coords || !p.email || optedOut.has(p.id)) continue;
      candidates.push({
        userId: p.id,
        email: p.email,
        name: p.full_name || "there",
        lat: coords.lat,
        lng: coords.lng,
      });
    }

    // ---- Resolve each customer's next run + the notice window ---------------
    const now = new Date();
    type Planned = {
      c: Candidate;
      headline: string;
      cutoffText: string;
      dayName: string;
      date: string;
    };
    const planned: Planned[] = [];
    const skipped = { noRun: 0, outsideWindow: 0, alreadyOrdered: 0, optedOut: optedOut.size };

    for (const c of candidates) {
      const awareness = resolveRouteDayAwareness({
        coords: { lat: c.lat, lng: c.lng },
        deliveryDays: rules.deliveryDays,
        deliveryZones: rules.deliveryZones,
        now,
      });
      if (!awareness) {
        skipped.noRun++;
        continue;
      }
      const hoursToCutoff = (awareness.cutoffAt.getTime() - now.getTime()) / 3_600_000;
      if (hoursToCutoff < MIN_HOURS_BEFORE_CUTOFF || hoursToCutoff > MAX_HOURS_BEFORE_CUTOFF) {
        skipped.outsideWindow++;
        continue;
      }
      planned.push({
        c,
        headline: routeDayHeadline(awareness),
        cutoffText: awareness.cutoffText,
        dayName: awareness.dayName,
        date: awareness.deliveryDateString,
      });
    }

    // ---- Never nudge someone who already ordered for that date --------------
    const dates = [...new Set(planned.map((p) => p.date))];
    if (dates.length > 0) {
      const { data: existing } = await supabase
        .from("orders")
        .select("user_id, delivery_window_start, status")
        .in("user_id", [...new Set(planned.map((p) => p.c.userId))])
        .neq("status", "cancelled");
      const ordered = new Set(
        (existing ?? [])
          .filter((o) => o.delivery_window_start)
          // delivery_window_start is timestamptz returned in UTC; the planned
          // date is LA-zoned. Slicing the UTC string would roll an evening PT
          // window (>= 17:00 PT = 00:00 UTC next day) to the following date and
          // silently miss the match — re-nudging someone who already ordered.
          .map((o) => `${o.user_id}:${getZonedDateString(new Date(o.delivery_window_start!))}`)
      );
      for (let i = planned.length - 1; i >= 0; i--) {
        if (ordered.has(`${planned[i].c.userId}:${planned[i].date}`)) {
          planned.splice(i, 1);
          skipped.alreadyOrdered++;
        }
      }
    }

    const toSend = planned.slice(0, MAX_SENDS_PER_RUN);
    if (planned.length > toSend.length) {
      logger.warn("Route-day invite capped — some candidates not mailed this run", {
        flowId: FLOW_ID,
        capped: planned.length - toSend.length,
      });
    }

    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        candidates: candidates.length,
        wouldSend: toSend.length,
        skipped,
        preview: toSend.slice(0, 20).map((p) => ({
          email: p.c.email,
          headline: p.headline,
          cutoff: p.cutoffText,
          deliveryDate: p.date,
        })),
      });
    }

    // Real dishes with hostable photos — shared across the whole run.
    const featuredItems = await fetchSuggestedItems(supabase, []);

    let sent = 0;
    for (let i = 0; i < toSend.length; i++) {
      const p = toSend[i];
      try {
        const result = await sendEmail({
          to: p.c.email,
          subject: `${p.headline} — ${p.cutoffText}`,
          react: React.createElement(RouteDayInvite, {
            customerName: p.c.name,
            headline: p.headline,
            cutoffText: p.cutoffText,
            dayName: p.dayName,
            featuredItems,
          }),
          type: "route_day_invite",
          // No order exists yet; orderId is only used for tagging/logging and
          // this type is not written to notification_logs.
          orderId: `route-${p.date}`,
          userId: p.c.userId,
          // Stable key = the dedupe (no notification_logs row for this type):
          // a re-run for the same customer + delivery date is one send.
          idempotencyKey: `route-day-${p.date}-${p.c.userId}`,
        });
        if (result.success) sent++;
      } catch (err) {
        logger.exception(err, { flowId: FLOW_ID, userId: p.c.userId });
      }
      if (i < toSend.length - 1) {
        await new Promise((r) => setTimeout(r, STAGGER_DELAY_MS));
      }
    }

    logger.info("Route-day invites processed", {
      flowId: FLOW_ID,
      candidates: candidates.length,
      planned: toSend.length,
      sent,
    });
    return NextResponse.json({ ok: true, candidates: candidates.length, sent, skipped });
  } catch (error) {
    logger.exception(error, { flowId: FLOW_ID, api: "cron" });
    return apiError("INTERNAL_ERROR", "Route-day invite run failed", 500);
  }
}
