import { render } from "@react-email/render";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getResendClient, EMAIL_FROM, buildEmailElement } from "@/lib/email";
import type { EmailType } from "@/lib/email";
import { apiError } from "@/lib/utils/api-error";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";
import {
  SAMPLE_ORDER_CONFIRMATION,
  SAMPLE_CANCELLATION,
  SAMPLE_REFUND,
  SAMPLE_DELIVERY_REMINDER,
} from "@/emails/fixtures";

const VALID_EMAIL_TYPES: EmailType[] = [
  "order_confirmation",
  "cancellation",
  "refund",
  "delivery_reminder",
];

/**
 * POST /api/emails/test
 *
 * Send a test email using fixture data. Admin-only.
 * Body: { emailType: EmailType, recipientEmail: string }
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return apiError(auth.status === 403 ? "FORBIDDEN" : "UNAUTHORIZED", auth.error, auth.status);
    }

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: auth.userId,
      role: "admin",
      route: "emails/test",
    });
    if (rl.limited) return rl.response;

    const body = await request.json();
    const { emailType, recipientEmail } = body as {
      emailType?: string;
      recipientEmail?: string;
    };

    // Validate input
    if (!emailType || !VALID_EMAIL_TYPES.includes(emailType as EmailType)) {
      return apiError(
        "VALIDATION_ERROR",
        `Invalid emailType. Valid: ${VALID_EMAIL_TYPES.join(", ")}`,
        400
      );
    }

    if (!recipientEmail || typeof recipientEmail !== "string" || !recipientEmail.includes("@")) {
      return apiError("VALIDATION_ERROR", "Valid recipientEmail is required", 400);
    }

    const type = emailType as EmailType;
    const fixtureData = getFixtureDataForType(type);
    const subject = getTestSubject(type);
    const react = buildEmailElement(type, fixtureData);

    // Send via Resend directly (bypass sendEmail preference checks for test emails)
    const resend = getResendClient();
    const html = await render(react);

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: recipientEmail,
      subject: `[TEST] ${subject}`,
      html,
      headers: {
        "Idempotency-Key": `test-${type}-${Date.now()}`,
      },
    });

    if (error) {
      logger.error("Test email send failed", {
        api: "emails/test",
        emailType: type,
        error: error.message,
      });
      return apiError("INTERNAL_ERROR", error.message, 500);
    }

    logger.info("Test email sent", {
      api: "emails/test",
      emailType: type,
      recipientEmail,
      emailId: data?.id,
    });

    return NextResponse.json({
      success: true,
      emailId: data?.id,
    });
  } catch (error) {
    logger.exception(error, { api: "emails/test" });
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

function getFixtureDataForType(type: EmailType): Record<string, unknown> {
  switch (type) {
    case "order_confirmation": {
      const s = SAMPLE_ORDER_CONFIRMATION;
      return {
        customerName: s.customerName,
        orderId: s.orderId,
        items: s.items,
        subtotalCents: s.totals.subtotalCents,
        deliveryFeeCents: s.totals.deliveryFeeCents,
        taxCents: s.totals.taxCents,
        totalCents: s.totals.totalCents,
        deliveryWindowStart: s.delivery.windowStart,
        deliveryWindowEnd: s.delivery.windowEnd,
        address: s.delivery.address,
        deliveryInstructions: s.delivery.instructions,
        driverName: s.delivery.driverName,
        placedAt: s.placedAt,
      };
    }
    case "cancellation": {
      const s = SAMPLE_CANCELLATION;
      return {
        customerName: s.customerName,
        orderId: s.orderId,
        items: s.items,
        totalCents: s.totals.totalCents,
        cancellationReason: s.reason,
        cancelledAt: s.cancelledAt,
        refundIssued: s.refundIssued,
      };
    }
    case "refund": {
      const s = SAMPLE_REFUND;
      return {
        customerName: s.customerName,
        orderId: s.orderId,
        isPartialRefund: s.isPartial,
        refundedItems: s.refundedItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          refundAmountCents: item.lineTotalCents,
        })),
        originalTotalCents: s.originalAmountCents,
        refundAmountCents: s.refundAmountCents,
        refundMethod: s.refundMethod,
        refundTimeline: s.refundTimeline,
        processedAt: s.refundedAt,
      };
    }
    case "delivery_reminder": {
      const s = SAMPLE_DELIVERY_REMINDER;
      return {
        customerName: s.customerName,
        orderId: s.orderId,
        itemCount: s.itemCount,
        itemNames: s.highlightItems,
        deliveryWindowStart: s.delivery.windowStart,
        deliveryWindowEnd: s.delivery.windowEnd,
        address: s.delivery.address,
        specialInstructions: s.delivery.instructions,
      };
    }
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}

function getTestSubject(type: EmailType): string {
  switch (type) {
    case "order_confirmation":
      return "Order Confirmation";
    case "cancellation":
      return "Order Cancellation";
    case "refund":
      return "Refund Notification";
    case "delivery_reminder":
      return "Delivery Reminder";
    default:
      return "Email Test";
  }
}
