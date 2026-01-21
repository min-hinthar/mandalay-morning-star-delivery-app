/**
 * Checkout Components - Barrel Export
 *
 * Sprint 6: Cart & Checkout
 * Features: Animated wizard, map preview, time slot pills, payment celebration
 */

export {
  CheckoutWizard,
  CheckoutWizard as CheckoutWizardV7,
  CheckoutStepCard,
  CheckoutStepCard as CheckoutStepCardV7,
  CheckoutSummary,
  CheckoutSummary as CheckoutSummaryV7,
} from "./CheckoutWizard";
export type {
  CheckoutWizardProps,
  CheckoutWizardProps as CheckoutWizardV7Props,
  CheckoutStepCardProps,
  CheckoutStepCardProps as CheckoutStepCardV7Props,
  CheckoutSummaryProps,
  CheckoutSummaryProps as CheckoutSummaryV7Props,
} from "./CheckoutWizard";

export {
  AddressInput,
  AddressInput as AddressInputV7,
  MapPreview,
  MapPreview as MapPreviewV7,
  AddressAutocomplete,
  AddressAutocomplete as AddressAutocompleteV7,
} from "./AddressInput";
export type { AddressInputProps, AddressInputProps as AddressInputV7Props } from "./AddressInput";

export { TimeSlotPicker, TimeSlotPicker as TimeSlotPickerV7 } from "./TimeSlotPicker";
export type { TimeSlotPickerProps, TimeSlotPickerProps as TimeSlotPickerV7Props } from "./TimeSlotPicker";

export { PaymentSuccess, PaymentSuccess as PaymentSuccessV7 } from "./PaymentSuccess";
export type { PaymentSuccessProps, PaymentSuccessProps as PaymentSuccessV7Props } from "./PaymentSuccess";
