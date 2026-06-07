"use client";

import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { VEGAN_NOTE_EN, VEGAN_NOTE_MY } from "@/lib/menu/vegan-request";

export interface VeganToggleProps {
  makeVegan: boolean;
  onToggle: () => void;
}

/**
 * "Make it vegan" switch for veganizable dishes — one tap attaches a bilingual
 * kitchen instruction (skip fish sauce / shrimp powder / ngapi) to the order.
 */
export function VeganToggle({ makeVegan, onToggle }: VeganToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={makeVegan}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-xl border p-3.5 text-left",
        "transition-colors motion-safe:active:scale-[0.99]",
        makeVegan
          ? "border-emerald-500/50 bg-emerald-500/10"
          : "border-border bg-surface-secondary/50 hover:border-emerald-500/40"
      )}
    >
      <div className="min-w-0">
        <span className="flex items-center gap-1.5 font-semibold text-text-primary">
          <Leaf className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Make it vegan
        </span>
        <p className="mt-0.5 text-xs text-text-muted">
          {VEGAN_NOTE_EN.replace("Make it vegan — ", "")}
          <span className="font-burmese"> · {VEGAN_NOTE_MY}</span>
        </p>
      </div>
      <span
        aria-hidden="true"
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          makeVegan ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-surface-primary shadow transition-transform",
            makeVegan ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  );
}

export default VeganToggle;
