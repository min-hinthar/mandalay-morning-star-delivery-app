import type { Address } from "./address";
import type { DeliverySelection } from "./delivery";

export type CheckoutStep = "address" | "time" | "payment";

export const CHECKOUT_STEPS: CheckoutStep[] = ["address", "time", "payment"];

export interface CheckoutState {
  step: CheckoutStep;
  addressId: string | null;
  address: Address | null;
  delivery: DeliverySelection | null;
  customerNotes: string;
  /** Tip preset percentage (15/20/25) or null for custom */
  tipPercent: number | null;
  /** User-entered custom tip amount in cents */
  customTipCents: number;
  /** Entered promo code string */
  promoCode: string;
  /** Whether promo has been validated and applied */
  promoApplied: boolean;
  /** Discount amount from applied promo in cents */
  discountCents: number;
  /** Discount label e.g. "20% off" or "$5.00 off" */
  discountLabel: string;
  /** Delivery instructions for the driver */
  deliveryInstructions: string;
}

export interface CreateCheckoutSessionRequest {
  addressId: string;
  scheduledDate: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    modifiers: Array<{ optionId: string }>;
    notes?: string;
  }>;
  customerNotes?: string;
  tipCents?: number;
  promoCode?: string;
  deliveryInstructions?: string;
}

export interface CreateCheckoutSessionResponse {
  data: {
    sessionUrl: string;
    orderId: string;
  };
}

export interface CheckoutError {
  code: CheckoutErrorCode;
  message: string;
  details?: unknown;
}

export type CheckoutErrorCode =
  | "UNAUTHORIZED"
  | "CART_EMPTY"
  | "ITEM_UNAVAILABLE"
  | "ITEM_SOLD_OUT"
  | "MODIFIER_UNAVAILABLE"
  | "ADDRESS_INVALID"
  | "OUT_OF_COVERAGE"
  | "CUTOFF_PASSED"
  | "DUPLICATE_ORDER"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "STRIPE_ERROR"
  | "PROFILE_ERROR"
  | "INTERNAL_ERROR";
