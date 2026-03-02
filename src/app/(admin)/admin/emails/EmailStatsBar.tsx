"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { EmailStats } from "./email-log-types";

// ===========================================
// COMPONENT
// ===========================================

export function EmailStatsBar() {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/admin/emails/stats");
        if (!response.ok) return;
        const data = await response.json();
        setStats(data.stats);
      } catch {
        // Non-critical — stats bar failing shouldn't block the page
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-card-sm border border-border-subtle p-3 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: "Sent", color: "text-status-info", data: stats, key: "sent" as const },
    { label: "Delivered", color: "text-green", data: stats, key: "delivered" as const },
    { label: "Failed", color: "text-status-error", data: stats, key: "failed" as const },
    { label: "Bounced", color: "text-status-warning", data: stats, key: "bounced" as const },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.label} className="rounded-card-sm border border-border-subtle p-3">
          <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">{card.label}</p>
          <p className={`text-xl font-bold ${card.color}`}>{card.data.allTime[card.key]}</p>
          <div className="flex gap-3 mt-1 text-2xs text-text-muted">
            <span>Today: {card.data.today[card.key]}</span>
            <span>Week: {card.data.week[card.key]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
