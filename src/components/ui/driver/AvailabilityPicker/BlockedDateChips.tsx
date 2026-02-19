"use client";

/**
 * BlockedDateChips
 * Renders dismissible date chips for one-off blocked dates.
 * Add button opens native date input; chips display formatted dates.
 */

import { useState, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { format } from "date-fns";
import { useAnimationPreference } from "@/lib/hooks";
import { cn } from "@/lib/utils/cn";

interface BlockedDateChipsProps {
  dates: string[];
  onChange: (dates: string[]) => void;
}

export function BlockedDateChips({ dates, onChange }: BlockedDateChipsProps) {
  const [showInput, setShowInput] = useState(false);
  const { shouldAnimate } = useAnimationPreference();

  const today = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  const sortedDates = useMemo(() => [...dates].sort(), [dates]);

  const handleAdd = (value: string) => {
    if (value && !dates.includes(value)) {
      onChange([...dates, value]);
    }
    setShowInput(false);
  };

  const handleRemove = (date: string) => {
    onChange(dates.filter((d) => d !== date));
  };

  const formatDate = (date: string) => {
    return format(new Date(date + "T12:00:00Z"), "MMM d, yyyy");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AnimatePresence mode="popLayout">
        {sortedDates.map((date) => (
          <m.span
            key={date}
            layout={shouldAnimate}
            initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : undefined}
            animate={{ opacity: 1, scale: 1 }}
            exit={shouldAnimate ? { opacity: 0, scale: 0.8 } : undefined}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-sm font-medium",
              "bg-status-error/10 text-status-error border border-status-error/20"
            )}
          >
            {formatDate(date)}
            <button
              type="button"
              onClick={() => handleRemove(date)}
              className="shrink-0 rounded-full p-0.5 hover:bg-status-error/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`Remove ${formatDate(date)}`}
            >
              <X className="h-3 w-3" />
            </button>
          </m.span>
        ))}
      </AnimatePresence>

      {showInput ? (
        <input
          type="date"
          min={today}
          autoFocus
          onChange={(e) => handleAdd(e.target.value)}
          onBlur={() => setShowInput(false)}
          className={cn(
            "rounded-lg border border-border bg-surface-primary px-3 py-1.5 text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          )}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowInput(true)}
          className={cn(
            "inline-flex items-center justify-center h-8 w-8 rounded-full",
            "border border-dashed border-border text-text-secondary",
            "hover:border-primary hover:text-primary transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          )}
          aria-label="Add blocked date"
        >
          <Plus className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
