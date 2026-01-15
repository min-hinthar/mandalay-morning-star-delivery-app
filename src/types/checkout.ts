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
  | "VALIDATION_ERROR"
  | "STRIPE_ERROR"
  | "INTERNAL_ERROR";
