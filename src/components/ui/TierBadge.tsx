import { cn } from "@/lib/utils/cn";
import type { LoyaltyTierId } from "@/lib/loyalty";
import { tierAccent } from "@/components/ui/account/RewardsTab/tierStyle";

export interface TierBadgeTier {
  id: LoyaltyTierId;
  name: string;
  english: string;
  emoji: string;
}

interface TierBadgeProps {
  tier: TierBadgeTier;
  /**
   * - `pill`: filled gem chip (rewards hub, profile, confirmation)
   * - `inline`: emoji + name in flowing text (teaser)
   * - `mini`: tiny name-only label (dropdown)
   */
  variant?: "pill" | "inline" | "mini";
  className?: string;
}

/**
 * Loyalty tier badge — the Burmese gem chip used across the app. One source of
 * truth so the header pill, rewards hub, profile, and confirmation all match.
 * Emoji is decorative (`aria-hidden`); the visible name + gloss carry meaning,
 * and an `aria-label` gives AT the full "Tier: Kyauk Sein (Jade)" reading.
 */
export function TierBadge({ tier, variant = "pill", className }: TierBadgeProps) {
  const accent = tierAccent(tier.id);
  const showGloss = tier.english !== tier.name;
  const label = `Tier: ${tier.name}${showGloss ? ` (${tier.english})` : ""}`;

  if (variant === "mini") {
    return (
      <span className={cn("text-xs font-medium text-text-secondary", className)} aria-label={label}>
        <span aria-hidden="true">
          {tier.emoji} {tier.name}
        </span>
      </span>
    );
  }

  if (variant === "inline") {
    return (
      <span className={cn("font-semibold", accent.text, className)} aria-label={label}>
        <span aria-hidden="true">
          {tier.emoji} {tier.name}
        </span>
      </span>
    );
  }

  // pill
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
        accent.bg,
        accent.text,
        className
      )}
      aria-label={label}
    >
      <span aria-hidden="true">{tier.emoji}</span>
      <span>{tier.name}</span>
      {showGloss && (
        <span className="font-normal opacity-80" aria-hidden="true">
          · {tier.english}
        </span>
      )}
    </span>
  );
}

export default TierBadge;
