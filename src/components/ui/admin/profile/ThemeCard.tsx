"use client";

/**
 * ThemeCard
 * Wraps existing ThemeSelector in a card for the admin profile page.
 * Theme changes apply immediately via next-themes (no save needed).
 */

import { Palette } from "lucide-react";
import { ThemeSelector } from "@/components/ui/account/SettingsTab/ThemeSelector";

export function ThemeCard() {
  return (
    <div className="rounded-card border border-border bg-surface-primary p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5 text-text-muted" />
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Appearance
        </h2>
      </div>
      <ThemeSelector />
      <p className="text-xs text-text-muted">
        Theme changes apply immediately.
      </p>
    </div>
  );
}
