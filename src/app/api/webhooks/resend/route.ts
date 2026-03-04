/**
 * Resend Webhook Handler
 *
 * Receives email delivery events (delivered, opened, clicked, bounced, complained)
 * and updates notification_logs status + metadata for admin tracking.
 *
 * Verifies webhook signatures via Svix HMAC. Logs all attempts to webhook_audit_logs.
 * Deduplicates by svix-id to prevent double-processing.
 * Always returns 200 after verification to prevent Resend retries.
 */

import { createHash } from "crypto";

import { NextResponse } from "next/server";
import { Webhook } from "svix";

import { apiError } from "@/lib/utils/api-error";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;
const FLOW_ID = "resend-webhook";

// ===========================================
// EVENT TYPE MAPPING
// ===========================================

type ResendEventType =
  | "email.delivered"
  | "email.opened"
  | "email.clicked"
  | "email.bounced"
  | "email.complained";

const EVENT_STATUS_MAP: Record<ResendEventType, string> = {
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "bounced", // Treat complaint as bounce
};

const SUPPORTED_EVENTS = new Set<string>(Object.keys(EVENT_STATUS_MAP));

/** Higher number = higher priority. Don't downgrade status. */
const STATUS_PRIORITY: Record<string, number> = {
  pending: 0,
  sent: 1,
  delivered: 2,
  opened: 3,
  clicked: 4,
  bounced: 5,
  failed: 5,
};

// ===========================================
// RESEND WEBHOOK PAYLOAD TYPES
// ===========================================

interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    to: string[];
    subject: string;
    [key: string]: unknown;
  };
}

// ===========================================
// HELPERS
// ===========================================

function hashPayload(body: string): string {
  return createHash("sha256").update(body).digest("hex");
}

