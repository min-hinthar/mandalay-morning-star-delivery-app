import { z } from "zod";

const FEEDBACK_CATEGORIES = ["bug_report", "order_issue", "suggestion", "general"] as const;

export const createFeedbackSchema = z.object({
  category: z.enum(FEEDBACK_CATEGORIES),
  subject: z.string().min(5, "Subject must be at least 5 characters").max(100),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
  orderId: z.string().uuid().optional(),
  pageUrl: z.string().url().optional(),
  userAgent: z.string().max(500).optional(),
  sentryEventId: z.string().max(100).optional(),
  contactEmail: z.string().email("Invalid email address").optional(),
});

export type CreateFeedbackPayload = z.infer<typeof createFeedbackSchema>;
