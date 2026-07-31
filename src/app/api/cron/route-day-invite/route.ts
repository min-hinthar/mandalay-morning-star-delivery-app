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
import { getBusinessRules, getDeliveryPricingConfig } from "@/lib/settings";
import { serviceableCeilingMiles } from "@/lib/utils/order";
import { resolveRouteDayAwareness, routeDayHeadline } from "@/lib/delivery/route-awareness";
import { getZonedDateString, getZonedDayRangeUtc } from "@/lib/utils/delivery-dates";
import { createServiceClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/utils/api-error";
import { logger } from "@/lib/utils/logger";
import type { NotificationPrefs } from "@/components/ui/account/SettingsTab/settings-types";
import type { DeliveryDayConfig, DeliveryZoneConfig } from "@/types/delivery";

const CRON_SECRET = process.env.CRON_SECRET;
const STAGGER_DELAY_MS = 100;
const FLOW_ID = "route-day-invite";

/**
 * Only nudge when the deadline is close enough to be actionable, but not past.
 *
 * The upper bound is deliberately kept well inside Resend's ~24h
 * Idempotency-Key TTL, because that key is still the ONLY thing preventing a
 * duplicate send — a window wider than the TTL lets the key age out while a
 * customer is still inside the window, and they get mailed twice for the same
 * delivery date. Trade-off: with a once-daily cron, cutoffs landing outside
 * 2–20h are simply not nudged. A missed nudge is much cheaper than a duplicate
 * marketing email.
 *
 * The notification_type enum now HAS a route_day_invite value, so each send
 * finally writes a notification_logs row — but that alone changes nothing
 * here. A written row is an audit trail, not a guard: widening this window
 * safely needs a pre-send READ of notification_logs (does a route_day_invite
 * row already exist for this user + delivery date?) to replace the Resend key
 * as the dedupe mechanism. Until that check exists, keep the cap inside the
 * TTL — the row is a necessary condition for exact-once, not a sufficient one.
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
 *
 * The sleeps were only HALF the worst case. Each attempt also makes a request,
 * and until a per-attempt ceiling existed that request was unbounded — so no
 * reserve could ever be sufficient and this arithmetic was quietly optimistic.
 * The request time is now bounded too, and counted here.
 *
 * ATTEMPT_TIMEOUT_MS is deliberately tighter than sendEmail's 15s default. That
 * default is generous because aborting a request Resend may already have
 * ACCEPTED and then retrying can DUPLICATE mail for a caller with no
 * idempotency key. Every send in this loop carries a stable
 * `route-day-<date>-<userId>` key, so a retry after an abort is deduped by
 * Resend — which is exactly what makes a tight ceiling safe HERE and not in
 * general. 3s also keeps the reserve small enough to leave a usable send
 * window: at 15s the reserve would be 30s + 45s = 75s, past maxDuration
 * entirely, and the loop would refuse to send anything at all.
 */
const ATTEMPT_TIMEOUT_MS = 3_000;
const WORST_CASE_BACKOFF_MS =
  MAX_RETRY_ATTEMPTS * (MAX_RETRY_ATTEMPTS - 1) * (RETRY_BASE_DELAY_MS / 2);
// The trailing stagger sleep is part of a recipient's worst case too — without
// it here, the pathological last send (budget-boundary start + three full-3s
// aborts + the whole flat headroom spent on renders/reads) lands exactly AT
// maxDuration and the stagger tips it past. Counting it buys the margin the
// headroom comment claims.
const WORST_CASE_SEND_MS =
  WORST_CASE_BACKOFF_MS + MAX_RETRY_ATTEMPTS * ATTEMPT_TIMEOUT_MS + STAGGER_DELAY_MS;
// The flat headroom absorbs the per-recipient work that is NOT under the
// attempt ceiling: sendEmail renders the template twice (HTML + plain text)
// and does two Supabase reads (kill switch + prefs) before the bounded call,
// plus the response/log writes after it. All sub-second in practice, so 5s
// covers the one last-started send this reserve exists for. If any of that
// ever grows past ~1s per recipient (a heavy template, a slow region), grow
// this — the budget is only a hard ceiling while everything outside the
// bounded call fits in here.
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

interface AddressRow {
  id: string;
  user_id: string;
  lat: number | null;
  lng: number | null;
  is_default: boolean | null;
  created_at: string | null;
  distance_miles: number | null;
  is_verified: boolean | null;
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
    // Verify the email kill switch BEFORE building an audience. sendEmail
    // checks it too, but that check fails OPEN — it swallows the query error
    // and proceeds — which is a reasonable default for one transactional email
    // and the wrong one for a bulk campaign: a permissions blip on app_settings
    // would mail everybody while the operator believes sending is disabled.
    const { data: killSwitch, error: killSwitchErr } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "email_sending_enabled")
      .maybeSingle();
    if (killSwitchErr) {
      logger.exception(killSwitchErr, { flowId: FLOW_ID, api: "cron" });
      return apiError("INTERNAL_ERROR", "Could not verify the email kill switch", 500);
    }
    // Only short-circuit a REAL send. A dry run inspects eligibility and mails
    // nobody, and the documented activation workflow is to preview the audience
    // before switching sending on — blocking it here would force an operator to
    // enable outbound email just to look.
    if (killSwitch?.value === false && !dryRun) {
      logger.info("Email sending disabled — skipping route-day run", { flowId: FLOW_ID });
      return NextResponse.json({ ok: true, skipped: "email sending disabled" });
    }

    // The schedule and the zone bearings ARE the claim this email makes, so
    // both are read directly with real error handling rather than taken from
    // getBusinessRules. That helper falls back per-source — `if (zonesResult.data)`
    // — and caches the result for five minutes, so a cache populated during a
    // transient zones failure serves DEFAULT bearings for the next five minutes
    // while a fresh probe of delivery_days still succeeds. This cron would then
    // send route-specific invitations based on bearings the operator never
    // configured. Reading both here means a failure aborts the run instead.
    const [daysRes, zonesRes] = await Promise.all([
      supabase
        .from("delivery_days")
        .select(
          "id, day_of_week, is_active, cutoff_day, cutoff_hour, delivery_fee_cents, display_order, direction"
        ),
      supabase.from("delivery_zones").select("id, direction, bearing_start, bearing_end"),
    ]);
    if (daysRes.error) {
      logger.exception(daysRes.error, { flowId: FLOW_ID, api: "cron" });
      return apiError("INTERNAL_ERROR", "Could not verify the delivery schedule", 500);
    }
    if (zonesRes.error) {
      logger.exception(zonesRes.error, { flowId: FLOW_ID, api: "cron" });
      return apiError("INTERNAL_ERROR", "Could not verify the delivery zones", 500);
    }

    const verifiedDays: DeliveryDayConfig[] = (daysRes.data ?? []).map((row) => ({
      id: row.id,
      dayOfWeek: row.day_of_week,
      isActive: row.is_active,
      cutoffDay: row.cutoff_day,
      cutoffHour: row.cutoff_hour,
      deliveryFeeCents: row.delivery_fee_cents,
      displayOrder: row.display_order,
      direction: (row.direction || "all") as DeliveryDayConfig["direction"],
    }));
    const verifiedZones: DeliveryZoneConfig[] = (zonesRes.data ?? []).map((row) => ({
      id: row.id,
      direction: row.direction as DeliveryZoneConfig["direction"],
      bearingStart: row.bearing_start,
      bearingEnd: row.bearing_end,
      referenceCities: [],
    }));

    // Pricing only — a stale fee band can't make this email promise a route
    // that doesn't exist, which is the failure mode that matters here.
    const rules = await getBusinessRules();

    // The distance past which checkout answers OUT_OF_COVERAGE. Not
    // maxDeliveryRadiusMiles on its own — that ceiling only applies while
    // long-distance delivery is switched on.
    if (verifiedDays.filter((d) => d.isActive).length === 0) {
      return NextResponse.json({ ok: true, skipped: "no active delivery days" });
    }

    const serviceableCeiling = serviceableCeilingMiles(getDeliveryPricingConfig(rules));

    // ---- Audience: default addresses with real coords -----------------------
    // Deliberately NOT filtered to coordinate-bearing rows in SQL. Dropping
    // null-coord rows before ordering would make a legacy DEFAULT address with
    // no coords vanish, and the first surviving row — some older secondary
    // address — would silently stand in for it. The customer would then be
    // promised a route based on somewhere they no longer order from. Fetch all
    // and decide in code, so an unplaceable default suppresses the customer
    // instead. `created_at` breaks ties that `is_default` alone leaves
    // unordered, making the pick deterministic run-to-run.
    // Paged. PostgREST caps a select at max_rows (1000, supabase/config.toml),
    // and because the ordering is GLOBAL rather than per-user, an unpaged query
    // past that cap wouldn't just truncate — every customer sorting after row
    // 1000 would vanish from the audience entirely, identically on every run,
    // with no error. `id` is the stable cursor: the two ordering columns aren't
    // unique, so paging on them could skip or repeat rows at a page boundary.
    const ADDRESS_PAGE_SIZE = 1000;
    const addresses: AddressRow[] = [];
    for (let page = 0; ; page++) {
      const { data, error: addrError } = await supabase
        .from("addresses")
        .select("id, user_id, lat, lng, is_default, created_at, distance_miles, is_verified")
        .order("id", { ascending: true })
        .range(page * ADDRESS_PAGE_SIZE, (page + 1) * ADDRESS_PAGE_SIZE - 1);

      if (addrError) {
        logger.exception(addrError, { flowId: FLOW_ID, api: "cron" });
        return apiError("INTERNAL_ERROR", "Failed to load addresses", 500);
      }
      if (!data || data.length === 0) break;
      addresses.push(...(data as AddressRow[]));
      if (data.length < ADDRESS_PAGE_SIZE) break;
    }
    // Ordering that the page cursor can't provide, applied once we hold them
    // all: default first, then newest.
    addresses.sort(
      (a, b) =>
        Number(b.is_default) - Number(a.is_default) ||
        (b.created_at ?? "").localeCompare(a.created_at ?? "")
    );

    // First address per user wins (is_default first, then newest). If that one
    // has no coords we record the user as unplaceable rather than falling
    // through to an older address — see the query comment.
    const coordsByUser = new Map<
      string,
      { lat: number; lng: number; distanceMiles: number | null }
    >();
    const seenUsers = new Set<string>();
    let skippedUnplaceable = 0;
    for (const a of addresses) {
      if (seenUsers.has(a.user_id)) continue;
      seenUsers.add(a.user_id);
      // Unverified is a hard checkout reject ("Address not verified for
      // delivery" → OUT_OF_COVERAGE), so an invite built on one would be
      // unorderable. Treated like an unplaceable default rather than falling
      // through to an older address.
      if (a.lat == null || a.lng == null || !a.is_verified) {
        skippedUnplaceable++;
        continue;
      }
      coordsByUser.set(a.user_id, {
        lat: a.lat,
        lng: a.lng,
        distanceMiles: a.distance_miles ?? null,
      });
    }
    if (coordsByUser.size === 0) return NextResponse.json({ ok: true, candidates: 0, sent: 0 });

    const userIds = [...coordsByUser.keys()];

    // Chunked. PostgREST caps every select at max_rows (1000), silently — and
    // for the PREFERENCES read that is a consent bug, not just truncation: a
    // dropped row reads as "no preferences on file", which this code (correctly,
    // for a genuinely absent row) treats as opted IN. Someone who set
    // marketing:false would be mailed. Chunking the `.in()` keeps every page
    // under the cap so absence means absence.
    const ID_CHUNK = 500;
    const profiles: { id: string; email: string | null; full_name: string | null }[] = [];
    const settings: { user_id: string; notification_prefs: unknown }[] = [];
    for (let i = 0; i < userIds.length; i += ID_CHUNK) {
      const chunk = userIds.slice(i, i + ID_CHUNK);
      const [{ data: profileRows, error: profilesErr }, { data: settingRows, error: settingsErr }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, email, full_name")
            .eq("role", "customer")
            .in("id", chunk),
          supabase
            .from("customer_settings")
            .select("user_id, notification_prefs")
            .in("user_id", chunk),
        ]);
      if (settingsErr) {
        logger.exception(settingsErr, { flowId: FLOW_ID, api: "cron" });
        return apiError("INTERNAL_ERROR", "Failed to load marketing preferences", 500);
      }
      if (profilesErr) {
        logger.exception(profilesErr, { flowId: FLOW_ID, api: "cron" });
        return apiError("INTERNAL_ERROR", "Failed to load profiles", 500);
      }
      profiles.push(...(profileRows ?? []));
      settings.push(...(settingRows ?? []));
    }

    // Marketing is opt-OUT (absent row ⇒ opted in, matching sendEmail's rule),
    // but we filter here too so the dry run reports the true audience.
    const optedOut = new Set(
      settings
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
    for (const p of profiles) {
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
        maxRadiusMiles: serviceableCeiling,
        deliveryDays: verifiedDays,
        deliveryZones: verifiedZones,
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
      // Chunked for the same max_rows reason as the audience reads, and it
      // matters more here: this result has no deterministic ordering, so a
      // truncated page could drop the ONLY order row for a customer still in
      // `toSend` — and we would invite someone who already ordered, the one
      // thing this job promises never to do.
      const existing: { user_id: string; delivery_window_start: string | null }[] = [];
      const plannedUserIds = [...new Set(planned.map((p) => p.c.userId))];
      for (let i = 0; i < plannedUserIds.length; i += 500) {
        const chunk = plannedUserIds.slice(i, i + 500);
        // Pages the ROWS too, not just the user ids. Chunking users alone still
        // assumed 500 users produce under max_rows orders — but a customer can
        // have several qualifying orders across the covered dates, so a chunk
        // could overflow the cap and drop the only row proving someone already
        // ordered. `id` gives the stable cursor.
        for (let page = 0; ; page++) {
          const { data: rows, error: existingErr } = await supabase
            .from("orders")
            .select("id, user_id, delivery_window_start, status")
            .in("user_id", chunk)
            .gte("delivery_window_start", startUtc)
            .lte("delivery_window_start", endUtc)
            .in("status", [
              "pending_approval",
              "confirmed",
              "preparing",
              "out_for_delivery",
              "delivered",
            ])
            .order("id", { ascending: true })
            .range(page * 1000, (page + 1) * 1000 - 1);
          if (existingErr) {
            logger.exception(existingErr, { flowId: FLOW_ID, api: "cron" });
            return apiError("INTERNAL_ERROR", "Failed to load existing orders", 500);
          }
          if (!rows || rows.length === 0) break;
          existing.push(...rows);
          if (rows.length < 1000) break;
        }
      }
      const ordered = new Set(
        existing
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
    // Constant seed, not a random pick. fetchSuggestedItems already narrows to
    // SUGGESTION_COUNT, so there is no per-recipient variety to be had — but
    // there IS a payload-stability requirement: every recipient's idempotency
    // key must render the same bytes on a re-run, or Resend rejects the reused
    // key. A fixed seed makes the pool deterministic across runs; sharing one
    // pool across recipients is fine because each key only needs to be stable
    // against ITSELF.
    const featuredItems = await fetchSuggestedItems(supabase, [], "route-day-invite");

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
          // No order exists yet. This is a synthetic handle for Resend's
          // `order_id` tag only — sendEmail nulls it before it reaches
          // notification_logs.order_id, which is a uuid column.
          orderId: `route-${p.date}`,
          userId: p.c.userId,
          // Stable key = THE dedupe. The notification_logs row this type now
          // writes is an audit trail, not a guard: nothing reads it before
          // sending. So the key is still what makes a re-run for the same
          // customer + delivery date one send.
          idempotencyKey: `route-day-${p.date}-${p.c.userId}`,
          // Safe to tighten only because of the stable key on the line above:
          // an aborted-then-retried request is deduped by Resend rather than
          // mailing the customer twice. SEND_BUDGET_MS reserves exactly this.
          attemptTimeoutMs: ATTEMPT_TIMEOUT_MS,
        });
        // `success` alone can't answer "did mail go out?" — the admin kill
        // switch and an opt-out both short-circuit to success WITHOUT calling
        // Resend. Counting those as sent would report a full run while mailing
        // nobody, and a suppressed send returns before Step 5, so no
        // notification_logs row exists to contradict it either.
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
    // sent: 0 — indistinguishable from "everyone was suppressed". This summary
    // is the RUN-level signal: notification_logs now records the sends that
    // happened, but a suppressed or never-attempted recipient writes no row at
    // all, so the log alone can't tell "mailed nobody" from "mailed no one
    // yet". Only these counters carry that.
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
