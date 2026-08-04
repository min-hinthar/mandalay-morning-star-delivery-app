/**
 * Read `app_settings.admin_contact_info` into something renderable.
 *
 * The column is `jsonb NOT NULL`, so PostgREST hands back an already-parsed
 * value — an object, not a string. The page previously declared it
 * `.returns<{ value: string }[]>()` and called `JSON.parse(setting.value)`,
 * which coerced the object to "[object Object]", threw, and was swallowed by an
 * empty catch. The result: a deactivated driver was told to "contact the admin"
 * and given no way to do it, in every reachable DB state.
 *
 * Both shapes are accepted here rather than only the correct one, because the
 * stored value cannot be inspected from this environment and `business-rules.ts`
 * shows the repo already tolerates legacy string-encoded settings
 * (`row.value === true || row.value === "true"`). A doubly-encoded JSON string
 * would be unusual but is cheap to survive.
 */

export interface AdminContactInfo {
  email?: string;
  phone?: string;
}

/** Non-empty strings only — anything else must not reach an href. */
function cleanField(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function parseAdminContactInfo(value: unknown): AdminContactInfo {
  let raw = value;

  // Legacy/defensive: a jsonb value that itself holds a JSON string.
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return {};
    }
  }

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};

  const record = raw as Record<string, unknown>;
  const email = cleanField(record.email);
  const phone = cleanField(record.phone);

  return {
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
  };
}
