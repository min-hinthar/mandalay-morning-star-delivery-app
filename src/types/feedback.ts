// ============================================
// Customer Feedback Types
// ============================================

export type FeedbackCategory = "bug_report" | "order_issue" | "suggestion" | "general";
export type FeedbackStatus = "new" | "in_review" | "resolved" | "dismissed";

export interface CustomerFeedback {
  id: string;
  user_id: string | null;
  contact_email: string | null;
  category: FeedbackCategory;
  subject: string;
  message: string;
  order_id: string | null;
  page_url: string | null;
  user_agent: string | null;
  sentry_event_id: string | null;
  screenshot_url: string | null;
  screenshot_path: string | null;
  status: FeedbackStatus;
  admin_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFeedbackInput {
  category: FeedbackCategory;
  subject: string;
  message: string;
  orderId?: string;
  pageUrl?: string;
  userAgent?: string;
  sentryEventId?: string;
  contactEmail?: string;
}

export interface UpdateFeedbackInput {
  status?: FeedbackStatus;
  admin_notes?: string;
}

/** Feedback row with joined profile data (admin queries) */
export interface FeedbackWithProfile extends CustomerFeedback {
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
}
