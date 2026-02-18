"use client";

/**
 * NotificationCard
 * Expandable card with icon, title, description, toggle, sub-categories, and warning.
 * Toggle click is isolated from card expand/collapse via stopPropagation.
 */

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { ToggleSwitch } from "@/components/ui/admin/settings/ToggleSwitch";
import { cn } from "@/lib/utils/cn";

interface NotificationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  subCategories: readonly string[];
  warningText: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function NotificationCard({
  title,
  description,
  icon,
  subCategories,
  warningText,
  enabled,
  onToggle,
}: NotificationCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-surface-secondary overflow-hidden">
      {/* Header row — clickable to expand/collapse */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        {/* Left: icon + text */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="mt-0.5 shrink-0 text-text-secondary">{icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary">{title}</p>
            <p className="text-xs text-text-secondary mt-0.5">{description}</p>
          </div>
        </div>

        {/* Right: toggle + chevron */}
        <div className="flex items-center gap-3 shrink-0">
          {/* stopPropagation prevents card expand on toggle click */}
          <div onClick={(e) => e.stopPropagation()}>
            <ToggleSwitch
              id={`notif-toggle-${title.toLowerCase().replace(/\s+/g, "-")}`}
              checked={enabled}
              onChange={onToggle}
              label=""
            />
          </div>
          <m.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-text-tertiary"
          >
            <ChevronDown className="h-4 w-4" />
          </m.span>
        </div>
      </button>

      {/* Expandable sub-categories */}
      <AnimatePresence initial={false}>
        {expanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 pl-11">
              <ul className="list-disc pl-5 space-y-1">
                {subCategories.map((cat) => (
                  <li key={cat} className="text-xs text-text-secondary">
                    {cat}
                  </li>
                ))}
              </ul>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Warning when disabled */}
      <AnimatePresence>
        {!enabled && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className={cn("px-4 pb-3 text-sm text-status-warning", !expanded && "pt-0")}>
              {warningText}
            </p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
