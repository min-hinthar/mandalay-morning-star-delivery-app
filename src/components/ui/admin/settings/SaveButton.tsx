"use client";

/**
 * SaveButton Component
 * Morphing save button with checkmark animation.
 * Reusable across admin and customer settings (Phase 51).
 *
 * States: idle -> saving -> success -> idle
 * Animation: scale-down, text fades to checkmark, green pulse, revert ~1.5s
 */

import { useState, useCallback, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Save, Loader2 } from "lucide-react";
import { SuccessCheckmark } from "@/components/ui/success-checkmark";
import { Button } from "@/components/ui/button";
import { spring } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils/cn";

type SaveState = "idle" | "saving" | "success";

export interface SaveButtonProps {
  onClick: () => Promise<boolean | void>;
  disabled?: boolean;
  hasChanges: boolean;
  className?: string;
}

const SUCCESS_REVERT_MS = 1500;

export function SaveButton({
  onClick,
  disabled = false,
  hasChanges,
  className,
}: SaveButtonProps) {
  const [state, setState] = useState<SaveState>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(async () => {
    if (state !== "idle" || !hasChanges) return;

    setState("saving");
    try {
      const result = await onClick();
      // Treat void (undefined) as success, explicit false as failure
      if (result === false) {
        setState("idle");
        return;
      }
      setState("success");
      timeoutRef.current = setTimeout(() => {
        setState("idle");
      }, SUCCESS_REVERT_MS);
    } catch {
      setState("idle");
    }
  }, [onClick, state, hasChanges]);

  const isDisabled = disabled || !hasChanges || state !== "idle";

  return (
    <m.div
      animate={{
        scale: state === "saving" ? 0.95 : 1,
      }}
      transition={spring.snappyButton}
      className={cn("inline-flex", className)}
    >
      <Button
        variant={state === "success" ? "success" : "primary"}
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          "min-w-[140px] relative overflow-hidden",
          state === "success" && "animate-pulse"
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {state === "idle" && (
            <m.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="inline-flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </m.span>
          )}

          {state === "saving" && (
            <m.span
              key="saving"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="inline-flex items-center gap-2"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </m.span>
          )}

          {state === "success" && (
            <m.span
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center gap-2"
            >
              <SuccessCheckmark
                show
                variant="minimal"
                size={16}
                className="text-text-inverse"
              />
              Saved!
            </m.span>
          )}
        </AnimatePresence>
      </Button>
    </m.div>
  );
}
