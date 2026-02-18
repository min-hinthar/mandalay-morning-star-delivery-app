import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getResendClient, EMAIL_FROM, EMAIL_REPLY_TO, APP_URL } from "@/lib/email";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

// ===========================================
// VALIDATION
// ===========================================

const composeSchema = z.object({
  orderId: z.string().uuid(),
  subject: z.string().min(1).max(200),
  htmlBody: z.string().min(1).max(50000),
  recipientEmail: z.string().email(),
});

// ===========================================
// TYPES
// ===========================================

interface OrderRow {
  id: string;
  user_id: string;
  delivery_address: Record<string, unknown> | null;
}

interface OrderItemRow {
  name_snapshot: string;
  quantity: number;
}

// ===========================================
// POST /api/admin/emails/compose
// ===========================================

/**
 * Send a manually composed email to a customer.
 * Admin-authored HTML body with auto-generated order context footer.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = composeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const { orderId, subject, htmlBody, recipientEmail } = parsed.data;
    const serviceClient = createServiceClient();

    // Fetch order for footer context
    const { data: order, error: orderError } = (await serviceClient
      .from("orders")
      .select("id, user_id, delivery_address")
      .eq("id", orderId)
      .single()) as {
      data: OrderRow | null;
      error: { message: string } | null;
    };

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Fetch order items for footer
    const { data: orderItems } = (await serviceClient
      .from("order_items")
      .select("name_snapshot, quantity")
      .eq("order_id", orderId)) as {
      data: OrderItemRow[] | null;
    };

    // Build order context footer
    const items = (orderItems || []).map((i) => `${i.name_snapshot} x${i.quantity}`).join(", ");

    const address = order.delivery_address as {
      line1?: string;
      city?: string;
      state?: string;
    } | null;

    const deliveryLine = address?.line1 ? `${address.line1}, ${address.city || ""}` : "";

    const shortId = orderId.slice(0, 8).toUpperCase();
    const footerHtml = `
      <hr style="margin:24px 0 16px;border:none;border-top:1px solid #E5E7EB" />
      <p style="font-size:12px;color:#6B7280;line-height:1.5">
        Regarding Order #${shortId}${items ? `: ${items}` : ""}${deliveryLine ? `. Delivery: ${deliveryLine}` : ""}
      </p>
      <p style="font-size:11px;color:#9CA3AF;margin-top:8px">
        Mandalay Morning Star &middot;
        <a href="${APP_URL}" style="color:#9CA3AF">mandalaymorningstar.com</a>
      </p>
    `;

    // Compose full HTML email
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background-color:#ffffff">
        <div style="max-width:600px;margin:0 auto;padding:24px">
          ${htmlBody}
          ${footerHtml}
        </div>
      </body>
      </html>
    `;

    // Send via Resend
    const resend = getResendClient();
    const { data: sendResult, error: sendError } = await resend.emails.send({
      from: EMAIL_FROM,
      to: recipientEmail,
      replyTo: EMAIL_REPLY_TO,
      subject,
      html: fullHtml,
      tags: [
        { name: "type", value: "manual" },
        { name: "order_id", value: orderId },
      ],
      headers: {
        "List-Unsubscribe": `<${APP_URL}/account?tab=settings>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    if (sendError) {
      logger.error("Manual email send failed", {
        api: "admin/emails/compose",
        orderId,
        error: sendError.message,
      });

      // Log failure
      await serviceClient.from("notification_logs").insert({
        order_id: orderId,
        user_id: order.user_id,
        notification_type: "manual",
        channel: "email",
        recipient: recipientEmail,
        subject,
        status: "failed",
        error_message: sendError.message,
      });

      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    // Log success
    const resendId = sendResult?.id ?? null;
    await serviceClient.from("notification_logs").insert({
      order_id: orderId,
      user_id: order.user_id,
      notification_type: "manual",
      channel: "email",
      recipient: recipientEmail,
      subject,
      resend_id: resendId,
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    logger.info("Manual email sent", {
      api: "admin/emails/compose",
      orderId,
      resendId,
    });

    return NextResponse.json({
      success: true,
      emailId: resendId,
    });
  } catch (error) {
    logger.exception(error, { api: "admin/emails/compose" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
