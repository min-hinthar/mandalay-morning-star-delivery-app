import { z } from "zod";

export const CoverageCheckRequestSchema = z.object({
  address: z.string().min(5, "Please enter a valid address"),
});

export const CoverageCheckResponseSchema = z.object({
  deliverable: z.boolean(),
  distance_miles: z.number(),
  duration_minutes: z.number(),
  formatted_address: z.string(),
  reason: z.string().optional(),
});

export type CoverageCheckRequest = z.infer<typeof CoverageCheckRequestSchema>;
export type CoverageCheckResponse = z.infer<typeof CoverageCheckResponseSchema>;
