"use client";

import { icons, Sparkles } from "lucide-react";
import type { LucideIcon, LucideProps } from "lucide-react";

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
// HELPERS
// ============================================

/**
 * Convert kebab-case to PascalCase for lucide icon lookup.
 * e.g., "utensils-crossed" -> "UtensilsCrossed"
 */
function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

// ============================================
// COMPONENT
// ============================================

/**
 * Render a lucide icon by name string (from database).
 * Supports both kebab-case ("utensils-crossed") and PascalCase ("UtensilsCrossed").
 * Falls back to Sparkles icon if name not found.
 */
export function DynamicIcon({
  name,
  fallback: Fallback = Sparkles,
  ...props
}: DynamicIconProps) {
  if (!name) {
    return <Fallback {...props} />;
  }

  // Try both original and PascalCase versions
  const pascalName = toPascalCase(name);
  const IconComponent =
    (icons as Record<string, LucideIcon>)[name] ||
    (icons as Record<string, LucideIcon>)[pascalName] ||
    Fallback;

  return <IconComponent {...props} />;
}

export default DynamicIcon;
