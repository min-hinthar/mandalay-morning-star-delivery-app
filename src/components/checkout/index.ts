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

// Re-export V8 as default names for easy migration
export { CheckoutStepperV8 as CheckoutStepper } from "./CheckoutStepperV8";
export { AddressFormV8 as AddressForm } from "./AddressFormV8";

// Step components
export { AddressStep } from "./AddressStep";
export { TimeStep } from "./TimeStep";
export { PaymentStep } from "./PaymentStep";

// Supporting components
export { CheckoutSummary } from "./CheckoutSummary";
export { AddressCard } from "./AddressCard";

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
