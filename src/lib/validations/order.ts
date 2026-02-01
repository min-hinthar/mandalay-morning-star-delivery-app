import { z } from "zod";

// Cancel order schema
export const cancelOrderSchema = z.object({
  reason: z.string().min(5, "Reason must be at least 5 characters").max(500),
  notifyCustomer: z.boolean().default(true),
});

// Refund schema - item-level per CONTEXT.md
export const refundOrderSchema = z.object({
  items: z
    .array(
      z.object({
        orderItemId: z.string().uuid(),
        quantity: z.number().int().min(1),
        reason: z.string().max(500).optional(),
      })
    )
    .min(1, "Must select at least one item to refund"),
  refundShipping: z.boolean().default(false),
  notifyCustomer: z.boolean().default(true),
});

// Status change schema (for audit)
export const changeOrderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ]),
  reason: z.string().max(500).optional(),
  notifyCustomer: z.boolean().default(true),
});

export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type RefundOrderInput = z.infer<typeof refundOrderSchema>;
export type ChangeOrderStatusInput = z.infer<typeof changeOrderStatusSchema>;
