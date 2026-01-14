export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(dollars);
}

export function parsePriceToCents(price: string): number {
  const cleaned = price.replace(/[^0-9.]/g, "");
  return Math.round(parseFloat(cleaned) * 100);
}
