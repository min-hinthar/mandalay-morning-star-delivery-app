/**
 * AcceptDeclineCard - Dashboard accept/decline UI with route preview
 *
 * Shown when todayRoute.status === "assigned". Full-width card with
 * route preview, green Accept CTA, and red Decline link.
 */

"use client";

import { useState, useCallback } from "react";
import { m } from "framer-motion";
import { Loader2, MapPin, Package } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useAcceptRoute } from "@/lib/hooks/useAcceptRoute";
import { useDeclineRoute } from "@/lib/hooks/useDeclineRoute";
import { DeclineConfirmDialog } from "./DeclineConfirmDialog";

interface AcceptDeclineCardProps {
  route: {
    id: string;
    status: string;
    stopCount: number;
    area_description?: string | null;
  };
  onAccepted?: () => void;
  onDeclined?: () => void;
}

export function AcceptDeclineCard({ route, onAccepted, onDeclined }: AcceptDeclineCardProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const { acceptRoute, isAccepting } = useAcceptRoute({
    routeId: route.id,
    onSuccess: () => {
      setIsExiting(true);
      // Allow exit animation before calling parent
      setTimeout(() => onAccepted?.(), shouldAnimate ? 250 : 0);
    },
  });

  const { declineRoute, isDeclining } = useDeclineRoute({
    routeId: route.id,
    onSuccess: () => {
      setShowDeclineDialog(false);
      onDeclined?.();
    },
  });

  const handleAccept = useCallback(async () => {
    if (isAccepting || isDeclining) return;
    await acceptRoute();
  }, [acceptRoute, isAccepting, isDeclining]);

  const stopCount = route.stopCount ?? 0;

  return (
    <>
      <m.div
        initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
        animate={
          shouldAnimate
            ? isExiting
              ? { opacity: 0, scale: 0.95 }
              : { opacity: 1, y: 0 }
            : undefined
        }
        transition={isExiting ? { duration: 0.2 } : getSpring(spring.default)}
        className={cn("w-full overflow-hidden rounded-2xl border-2 border-border shadow-card")}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-accent-teal/10 to-surface-tertiary/30 p-4">
          <h2 className="font-display text-xl font-semibold text-text-primary">Route Assigned</h2>
        </div>

        {/* Preview */}
        <div className="space-y-2 p-4">
          <div className="flex items-center gap-2 text-text-muted">
            <Package className="h-4 w-4 shrink-0" />
            <span className="font-body text-base">
              {stopCount} {stopCount === 1 ? "stop" : "stops"}
            </span>
          </div>
          {route.area_description && (
            <div className="flex items-center gap-2 text-text-muted">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="font-body text-base">{route.area_description}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3 p-4 pt-0">
          {/* Accept button */}
          <m.button
            whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
            onClick={handleAccept}
            disabled={isAccepting || isDeclining}
            className={cn(
              "flex min-h-[72px] w-full items-center justify-center gap-3 rounded-xl",
              "bg-green font-body text-xl font-semibold text-text-inverse shadow-md",
              "transition-all duration-fast hover:bg-green-hover hover:shadow-lg",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            {isAccepting ? (
              <>
                <Loader2 className="h-7 w-7 animate-spin" />
                <span>Accepting...</span>
              </>
            ) : (
              <span>Accept Route</span>
            )}
          </m.button>

          {/* Decline link */}
          <button
            onClick={() => setShowDeclineDialog(true)}
            disabled={isAccepting || isDeclining}
            className={cn(
              "mx-auto block font-body text-sm text-status-error",
              "hover:underline",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            Decline
          </button>
        </div>
      </m.div>

      <DeclineConfirmDialog
        open={showDeclineDialog}
        onOpenChange={setShowDeclineDialog}
        onConfirm={declineRoute}
        isLoading={isDeclining}
      />
    </>
  );
}
