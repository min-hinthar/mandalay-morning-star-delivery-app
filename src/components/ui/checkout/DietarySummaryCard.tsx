"use client";

/**
 * DietarySummaryCard
 * Informational card shown in checkout review step displaying user's dietary restrictions.
 * Self-contained: fetches own data, renders nothing if no restrictions set.
 * Non-critical: silently fails on error to avoid blocking checkout flow.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { Leaf } from "lucide-react";
import {
  DIETARY_OPTIONS,
  DIETARY_EMOJIS,
} from "@/components/ui/account/SettingsTab/settings-types";
import type { DietaryOption } from "@/components/ui/account/SettingsTab/settings-types";

export function DietarySummaryCard() {
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/account/settings")
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const dietary = data?.data?.dietaryRestrictions;
        if (Array.isArray(dietary)) {
          setRestrictions(dietary);
        }
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Don't render until loaded, and hide if no restrictions
  if (!loaded || restrictions.length === 0) return null;

  return (
    <div className="rounded-lg bg-amber-50/50 border border-amber-200/50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Leaf className="h-4 w-4 text-amber-600" />
        <h3 className="text-sm font-medium text-amber-900">
          Dietary Preferences
        </h3>
      </div>
      <p className="text-xs text-amber-700 mb-3">
        These will be included in your order notes
      </p>

      {/* Restriction pills */}
      <div className="flex flex-wrap gap-1.5">
        {restrictions.map((item) => {
          const isPredefined = (DIETARY_OPTIONS as readonly string[]).includes(
            item
          );
          const emoji = isPredefined
            ? DIETARY_EMOJIS[item as DietaryOption]
            : undefined;

          return (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"
            >
              {emoji && <span>{emoji}</span>}
              {item}
            </span>
          );
        })}
      </div>

      {/* Edit link */}
      <div className="mt-3">
        <Link
          href="/account?tab=settings&section=preferences"
          className="text-xs text-amber-600 hover:text-amber-800 underline underline-offset-2 transition-colors"
        >
          Edit in Settings
        </Link>
      </div>
    </div>
  );
}
