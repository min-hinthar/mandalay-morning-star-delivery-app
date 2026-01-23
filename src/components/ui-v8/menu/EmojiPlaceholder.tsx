"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// CATEGORY EMOJI MAP
// ============================================

/**
 * Maps category slugs to appropriate food emojis
 * Covers Myanmar cuisine categories and general food types
 */
export const CATEGORY_EMOJI_MAP: Record<string, string> = {
  // Myanmar Cuisine
  "mohinga": "\u{1F35C}",           // Noodle bowl - Myanmar's national dish
  "ohn-no-khao-swe": "\u{1F35C}",   // Noodle bowl - coconut chicken noodles
  "khao-swe": "\u{1F35C}",          // Noodle bowl
  "noodles": "\u{1F35C}",           // Noodle bowl
  "noodle-soup": "\u{1F35C}",       // Noodle bowl

  // Rice dishes
  "rice": "\u{1F35A}",              // Rice bowl
  "fried-rice": "\u{1F35A}",        // Rice bowl
  "htamin": "\u{1F35A}",            // Rice bowl
  "biryani": "\u{1F35A}",           // Rice bowl
  "danbauk": "\u{1F35A}",           // Rice bowl (Myanmar biryani)

  // Curries
  "curry": "\u{1F35B}",             // Curry rice
  "hin": "\u{1F35B}",               // Curry (Myanmar curry)
  "wet-tha-hin": "\u{1F356}",       // Meat on bone (pork curry)
  "kyet-tha-hin": "\u{1F357}",      // Poultry leg (chicken curry)
  "nga-hin": "\u{1F41F}",           // Fish (fish curry)

  // Salads
  "salad": "\u{1F957}",             // Green salad
  "thoke": "\u{1F957}",             // Green salad (Myanmar salad)
  "laphet-thoke": "\u{1F375}",      // Tea (tea leaf salad)
  "ginger-salad": "\u{1F957}",      // Green salad

  // Soups
  "soup": "\u{1F372}",              // Pot of food
  "hin-cho": "\u{1F372}",           // Pot of food (clear soup)
  "broth": "\u{1F372}",             // Pot of food

  // Snacks & Appetizers
  "snacks": "\u{1F95F}",            // Dumpling
  "samosa": "\u{1F95F}",            // Dumpling
  "fritters": "\u{1F35E}",          // Bread
  "mont": "\u{1F370}",              // Shortcake (Myanmar snacks)

  // Drinks
  "drinks": "\u{1F964}",            // Cup with straw
  "tea": "\u{1F375}",               // Tea cup
  "coffee": "\u{2615}",             // Hot beverage
  "smoothie": "\u{1F34C}",          // Banana
  "juice": "\u{1F34A}",             // Orange
  "lassi": "\u{1F95B}",             // Glass of milk

  // Desserts
  "dessert": "\u{1F370}",           // Shortcake
  "sweets": "\u{1F36C}",            // Candy
  "mont-lin-ma-yar": "\u{1F95E}",   // Pancakes (coconut pancakes)
  "shwe-yin-aye": "\u{1F367}",      // Shaved ice (Myanmar dessert drink)
  "faluda": "\u{1F368}",            // Ice cream

  // Proteins
  "chicken": "\u{1F357}",           // Poultry leg
  "pork": "\u{1F356}",              // Meat on bone
  "beef": "\u{1F969}",              // Cut of meat
  "fish": "\u{1F41F}",              // Fish
  "seafood": "\u{1F990}",           // Shrimp
  "prawns": "\u{1F990}",            // Shrimp
  "mutton": "\u{1F969}",            // Cut of meat

  // Vegetarian
  "vegetarian": "\u{1F966}",        // Broccoli
  "vegan": "\u{1F331}",             // Seedling
  "tofu": "\u{1F9C8}",              // Butter (closest to tofu)

  // Bread & Bakery
  "bread": "\u{1F35E}",             // Bread
  "naan": "\u{1F968}",              // Pretzel (closest to flatbread)
  "paratha": "\u{1F968}",           // Pretzel
  "bakery": "\u{1F950}",            // Croissant

  // Special categories
  "breakfast": "\u{1F373}",         // Cooking (fried egg)
  "lunch": "\u{1F371}",             // Bento box
  "dinner": "\u{1F37D}",            // Fork and knife with plate
  "specials": "\u{2B50}",           // Star
  "popular": "\u{1F525}",           // Fire
  "new": "\u{1F195}",               // NEW button
  "spicy": "\u{1F336}",             // Hot pepper

  // Default fallback
  "default": "\u{1F35C}",           // Noodle bowl (Myanmar default)
} as const;

