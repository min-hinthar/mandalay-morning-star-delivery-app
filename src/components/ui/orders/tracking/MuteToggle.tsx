"use client";

/**
 * MuteToggle — CFIX-10
 *
 * Icon-only button for toggling tracking audio notifications.
 * Persistence is handled by the consumer (via useMutePreference hook);
 * this component is a stateless presentation wrapper so it's easy to test
 * and easy to drive from a parent's useMutePreference call.
 *
 * - 44px touch target (Phase 113 A11Y prep) per D-31
 * - aria-pressed toggle state per D-32
 * - Haptic feedback on click via triggerHaptic("light") per D-31
 * - Ghost button variant matches adjacent ShareButton + RefreshCw per D-30
 */

import { Volume2, VolumeX } from "lucide-react";
import { triggerHaptic } from "@/lib/swipe-gestures";
import { cn } from "@/lib/utils/cn";

export interface MuteToggleProps {
  isMuted: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
}

export function MuteToggle({ isMuted, onToggle, disabled = false, className }: MuteToggleProps) {
  const label = isMuted ? "Unmute notifications" : "Mute notifications";

  const handleClick = () => {
    if (disabled) return;
    triggerHaptic("light");
    onToggle();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={isMuted}
      title={label}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-lg",
        "hover:bg-surface-secondary",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "transition-colors",
        className
      )}
    >
      {isMuted ? (
        <VolumeX className="h-5 w-5 text-text-muted" aria-hidden="true" />
      ) : (
        <Volume2 className="h-5 w-5 text-text-primary" aria-hidden="true" />
      )}
    </button>
  );
}
