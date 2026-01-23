/**
 * Checkout Components - V8 Barrel Export
 *
 * Phase 6: Checkout Flow
 * V8 components with enhanced animations for step transitions
 */

// V8 Components (new animated versions)
export { CheckoutStepperV8 } from "./CheckoutStepperV8";

// Re-export V8 as default names for easy migration
export { CheckoutStepperV8 as CheckoutStepper } from "./CheckoutStepperV8";

// Step components
export { AddressStep } from "./AddressStep";
export { TimeStep } from "./TimeStep";
export { PaymentStep } from "./PaymentStep";

// Supporting components
export { CheckoutSummary } from "./CheckoutSummary";
export { AddressForm } from "./AddressForm";
export { AddressCard } from "./AddressCard";

// Legacy V7 exports (keep for compatibility)
export {
  CheckoutWizard,
  CheckoutWizardV7,
  CheckoutStepCard,
  CheckoutStepCardV7,
  CheckoutSummary as CheckoutSummaryV7,
} from "./CheckoutWizard";
export type {
  CheckoutWizardProps,
  CheckoutWizardV7Props,
  CheckoutStepCardProps,
  CheckoutStepCardV7Props,
  CheckoutSummaryProps,
  CheckoutSummaryV7Props,
} from "./CheckoutWizard";

export {
  AddressInput,
  AddressInputV7,
  MapPreview,
  MapPreviewV7,
  AddressAutocomplete,
  AddressAutocompleteV7,
} from "./AddressInput";
export type { AddressInputProps, AddressInputV7Props } from "./AddressInput";

export { TimeSlotPicker, TimeSlotPickerV7 } from "./TimeSlotPicker";
export type { TimeSlotPickerProps, TimeSlotPickerV7Props } from "./TimeSlotPicker";

export { PaymentSuccess, PaymentSuccessV7 } from "./PaymentSuccess";
export type { PaymentSuccessProps, PaymentSuccessV7Props } from "./PaymentSuccess";
