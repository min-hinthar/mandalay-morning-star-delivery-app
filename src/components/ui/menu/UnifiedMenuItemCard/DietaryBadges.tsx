"use client";

import { motion } from "framer-motion";
import { Leaf, Flame, Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { zClass } from "@/lib/design-system/tokens/z-index";

// ============================================
// TYPES
// ============================================

export interface DietaryBadgesProps {
  /** Item tags array */
  tags: string[];
  /** Additional className */
  className?: string;
}

interface BadgeConfig {
  icon: React.ReactNode;
  label: string;
  bgColor: string;
  textColor: string;
}

// ============================================
// BADGE CONFIGURATIONS
// ============================================

function getBadgeConfig(tag: string, level?: number): BadgeConfig | null {
  switch (tag) {
    case "vegetarian":
      return {
        icon: <Leaf className="w-3 h-3" />,
        label: "Vegetarian",
        bgColor: "bg-green-500/20",
        textColor: "text-green-700 dark:text-green-400",
      };
    case "vegan":
      return {
        icon: <Leaf className="w-3 h-3 fill-current" />,
        label: "Vegan",
        bgColor: "bg-emerald-500/20",
        textColor: "text-emerald-700 dark:text-emerald-400",
      };
    case "spicy":
      return {
        icon: (
          <div className="flex">
            {Array.from({ length: level ?? 1 }).map((_, i) => (
              <Flame key={i} className="w-3 h-3 -ml-0.5 first:ml-0" />
            ))}
          </div>
        ),
        label: level && level > 1 ? `Spicy x${level}` : "Spicy",
        bgColor: "bg-red-500/20",
        textColor: "text-red-600 dark:text-red-400",
      };
    case "popular":
      return {
        icon: <Star className="w-3 h-3 fill-current" />,
        label: "Popular",
        bgColor: "bg-amber-500/20",
        textColor: "text-amber-700 dark:text-amber-400",
      };
    case "featured":
      return {
        icon: <Sparkles className="w-3 h-3" />,
        label: "Featured",
        bgColor: "bg-secondary/30",
        textColor: "text-secondary-foreground",
      };
    default:
      return null;
  }
}

// ============================================
// SINGLE BADGE COMPONENT
// ============================================

interface BadgeItemProps {
  config: BadgeConfig;
  index: number;
}

function BadgeItem({ config, index }: BadgeItemProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <motion.span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5",
        "rounded-full text-2xs font-semibold uppercase tracking-wide",
        config.bgColor,
        config.textColor,
        "backdrop-blur-sm shadow-sm"
      )}
      initial={shouldAnimate ? { scale: 0, opacity: 0 } : undefined}
      animate={shouldAnimate ? { scale: 1, opacity: 1 } : undefined}
      transition={getSpring({ ...spring.ultraBouncy, delay: index * 0.05 })}
    >
      {config.icon}
      <span>{config.label}</span>
    </motion.span>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * DietaryBadges - Display dietary/feature badges with icons and text
 *
 * Positioned top-left of image with spring entrance animation.
 * Shows: vegetarian, vegan, spicy (1-3 levels), popular, featured
 */
export function DietaryBadges({ tags, className }: DietaryBadgesProps) {
  // Parse tags to get badge configs
  const badges: { config: BadgeConfig; key: string }[] = [];

  // Check for vegetarian
  if (tags.includes("vegetarian")) {
    const config = getBadgeConfig("vegetarian");
    if (config) badges.push({ config, key: "vegetarian" });
  }

  // Check for vegan (exclusive with vegetarian display)
  if (tags.includes("vegan") && !tags.includes("vegetarian")) {
    const config = getBadgeConfig("vegan");
    if (config) badges.push({ config, key: "vegan" });
  }

  // Check for spicy levels
  if (tags.includes("extra-spicy")) {
    const config = getBadgeConfig("spicy", 3);
    if (config) badges.push({ config, key: "spicy-3" });
  } else if (tags.includes("very-spicy")) {
    const config = getBadgeConfig("spicy", 2);
    if (config) badges.push({ config, key: "spicy-2" });
  } else if (tags.includes("spicy")) {
    const config = getBadgeConfig("spicy", 1);
    if (config) badges.push({ config, key: "spicy-1" });
  }

  // Check for popular
  if (tags.includes("popular")) {
    const config = getBadgeConfig("popular");
    if (config) badges.push({ config, key: "popular" });
  }

  // Check for featured
  if (tags.includes("featured")) {
    const config = getBadgeConfig("featured");
    if (config) badges.push({ config, key: "featured" });
  }

  if (badges.length === 0) return null;

  return (
    <div
      className={cn(
        "absolute top-3 left-3",
        zClass.dropdown,
        "flex flex-wrap gap-1",
        className
      )}
    >
      {badges.map((badge, index) => (
        <BadgeItem key={badge.key} config={badge.config} index={index} />
      ))}
    </div>
  );
}

export default DietaryBadges;
