/**
 * Shared helpers for email templates.
 */
import { TIMEZONE } from "@/types/delivery";
import { appOrigin } from "./components/origin";

export { BODY_FONT as FONT_STACK, DISPLAY_FONT as SERIF_STACK } from "./components/theme";

export const APP_URL = appOrigin();

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: TIMEZONE,
  });
}

export function shortOrderId(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}
