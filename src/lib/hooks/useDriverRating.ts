/**
 * useDriverRating - Driver rating submission hook
 *
 * Manages rating state and POST to /api/orders/{orderId}/rating.
 * Pre-populates from initialRating for post-delivery read-only revisits.
 */

"use client";

import { useState, useCallback } from "react";
import { toast } from "@/lib/hooks/useToastV8";

interface UseDriverRatingReturn {
  rating: number;
  submitRating: (rating: number) => void;
  isSubmitting: boolean;
  error: string | null;
}

export function useDriverRating(orderId: string, initialRating?: number): UseDriverRatingReturn {
  const [rating, setRating] = useState<number>(initialRating ?? 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitRating = useCallback(
    async (newRating: number) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch(`/api/orders/${orderId}/rating`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating: newRating }),
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as {
            error?: { message?: string };
          } | null;
          throw new Error(data?.error?.message ?? "Failed to submit rating");
        }

        setRating(newRating);
        toast({ message: "Thanks for your rating!", type: "success" });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to submit rating";
        setError(message);
        toast({ message, type: "error" });
      } finally {
        setIsSubmitting(false);
      }
    },
    [orderId]
  );

  return { rating, submitRating, isSubmitting, error };
}
