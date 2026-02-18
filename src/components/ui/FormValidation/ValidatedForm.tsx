"use client";

/**
 * ValidatedForm Component
 *
 * Form wrapper that validates all registered fields on submit.
 */

import { forwardRef, useCallback } from "react";
import { useFormValidation } from "./FormValidationProvider";

export interface ValidatedFormProps extends Omit<
  React.FormHTMLAttributes<HTMLFormElement>,
  "onSubmit"
> {
  /** Called when form is submitted and validation passes */
  onValidSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  /** Called when form submission fails validation */
  onInvalidSubmit?: () => void;
  /** Prevent default form submission */
  preventSubmit?: boolean;
}

export const ValidatedForm = forwardRef<HTMLFormElement, ValidatedFormProps>(
  ({ onValidSubmit, onInvalidSubmit, preventSubmit = true, children, ...props }, ref) => {
    const { validateAll } = useFormValidation();

    const handleSubmit = useCallback(
      (e: React.FormEvent<HTMLFormElement>) => {
        if (preventSubmit) {
          e.preventDefault();
        }

        const isValid = validateAll();
        if (isValid) {
          onValidSubmit?.(e);
        } else {
          onInvalidSubmit?.();
        }
      },
      [validateAll, onValidSubmit, onInvalidSubmit, preventSubmit]
    );

    return (
      <form ref={ref} onSubmit={handleSubmit} {...props}>
        {children}
      </form>
    );
  }
);

ValidatedForm.displayName = "ValidatedForm";
