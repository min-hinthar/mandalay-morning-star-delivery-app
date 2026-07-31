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
import { MAX_RETRY_ATTEMPTS, RETRY_BASE_DELAY_MS } from "@/lib/email/constants";
import { getBusinessRules } from "@/lib/settings";
import { resolveRouteDayAwareness, routeDayHeadline } from "@/lib/delivery/route-awareness";
import { getZonedDateString, getZonedDayRangeUtc } from "@/lib/utils/delivery-dates";
import { createServiceClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/utils/api-error";
import { logger } from "@/lib/utils/logger";
import type { NotificationPrefs } from "@/components/ui/account/SettingsTab/settings-types";

const CRON_SECRET = process.env.CRON_SECRET;
const STAGGER_DELAY_MS = 100;
const FLOW_ID = "route-day-invite";

/**
 * Only nudge when the deadline is close enough to be actionable, but not past.
 *
 * The upper bound is deliberately kept well inside Resend's ~24h
 * Idempotency-Key TTL. This type writes no notification_logs row (the
 * notification_type enum has no value for it), so that key is the ONLY thing
 * preventing a duplicate send — a window wider than the TTL lets the key age
 * out while a customer is still inside the window, and they get mailed twice
 * for the same delivery date. Trade-off: with a once-daily cron, cutoffs
 * landing outside 2–20h are simply not nudged. A missed nudge is much cheaper
 * than a duplicate marketing email. Exact-once arrives with the enum migration.
 */
const MIN_HOURS_BEFORE_CUTOFF = 2;
const MAX_HOURS_BEFORE_CUTOFF = 20;

/**
 * SCHEDULING: this window is relative to when the cron FIRES, so the schedule
 * is not a free choice — pick it against the cutoff or a cohort silently lands
 * in `outsideWindow` on every run and is never nudged (no error, just zeros in
 * the summary).
 *
 * Cutoffs are 15:00 PT (`delivery_days.cutoff_hour`, default 15). Vercel crons
 * are UTC, so a fixed entry drifts an hour across DST — pick one that stays
 * inside 2–20h on BOTH sides of the shift. `"0 16 * * *"` = 09:00 PDT / 08:00
 * PST, i.e. 6h or 7h before a same-day cutoff. Comfortably inside on both.
 *
 * Avoid early-afternoon PT (under 2h out) and late evening PT (over 20h out to
 * the NEXT cutoff). Verify any new time with `?dryRun=1`, which reports the
 * `outsideWindow` count without sending: a run where that number equals the
 * candidate count means the schedule, not the audience, is wrong.
 */

/** Hard cap per run — matches the other marketing crons (win-back, abandoned-cart). */
const MAX_SENDS_PER_RUN = 100;

/**
 * `a***@domain.com` — the dry run is for checking WHO is in the audience by
 * shape (right route, right cutoff, right count), which the headline and date
 * already answer. Full addresses would turn a pasted dry-run output into a
 * customer-list leak, and operators paste these into chat.
 */
function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  return `${email[0]}***${email.slice(at)}`;
}

/**
 * Matches the repo's only other cron (payment-reconciliation). 60s is the
 * Hobby-plan ceiling and Vercel silently CLAMPS anything higher, so a larger
 * value here would be a bet on the plan tier rather than a guarantee.
 */
export const maxDuration = 60;

/**
 * Wall-clock budget for the send loop, with headroom under maxDuration.
 *
 * Serial sends + stagger + Resend retries scale with audience size, so a big
 * enough run WILL eventually reach the timeout — and being killed mid-loop is
 * silent: no summary, no log line, no way to tell a truncated run from a
 * complete one. Stopping ourselves instead turns that into a clean exit that
 * reports `remaining`. Safe to cut short: the stable idempotency key means a
 * re-run inside the notice window re-sends to nobody who already got one.
 *
 * The budget must leave room for the WORST-CASE next send, not the typical one:
 * sendEmail retries 3× with `attempt * RETRY_BASE_DELAY_MS` backoff, so one
 * fully-failing recipient sleeps 10s + 20s = 30s. Checking a 45s budget would
 * happily start a send at 44s that finishes at 74s — past maxDuration, killed
 * mid-loop, exactly the silent truncation this guard exists to prevent. The
 * budget is therefore maxDuration minus that worst case, and `startedAt` is
 * stamped at request entry so slow setup queries eat into it rather than being
 * free.
 */
