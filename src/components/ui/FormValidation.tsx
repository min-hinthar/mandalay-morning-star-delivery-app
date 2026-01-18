/**
 * V3 Sprint 5: Form Validation Components
 *
 * Real-time inline form validation with animated error display.
 * Validates on blur, re-validates on change after error.
 */

"use client";

import {
  useState,
  useCallback,
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ============================================
// TYPES
// ============================================

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
}

// ============================================
// COMMON VALIDATION RULES
// ============================================

export const validationRules = {
  required: (message = "This field is required"): ValidationRule => ({
    validate: (value) => value.trim().length > 0,
    message,
  }),

  email: (message = "Please enter a valid email"): ValidationRule => ({
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),

  phone: (message = "Please enter a valid phone number"): ValidationRule => ({
    validate: (value) => /^[\d\s\-+()]{10,}$/.test(value.replace(/\s/g, "")),
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value) => value.length >= min,
    message: message ?? `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value) => value.length <= max,
    message: message ?? `Must be no more than ${max} characters`,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validate: (value) => regex.test(value),
    message,
  }),

  range: (min: number, max: number, message?: string): ValidationRule => ({
    validate: (value) => {
      const num = parseFloat(value);
      return !isNaN(num) && num >= min && num <= max;
    },
    message: message ?? `Please enter a value between ${min} and ${max}`,
  }),
};

// ============================================
// VALIDATION HOOK
// ============================================

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

  return { state, message, validate, reset };
}

// ============================================
// VALIDATION MESSAGE COMPONENT
// ============================================

const messageVariants = {
  hidden: {
    opacity: 0,
    y: -10,
    height: 0,
  },
  visible: {
    opacity: 1,
    y: 0,
    height: "auto",
    transition: { duration: 0.15, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    y: -5,
    height: 0,
    transition: { duration: 0.1 },
  },
};

export interface ValidationMessageProps {
  message: string | null;
  className?: string;
}

export function ValidationMessage({ message, className }: ValidationMessageProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          variants={prefersReducedMotion ? undefined : messageVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn("overflow-hidden", className)}
        >
          <div className="flex items-center gap-1.5 pt-1.5 text-sm text-[var(--color-error)]">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// VALIDATED INPUT COMPONENT
// ============================================

export interface ValidatedInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  /** Validation rules to apply */
  rules?: ValidationRule[];
  /** External validation state (controlled) */
  validationState?: ValidationState;
  /** External error message (controlled) */
  errorMessage?: string | null;
  /** Show success state */
  showSuccess?: boolean;
  /** Label text */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Icon to show on the left */
  leftIcon?: ReactNode;
  /** Callback when value changes */
  onChange?: (value: string) => void;
  /** Callback when validation state changes */
  onValidationChange?: (state: ValidationState, message: string | null) => void;
  /** Container class name */
  containerClassName?: string;
}

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  (
    {
      rules = [],
      validationState: externalState,
      errorMessage: externalMessage,
      showSuccess = true,
      label,
      helperText,
      leftIcon,
      onChange,
      onValidationChange,
      containerClassName,
      className,
      onBlur,
      disabled,
      ...props
    },
    ref
  ) => {
    const [internalState, setInternalState] = useState<ValidationState>("idle");
    const [internalMessage, setInternalMessage] = useState<string | null>(null);
    const [hasBlurred, setHasBlurred] = useState(false);

    // Use external state if provided, otherwise internal
    const state = externalState ?? internalState;
    const message = externalMessage ?? internalMessage;

    const validate = useCallback(
      (value: string): boolean => {
        for (const rule of rules) {
          if (!rule.validate(value)) {
            setInternalState("invalid");
            setInternalMessage(rule.message);
            onValidationChange?.("invalid", rule.message);
            return false;
          }
        }
        setInternalState("valid");
        setInternalMessage(null);
        onValidationChange?.("valid", null);
        return true;
      },
      [rules, onValidationChange]
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        onChange?.(value);

        // Re-validate on change only if we've already shown an error
        if (hasBlurred && state === "invalid") {
          validate(value);
        }
      },
      [onChange, hasBlurred, state, validate]
    );

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setHasBlurred(true);
        if (rules.length > 0) {
          validate(e.target.value);
        }
        onBlur?.(e);
      },
      [rules, validate, onBlur]
    );

    const getBorderColor = () => {
      if (disabled) return "border-[var(--color-border)]";
      switch (state) {
        case "invalid":
          return "border-[var(--color-error)] focus:ring-[var(--color-error)]";
        case "valid":
          return showSuccess
            ? "border-[var(--color-jade)] focus:ring-[var(--color-jade)]"
            : "border-[var(--color-border)]";
        default:
          return "border-[var(--color-border)] focus:ring-[var(--color-cta)]";
      }
    };

    const getBackgroundColor = () => {
      if (disabled) return "bg-[var(--color-surface-muted)]";
      if (state === "invalid") return "bg-[var(--color-error-light)]";
      return "bg-[var(--color-surface)]";
    };

    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label
            className={cn(
              "block text-sm font-medium mb-1.5",
              disabled
                ? "text-[var(--color-text-muted)]"
                : "text-[var(--color-text-primary)]"
            )}
          >
            {label}
            {props.required && (
              <span className="text-[var(--color-error)] ml-0.5">*</span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            disabled={disabled}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={state === "invalid"}
            aria-describedby={message ? `${props.id}-error` : undefined}
            className={cn(
              "w-full rounded-[var(--radius-md)] px-3 py-2.5",
              "text-[var(--color-text-primary)]",
              "border transition-colors duration-[var(--duration-fast)]",
              "focus:outline-none focus:ring-2 focus:ring-offset-1",
              "placeholder:text-[var(--color-text-muted)]",
              getBorderColor(),
              getBackgroundColor(),
              leftIcon && "pl-10",
              (state === "invalid" || (state === "valid" && showSuccess)) && "pr-10",
              disabled && "cursor-not-allowed opacity-60",
              className
            )}
            {...props}
          />

          {/* Status icon */}
          <AnimatePresence>
            {state === "invalid" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <AlertCircle className="h-5 w-5 text-[var(--color-error)]" />
              </motion.div>
            )}
            {state === "valid" && showSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <Check className="h-5 w-5 text-[var(--color-jade)]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error message */}
        <ValidationMessage message={message} />

        {/* Helper text (only show when no error) */}
        {helperText && !message && (
          <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = "ValidatedInput";

// ============================================
// FORM VALIDATION CONTEXT (Optional)
// ============================================

import { createContext, useContext } from "react";

interface FormValidationContextValue {
  registerField: (name: string, validate: () => boolean) => void;
  unregisterField: (name: string) => void;
  validateAll: () => boolean;
}

const FormValidationContext = createContext<FormValidationContextValue | null>(null);

export function useFormValidation() {
  const context = useContext(FormValidationContext);
  if (!context) {
    throw new Error("useFormValidation must be used within FormValidationProvider");
  }
  return context;
}

export interface FormValidationProviderProps {
  children: ReactNode;
  onValidationChange?: (isValid: boolean) => void;
}

export function FormValidationProvider({
  children,
  onValidationChange,
}: FormValidationProviderProps) {
  const [fields] = useState<Map<string, () => boolean>>(() => new Map());

  const registerField = useCallback((name: string, validate: () => boolean) => {
    fields.set(name, validate);
  }, [fields]);

  const unregisterField = useCallback((name: string) => {
    fields.delete(name);
  }, [fields]);

  const validateAll = useCallback(() => {
    let allValid = true;
    fields.forEach((validate) => {
      if (!validate()) {
        allValid = false;
      }
    });
    onValidationChange?.(allValid);
    return allValid;
  }, [fields, onValidationChange]);

  return (
    <FormValidationContext.Provider
      value={{ registerField, unregisterField, validateAll }}
    >
      {children}
    </FormValidationContext.Provider>
  );
}
