/**
 * Recent Ratings Section Component
 *
 * Displays driver's customer ratings and feedback.
 * Fetches data from /api/admin/drivers/[id]/ratings.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { m } from "framer-motion";
import { Star, MessageCircle, RefreshCw, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/hooks/useToastV8";
import { spring } from "@/lib/motion-tokens";
import { Button } from "@/components/ui/button";

interface DriverRating {
  id: string;
  rating: number;
  feedbackText: string | null;
  submittedAt: string;
  orderId: string;
  customerName: string | null;
}

interface RecentRatingsSectionProps {
  driverId: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-4 w-4",
            star <= rating ? "text-primary fill-primary" : "text-surface-tertiary"
          )}
        />
      ))}
    </div>
  );
}

export function RecentRatingsSection({ driverId }: RecentRatingsSectionProps) {
  const [ratings, setRatings] = useState<DriverRating[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRatings = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);

      try {
        const response = await fetch(`/api/admin/drivers/${driverId}/ratings?limit=10`);
        if (!response.ok) throw new Error("Failed to fetch ratings");

        const data = await response.json();
        setRatings(data.ratings || []);
        setAverageRating(data.averageRating);
        setTotalRatings(data.totalRatings || 0);
      } catch {
        toast({ message: "Failed to fetch ratings", type: "error" });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [driverId]
  );

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-surface-secondary rounded-card-sm border border-border p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-text-primary flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Customer Ratings
          </h2>
        </div>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-surface-tertiary rounded-input" />
          ))}
        </div>
      </m.div>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-surface-secondary rounded-card-sm border border-border p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-text-primary flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Customer Ratings
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchRatings(true)}
          disabled={refreshing}
          className="text-text-muted hover:text-text-primary"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
        </Button>
      </div>

      {/* Average Rating Header */}
      {totalRatings > 0 && (
        <div className="flex items-center gap-4 mb-4 p-3 bg-primary-light/50 rounded-input">
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 text-primary fill-primary" />
            <span className="text-2xl font-display font-bold text-text-primary">
              {averageRating?.toFixed(1) || "-"}
            </span>
          </div>
          <div className="text-sm font-body text-text-secondary">
            <span className="font-medium text-text-primary">{totalRatings}</span> total ratings
          </div>
        </div>
      )}

      {ratings.length === 0 ? (
        <div className="text-center py-8">
          <div className="rounded-full bg-surface-tertiary w-12 h-12 mx-auto flex items-center justify-center mb-3">
            <Star className="h-6 w-6 text-text-muted" />
          </div>
          <p className="text-sm font-body text-text-secondary">No ratings yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ratings.map((rating, index) => (
            <m.div
              key={rating.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, ...spring.default }}
              className="p-3 rounded-input bg-surface-primary border border-border/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Customer and Date */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1.5 text-sm font-body">
                      <User className="h-3.5 w-3.5 text-text-muted" />
                      <span className="text-text-primary font-medium truncate">
                        {rating.customerName || "Anonymous"}
                      </span>
                    </div>
                    <span className="text-xs font-body text-text-muted">
                      {formatDate(rating.submittedAt)}
                    </span>
                  </div>

                  {/* Star Rating */}
                  <StarRating rating={rating.rating} />

                  {/* Feedback Text */}
                  {rating.feedbackText ? (
                    <p className="mt-2 text-sm font-body text-text-secondary line-clamp-2">
                      &ldquo;{rating.feedbackText}&rdquo;
                    </p>
                  ) : (
                    <p className="mt-2 text-sm font-body text-text-muted italic">
                      No feedback provided
                    </p>
                  )}
                </div>

                {/* Rating Number */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-light shrink-0">
                  <span className="text-lg font-display font-bold text-primary">
                    {rating.rating}
                  </span>
                </div>
              </div>
            </m.div>
          ))}
        </div>
      )}
    </m.div>
  );
}