const WORST_CASE_SEND_MS =
  MAX_RETRY_ATTEMPTS * (MAX_RETRY_ATTEMPTS - 1) * (RETRY_BASE_DELAY_MS / 2);
const SEND_BUDGET_MS = maxDuration * 1000 - WORST_CASE_SEND_MS - 5_000;

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
  /** Persisted drive distance, or null when never measured. */
  distanceMiles: number | null;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return apiError("UNAUTHORIZED", "Unauthorized", 401);

  // Stamped at request ENTRY, not at the send loop: the audience queries run
  // before it, and on a slow Supabase response those seconds are real budget
  // already spent. Starting the clock at the loop would hand them back for free
  // and let the invocation overrun maxDuration anyway.
  const startedAt = Date.now();
  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";
  const supabase = createServiceClient();

  try {
    const rules = await getBusinessRules();
    if (rules.deliveryDays.filter((d) => d.isActive).length === 0) {
      return NextResponse.json({ ok: true, skipped: "no active delivery days" });
    }

    // ---- Audience: default addresses with real coords -----------------------
    // Deliberately NOT filtered to coordinate-bearing rows in SQL. Dropping
    // null-coord rows before ordering would make a legacy DEFAULT address with
    // no coords vanish, and the first surviving row — some older secondary
    // address — would silently stand in for it. The customer would then be
    // promised a route based on somewhere they no longer order from. Fetch all
    // and decide in code, so an unplaceable default suppresses the customer
    // instead. `created_at` breaks ties that `is_default` alone leaves
    // unordered, making the pick deterministic run-to-run.
    const { data: addresses, error: addrError } = await supabase
      .from("addresses")
      .select("user_id, lat, lng, is_default, created_at, distance_miles")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (addrError) {
      logger.exception(addrError, { flowId: FLOW_ID, api: "cron" });
      return apiError("INTERNAL_ERROR", "Failed to load addresses", 500);
    }

    // First address per user wins (is_default first, then newest). If that one
    // has no coords we record the user as unplaceable rather than falling
    // through to an older address — see the query comment.
    const coordsByUser = new Map<
      string,
      { lat: number; lng: number; distanceMiles: number | null }
    >();
    const seenUsers = new Set<string>();
    let skippedUnplaceable = 0;
    for (const a of addresses ?? []) {
      if (seenUsers.has(a.user_id)) continue;
      seenUsers.add(a.user_id);
      if (a.lat == null || a.lng == null) {
        skippedUnplaceable++;
        continue;
      }
      coordsByUser.set(a.user_id, {
        lat: a.lat,
        lng: a.lng,
        distanceMiles: (a as { distance_miles?: number | null }).distance_miles ?? null,
      });
    }
    if (coordsByUser.size === 0) return NextResponse.json({ ok: true, candidates: 0, sent: 0 });

    const userIds = [...coordsByUser.keys()];

    const [{ data: profiles, error: profilesErr }, { data: settings, error: settingsErr }] =
      await Promise.all([
        supabase.from("profiles").select("id, email, full_name").in("id", userIds),
        supabase
          .from("customer_settings")
          .select("user_id, notification_prefs")
          .in("user_id", userIds),
      ]);

    // Fail CLOSED on the preferences read. `settings ?? []` on an error would
    // yield an EMPTY opted-out set, i.e. "nobody opted out" — so a transient DB
    // or permissions failure would mail promotional email to customers who
    // explicitly disabled marketing. sendEmail's own per-recipient check can't
    // save us either: it swallows its query error and proceeds. Consent is not
    // something to guess at, so abort the run instead.
    if (settingsErr) {
      logger.exception(settingsErr, { flowId: FLOW_ID, api: "cron" });
      return apiError("INTERNAL_ERROR", "Failed to load marketing preferences", 500);
    }
    if (profilesErr) {
      logger.exception(profilesErr, { flowId: FLOW_ID, api: "cron" });
      return apiError("INTERNAL_ERROR", "Failed to load profiles", 500);
    }

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
    // Count opt-outs that were otherwise MAILABLE (had coords + an address), so
    // this bucket is comparable to the other skipped.* counters, which all count
    // real candidates dropped rather than the whole opted-out population.
    let optedOutCandidates = 0;
    // Counted, not silently dropped: the run summary is this type's ONLY
    // operator signal, so an audience smaller than the address list has to be
    // explainable. Without this the numbers just don't reconcile.
    let noEmailCandidates = 0;
    for (const p of profiles ?? []) {
      const coords = coordsByUser.get(p.id);
      if (!coords) continue;
      if (!p.email) {
        noEmailCandidates++;
        continue;
      }
      if (optedOut.has(p.id)) {
        optedOutCandidates++;
        continue;
      }
      candidates.push({
        userId: p.id,
        email: p.email,
        name: p.full_name || "there",
        lat: coords.lat,
        lng: coords.lng,
        distanceMiles: coords.distanceMiles,
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
    const skipped = {
      noRun: 0,
      outsideWindow: 0,
      alreadyOrdered: 0,
      optedOut: optedOutCandidates,
      noEmail: noEmailCandidates,
      unplaceableDefaultAddress: skippedUnplaceable,
    };

    for (const c of candidates) {
      const awareness = resolveRouteDayAwareness({
        coords: { lat: c.lat, lng: c.lng },
        distanceMiles: c.distanceMiles,
        maxRadiusMiles: rules.maxDeliveryRadiusMiles,
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
      // Bound to the planned delivery dates' UTC range — otherwise this pulls
      // every non-cancelled order these customers have ever placed.
      const ranges = dates.map(getZonedDayRangeUtc);
      const startUtc = ranges.map((r) => r.startUtc).sort()[0];
      const endUtc = ranges.map((r) => r.endUtc).sort()[ranges.length - 1];
      const { data: existing, error: existingErr } = await supabase
        .from("orders")
        .select("user_id, delivery_window_start, status")
        .in("user_id", [...new Set(planned.map((p) => p.c.userId))])
        .gte("delivery_window_start", startUtc)
        .lte("delivery_window_start", endUtc)
        .neq("status", "cancelled");
      // Fail CLOSED. Swallowing this error leaves `ordered` empty, which filters
      // NOBODY and mails customers who already ordered — the exact guardrail
      // this job exists to honour. Abort the run instead.
      if (existingErr) {
        logger.exception(existingErr, { flowId: FLOW_ID, api: "cron" });
        return apiError("INTERNAL_ERROR", "Failed to load existing orders", 500);
      }
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
          email: maskEmail(p.c.email),
          headline: p.headline,
          cutoff: p.cutoffText,
          deliveryDate: p.date,
        })),
      });
    }

    // Real dishes with hostable photos — shared across the whole run.
    const featuredItems = await fetchSuggestedItems(supabase, []);

    let sent = 0;
    let suppressed = 0;
    let attempted = 0;
    for (let i = 0; i < toSend.length; i++) {
      if (Date.now() - startedAt > SEND_BUDGET_MS) {
        logger.warn("Route-day invite run hit its time budget — stopping early", {
          flowId: FLOW_ID,
          attempted,
          remaining: toSend.length - attempted,
        });
        break;
      }
      attempted++;
      const p = toSend[i];
      try {
        const result = await sendEmail({
          to: p.c.email,
          subject: p.headline,
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
        // `success` alone can't answer "did mail go out?" — the admin kill
        // switch and an opt-out both short-circuit to success WITHOUT calling
        // Resend. Counting those as sent would report a full run while mailing
        // nobody, and this type writes no notification_logs row to contradict it.
        if (result.suppressed) suppressed++;
        else if (result.success) sent++;
      } catch (err) {
        logger.exception(err, { flowId: FLOW_ID, userId: p.c.userId });
      }
      if (i < toSend.length - 1) {
        await new Promise((r) => setTimeout(r, STAGGER_DELAY_MS));
      }
    }

    // sendEmail returns {success:false} after exhausting retries WITHOUT
    // throwing, so a run where every send hard-fails would otherwise report
    // sent: 0 — indistinguishable from "everyone was suppressed". This type
    // writes no notification_logs row, so this summary is the only structured
    // signal an operator gets.
    //
    // `failed` counts only sends we actually ATTEMPTED — anything left after an
    // early stop is `remaining`, not a failure, and conflating them would make
    // a healthy budget-limited run look like a Resend outage.
    const failed = attempted - sent - suppressed;
    const remaining = toSend.length - attempted;
    logger.info("Route-day invites processed", {
      flowId: FLOW_ID,
      candidates: candidates.length,
      planned: toSend.length,
      sent,
      suppressed,
      failed,
      remaining,
    });
    return NextResponse.json({
      ok: true,
      candidates: candidates.length,
      sent,
      suppressed,
      failed,
      remaining,
      skipped,
    });
  } catch (error) {
    logger.exception(error, { flowId: FLOW_ID, api: "cron" });
    return apiError("INTERNAL_ERROR", "Route-day invite run failed", 500);
  }
}
