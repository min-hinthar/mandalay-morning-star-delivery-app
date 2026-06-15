"use client";

/**
 * Footer delivery-schedule metadata + pure formatters. Maps each routing
 * DIRECTION to a human region label, bilingual name, an Anthropic-triad accent,
 * and a thematic icon (sun rises in the east, sets in the west). Pure data —
 * the live cities/cutoffs come from `getBusinessRules()` (delivery_days +
 * delivery_zones), never hardcoded.
 */

import { Sunrise, Sunset, Navigation2, Compass, type LucideIcon } from "lucide-react";
import type { DeliveryDayConfig, DeliveryDirection, DeliveryZoneConfig } from "@/types/delivery";
import { DAY_NAMES_FULL, DAY_NAMES_SHORT, formatHour } from "@/lib/utils/delivery-schedule";
import { generateTimeWindows } from "@/lib/settings/generate-time-windows";

export interface DirectionMeta {
  label: string;
  /** Region gloss shown under the direction (e.g. "Inland Empire"). */
  region: string;
  /** Burmese label (flagged for native review). */
  my: string;
  /** Anthropic-triad accent token used for the card edge/icon/dot. */
  accent: "clay" | "blue" | "sage" | "gold";
  icon: LucideIcon;
}

export const DIRECTION_META: Record<DeliveryDirection, DirectionMeta> = {
  east: { label: "East", region: "Inland Empire", my: "အရှေ့ဘက်", accent: "clay", icon: Sunrise },
  west: { label: "West", region: "Westside & Coastal", my: "အနောက်ဘက်", accent: "blue", icon: Sunset }, // prettier-ignore
  south: { label: "South", region: "Orange County", my: "တောင်ဘက်", accent: "sage", icon: Navigation2 }, // prettier-ignore
  all: { label: "All areas", region: "Everywhere in range", my: "နေရာအနှံ့", accent: "gold", icon: Compass }, // prettier-ignore
};

/** Per-accent text / dot / soft-fill classes (constant hero tokens — read on the dark footer). */
export const ACCENT_CLASSES: Record<DirectionMeta["accent"], { text: string; dot: string; ring: string }> = {
  clay: { text: "text-hero-clay", dot: "bg-hero-clay", ring: "ring-hero-clay/40" },
  blue: { text: "text-hero-blue", dot: "bg-hero-blue", ring: "ring-hero-blue/40" },
  sage: { text: "text-hero-sage", dot: "bg-hero-sage", ring: "ring-hero-sage/40" },
  gold: { text: "text-hero-gold", dot: "bg-hero-gold", ring: "ring-hero-gold/40" },
}; // prettier-ignore

/** Active delivery days, sorted by display order (the schedule rows). */
export function activeDeliveryDays(days: DeliveryDayConfig[]): DeliveryDayConfig[] {
  return days.filter((d) => d.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * The cities a given day serves. Directional days read their zone's reference
 * cities; an "all" day lists the three region labels (it covers everywhere).
 */
export function citiesForDay(
  day: DeliveryDayConfig,
  zones: DeliveryZoneConfig[]
): { kind: "cities" | "regions"; items: string[] } {
  const direction = day.direction ?? "all";
  if (direction === "all") {
    const regions = (["east", "west", "south"] as const)
      .filter((d) => zones.some((z) => z.direction === d))
      .map((d) => DIRECTION_META[d].region);
    return { kind: "regions", items: regions.length > 0 ? regions : ["Everywhere in range"] };
  }
  const zone = zones.find((z) => z.direction === direction);
  return { kind: "cities", items: zone?.referenceCities ?? [] };
}

/** Short cutoff phrase, e.g. "by Sun 3 PM". */
export function shortCutoff(day: DeliveryDayConfig): string {
  return `by ${DAY_NAMES_SHORT[day.cutoffDay]} ${formatHour(day.cutoffHour)}`;
}

/** Full cutoff sentence, e.g. "Order by Sunday 3 PM". */
export function fullCutoff(day: DeliveryDayConfig): string {
  return `Order by ${DAY_NAMES_FULL[day.cutoffDay]} ${formatHour(day.cutoffHour)}`;
}

/** Delivery-window range string from the slot generator, e.g. "12 – 7 PM". */
export function deliveryWindowRange(
  startHour: number,
  endHour: number,
  prepBufferMinutes: number
): { range: string; slots: number } | null {
  const windows = generateTimeWindows(startHour, endHour, prepBufferMinutes);
  if (windows.length === 0) return null;
  const firstHour = Number(windows[0].start.slice(0, 2));
  return { range: `${formatHour(firstHour)} – ${formatHour(endHour)}`, slots: windows.length };
}
