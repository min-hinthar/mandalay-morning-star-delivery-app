"use client";

/**
 * useFieldValidation Hook
 *
 * Manages validation state for a single form field.
 */

import { useState, useCallback } from "react";
import type { ValidationRule, ValidationState, FieldValidation } from "./types";

export function useFieldValidation(rules: ValidationRule[]): FieldValidation {
  const [state, setState] = useState<ValidationState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const validate = useCallback(
    (value: string): boolean => {
      for (const rule of rules) {
        if (!rule.validate(value)) {
          setState("invalid");
          setMessage(rule.message);
          return false;
        }
      }
      setState("valid");
      setMessage(null);
      return true;
    },
    [rules]
  );

  const reset = useCallback(() => {
    setState("idle");
    setMessage(null);
  }, []);

  const setError = useCallback((errorMessage: string) => {
    setState("invalid");
    setMessage(errorMessage);
  }, []);

  return { state, message, validate, reset, setError };
}
