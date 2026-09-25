import React from "react";
import { render } from "@react-email/render";

import { CouponGift } from "@/emails/CouponGift";
import { labelFor, type CouponRow } from "@/lib/coupons";
import { getResendClient } from "@/lib/email/client";
import { APP_URL, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/email/constants";
import { formatPrice } from "@/lib/utils/currency";
import { logger } from "@/lib/utils/logger";

/**
 * Email an assigned coupon to its customer. Awaited (never fire-and-forget on
 * Vercel) and non-fatal: the coupon already exists, so a send failure is
 * reported back to the admin as `emailSent: false` rather than failing the
 * request — they can copy the code and share it by hand.
 */
export async function sendCouponEmail(
  coupon: CouponRow,
  customer: { email: string | null; full_name: string | null }
): Promise<boolean> {
  if (!customer.email) return false;
  try {
    const offerLabel = labelFor(coupon);
    const component = React.createElement(CouponGift, {
      customerName: customer.full_name?.split(" ")[0] || "friend",
      offerLabel,
      promoCode: coupon.code,
      expiresOn: coupon.expires_at
        ? new Date(coupon.expires_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: "America/Los_Angeles",
          })
        : null,
      minimumLabel: coupon.min_subtotal_cents > 0 ? formatPrice(coupon.min_subtotal_cents) : null,
      menuUrl: `${APP_URL}/menu?src=coupon_gift`,
    });
    const [html, text] = await Promise.all([
      render(component),
      render(component, { plainText: true }),
    ]);
    const { error } = await getResendClient().emails.send({
      from: EMAIL_FROM,
      to: customer.email,
      replyTo: EMAIL_REPLY_TO,
      subject: `A gift for you: ${offerLabel} 🎁`,
      html,
      text,
    });
    if (error) {
      logger.error("Coupon email failed", {
        api: "admin/coupons",
        couponId: coupon.id,
        error: error.message,
      });
      return false;
    }
    return true;
  } catch (err) {
    logger.exception(err, { api: "admin/coupons", couponId: coupon.id });
    return false;
  }
}
