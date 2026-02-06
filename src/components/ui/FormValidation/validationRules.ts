/**
 * Common Validation Rules
 *
 * Pre-built validation rule factories for common form field patterns.
 */

import type { ValidationRule } from "./types";

export const validationRules = {
  /**
   * Field must not be empty
   */
  required: (message = "This field is required"): ValidationRule => ({
    validate: (value) => value.trim().length > 0,
    message,
  }),

  /**
   * Valid email format
   */
  email: (message = "Please enter a valid email"): ValidationRule => ({
    validate: (value) => {
      if (!value.trim()) return true; // Let required handle empty
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    },
    message,
  }),

  /**
   * Valid phone number (10+ digits)
   */
  phone: (message = "Please enter a valid phone number"): ValidationRule => ({
    validate: (value) => {
      if (!value.trim()) return true; // Let required handle empty
      const digits = value.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 15;
    },
    message,
  }),

  /**
   * Minimum character length
   */
  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value) => value.length >= min,
    message: message ?? `Must be at least ${min} characters`,
  }),

  /**
   * Maximum character length
   */
  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value) => value.length <= max,
    message: message ?? `Must be no more than ${max} characters`,
  }),

  /**
   * Match a regex pattern
   */
  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validate: (value) => {
      if (!value.trim()) return true; // Let required handle empty
      return regex.test(value);
    },
    message,
  }),

  /**
   * Numeric value within range
   */
  range: (min: number, max: number, message?: string): ValidationRule => ({
    validate: (value) => {
      if (!value.trim()) return true; // Let required handle empty
      const num = parseFloat(value);
      return !isNaN(num) && num >= min && num <= max;
    },
    message: message ?? `Please enter a value between ${min} and ${max}`,
  }),

  /**
   * Custom validation function
   */
  custom: (
    fn: (value: string) => boolean,
    message: string
  ): ValidationRule => ({
    validate: fn,
    message,
  }),

  /**
   * Match another field value
   */
  matches: (
    getValue: () => string,
    message = "Values do not match"
  ): ValidationRule => ({
    validate: (value) => value === getValue(),
    message,
  }),
};

/**
 * Combines multiple validation rules into a single array
 * Useful for building conditional validation
 */
export function combineRules(
  ...ruleSets: (ValidationRule | ValidationRule[] | false | null | undefined)[]
): ValidationRule[] {
  return ruleSets.flat().filter((rule): rule is ValidationRule => Boolean(rule));
}
