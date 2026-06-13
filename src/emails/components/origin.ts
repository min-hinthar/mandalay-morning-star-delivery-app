/**
 * App origin for email links/assets. Repairs a known malformation seen in some
 * deploy/dev envs where `NEXT_PUBLIC_APP_URL` is set to `http://https://host`
 * (double protocol). Single source so the scrub isn't duplicated across email
 * files. No imports — safe for both `theme.ts` and `helpers.ts` to use.
 */
export function appOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || "https://mandalaymorningstar.com";
  return raw.replace(/^https?:\/\/https:\/\//, "https://");
}
