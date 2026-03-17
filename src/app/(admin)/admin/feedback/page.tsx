import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ProfileRole } from "@/types/database";
import type { FeedbackCategory, FeedbackStatus, FeedbackWithProfile } from "@/types/feedback";
import { FeedbackDetailPanel } from "./FeedbackDetailPanel";

// ============================================
// TYPES
// ============================================

type SortOption = "date" | "status";

interface FeedbackPageProps {
  searchParams: Promise<{ sort?: string; status?: string; category?: string }>;
}

// ============================================
// METADATA
// ============================================

export const metadata = {
  title: "Feedback | Mandalay Morning Star",
  description: "View and manage customer feedback",
};

// ============================================
// HELPERS
// ============================================

const STATUS_STYLES: Record<FeedbackStatus, string> = {
  new: "bg-status-info/10 text-status-info",
  in_review: "bg-status-warning/10 text-status-warning",
  resolved: "bg-status-success/10 text-status-success",
  dismissed: "bg-surface-tertiary text-text-muted",
};

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: "New",
  in_review: "In Review",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug_report: "Bug Report",
  order_issue: "Order Issue",
  suggestion: "Suggestion",
  general: "General",
};

const CATEGORY_COLORS: Record<FeedbackCategory, string> = {
  bug_report: "text-status-error",
  order_issue: "text-accent-orange",
  suggestion: "text-accent-teal",
  general: "text-text-secondary",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ============================================
// PAGE
// ============================================

export default async function FeedbackPage({ searchParams }: FeedbackPageProps) {
  const resolvedParams = await searchParams;
  const sort: SortOption = resolvedParams.sort === "status" ? "status" : "date";
  const statusFilter = resolvedParams.status as FeedbackStatus | undefined;
  const categoryFilter = resolvedParams.category as FeedbackCategory | undefined;

  const supabase = await createClient();

  // Auth + admin check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=/admin/feedback");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .returns<{ role: ProfileRole }[]>()
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/?error=unauthorized");
  }

  // Use service client for data query (bypasses RLS, avoids 5s timeout)
  // Admin auth already verified above
  const serviceClient = createServiceClient();

  // Build query — no profiles join (customer_feedback.user_id -> auth.users, not profiles)
  // Falls back to contact_email for display
  let query = serviceClient
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("customer_feedback" as any)
    .select("*");

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }
  if (categoryFilter) {
    query = query.eq("category", categoryFilter);
  }

  if (sort === "status") {
    query = query.order("status").order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: feedbackRows, error: fetchError } = await query;

  if (fetchError) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-status-error">Failed to load feedback.</p>
      </div>
    );
  }

  const feedback = (feedbackRows ?? []) as unknown as FeedbackWithProfile[];

  // Build filter URLs
  const baseUrl = "/admin/feedback";
  function filterUrl(params: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    if (params.sort) p.set("sort", params.sort);
    if (params.status) p.set("status", params.status);
    if (params.category) p.set("category", params.category);
    const qs = p.toString();
    return qs ? `${baseUrl}?${qs}` : baseUrl;
  }

  const statuses: FeedbackStatus[] = ["new", "in_review", "resolved", "dismissed"];
  const categories: FeedbackCategory[] = ["bug_report", "order_issue", "suggestion", "general"];

  return (
    <div className="p-4 md:p-0 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-text-primary">Feedback</h1>
        <span className="rounded-full bg-accent-teal/10 px-3 py-1 text-sm font-semibold text-accent-teal">
          {feedback.length}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-text-secondary">Status:</span>
        <a
          href={filterUrl({ sort: resolvedParams.sort, category: resolvedParams.category })}
          className={cn(
            "rounded-full px-3 py-1 text-sm font-medium transition-colors min-h-[44px] md:min-h-0 inline-flex items-center",
            !statusFilter
              ? "bg-primary text-text-inverse"
              : "bg-surface-secondary text-text-secondary hover:text-text-primary"
          )}
        >
          All
        </a>
        {statuses.map((s) => (
          <a
            key={s}
            href={filterUrl({
              sort: resolvedParams.sort,
              status: s,
              category: resolvedParams.category,
            })}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium transition-colors min-h-[44px] md:min-h-0 inline-flex items-center",
              statusFilter === s
                ? "bg-primary text-text-inverse"
                : "bg-surface-secondary text-text-secondary hover:text-text-primary"
            )}
          >
            {STATUS_LABELS[s]}
          </a>
        ))}

        <span className="ml-4 text-sm text-text-secondary">Category:</span>
        <a
          href={filterUrl({ sort: resolvedParams.sort, status: resolvedParams.status })}
          className={cn(
            "rounded-full px-3 py-1 text-sm font-medium transition-colors min-h-[44px] md:min-h-0 inline-flex items-center",
            !categoryFilter
              ? "bg-primary text-text-inverse"
              : "bg-surface-secondary text-text-secondary hover:text-text-primary"
          )}
        >
          All
        </a>
        {categories.map((c) => (
          <a
            key={c}
            href={filterUrl({
              sort: resolvedParams.sort,
              status: resolvedParams.status,
              category: c,
            })}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium transition-colors min-h-[44px] md:min-h-0 inline-flex items-center",
              categoryFilter === c
                ? "bg-primary text-text-inverse"
                : "bg-surface-secondary text-text-secondary hover:text-text-primary"
            )}
          >
            {CATEGORY_LABELS[c]}
          </a>
        ))}
      </div>

      {/* Table */}
      {feedback.length === 0 ? (
        <div className="rounded-card border border-border-subtle bg-surface-primary p-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-text-muted" />
          <p className="mt-4 text-lg font-medium text-text-primary">No feedback yet</p>
          <p className="mt-1 text-sm text-text-secondary">
            Customer feedback will appear here once submitted.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-card border border-border-subtle bg-surface-primary">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-secondary">
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Category</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Subject</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {feedback.map((f) => (
                  <FeedbackDetailPanel key={f.id} feedback={f}>
                    <tr className="hover:bg-surface-secondary/50 cursor-pointer">
                      <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                        {formatDate(f.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-medium", CATEGORY_COLORS[f.category])}>
                          {CATEGORY_LABELS[f.category]}
                        </span>
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 font-medium text-text-primary">
                        {f.subject}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {f.profiles?.full_name ?? f.contact_email ?? "Anonymous"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            STATUS_STYLES[f.status]
                          )}
                        >
                          {STATUS_LABELS[f.status]}
                        </span>
                      </td>
                    </tr>
                  </FeedbackDetailPanel>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {feedback.map((f) => (
              <FeedbackDetailPanel key={f.id} feedback={f}>
                <div className="rounded-lg border border-border p-4 cursor-pointer active:bg-surface-secondary/50">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        STATUS_STYLES[f.status]
                      )}
                    >
                      {STATUS_LABELS[f.status]}
                    </span>
                    <span className="text-xs text-text-muted">{formatDate(f.created_at)}</span>
                  </div>
                  <p className="text-sm font-medium text-text-primary mt-1">{f.subject}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className={cn("text-xs font-medium", CATEGORY_COLORS[f.category])}>
                      {CATEGORY_LABELS[f.category]}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {f.profiles?.full_name ?? f.contact_email ?? "Anonymous"}
                    </span>
                  </div>
                  {f.message && (
                    <p className="text-sm text-text-secondary line-clamp-2 mt-2">{f.message}</p>
                  )}
                </div>
              </FeedbackDetailPanel>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
