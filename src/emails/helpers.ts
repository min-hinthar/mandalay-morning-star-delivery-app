/**
 * Shared helpers for email templates.
 */

export const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export const SERIF_STACK = "Georgia, 'Palatino Linotype', serif";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://mandalaymorningstar.com';

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function shortOrderId(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}
