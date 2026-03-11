import { render } from "@react-email/render";

import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import type { NotificationPrefs } from "@/components/ui/account/SettingsTab/settings-types";

import { getResendClient } from "./client";
import {
  APP_URL,
  EMAIL_FROM,
  EMAIL_REPLY_TO,
  MAX_RETRY_ATTEMPTS,
  RETRY_BASE_DELAY_MS,
} from "./constants";
import {
  ADMIN_EMAIL_TYPES,
  MANDATORY_EMAIL_TYPES,
  mapTypeToPrefKey,
  type CustomerEmailType,
  type SendEmailOptions,
  type SendEmailResult,
} from "./types";

// ===========================================
// SEND EMAIL
// ===========================================

/**
 * Sends an email through Resend with:
 * 1. Admin kill switch check
 * 2. User notification preference check
 * 3. React-to-HTML rendering
 * 4. Retry with exponential backoff
 * 5. Notification log insert
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const supabase = createServiceClient();
  const flowId = "email";

  // -----------------------------------------------
  // Step 1: Admin kill switch
  // -----------------------------------------------
  try {
    const { data: killSwitch } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "email_sending_enabled")
      .single();

    if (killSwitch?.value === false) {
      logger.info("Email sending disabled by admin kill switch", {
        flowId,
        orderId: options.orderId,
        userId: options.userId,
      });
      return { success: true };
    }
  } catch {
    // If we can't read the setting, continue sending (fail open)
    logger.warn("Could not read email kill switch, proceeding", {
      flowId,
    });
  }

  // -----------------------------------------------
  // Step 2: User notification preference check
  // -----------------------------------------------
  const isMandatory =
    options.mandatory || (MANDATORY_EMAIL_TYPES as readonly string[]).includes(options.type);

  if (!isMandatory) {
    try {
      const { data: settings } = await supabase
        .from("customer_settings")
        .select("notification_prefs")
        .eq("user_id", options.userId)
        .single();

      // If no record exists, treat as all opted-in (new customer default)
      if (settings?.notification_prefs) {
        const prefs = settings.notification_prefs as unknown as NotificationPrefs;
        const prefKey = mapTypeToPrefKey(options.type);

        if (prefs[prefKey] === false) {
          logger.info("Email skipped: user preference opt-out", {
            flowId,
            userId: options.userId,
            orderId: options.orderId,
          });
          return { success: true };
        }
      }
    } catch {
      // No customer_settings row = new customer = all opted-in
    }
  }

  // -----------------------------------------------
  // Step 3: Render React element to HTML + plain text
  // -----------------------------------------------
  let html: string;
  let text: string;
  try {
    html = await render(options.react);
    text = await render(options.react, { plainText: true });
  } catch (err) {
    logger.error("Email render failed", {
      flowId,
      orderId: options.orderId,
      userId: options.userId,
    });
    logger.exception(err, { flowId, orderId: options.orderId });
    return { success: false, error: "Email render failed" };
  }

  // -----------------------------------------------
  // Step 4: Send via Resend with retry
  // -----------------------------------------------
  const resend = getResendClient();
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: options.to,
        replyTo: EMAIL_REPLY_TO,
        subject: options.subject,
        html,
        text,
        tags: [
          { name: "type", value: options.type },
          { name: "order_id", value: options.orderId },
        ],
        headers: {
          "List-Unsubscribe": `<${APP_URL}/account?tab=settings>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        ...(options.idempotencyKey && {
          headers: {
            "List-Unsubscribe": `<${APP_URL}/account?tab=settings>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            "Idempotency-Key": options.idempotencyKey,
          },
        }),
      });

      if (error) {
        lastError = error.message;
        logger.warn(`Email send attempt ${attempt} failed`, {
          flowId,
          orderId: options.orderId,
        });

        if (attempt < MAX_RETRY_ATTEMPTS) {
          await sleep(attempt * RETRY_BASE_DELAY_MS);
          continue;
        }
        break;
      }

      // -----------------------------------------------
      // Step 5: Success — log to notification_logs (customer emails only)
      // -----------------------------------------------
      const resendId = data?.id;
      const isAdminEmail = (ADMIN_EMAIL_TYPES as readonly string[]).includes(options.type);
      if (!isAdminEmail) {
        await supabase.from("notification_logs").insert({
          order_id: options.orderId,
          user_id: options.userId,
          notification_type: options.type as CustomerEmailType,
          channel: "email",
          recipient: options.to,
          subject: options.subject,
          resend_id: resendId ?? null,
          status: "sent",
          retry_count: attempt,
          sent_at: new Date().toISOString(),
        });
      }

      logger.info("Email sent successfully", {
        flowId,
        orderId: options.orderId,
        userId: options.userId,
      });

      return { success: true, resendId: resendId ?? undefined };
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Unknown send error";
      logger.warn(`Email send attempt ${attempt} threw`, {
        flowId,
        orderId: options.orderId,
      });

      if (attempt < MAX_RETRY_ATTEMPTS) {
        await sleep(attempt * RETRY_BASE_DELAY_MS);
      }
    }
  }

  // -----------------------------------------------
  // Step 6: All retries exhausted — log failure (customer emails only)
  // -----------------------------------------------
  const isAdminEmailFailed = (ADMIN_EMAIL_TYPES as readonly string[]).includes(options.type);
  if (!isAdminEmailFailed) {
    await supabase.from("notification_logs").insert({
      order_id: options.orderId,
      user_id: options.userId,
      notification_type: options.type as CustomerEmailType,
      channel: "email",
      recipient: options.to,
      subject: options.subject,
      status: "failed",
      retry_count: MAX_RETRY_ATTEMPTS,
      error_message: lastError ?? "Unknown error after retries",
    });
  }

  logger.error("Email send failed after all retries", {
    flowId,
    orderId: options.orderId,
    userId: options.userId,
  });

  // -----------------------------------------------
  // Step 7: Flag order for manual customer contact
  // -----------------------------------------------
  try {
    // needs_contact column added in migration 030 — not in generated types yet
    await (supabase
      .from("orders")
      .update({ needs_contact: true } as Record<string, unknown>)
      .eq("id", options.orderId) as unknown as Promise<unknown>);

    logger.warn("Order flagged for manual contact after email failure", {
      flowId,
      orderId: options.orderId,
      userId: options.userId,
    });
  } catch (flagErr) {
    // Non-blocking — email failure is already logged
    logger.error("Failed to flag order for manual contact", {
      flowId,
      orderId: options.orderId,
    });
    logger.exception(flagErr, { flowId, orderId: options.orderId });
  }

  return { success: false, error: lastError };
}

// ===========================================
// HELPERS
// ===========================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
