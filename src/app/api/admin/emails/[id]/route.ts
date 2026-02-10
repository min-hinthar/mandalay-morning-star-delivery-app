import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";

interface ResendEvent {
  type: string;
  created_at: string;
}

interface NotificationLogDetailRow {
  id: string;
  order_id: string;
  user_id: string;
  notification_type: string;
  channel: string;
  recipient: string;
  subject: string | null;
  resend_id: string | null;
  status: string;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  sent_at: string | null;
  created_at: string;
}

/**
 * GET /api/admin/emails/[id]
 *
 * Single email detail with delivery status timeline.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { supabase } = auth;

    // notification_logs not in Database type — cast result
    const { data, error } = (await supabase
      .from("notification_logs")
      .select(
        "id, order_id, user_id, notification_type, channel, recipient, subject, resend_id, status, error_message, metadata, sent_at, created_at",
      )
      .eq("id", id)
      .single()) as {
      data: NotificationLogDetailRow | null;
      error: { message: string } | null;
    };

    if (error || !data) {
      return NextResponse.json(
        { error: "Email log not found" },
        { status: 404 },
      );
    }

    // Extract status timeline from metadata.resend_events
    const resendEvents = (data.metadata?.resend_events ?? []) as ResendEvent[];
    const statusTimeline = resendEvents.map((event) => ({
      status: event.type,
      timestamp: event.created_at,
    }));

    // Add the initial sent/failed event if not already in timeline
    if (data.sent_at) {
      const hasSentEvent = statusTimeline.some(
        (e) => e.status === "sent" || e.status === "email.sent",
      );
      if (!hasSentEvent) {
        statusTimeline.unshift({
          status: "sent",
          timestamp: data.sent_at,
        });
      }
    }

    // Sort timeline chronologically
    statusTimeline.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    return NextResponse.json({
      data: {
        id: data.id,
        orderId: data.order_id,
        userId: data.user_id,
        notificationType: data.notification_type,
        channel: data.channel,
        recipient: data.recipient,
        subject: data.subject,
        resendId: data.resend_id,
        status: data.status,
        errorMessage: data.error_message,
        metadata: data.metadata,
        sentAt: data.sent_at,
        createdAt: data.created_at,
        statusTimeline,
        canResend: data.status === "failed",
      },
    });
  } catch (error) {
    logger.exception(error, { api: "admin/emails/[id]" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
