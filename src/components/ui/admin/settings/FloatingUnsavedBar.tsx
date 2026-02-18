"use client";

/**
 * FloatingUnsavedBar Component
 * Floating bottom bar with Save/Discard buttons.
 * Slides up from bottom with spring animation.
 */

import { m, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { spring } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils/cn";

export interface FloatingUnsavedBarProps {
  show: boolean;
  onSave: () => void;
  onDiscard: () => void;
  isSaving: boolean;
}

export function FloatingUnsavedBar({ show, onSave, onDiscard, isSaving }: FloatingUnsavedBarProps) {
  return (
    <AnimatePresence>
      {show && (
        <m.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={spring.default}
          className={cn(
            "fixed bottom-4 left-1/2 -translate-x-1/2 z-40",
            "bg-surface-primary border border-border shadow-lg backdrop-blur-sm rounded-card-sm",
            "flex items-center gap-4 px-4 py-3",
            "max-w-[90vw] sm:max-w-md"
          )}
        >
          {/* Warning text */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <p className="text-sm font-medium text-text-primary truncate">
              You have unsaved changes
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={onDiscard} disabled={isSaving}>
              Discard
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onSave}
              isLoading={isSaving}
              loadingText="Saving..."
            >
              Save
            </Button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