function getSourceIp(request: Request): string | null {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

// ===========================================
// POST HANDLER
// ===========================================

export async function POST(request: Request) {
  const supabase = createServiceClient();
  const sourceIp = getSourceIp(request);

  // -----------------------------------------------
  // Step 1: Read raw body (required for Svix verification)
  // -----------------------------------------------
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    logger.error("Failed to read Resend webhook body", {
      flowId: FLOW_ID,
      api: "resend-webhook",
    });
    return apiError("BAD_REQUEST", "Bad request", 400);
  }

  const payloadHash = hashPayload(rawBody);
  const svixId = request.headers.get("svix-id") ?? "";

  // -----------------------------------------------
  // Step 2: Svix HMAC signature verification
  // -----------------------------------------------
  if (RESEND_WEBHOOK_SECRET) {
    const svixTimestamp = request.headers.get("svix-timestamp") ?? "";
    const svixSignature = request.headers.get("svix-signature") ?? "";

    try {
      const wh = new Webhook(RESEND_WEBHOOK_SECRET);
      wh.verify(rawBody, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });

      // Log successful verification
      await supabase.from("webhook_audit_logs").insert({
        svix_id: svixId || null,
        event_type: "verification_passed",
        payload_hash: payloadHash,
        signature_valid: true,
        source_ip: sourceIp,
      });
    } catch (verifyErr) {
      // Log rejected webhook
      const errorMsg =
        verifyErr instanceof Error ? verifyErr.message : "Unknown verification error";

      logger.warn("Resend webhook signature verification failed", {
        flowId: FLOW_ID,
        api: "resend-webhook",
        sourceIp,
        payloadHash,
      });

      await supabase.from("webhook_audit_logs").insert({
        svix_id: svixId || null,
        event_type: "verification_failed",
        payload_hash: payloadHash,
        signature_valid: false,
        source_ip: sourceIp,
        error_message: errorMsg,
      });

      return apiError("UNAUTHORIZED", "Unauthorized", 401);
    }
  } else {
    logger.warn("RESEND_WEBHOOK_SECRET not configured, skipping verification", {
      flowId: FLOW_ID,
      api: "resend-webhook",
    });
  }

  // -----------------------------------------------
  // Step 3: Idempotency check — skip duplicate events
  // -----------------------------------------------
  if (svixId) {
    const { data: existing } = (await supabase
      .from("webhook_audit_logs")
      .select("id")
      .eq("svix_id", svixId)
      .eq("event_type", "processed")
      .limit(1)
      .single()) as { data: { id: string } | null; error: unknown };

    if (existing) {
      logger.info("Duplicate webhook event skipped", {
        flowId: FLOW_ID,
        api: "resend-webhook",
        svixId,
      });
      return NextResponse.json({ received: true });
    }
  }

  // -----------------------------------------------
  // Step 4: Parse event payload
  // -----------------------------------------------
  let payload: ResendWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as ResendWebhookPayload;
  } catch {
    logger.error("Failed to parse Resend webhook payload", {
      flowId: FLOW_ID,
      api: "resend-webhook",
    });
    return NextResponse.json({ received: true });
  }

  const { type: eventType, created_at: eventCreatedAt, data } = payload;

  // -----------------------------------------------
  // Step 5: Check if we handle this event type
  // -----------------------------------------------
  if (!SUPPORTED_EVENTS.has(eventType)) {
    logger.info(`Unhandled Resend event type: ${eventType}`, {
      flowId: FLOW_ID,
      api: "resend-webhook",
    });
    return NextResponse.json({ received: true });
  }

  const mappedStatus = EVENT_STATUS_MAP[eventType as ResendEventType];
  const emailId = data?.email_id;

  if (!emailId) {
    logger.warn("Resend webhook missing email_id", {
      flowId: FLOW_ID,
      api: "resend-webhook",
    });
    return NextResponse.json({ received: true });
  }

  // -----------------------------------------------
  // Step 6: Update notification_logs
  // -----------------------------------------------
  try {
    // Find the notification log entry by resend_id
    const { data: logEntry, error: findError } = (await supabase
      .from("notification_logs")
      .select("id, status, metadata")
      .eq("resend_id", emailId)
      .single()) as {
      data: { id: string; status: string; metadata: Record<string, unknown> | null } | null;
      error: { message: string } | null;
    };

    if (findError || !logEntry) {
      logger.info("No notification_log found for Resend email_id", {
        flowId: FLOW_ID,
        api: "resend-webhook",
        emailId,
      });
      return NextResponse.json({ received: true });
    }

    // Status downgrade protection — don't overwrite higher-priority status
    const currentPriority = STATUS_PRIORITY[logEntry.status] ?? 0;
    const newPriority = STATUS_PRIORITY[mappedStatus] ?? 0;
    const shouldUpdateStatus = newPriority >= currentPriority;

    // Build updated metadata with event history
    const existingMetadata = (logEntry.metadata ?? {}) as Record<string, unknown>;
    const resendEvents = (
      Array.isArray(existingMetadata.resend_events) ? existingMetadata.resend_events : []
    ) as { type: string; at: string }[];

    resendEvents.push({
      type: eventType,
      at: eventCreatedAt,
    });

    const updatedMetadata = {
      ...existingMetadata,
      resend_events: resendEvents,
    };

    // Update status (if not downgrade) and always update metadata
    const updatePayload: Record<string, unknown> = {
      metadata: updatedMetadata,
    };
    if (shouldUpdateStatus) {
      updatePayload.status = mappedStatus;
    }

    const { error: updateError } = await supabase
      .from("notification_logs")
      .update(updatePayload)
      .eq("id", logEntry.id);

    if (updateError) {
      logger.error("Failed to update notification_log status", {
        flowId: FLOW_ID,
        api: "resend-webhook",
        emailId,
      });
      logger.exception(updateError, {
        flowId: FLOW_ID,
        api: "resend-webhook",
      });
    } else {
      logger.info(
        `Notification log updated: ${eventType} -> ${shouldUpdateStatus ? mappedStatus : `skipped (current: ${logEntry.status})`}`,
        {
          flowId: FLOW_ID,
          api: "resend-webhook",
          emailId,
        }
      );
    }

    // Mark as processed for idempotency
    if (svixId) {
      await supabase.from("webhook_audit_logs").insert({
        svix_id: svixId,
        event_type: "processed",
        payload_hash: payloadHash,
        signature_valid: true,
        source_ip: sourceIp,
      });
    }
  } catch (err) {
    logger.error("Error processing Resend webhook", {
      flowId: FLOW_ID,
      api: "resend-webhook",
      emailId,
    });
    logger.exception(err, { flowId: FLOW_ID, api: "resend-webhook" });
  }

  // -----------------------------------------------
  // Step 7: Always return 200
  // -----------------------------------------------
  return NextResponse.json({ received: true });
}
