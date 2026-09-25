import type { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

type Service = ReturnType<typeof createServiceClient>;

export interface CouponCustomer {
  id: string;
  /** The VERIFIED sign-in email (auth.users), not the editable profile copy. */
  email: string;
  full_name: string | null;
}

/**
 * Resolve the customer a coupon is being issued to. `profiles.email` is
 * customer-editable and not unique, so matching on it alone lets another
 * account "squat" an address and receive the binding (the real customer then
 * gets "linked to a different account"). Use profiles only to find candidate
 * ids, then keep the one whose auth.users email actually matches.
 */
export async function findCustomerByEmail(
  service: Service,
  email: string
): Promise<CouponCustomer | null | "error"> {
  const target = email.trim().toLowerCase();
  const { data: candidates, error } = await service
    .from("profiles")
    .select("id, full_name")
    .ilike("email", target.replace(/[\\%_]/g, "\\$&"))
    .limit(10);
  if (error) {
    logger.exception(error, { api: "admin/coupons/create" });
    return "error";
  }
  for (const candidate of candidates ?? []) {
    const { data, error: authError } = await service.auth.admin.getUserById(candidate.id);
    if (authError) {
      logger.exception(authError, { api: "admin/coupons/create", userId: candidate.id });
      return "error";
    }
    if (data.user?.email?.toLowerCase() === target) {
      return { id: candidate.id, email: data.user.email, full_name: candidate.full_name };
    }
  }
  return null;
}
