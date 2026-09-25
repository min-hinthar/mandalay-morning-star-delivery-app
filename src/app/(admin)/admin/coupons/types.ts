import type { CouponRow } from "@/lib/coupons";
import type { CouponStatus } from "@/lib/coupons/status";

export interface AdminCoupon extends CouponRow {
  status: CouponStatus;
  assignedEmail: string | null;
  redeemedEmail: string | null;
}
