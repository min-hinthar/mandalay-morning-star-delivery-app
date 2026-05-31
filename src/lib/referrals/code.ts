import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { generateReferralCode } from ".";

/** Assign a unique referral code to the user if they don't have one yet. */
export async function ensureReferralCode(
  service: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  const { data } = await service
    .from("profiles")
    .select("referral_code")
    .eq("id", userId)
    .maybeSingle();
  if (data?.referral_code) return data.referral_code;

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateReferralCode();
    const { error } = await service
      .from("profiles")
      .update({ referral_code: code })
      .eq("id", userId)
      .is("referral_code", null);
    if (!error) {
      const { data: after } = await service
        .from("profiles")
        .select("referral_code")
        .eq("id", userId)
        .maybeSingle();
      if (after?.referral_code) return after.referral_code;
    }
    // Unique collision — try a different code.
  }
  return null;
}
