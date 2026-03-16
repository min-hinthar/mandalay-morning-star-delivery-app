/**
 * AcceptDeclineBar - Sticky bottom bar for route page accept/decline
 *
 * Shows for both assigned (accept+decline) and accepted (decline-only) statuses.
 * Per locked decision: driver can un-accept as long as route is not in_progress.
 */

"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useAcceptRoute } from "@/lib/hooks/useAcceptRoute";
import { useDeclineRoute } from "@/lib/hooks/useDeclineRoute";
import { DeclineConfirmDialog } from "./DeclineConfirmDialog";

interface AcceptDeclineBarProps {
  routeId: string;
  routeStatus: string;
  onAccepted?: () => void;
  onDeclined?: () => void;
}

export function AcceptDeclineBar({
  routeId,
  routeStatus,
  onAccepted,
  onDeclined,
}: AcceptDeclineBarProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);

  const { acceptRoute, isAccepting } = useAcceptRoute({
    routeId,
    onSuccess: onAccepted,
  });

  const { declineRoute, isDeclining } = useDeclineRoute({
    routeId,
    onSuccess: () => {
      setShowDeclineDialog(false);
      onDeclined?.();
    },
  });

  // Only show for assigned (accept+decline) or accepted (decline-only)
  if (routeStatus !== "assigned" && routeStatus !== "accepted") {
    return null;
  }

  const isAssigned = routeStatus === "assigned";

  return (
    <>
      <m.div
        initial={shouldAnimate ? { y: "100%" } : undefined}
        animate={shouldAnimate ? { y: 0 } : undefined}
        transition={getSpring(spring.default)}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[30]",
          "bg-background shadow-[0_-2px_10px_rgba(0,0,0,0.1)]"
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex h-20 items-center gap-3 px-4">
          {/* Decline button */}
          <button
            onClick={() => setShowDeclineDialog(true)}
            disabled={isAccepting || isDeclining}
            className={cn(
              "flex h-14 flex-1 items-center justify-center gap-2 rounded-xl",
              "border-2 border-status-error font-body font-semibold text-status-error",
              "transition-all duration-fast",
              "hover:bg-status-error/10",
              "active:scale-[0.98]",
              "disabled:cursor-not-allowed disabled:opacity-50",
              // Full-width when accepted (no Accept button shown)
              !isAssigned && "flex-auto"
            )}
          >
            Decline Route
          </button>

          {/* Accept button - only for assigned status */}
          {isAssigned && (
            <button
              onClick={acceptRoute}
              disabled={isAccepting || isDeclining}
              className={cn(
                "flex h-14 flex-1 items-center justify-center gap-2 rounded-xl",
                "bg-green font-body font-semibold text-text-inverse shadow-md",
                "transition-all duration-fast hover:bg-green-hover hover:shadow-lg",
                "active:scale-[0.98]",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              {isAccepting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Accepting...</span>
                </>
              ) : (
                <span>Accept Route</span>
              )}
            </button>
          )}
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
