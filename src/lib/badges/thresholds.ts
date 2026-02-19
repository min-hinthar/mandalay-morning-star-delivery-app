/**
 * Badge threshold definitions and award logic
 *
 * Checks delivery count, streak, and rating thresholds to award badges.
 * Uses service client for INSERT (driver_badges has admin-only INSERT policy).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ===========================================
// TYPES
// ===========================================

interface BadgeThreshold {
  type: string;
  threshold: number | null;
  name: string;
  icon: string;
}

interface DriverStats {
  totalDeliveries: number;
  streakDays: number;
  ratingAvg: number;
}

interface ExistingBadge {
  badge_type: string;
}

// ===========================================
// THRESHOLD DEFINITIONS
// ===========================================

export const BADGE_THRESHOLDS: BadgeThreshold[] = [
  { type: "first_delivery", threshold: 1, name: "First Delivery", icon: "star" },
  { type: "delivery_10", threshold: 10, name: "10 Deliveries", icon: "star" },
  { type: "delivery_50", threshold: 50, name: "50 Deliveries", icon: "trophy" },
  { type: "delivery_100", threshold: 100, name: "100 Deliveries", icon: "gem" },
  { type: "streak_5", threshold: 5, name: "5-Day Streak", icon: "fire" },
  { type: "streak_10", threshold: 10, name: "10-Day Streak", icon: "star2" },
  { type: "five_star", threshold: null, name: "Perfect Rating", icon: "sparkles" },
];

// ===========================================
// AWARD LOGIC
// ===========================================

/**
 * Check thresholds and award new badges to a driver.
 * Uses service client to bypass admin-only INSERT policy on driver_badges.
 *
 * @returns Array of newly awarded badge names
 */
export async function checkAndAwardBadges(
  serviceSupabase: SupabaseClient,
  driverId: string,
  stats: DriverStats
): Promise<string[]> {
  // Get already-earned badges
  const { data: existingBadges } = await serviceSupabase
    .from("driver_badges")
    .select("badge_type")
    .eq("driver_id", driverId)
    .returns<ExistingBadge[]>();

  const earnedTypes = new Set((existingBadges ?? []).map((b) => b.badge_type));

  // Determine which new badges to award
  const newBadges: BadgeThreshold[] = [];

  for (const badge of BADGE_THRESHOLDS) {
    // Skip already earned
    if (earnedTypes.has(badge.type)) continue;

    let qualifies = false;

    if (badge.type.startsWith("delivery_") || badge.type === "first_delivery") {
      // Delivery count badges
      qualifies = badge.threshold !== null && stats.totalDeliveries >= badge.threshold;
    } else if (badge.type.startsWith("streak_")) {
      // Streak badges
      qualifies = badge.threshold !== null && stats.streakDays >= badge.threshold;
    } else if (badge.type === "five_star") {
      // Perfect rating requires BOTH conditions
      qualifies = stats.ratingAvg >= 5.0 && stats.totalDeliveries >= 10;
    }

    if (qualifies) {
      newBadges.push(badge);
    }
  }

  if (newBadges.length === 0) return [];

  // Insert new badges using service client (admin-only INSERT policy)
  const { error } = await serviceSupabase.from("driver_badges").insert(
    newBadges.map((badge) => ({
      driver_id: driverId,
      badge_type: badge.type,
      name: badge.name,
      icon: badge.icon,
    }))
  );

  if (error) {
    throw new Error(`Failed to insert badges: ${error.message}`);
  }

  return newBadges.map((b) => b.name);
}
