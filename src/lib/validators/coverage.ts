import { z } from "zod";

export const CoverageCheckRequestSchema = z.union([
  z.object({
    address: z.string().min(1, "Please enter a valid address"),
  }),
  z.object({
    lat: z.number(),
    lng: z.number(),
  }),
]);

export type CoverageCheckRequest = z.infer<typeof CoverageCheckRequestSchema>;
