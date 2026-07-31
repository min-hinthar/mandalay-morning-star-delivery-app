/**
 * Date helpers for CheckoutErrorBanner — pure logic extracted out of the
 * component (keeps it under the 400-line cap and makes the date math testable
 * on its own).
 */

/** Compute next N dates for given day names from today */
export function getNextDatesForDays(
  dayNames: string[],
  count: number
): { label: string; date: string }[] {
  const dayNameToNum: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  const targetDays = dayNames.map((n) => dayNameToNum[n]).filter((n) => n !== undefined);
  const results: { label: string; date: string }[] = [];
  const today = new Date();

  for (let i = 1; i <= 30 && results.length < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (targetDays.includes(d.getDay())) {
      const dateStr = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      results.push({ label, date: dateStr });
    }
  }
  return results;
}
