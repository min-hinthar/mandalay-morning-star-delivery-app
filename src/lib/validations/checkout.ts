import { z } from "zod";

export const checkoutItemSchema = z.object({
  menuItemId: z.string().uuid("Invalid menu item ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(50, "Maximum quantity is 50"),
  modifiers: z.array(
    z.object({
      optionId: z.string().uuid("Invalid modifier option ID"),
    })
  ),
  notes: z.string().max(500, "Notes too long").optional(),
});

export const createCheckoutSessionSchema = z.object({
  addressId: z.string().uuid("Invalid address ID"),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  timeWindowStart: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  timeWindowEnd: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  items: z.array(checkoutItemSchema).min(1, "Cart cannot be empty").max(50, "Too many items"),
  customerNotes: z.string().max(1000, "Notes too long").optional(),
});

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;
export type CheckoutItemInput = z.infer<typeof checkoutItemSchema>;
