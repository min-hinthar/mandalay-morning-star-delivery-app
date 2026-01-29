/**
 * V2 Sprint 4: Delivery Feedback Form Client Component
 *
 * Animated star rating and feedback form with spring physics.
 * Shows thank you state after submission.
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Send, CheckCircle, Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/ui/admin/analytics";

interface ExistingRating {
  id: string;
  rating: number;
  feedbackText: string | null;
  submittedAt: string;
}

interface DeliveryFeedbackFormProps {
  orderId: string;
  existingRating: ExistingRating | null;
}

export function DeliveryFeedbackForm({
  orderId,
  existingRating,
}: DeliveryFeedbackFormProps) {
  const [rating, setRating] = useState(existingRating?.rating ?? 0);
  const [feedbackText, setFeedbackText] = useState(
    existingRating?.feedbackText ?? ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          feedbackText: feedbackText.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit rating");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // Already rated - show read-only view
  if (existingRating) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Back Button */}
        <Button variant="ghost" asChild>
          <Link href={`/orders/${orderId}`} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Order
          </Link>
        </Button>

        {/* Already Rated Card */}
        <div className="rounded-2xl bg-surface-primary p-8 shadow-warm-lg text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-jade/10"
          >
            <CheckCircle className="h-8 w-8 text-jade" />
          </motion.div>

          <h1 className="mb-2 text-2xl font-display text-charcoal">
            Thanks for your feedback!
          </h1>
          <p className="mb-6 text-charcoal-500">
            You rated this delivery on{" "}
            {new Date(existingRating.submittedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>

          <div className="mb-4 flex justify-center">
            <StarRating value={existingRating.rating} readonly size="lg" />
          </div>

          {existingRating.feedbackText && (
            <div className="mt-6 rounded-lg bg-charcoal-50 p-4 text-left">
              <p className="text-sm text-charcoal-500 mb-1">Your feedback:</p>
              <p className="text-charcoal-700">{existingRating.feedbackText}</p>
            </div>
          )}

          <div className="mt-8">
            <Button asChild>
              <Link href="/menu">Order Again</Link>
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl bg-surface-primary p-8 shadow-warm-lg text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-jade to-jade/80"
        >
          <CheckCircle className="h-10 w-10 text-text-inverse" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-2 text-2xl font-display text-charcoal"
        >
          Thank You!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 text-charcoal-500"
        >
          Your feedback helps us improve our service.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-3"
        >
          <Button asChild size="lg">
            <Link href="/menu">Order Again</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href={`/orders/${orderId}`}>View Order</Link>
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // Rating form
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href={`/orders/${orderId}`} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Order
        </Link>
      </Button>

      {/* Rating Card */}
      <form onSubmit={handleSubmit}>
        <div className="rounded-2xl bg-surface-primary p-8 shadow-warm-lg">
          {/* Header */}
          <div className="mb-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-saffron/10"
            >
              <Star className="h-8 w-8 text-saffron" />
            </motion.div>
            <h1 className="text-2xl font-display text-charcoal">
              How was your delivery?
            </h1>
            <p className="mt-2 text-charcoal-500">
              Your feedback helps us serve you better
            </p>
          </div>

          {/* Star Rating */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 flex justify-center"
          >
            <StarRating
              value={rating}
              onChange={setRating}
              size="lg"
              showLabel
            />
          </motion.div>

          {/* Feedback Text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <div className="mb-2 flex items-center gap-2 text-charcoal-600">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm font-medium">
                Additional feedback (optional)
              </span>
            </div>
            <Textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Tell us more about your experience..."
              rows={4}
              className="resize-none"
              maxLength={500}
            />
            <p className="mt-1 text-right text-xs text-charcoal-400">
              {feedbackText.length}/500
            </p>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting || rating === 0}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Submit Feedback
                </div>
              )}
            </Button>
          </motion.div>
        </div>
      </form>
    </motion.div>
  );
}
