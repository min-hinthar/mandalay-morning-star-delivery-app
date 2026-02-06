import { z } from "zod";

export const updateSectionSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  subtitle: z.string().max(500).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a hex color")
    .optional()
    .nullable(),
  itemCount: z.number().int().min(1).max(20).optional(),
  isVisible: z.boolean().optional(),
});

export const actionSchema = z.object({
  action: z.enum(["restore", "duplicate"]),
});
