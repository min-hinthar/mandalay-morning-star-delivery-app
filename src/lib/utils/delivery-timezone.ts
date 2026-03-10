/**
 * Build an ISO timestamp with the correct America/Los_Angeles UTC offset.
 * Handles DST automatically via Intl.DateTimeFormat.
 */
export function toISOWithTimezone(date: string, time: string): string {
  const dt = new Date(`${date}T${time}:00`);
  const laFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    timeZoneName: "shortOffset",
  });
  const parts = laFormatter.formatToParts(dt);
  const tzPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  const match = tzPart.match(/GMT([+-]\d+)/);
  const offsetHours = match ? parseInt(match[1], 10) : -8;
  const sign = offsetHours >= 0 ? "+" : "-";
  const abs = Math.abs(offsetHours).toString().padStart(2, "0");
  return `${date}T${time}:00${sign}${abs}:00`;
}
