"use client";

import {
  Sparkles,
  Star,
  Flame,
  Clock,
  Leaf,
  Heart,
  Award,
  TrendingUp,
  Utensils,
  UtensilsCrossed,
  ChefHat,
  Pizza,
  Sandwich,
  Soup,
  Coffee,
  IceCream,
  Beef,
  Fish,
  Salad,
  Carrot,
  Apple,
  Cake,
  Cookie,
  Wine,
  Beer,
  Milk,
  Egg,
  Wheat,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

// ============================================
// ICON REGISTRY
// ============================================

/**
 * Static map of icon names to lucide components.
 * Add new icons here as needed for featured sections.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  // Common section icons
  sparkles: Sparkles,
  star: Star,
  flame: Flame,
  clock: Clock,
  leaf: Leaf,
  heart: Heart,
  award: Award,
  "trending-up": TrendingUp,

  // Food-related icons
  utensils: Utensils,
  "utensils-crossed": UtensilsCrossed,
  "chef-hat": ChefHat,
  pizza: Pizza,
  sandwich: Sandwich,
  soup: Soup,
  coffee: Coffee,
  "ice-cream": IceCream,
  beef: Beef,
  fish: Fish,
  salad: Salad,
  carrot: Carrot,
  apple: Apple,
  cake: Cake,
  cookie: Cookie,
  wine: Wine,
  beer: Beer,
  milk: Milk,
  egg: Egg,
  wheat: Wheat,

  // PascalCase aliases
  Sparkles: Sparkles,
  Star: Star,
  Flame: Flame,
  Clock: Clock,
  Leaf: Leaf,
  Heart: Heart,
  Award: Award,
  TrendingUp: TrendingUp,
  Utensils: Utensils,
  UtensilsCrossed: UtensilsCrossed,
  ChefHat: ChefHat,
  Pizza: Pizza,
  Sandwich: Sandwich,
  Soup: Soup,
  Coffee: Coffee,
  IceCream: IceCream,
  Beef: Beef,
  Fish: Fish,
  Salad: Salad,
  Carrot: Carrot,
  Apple: Apple,
  Cake: Cake,
  Cookie: Cookie,
  Wine: Wine,
  Beer: Beer,
  Milk: Milk,
  Egg: Egg,
  Wheat: Wheat,
};

// ============================================
// TYPES
// ============================================

export interface DynamicIconProps extends Omit<LucideProps, "name"> {
  /** Icon name (kebab-case or PascalCase) */
  name: string | null | undefined;
  /** Fallback icon component when name not found */
  fallback?: LucideIcon;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Render a lucide icon by name string (from database).
 * Supports both kebab-case ("utensils-crossed") and PascalCase ("UtensilsCrossed").
 * Falls back to Sparkles icon if name not found.
 */
export function DynamicIcon({ name, fallback: Fallback = Sparkles, ...props }: DynamicIconProps) {
  if (!name) {
    return <Fallback {...props} />;
  }

  const IconComponent = ICON_MAP[name] || Fallback;
  return <IconComponent {...props} />;
}

export default DynamicIcon;
