import type { User } from "@supabase/supabase-js";

/** Extract email from Supabase User, checking multiple OAuth sources */
export function resolveOAuthEmail(user: User): string | null {
  return (
    user.email ||
    (user.user_metadata?.email as string) ||
    (user.identities?.[0]?.identity_data?.email as string) ||
    null
  );
}
