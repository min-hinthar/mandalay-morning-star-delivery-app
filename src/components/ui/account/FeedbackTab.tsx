"use client";

import { useEffect, useState } from "react";
import { MessageSquare, MessageSquarePlus, Loader2 } from "lucide-react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { useFeedbackStore } from "@/components/ui/feedback/feedback-store";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { CustomerFeedback, FeedbackCategory, FeedbackStatus } from "@/types/feedback";

// ============================================
// CONSTANTS
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
  general: "text-hero-ink-muted",
};

// ============================================
// COMPONENT
// ============================================

export function FeedbackTab() {
  const { shouldAnimate } = useAnimationPreference();
  const openFeedback = useFeedbackStore((s) => s.open);
  const [feedback, setFeedback] = useState<CustomerFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeedback() {
      try {
        const res = await fetch("/api/feedback");
        if (res.ok) {
          const data = await res.json();
          setFeedback(data.feedback ?? []);
        }
      } catch {
        // Silent fail — user sees empty state
      } finally {
        setLoading(false);
      }
    }
    fetchFeedback();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  if (feedback.length === 0) {
    return (
      <m.div
        initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        className="hero-surface-paper rounded-card p-12 text-center"
      >
        <MessageSquare className="mx-auto h-12 w-12 text-hero-clay" />
        <p className="mt-4 text-lg font-medium text-hero-ink">No feedback submitted yet</p>
        <p className="mt-1 text-sm text-hero-ink-muted">
          Have something to share? We&apos;d love to hear from you.
        </p>
        <Button onClick={() => openFeedback()} className="mt-6">
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          Send Feedback
        </Button>
      </m.div>
    );
  }

  return (
    <div className="space-y-3">
      {feedback.map((item) => {
        const isExpanded = expandedId === item.id;

        return (
          <m.div
            key={item.id}
            initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
            className="hero-surface-paper overflow-hidden rounded-card"
          >
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
              className="w-full px-4 py-3 text-left transition-colors hover:bg-hero-clay/[0.06]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-xs font-medium", CATEGORY_COLORS[item.category])}>
                      {CATEGORY_LABELS[item.category]}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-2xs font-medium",
                        STATUS_STYLES[item.status]
                      )}
                    >
                      {STATUS_LABELS[item.status]}
                    </span>
                  </div>
                  <p className="truncate text-sm font-medium text-hero-ink">{item.subject}</p>
                  {!isExpanded && (
                    <p className="mt-0.5 truncate text-xs text-hero-ink-muted">{item.message}</p>
                  )}
                </div>
                <span className="whitespace-nowrap text-xs text-hero-ink-muted">
                  {new Date(item.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </button>

            {isExpanded && (
              <div className="space-y-3 border-t border-hero-line/70 px-4 pb-4 pt-3">
                <p className="whitespace-pre-wrap text-sm text-hero-ink">{item.message}</p>

                {item.admin_notes && (
                  <div className="rounded-card-sm bg-hero-ink/5 p-3">
                    <p className="mb-1 text-xs font-medium text-hero-ink-muted">Admin Response</p>
                    <p className="text-sm text-hero-ink">{item.admin_notes}</p>
                  </div>
                )}

                {item.screenshot_url && (
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.screenshot_url}
                      alt="Feedback screenshot"
                      className="max-h-48 rounded-card-sm border border-hero-line object-contain"
                    />
                  </div>
                )}
              </div>
            )}
          </m.div>
        );
      })}
    </div>
  );
}
