"use client";

import { History } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { AUDIT_ACTION_LABELS } from "@/components/ui/admin/orders/OrderDetailExpanded/config";
import { CollapsibleCard } from "./CollapsibleCard";
import type { AuditLogEntry } from "./types";

// Dot color by action type
const ACTION_DOT_COLORS: Record<string, string> = {
  status_change: "bg-accent-teal",
  cancel: "bg-status-error",
  refund: "bg-secondary",
  priority_change: "bg-secondary-light",
  assign_driver: "bg-primary",
  unassign_driver: "bg-text-muted",
  edit: "bg-accent-magenta",
  update_items: "bg-accent-magenta",
};

interface StatusTimelineCardProps {
  auditLog: AuditLogEntry[];
}

export function StatusTimelineCard({ auditLog }: StatusTimelineCardProps) {
  return (
    <CollapsibleCard
      title="Status Timeline"
      icon={<History className="h-4 w-4" />}
      defaultOpen
    >
      {auditLog.length === 0 ? (
        <p className="text-sm text-text-muted">No status history</p>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

          <div className="space-y-3">
            {auditLog.map((entry) => {
              const dotColor =
                ACTION_DOT_COLORS[entry.action] || "bg-text-muted";
              return (
                <div key={entry.id} className="flex items-start gap-3 relative">
                  {/* Dot */}
                  <div
                    className={cn(
                      "mt-1.5 h-[14px] w-[14px] rounded-full border-2 border-surface-primary flex-shrink-0 z-[1]",
                      dotColor
                    )}
                  />
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">
                      {AUDIT_ACTION_LABELS[entry.action] || entry.action}
                    </p>
                    {entry.reason && (
                      <p className="text-xs text-text-muted mt-0.5">
                        {entry.reason}
                      </p>
                    )}
                    <p className="text-xs text-text-muted mt-0.5">
                      {format(parseISO(entry.createdAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </CollapsibleCard>
  );
}
