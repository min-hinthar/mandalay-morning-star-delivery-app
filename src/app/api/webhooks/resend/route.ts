/**
 * Resend Webhook Handler
 *
 * Receives email delivery events (delivered, opened, clicked, bounced, complained)
 * and updates notification_logs status + metadata for admin tracking.
 *
 * Always returns 200 to prevent Resend retries on processing errors.
 */

import { NextResponse } from "next/server";

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
// POST HANDLER
// ===========================================

export async function POST(request: Request) {
  // -----------------------------------------------
  // Step 1: Webhook secret verification
  // -----------------------------------------------
  if (RESEND_WEBHOOK_SECRET) {
    const svixId = request.headers.get("svix-id");
    const webhookSecret = request.headers.get("webhook-secret");

    // Support simple secret header check
    if (webhookSecret) {
      if (webhookSecret !== RESEND_WEBHOOK_SECRET) {
        logger.warn("Resend webhook secret mismatch", {
          flowId: FLOW_ID,
          api: "resend-webhook",
        });
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else if (!svixId) {
      // No verification headers present at all
      logger.warn("Resend webhook missing verification headers", {
        flowId: FLOW_ID,
        api: "resend-webhook",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // If svix headers present but no svix package, log and proceed
    // Full svix verification can be added later with the svix package
  } else {
    logger.warn("RESEND_WEBHOOK_SECRET not configured, skipping verification", {
      flowId: FLOW_ID,
      api: "resend-webhook",
    });
  }

  // -----------------------------------------------
  // Step 2: Parse event payload
  // -----------------------------------------------
  let payload: ResendWebhookPayload;
  try {
    payload = (await request.json()) as ResendWebhookPayload;
  } catch {
    logger.error("Failed to parse Resend webhook payload", {
      flowId: FLOW_ID,
      api: "resend-webhook",
    });
    // Return 200 to prevent retries
    return NextResponse.json({ received: true });
  }

  const { type: eventType, created_at: eventCreatedAt, data } = payload;

  // -----------------------------------------------
  // Step 3: Check if we handle this event type
  // -----------------------------------------------
  if (!SUPPORTED_EVENTS.has(eventType)) {
    logger.info(`Unhandled Resend event type: ${eventType}`, {
      flowId: FLOW_ID,
      api: "resend-webhook",
    });
    return NextResponse.json({ received: true });
  }

  const mappedStatus =
    EVENT_STATUS_MAP[eventType as ResendEventType];
  const emailId = data?.email_id;

  if (!emailId) {
    logger.warn("Resend webhook missing email_id", {
      flowId: FLOW_ID,
      api: "resend-webhook",
    });
    return NextResponse.json({ received: true });
  }

  // -----------------------------------------------
  // Step 4: Update notification_logs
  // -----------------------------------------------
  try {
    const supabase = createServiceClient();

    // First, find the notification log entry by resend_id
    // notification_logs not in Database type — cast result
    const { data: logEntry, error: findError } = (await supabase
      .from("notification_logs")
      .select("id, metadata")
      .eq("resend_id", emailId)
      .single()) as {
      data: { id: string; metadata: Record<string, unknown> | null } | null;
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

    // Build updated metadata with event history
    const existingMetadata = (logEntry.metadata ?? {}) as Record<
      string,
      unknown
    >;
    const resendEvents = (
      Array.isArray(existingMetadata.resend_events)
        ? existingMetadata.resend_events
        : []
    ) as { type: string; at: string }[];

    resendEvents.push({
      type: eventType,
      at: eventCreatedAt,
    });

    const updatedMetadata = {
      ...existingMetadata,
      resend_events: resendEvents,
    };

    // Update status and metadata
    const { error: updateError } = await supabase
      .from("notification_logs")
      .update({
        status: mappedStatus,
        metadata: updatedMetadata,
      })
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
      logger.info(`Notification log updated: ${eventType} -> ${mappedStatus}`, {
        flowId: FLOW_ID,
        api: "resend-webhook",
        emailId,
      });
    }
  } catch (err) {
    // Log errors but always return 200
    logger.error("Error processing Resend webhook", {
      flowId: FLOW_ID,
      api: "resend-webhook",
      emailId,
    });
    logger.exception(err, { flowId: FLOW_ID, api: "resend-webhook" });
  }

  // -----------------------------------------------
  // Step 5: Always return 200
  // -----------------------------------------------
  return NextResponse.json({ received: true });
}
