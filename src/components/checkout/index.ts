/**
 * Checkout Components - V8 Barrel Export
 *
 * Phase 6: Checkout Flow
 * V8 components with enhanced animations for step transitions
 */

// V8 Components (new animated versions)
export { CheckoutStepperV8 } from "./CheckoutStepperV8";
export { AnimatedFormField } from "./AnimatedFormField";
export { AddressFormV8 } from "./AddressFormV8";
export { AddressCardV8 } from "./AddressCardV8";
export { AddressStepV8 } from "./AddressStepV8";
export { CheckoutSummaryV8 } from "./CheckoutSummaryV8";
export { PaymentStepV8 } from "./PaymentStepV8";
export { TimeStepV8 } from "./TimeStepV8";

// Re-export V8 as default names for easy migration
export { CheckoutStepperV8 as CheckoutStepper } from "./CheckoutStepperV8";
export { AddressFormV8 as AddressForm } from "./AddressFormV8";
export { AddressCardV8 as AddressCard } from "./AddressCardV8";
export { AddressStepV8 as AddressStep } from "./AddressStepV8";
export { CheckoutSummaryV8 as CheckoutSummary } from "./CheckoutSummaryV8";
export { PaymentStepV8 as PaymentStep } from "./PaymentStepV8";
export { TimeStepV8 as TimeStep } from "./TimeStepV8";

// Legacy step components
export { AddressStep as AddressStepLegacy } from "./AddressStep";
export { TimeStep as TimeStepLegacy } from "./TimeStep";

// Legacy exports (kept for backwards compatibility)
export { PaymentStep as PaymentStepLegacy } from "./PaymentStep";
export { CheckoutSummary as CheckoutSummaryLegacy } from "./CheckoutSummary";
export { AddressCard as AddressCardLegacy } from "./AddressCard";

// Wizard components
export {
  CheckoutWizard,
  CheckoutStepCard,
} from "./CheckoutWizard";
export type {
  CheckoutWizardProps,
  CheckoutStepCardProps,
  CheckoutSummaryProps,
} from "./CheckoutWizard";

// Address input components
export {
  AddressInput,
  MapPreview,
  AddressAutocomplete,
} from "./AddressInput";
export type { AddressInputProps } from "./AddressInput";

// Time slot picker
export { TimeSlotPicker } from "./TimeSlotPicker";
export type { TimeSlotPickerProps } from "./TimeSlotPicker";

// Payment success
export { PaymentSuccess } from "./PaymentSuccess";
export type { PaymentSuccessProps } from "./PaymentSuccess";
