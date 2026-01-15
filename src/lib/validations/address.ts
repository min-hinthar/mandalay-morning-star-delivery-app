import { z } from "zod";

export const addressFormSchema = z.object({
  label: z.string().min(1, "Label is required").max(50, "Label too long"),
  line1: z.string().min(1, "Street address is required").max(200),
  line2: z.string().max(100).optional(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().length(2, "Use 2-letter state code").default("CA"),
  postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;
