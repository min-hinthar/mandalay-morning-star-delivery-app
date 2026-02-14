"use client";

/**
 * ActivityStatsCard
 * Shows admin activity: last login time and orders processed count.
 * Fetches from GET /api/admin/profile/stats independently.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Clock, Package, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton/base";
import { Button } from "@/components/ui/button";
import type { AdminStats } from "./types";

export function ActivityStatsCard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/profile/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const json = await res.json();
      setStats(json.data as AdminStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const lastLoginFormatted = (() => {
    if (!stats?.lastLoginAt) return "Never";
    try {
      return formatDistanceToNow(parseISO(stats.lastLoginAt), {
        addSuffix: true,
      });
    } catch {
      return "Unknown";
    }
  })();

  return (
    <div className="rounded-card border border-border bg-surface-primary p-5 space-y-4">
      <h2 className="font-display text-lg font-semibold text-text-primary">
        Activity
      </h2>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-32" />
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-sm text-text-muted mb-2">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchStats}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Last login */}
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-surface-secondary p-2">
              <Clock className="h-5 w-5 text-text-muted" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Last login</p>
              <p className="text-base font-medium text-text-primary">
                {lastLoginFormatted}
              </p>
            </div>
          </div>

          {/* Orders processed */}
          <Link
            href="/admin/orders"
            className="flex items-start gap-3 group rounded-lg p-1 -m-1 transition-colors hover:bg-surface-secondary"
          >
            <div className="rounded-lg bg-surface-secondary p-2 group-hover:bg-surface-tertiary transition-colors">
              <Package className="h-5 w-5 text-text-muted" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Orders processed</p>
              <p className="text-2xl font-bold text-text-primary tabular-nums">
                {stats?.ordersProcessed ?? 0}
              </p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
