import type { LoyaltyTierId } from "@/lib/loyalty";

export interface TierAccent {
  /** Text/stroke color token class. */
  text: string;
  /** Ring color token class (for the avatar ring). */
  ring: string;
  /** Soft background token class (for badges). */
  bg: string;
}

/** Tier → brand color tokens, shared by the Rewards hub ring and header pill. */
export function tierAccent(id: LoyaltyTierId): TierAccent {
  switch (id) {
    case "jade":
      return { text: "text-accent-green", ring: "ring-accent-green", bg: "bg-accent-green/10" };
    case "ruby":
      return { text: "text-magenta", ring: "ring-magenta", bg: "bg-magenta/10" };
    case "gold":
      return { text: "text-accent-orange", ring: "ring-accent-orange", bg: "bg-accent-orange/10" };
    default:
      return { text: "text-primary", ring: "ring-primary", bg: "bg-primary/10" };
  }
}
