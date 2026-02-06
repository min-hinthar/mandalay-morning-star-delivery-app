/**
 * FormValidation - Barrel Export
 *
 * Re-exports all 20 original exports from the split sub-files.
 */

// Types (3 exports)
export type { ValidationRule, ValidationState, FieldValidation } from "./types";

// Validation rules (2 exports)
export { validationRules, combineRules } from "./validationRules";

// Field validation hook (1 export)
export { useFieldValidation } from "./useFieldValidation";

// ValidationMessage + InlineError (4 exports: 2 components + 2 prop types)
export { ValidationMessage, InlineError } from "./ValidationMessage";
export type { ValidationMessageProps, InlineErrorProps } from "./ValidationMessage";

// FormValidationProvider + context hooks (4 exports: 1 component + 2 hooks + 1 prop type)
export {
  FormValidationProvider,
  useFormValidation,
  useFormValidationOptional,
} from "./FormValidationProvider";
export type { FormValidationProviderProps } from "./FormValidationProvider";

// ValidatedInput (2 exports: component + prop type)
export { ValidatedInput } from "./ValidatedInput";
export type { ValidatedInputProps } from "./ValidatedInput";

// ValidatedTextarea (2 exports: component + prop type)
export { ValidatedTextarea } from "./ValidatedTextarea";
export type { ValidatedTextareaProps } from "./ValidatedTextarea";

// ValidatedForm (2 exports: component + prop type)
export { ValidatedForm } from "./ValidatedForm";
export type { ValidatedFormProps } from "./ValidatedForm";
