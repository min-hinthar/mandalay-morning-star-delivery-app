import type { SupabaseClient } from "@supabase/supabase-js";

import type { LoyaltyProgressData } from "@/emails/components/LoyaltyProgress";
import type { TierPerkData } from "@/emails/components/TierPerkCard";
import {
  TIER_PERKS,
  nextRewardCents,
  ordersToNextMilestone,
  progressInCycle,
  tierForSpend,
  type LoyaltyTier,
} from "@/lib/loyalty";
import { loyaltyStatsForUser } from "@/lib/loyalty/tier";
import { getBusinessRules } from "@/lib/settings/business-rules";
import { getNextDeliveryDate, getZonedDayOfWeek } from "@/lib/utils/delivery-dates";
import { getNextCutoffText } from "@/lib/utils/delivery-schedule";
import { logger } from "@/lib/utils/logger";
import type { Database } from "@/types/database";

/**
 * Decorative email nudges (loyalty progress, tier perk, next-delivery cutoff),
 * computed from REAL data at send time. Every reader here is fail-soft: a
 * nudge must never block or fail a transactional email, so errors log and
 * return null and the templates simply omit the module.
 */

/** Loyalty star-progress strip data for order emails. */
export async function getLoyaltyNudge(
  service: SupabaseClient<Database>,
  userId: string
): Promise<LoyaltyProgressData | null> {
  try {
    const { orderCount, spendCents } = await loyaltyStatsForUser(service, userId);
    if (orderCount <= 0) return null;
    const tier = tierForSpend(spendCents);
    return {
      stars: orderCount,
      progressInCycle: progressInCycle(orderCount),
      ordersToNext: ordersToNextMilestone(orderCount),
      nextRewardCents: nextRewardCents(spendCents),
      tierEnglish: tier.english,
      tierEmoji: tier.emoji,
    };
  } catch (error) {
    logger.exception(error, { api: "email/nudges", message: "loyalty nudge failed" });
    return null;
  }
}

/** Pure: tier → perk-card data, for call sites that already resolved the tier. */
export function tierPerkFromTier(tier: LoyaltyTier): TierPerkData | null {
  const perks = TIER_PERKS[tier.id];
  const perk = perks[perks.length - 1];
  if (!perk) return null;
  return {
    tierEnglish: tier.english,
    tierName: tier.name,
    emoji: tier.emoji,
    perkEn: perk.en,
    perkMy: perk.my,
  };
}

/** Tier badge + the tier's most distinctive perk, for retention emails. */
export async function getTierPerkNudge(
  service: SupabaseClient<Database>,
  userId: string
): Promise<TierPerkData | null> {
  try {
    const { orderCount, spendCents } = await loyaltyStatsForUser(service, userId);
    if (orderCount <= 0) return null;
    return tierPerkFromTier(tierForSpend(spendCents));
  } catch (error) {
    logger.exception(error, { api: "email/nudges", message: "tier nudge failed" });
    return null;
  }
}

/** Live "Order by Tuesday 3 PM for Wednesday delivery" line, or null. */
export async function getNextDeliveryCutoffText(): Promise<string | null> {
  try {
    const { deliveryDays } = await getBusinessRules();
    if (!deliveryDays.length) return null;
    const nextDate = getNextDeliveryDate(new Date(), deliveryDays);
    if (!nextDate) return null;
    const text = getNextCutoffText(getZonedDayOfWeek(nextDate), deliveryDays);
    return text === "No upcoming delivery windows" ? null : text;
  } catch (error) {
    logger.exception(error, { api: "email/nudges", message: "cutoff nudge failed" });
    return null;
  }
}
