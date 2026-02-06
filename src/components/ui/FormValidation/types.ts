/**
 * FormValidation Types
 *
 * Shared types for form validation components, hooks, and rules.
 */

export type ValidationRule = {
  validate: (value: string) => boolean;
  message: string;
};

export type ValidationState = "idle" | "valid" | "invalid";

export interface FieldValidation {
  state: ValidationState;
  message: string | null;
  validate: (value: string) => boolean;
  reset: () => void;
  setError: (message: string) => void;
}
