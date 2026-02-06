"use client";

import { m } from "framer-motion";
import { History } from "lucide-react";
import { format, parseISO } from "date-fns";
import { staggerItem } from "@/lib/motion-tokens";
import { AUDIT_ACTION_LABELS } from "./config";
import type { AuditLogEntry } from "./types";

interface AuditLogSectionProps {
  auditLog: AuditLogEntry[];
}

export function AuditLogSection({ auditLog }: AuditLogSectionProps) {
  return (
    <m.div variants={staggerItem} className="space-y-4">
      <div className="flex items-center gap-2 text-text-muted">
        <History className="h-4 w-4" />
        <span className="text-xs font-body font-semibold uppercase tracking-wider">
          Activity Log
        </span>
      </div>

      {auditLog.length > 0 ? (
        <div className="space-y-2">
          {auditLog.slice(0, 5).map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 p-2 rounded-input bg-surface-tertiary/30 text-sm"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-text-primary">
                  {AUDIT_ACTION_LABELS[entry.action] || entry.action}
                  {entry.reason && (
                    <span className="text-text-muted"> - {entry.reason}</span>
                  )}
                </p>
                <p className="text-xs text-text-muted">
                  {format(parseISO(entry.createdAt), "MMM d, h:mm a")} by {entry.actorRole}
                </p>
              </div>
            </div>
          ))}
          {auditLog.length > 5 && (
            <p className="text-xs text-text-muted text-center">
              +{auditLog.length - 5} more entries
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-text-muted">No activity recorded</p>
      )}
    </m.div>
  );
}