// ============================================
// TYPES
// ============================================

export interface EmojiPlaceholderProps {
  /** Category slug or name */
  category?: string;
  /** Override emoji */
  emoji?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /** Background color */
  bgColor?: string;
  /** Additional className */
  className?: string;
  /** Animate entrance */
  animate?: boolean;
}

// ============================================
// SIZE CONFIG
// ============================================

const sizeConfig = {
  sm: {
    container: "w-12 h-12",
    emoji: "text-xl",
  },
  md: {
    container: "w-16 h-16",
    emoji: "text-2xl",
  },
  lg: {
    container: "w-20 h-20",
    emoji: "text-3xl",
  },
  xl: {
    container: "w-24 h-24",
    emoji: "text-4xl",
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get emoji for a category
 * Falls back to guessing based on category name if not in map
 */
export function getCategoryEmoji(category?: string): string {
  if (!category) return CATEGORY_EMOJI_MAP.default;

  // Normalize: lowercase, replace spaces with hyphens
  const normalized = category.toLowerCase().replace(/\s+/g, "-");

  // Direct match
  if (CATEGORY_EMOJI_MAP[normalized]) {
    return CATEGORY_EMOJI_MAP[normalized];
  }

  // Partial match - check if category contains any key
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return emoji;
    }
  }

  // Name-based guessing
  const lowercaseCat = category.toLowerCase();

  if (lowercaseCat.includes("rice") || lowercaseCat.includes("htamin")) {
    return CATEGORY_EMOJI_MAP.rice;
  }
  if (lowercaseCat.includes("noodle") || lowercaseCat.includes("khao")) {
    return CATEGORY_EMOJI_MAP.noodles;
  }
  if (lowercaseCat.includes("curry") || lowercaseCat.includes("hin")) {
    return CATEGORY_EMOJI_MAP.curry;
  }
  if (lowercaseCat.includes("salad") || lowercaseCat.includes("thoke")) {
    return CATEGORY_EMOJI_MAP.salad;
  }
  if (lowercaseCat.includes("soup")) {
    return CATEGORY_EMOJI_MAP.soup;
  }
  if (lowercaseCat.includes("drink") || lowercaseCat.includes("tea") || lowercaseCat.includes("coffee")) {
    return CATEGORY_EMOJI_MAP.drinks;
  }
  if (lowercaseCat.includes("dessert") || lowercaseCat.includes("sweet")) {
    return CATEGORY_EMOJI_MAP.dessert;
  }
  if (lowercaseCat.includes("chicken") || lowercaseCat.includes("kyet")) {
    return CATEGORY_EMOJI_MAP.chicken;
  }
  if (lowercaseCat.includes("fish") || lowercaseCat.includes("nga")) {
    return CATEGORY_EMOJI_MAP.fish;
  }

  return CATEGORY_EMOJI_MAP.default;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function EmojiPlaceholder({
  category,
  emoji: overrideEmoji,
  size = "md",
  bgColor,
  className,
  animate = true,
}: EmojiPlaceholderProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const sizes = sizeConfig[size];
  const displayEmoji = overrideEmoji ?? getCategoryEmoji(category);

  const doAnimate = animate && shouldAnimate;
  const springConfig = getSpring(spring.ultraBouncy);

  return (
    <motion.div
      className={cn(
        sizes.container,
        "rounded-lg flex items-center justify-center",
        "bg-surface-secondary",
        className
      )}
      style={bgColor ? { backgroundColor: bgColor } : undefined}
      initial={doAnimate ? { scale: 0.8, opacity: 0 } : undefined}
      animate={doAnimate ? { scale: 1, opacity: 1 } : undefined}
      transition={springConfig}
    >
      <motion.span
        role="img"
        aria-label={category ?? "Food"}
        className={cn(sizes.emoji, "select-none")}
        initial={doAnimate ? { scale: 0, rotate: -20 } : undefined}
        animate={doAnimate ? { scale: 1, rotate: 0 } : undefined}
        transition={doAnimate ? { ...springConfig, delay: 0.1 } : undefined}
      >
        {displayEmoji}
      </motion.span>
    </motion.div>
  );
}

export default EmojiPlaceholder;
