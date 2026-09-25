import { z } from "zod";

import { COUPON_CODE_PATTERN, isReservedCouponCode, normalizeCouponCode } from "@/lib/coupons";

const cents = z.number().int().positive().max(100_000);

export const createCouponsSchema = z
  .object({
    kind: z.enum(["free_delivery", "amount_off", "percent_off"]),
    amountOffCents: cents.optional(),
    percentOff: z.number().int().min(1).max(100).optional(),
    /** Max $ off (percent) or max fee waived (free delivery). */
    maxDiscountCents: cents.optional(),
    minSubtotalCents: z.number().int().min(0).max(100_000).default(0),
    /** ISO timestamp; must be in the future. */
    expiresAt: z
      .string()
      .datetime({ offset: true })
      .refine((v) => new Date(v).getTime() > Date.now(), "Expiry must be in the future")
      .optional(),
    quantity: z.number().int().min(1).max(50).default(1),
    /** Custom code (single coupon only). Normalized to upper case. */
    code: z
      .string()
      .transform(normalizeCouponCode)
      .refine((v) => COUPON_CODE_PATTERN.test(v), "Use 4–32 letters, digits or dashes")
      .refine((v) => !isReservedCouponCode(v), "That prefix is reserved for loyalty codes")
      .optional(),
    /** Bind to one customer by account email (single coupon only). */
    assignEmail: z.string().trim().toLowerCase().email().max(254).optional(),
    sendEmail: z.boolean().default(false),
    note: z.string().trim().max(200).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.kind === "amount_off" && v.amountOffCents == null) {
      ctx.addIssue({ code: "custom", path: ["amountOffCents"], message: "Amount is required" });
    }
    if (v.kind === "percent_off" && v.percentOff == null) {
      ctx.addIssue({ code: "custom", path: ["percentOff"], message: "Percent is required" });
    }
    if (v.kind === "amount_off" && v.maxDiscountCents != null) {
      ctx.addIssue({ code: "custom", path: ["maxDiscountCents"], message: "Not used for $ off" });
    }
    if (v.quantity > 1 && (v.code || v.assignEmail)) {
      ctx.addIssue({
        code: "custom",
        path: ["quantity"],
        message: "Custom codes and assigned customers issue one coupon at a time",
      });
    }
    if (v.sendEmail && !v.assignEmail) {
      ctx.addIssue({ code: "custom", path: ["sendEmail"], message: "Assign a customer to email" });
    }
  });

export type CreateCouponsInput = z.infer<typeof createCouponsSchema>;

export const updateCouponSchema = z.object({ action: z.literal("revoke") });
