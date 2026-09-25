"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star, X } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { createClient } from "@/lib/supabase/client";

interface RatingBannerProps {
  orderId: string;
}

export function RatingBanner({ orderId }: RatingBannerProps) {
  const router = useRouter();
  const { shouldAnimate } = useAnimationPreference();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        // Check if already rated via API
        const res = await fetch(`/api/orders/${orderId}/rating`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.hasRating) return;

        // Check if dismissed via Supabase client
        const supabase = createClient();
        const { data: order } = await supabase
          .from("orders")
          .select("rating_dismissed")
          .eq("id", orderId)
          .single();

        if (order?.rating_dismissed) return;

        if (!cancelled) setVisible(true);
      } catch {
        // Silently fail — banner is non-critical
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const handleDismiss = async () => {
    setDismissed(true);

    try {
      // Server route: no customer UPDATE policy admits a delivered order, so a
      // direct client write silently matched 0 rows and never persisted.
      await fetch(`/api/orders/${orderId}/rating/dismiss`, { method: "POST" });
    } catch {
      // Dismissal is best-effort
    }
  };

  const show = visible && !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <m.div
          role="status"
          initial={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          exit={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
          transition={{ duration: 0.2 }}
          className="relative rounded-xl bg-saffron/10 border border-saffron/20 p-4 mb-6"
        >
          {/* Dismiss button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="group absolute top-0 right-0 flex h-11 w-11 items-center justify-center rounded-full"
            aria-label="Dismiss rating prompt"
          >
            <span className="rounded-full p-1 transition-colors group-hover:bg-saffron/20">
              <X className="h-4 w-4 text-saffron" aria-hidden="true" />
            </span>
          </button>

          <div className="flex items-center gap-3 pr-8">
            <div className="rounded-full bg-saffron/20 p-2 flex-shrink-0">
              <Star className="h-5 w-5 text-saffron" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-charcoal text-sm">How was your order?</p>
              <p className="text-xs text-muted-foreground mt-0.5">Your feedback helps us improve</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/orders/${orderId}/feedback`)}
              className="flex-shrink-0 border-saffron/30 text-saffron hover:bg-saffron/10"
            >
              Rate now
            </Button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
