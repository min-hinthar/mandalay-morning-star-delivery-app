"use client";

import { m } from "framer-motion";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { Button } from "@/components/ui/button";
import type { StopDetail } from "@/types/driver";

interface ExceptionAlertProps {
  stops: StopDetail[];
  onMarkResolved?: (exceptionId: string) => void;
}

export function ExceptionAlert({ stops, onMarkResolved }: ExceptionAlertProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const unresolvedExceptions = stops.filter(
    (s) => s.exception && !s.exception.resolved
  );

  if (unresolvedExceptions.length === 0) return null;

  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(spring.default)}
      className="rounded-xl bg-status-error/5 border border-status-error/20 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-status-error/10 flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-status-error" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary">
            {unresolvedExceptions.length} Unresolved Exception{unresolvedExceptions.length > 1 ? "s" : ""}
          </h3>
          <ul className="mt-2 space-y-1.5">
            {unresolvedExceptions.map((stop) => (
              <li key={stop.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-text-secondary truncate">
                  Stop {stop.stopIndex + 1}: {stop.exception?.type.replace(/_/g, " ")}
                  {stop.exception?.description && ` — ${stop.exception.description}`}
                </span>
                {onMarkResolved && stop.exception && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onMarkResolved(stop.exception!.id)}
                    className="text-accent-teal hover:bg-accent-teal/10 flex-shrink-0"
                    leftIcon={<CheckCircle className="h-3 w-3" />}
                  >
                    Resolve
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </m.div>
  );
}
