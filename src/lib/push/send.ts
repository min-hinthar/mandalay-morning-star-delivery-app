import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@mandalaymorningstar.com";

let vapidConfigured: boolean | null = null;

function ensureVapid(): boolean {
  if (vapidConfigured !== null) return vapidConfigured;
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    vapidConfigured = false;
    return false;
  }
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
    vapidConfigured = true;
  } catch {
    vapidConfigured = false;
  }
  return vapidConfigured;
}

export interface PushPayload {
  title: string;
  body: string;
  /** Where clicking the notification should take the user (path). */
  url?: string;
  /** Coalescing tag so updates for the same order replace each other. */
  tag?: string;
}

/** True only when VAPID keys are present — i.e. push can actually be delivered. */
export function isPushConfigured(): boolean {
  return ensureVapid();
}

/**
 * Best-effort push to every device a user has subscribed. A no-op (returns 0)
 * when VAPID keys aren't configured, so callers can fire it unconditionally.
 * Prunes subscriptions the push service reports as gone (404/410).
 */
export async function sendPushToUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  payload: PushPayload
): Promise<{ sent: number }> {
  if (!ensureVapid()) return { sent: 0 };

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) return { sent: 0 };

  const body = JSON.stringify(payload);
  const expired: string[] = [];
  let sent = 0;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        );
        sent++;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) expired.push(sub.endpoint);
      }
    })
  );

  if (expired.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", expired);
  }

  return { sent };
}
