/**
 * V5 Sprint 5: Form Validation Components
 *
 * Real-time inline form validation with animated error display.
 * Validates on blur, re-validates on change after error.
 */

"use client";

import {
  useState,
  useCallback,
  useEffect,
  useId,
  forwardRef,
  createContext,
  useContext,
  useRef,
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
  setError: (message: string) => void;
}

// ============================================
// ANIMATION VARIANTS
// ============================================

const messageVariants = {
  hidden: {
    opacity: 0,
    y: -8,
    height: 0,
    marginTop: 0,
  },
  visible: {
    opacity: 1,
    y: 0,
    height: "auto",
    marginTop: 6,
    transition: {
      duration: 0.15,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
      height: { duration: 0.15 },
      opacity: { duration: 0.12, delay: 0.03 },
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    height: 0,
    marginTop: 0,
    transition: {
      duration: 0.1,
      ease: [0.55, 0.06, 0.68, 0.19] as const,
    },
  },
};

const iconVariants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.1 },
  },
};

const shakeVariants = {
  shake: {
    x: [0, -6, 6, -4, 4, -2, 2, 0],
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

// ============================================
// COMMON VALIDATION RULES
// ============================================

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

  const setError = useCallback((errorMessage: string) => {
    setState("invalid");
    setMessage(errorMessage);
  }, []);

  return { state, message, validate, reset, setError };
}

// ============================================
// VALIDATION MESSAGE COMPONENT
// ============================================

export interface ValidationMessageProps {
  /** Error or success message to display */
  message: string | null;
  /** Type of message (error shows red, success shows green) */
  type?: "error" | "success";
  /** Additional class names */
  className?: string;
}

export function ValidationMessage({
  message,
  type = "error",
  className,
}: ValidationMessageProps) {
  const prefersReducedMotion = useReducedMotion();

  const colorClass =
    type === "error"
      ? "text-[var(--color-status-error)]"
      : "text-[var(--color-accent-secondary)]";

  const Icon = type === "error" ? AlertCircle : Check;

  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.div
          key={message}
          variants={prefersReducedMotion ? undefined : messageVariants}
          initial={prefersReducedMotion ? { opacity: 1 } : "hidden"}
          animate="visible"
          exit="exit"
          className={cn("overflow-hidden", className)}
          role={type === "error" ? "alert" : "status"}
          aria-live={type === "error" ? "assertive" : "polite"}
        >
          <div
            className={cn(
              "flex items-start gap-1.5 text-sm",
              colorClass
            )}
          >
            <Icon
              className="h-4 w-4 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
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
  /** Show success state with check icon */
  showSuccess?: boolean;
  /** Shake input on error */
  shakeOnError?: boolean;
  /** Label text */
  label?: string;
  /** Helper text shown below input */
  helperText?: string;
  /** Icon to show on the left side */
  leftIcon?: ReactNode;
  /** Callback when value changes */
  onChange?: (value: string) => void;
  /** Callback when validation state changes */
  onValidationChange?: (state: ValidationState, message: string | null) => void;
  /** Container class name */
  containerClassName?: string;
  /** Input wrapper class name (for relative positioning) */
  wrapperClassName?: string;
}

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  (
    {
      rules = [],
      validationState: externalState,
      errorMessage: externalMessage,
      showSuccess = true,
      shakeOnError = true,
      label,
      helperText,
      leftIcon,
      onChange,
      onValidationChange,
      containerClassName,
      wrapperClassName,
      className,
      onBlur,
      disabled,
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = providedId ?? generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const [internalState, setInternalState] = useState<ValidationState>("idle");
    const [internalMessage, setInternalMessage] = useState<string | null>(null);
    const [hasBlurred, setHasBlurred] = useState(false);
    const [shouldShake, setShouldShake] = useState(false);

    const prefersReducedMotion = useReducedMotion();
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Use external state if provided, otherwise internal
    const state = externalState ?? internalState;
    const message = externalMessage ?? internalMessage;

    // Trigger shake animation on error
    useEffect(() => {
      if (state === "invalid" && shakeOnError && !prefersReducedMotion) {
        setShouldShake(true);
        const timer = setTimeout(() => setShouldShake(false), 400);
        return () => clearTimeout(timer);
      }
    }, [state, shakeOnError, prefersReducedMotion, message]);

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

    const getBorderClass = () => {
      if (disabled) return "border-[var(--color-border)]";
      switch (state) {
        case "invalid":
          return "border-[var(--color-status-error)] focus:border-[var(--color-status-error)] focus:ring-[var(--color-status-error)]/20";
        case "valid":
          return showSuccess
            ? "border-[var(--color-accent-secondary)] focus:border-[var(--color-accent-secondary)] focus:ring-[var(--color-accent-secondary)]/20"
            : "border-[var(--color-border)] focus:border-[var(--color-accent-tertiary)] focus:ring-[var(--color-accent-tertiary)]/20";
        default:
          return "border-[var(--color-border)] focus:border-[var(--color-accent-tertiary)] focus:ring-[var(--color-accent-tertiary)]/20";
      }
    };

    const getBackgroundClass = () => {
      if (disabled) return "bg-[var(--color-surface-muted)]";
      if (state === "invalid") return "bg-[var(--color-status-error-bg)]";
      return "bg-[var(--color-surface)]";
    };

    // Build aria-describedby
    const describedBy = [
      message ? errorId : null,
      helperText && !message ? helperId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    return (
      <div className={cn("w-full", containerClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "block text-sm font-medium mb-1.5",
              disabled
                ? "text-[var(--color-text-secondary)]"
                : "text-[var(--color-text-primary)]"
            )}
          >
            {label}
            {props.required && (
              <span
                className="text-[var(--color-status-error)] ml-0.5"
                aria-hidden="true"
              >
                *
              </span>
            )}
          </label>
        )}

        {/* Input wrapper */}
        <motion.div
          className={cn("relative", wrapperClassName)}
          animate={shouldShake ? "shake" : undefined}
          variants={shakeVariants}
        >
          {/* Left icon */}
          {leftIcon && (
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === "function") {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
            }}
            id={inputId}
            disabled={disabled}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={state === "invalid"}
            aria-describedby={describedBy}
            className={cn(
              // Base styles
              "w-full rounded-[var(--radius-md)] px-3 py-2.5",
              "text-[var(--color-text-primary)] text-base",
              "border-2 transition-all duration-[var(--duration-fast)]",
              "focus:outline-none focus:ring-4",
              "placeholder:text-[var(--color-text-secondary)]",
              // Dynamic styles
              getBorderClass(),
              getBackgroundClass(),
              // Conditional padding
              leftIcon && "pl-10",
              (state === "invalid" || (state === "valid" && showSuccess)) &&
                "pr-10",
              // Disabled state
              disabled && "cursor-not-allowed opacity-60",
              className
            )}
            {...props}
          />

          {/* Status icons */}
          <AnimatePresence mode="wait">
            {state === "invalid" && (
              <motion.div
                key="error-icon"
                variants={iconVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              >
                <AlertCircle className="h-5 w-5 text-[var(--color-status-error)]" />
              </motion.div>
            )}
            {state === "valid" && showSuccess && (
              <motion.div
                key="success-icon"
                variants={iconVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              >
                <Check className="h-5 w-5 text-[var(--color-accent-secondary)]" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Error message */}
        <div id={errorId}>
          <ValidationMessage message={message} type="error" />
        </div>

        {/* Helper text (only show when no error) */}
        {helperText && !message && (
          <p
            id={helperId}
            className="mt-1.5 text-sm text-[var(--color-text-secondary)]"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = "ValidatedInput";

// ============================================
// VALIDATED TEXTAREA COMPONENT
// ============================================

export interface ValidatedTextareaProps
  extends Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    "onChange"
  > {
  /** Validation rules to apply */
  rules?: ValidationRule[];
  /** External validation state (controlled) */
  validationState?: ValidationState;
  /** External error message (controlled) */
  errorMessage?: string | null;
  /** Show success state */
  showSuccess?: boolean;
  /** Shake on error */
  shakeOnError?: boolean;
  /** Label text */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Character count display */
  showCharCount?: boolean;
  /** Max characters for count display */
  maxChars?: number;
  /** Callback when value changes */
  onChange?: (value: string) => void;
  /** Callback when validation state changes */
  onValidationChange?: (state: ValidationState, message: string | null) => void;
  /** Container class name */
  containerClassName?: string;
}

export const ValidatedTextarea = forwardRef<
  HTMLTextAreaElement,
  ValidatedTextareaProps
>((props, ref) => {
  const {
    rules = [],
    validationState: externalState,
    errorMessage: externalMessage,
    showSuccess = true,
    shakeOnError = true,
    label,
    helperText,
    showCharCount = false,
    maxChars,
    onChange,
    onValidationChange,
    containerClassName,
    className,
    onBlur,
    disabled,
    id: providedId,
    value,
    defaultValue,
    ...rest
  } = props;

  const generatedId = useId();
  const textareaId = providedId ?? generatedId;
  const errorId = `${textareaId}-error`;
  const helperId = `${textareaId}-helper`;

  const [internalState, setInternalState] = useState<ValidationState>("idle");
  const [internalMessage, setInternalMessage] = useState<string | null>(null);
  const [hasBlurred, setHasBlurred] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);
  const [charCount, setCharCount] = useState(
    () => (value?.toString() ?? defaultValue?.toString() ?? "").length
  );

  const prefersReducedMotion = useReducedMotion();

  const state = externalState ?? internalState;
  const message = externalMessage ?? internalMessage;

  useEffect(() => {
    if (state === "invalid" && shakeOnError && !prefersReducedMotion) {
      setShouldShake(true);
      const timer = setTimeout(() => setShouldShake(false), 400);
      return () => clearTimeout(timer);
    }
  }, [state, shakeOnError, prefersReducedMotion, message]);

  const validate = useCallback(
    (val: string): boolean => {
      for (const rule of rules) {
        if (!rule.validate(val)) {
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
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setCharCount(val.length);
      onChange?.(val);

      if (hasBlurred && state === "invalid") {
        validate(val);
      }
    },
    [onChange, hasBlurred, state, validate]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setHasBlurred(true);
      if (rules.length > 0) {
        validate(e.target.value);
      }
      onBlur?.(e);
    },
    [rules, validate, onBlur]
  );

  const getBorderClass = () => {
    if (disabled) return "border-[var(--color-border)]";
    switch (state) {
      case "invalid":
        return "border-[var(--color-status-error)] focus:border-[var(--color-status-error)] focus:ring-[var(--color-status-error)]/20";
      case "valid":
        return showSuccess
          ? "border-[var(--color-accent-secondary)] focus:border-[var(--color-accent-secondary)] focus:ring-[var(--color-accent-secondary)]/20"
          : "border-[var(--color-border)] focus:border-[var(--color-accent-tertiary)] focus:ring-[var(--color-accent-tertiary)]/20";
      default:
        return "border-[var(--color-border)] focus:border-[var(--color-accent-tertiary)] focus:ring-[var(--color-accent-tertiary)]/20";
    }
  };

  const getBackgroundClass = () => {
    if (disabled) return "bg-[var(--color-surface-muted)]";
    if (state === "invalid") return "bg-[var(--color-status-error-bg)]";
    return "bg-[var(--color-surface)]";
  };

  const describedBy = [
    message ? errorId : null,
    helperText && !message ? helperId : null,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  const isOverLimit = maxChars ? charCount > maxChars : false;

  return (
    <div className={cn("w-full", containerClassName)}>
      {label && (
        <label
          htmlFor={textareaId}
          className={cn(
            "block text-sm font-medium mb-1.5",
            disabled
              ? "text-[var(--color-text-secondary)]"
              : "text-[var(--color-text-primary)]"
          )}
        >
          {label}
          {rest.required && (
            <span
              className="text-[var(--color-status-error)] ml-0.5"
              aria-hidden="true"
            >
              *
            </span>
          )}
        </label>
      )}

      <motion.div
        className="relative"
        animate={shouldShake ? "shake" : undefined}
        variants={shakeVariants}
      >
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={state === "invalid"}
          aria-describedby={describedBy}
          className={cn(
            "w-full rounded-[var(--radius-md)] px-3 py-2.5",
            "text-[var(--color-text-primary)] text-base",
            "border-2 transition-all duration-[var(--duration-fast)]",
            "focus:outline-none focus:ring-4",
            "placeholder:text-[var(--color-text-secondary)]",
            "resize-y min-h-[100px]",
            getBorderClass(),
            getBackgroundClass(),
            disabled && "cursor-not-allowed opacity-60",
            className
          )}
          {...rest}
        />
      </motion.div>

      {/* Footer row: error/helper + char count */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div id={errorId}>
            <ValidationMessage message={message} type="error" />
          </div>
          {helperText && !message && (
            <p
              id={helperId}
              className="mt-1.5 text-sm text-[var(--color-text-secondary)]"
            >
              {helperText}
            </p>
          )}
        </div>

        {showCharCount && (
          <span
            className={cn(
              "mt-1.5 text-sm flex-shrink-0",
              isOverLimit
                ? "text-[var(--color-status-error)]"
                : "text-[var(--color-text-secondary)]"
            )}
          >
            {charCount}
            {maxChars && ` / ${maxChars}`}
          </span>
        )}
      </div>
    </div>
  );
});

ValidatedTextarea.displayName = "ValidatedTextarea";

// ============================================
// FORM VALIDATION CONTEXT
// ============================================

interface FormField {
  validate: () => boolean;
  reset: () => void;
}

interface FormValidationContextValue {
  /** Register a field with the form */
  registerField: (name: string, field: FormField) => void;
  /** Unregister a field from the form */
  unregisterField: (name: string) => void;
  /** Validate all registered fields */
  validateAll: () => boolean;
  /** Reset all fields to idle state */
  resetAll: () => void;
  /** Check if form is currently valid */
  isValid: boolean;
  /** Check if form has been touched */
  isDirty: boolean;
  /** Mark form as dirty */
  setDirty: () => void;
}

const FormValidationContext = createContext<FormValidationContextValue | null>(
  null
);

/**
 * Hook to access form validation context
 * @throws Error if used outside FormValidationProvider
 */
export function useFormValidation(): FormValidationContextValue {
  const context = useContext(FormValidationContext);
  if (!context) {
    throw new Error(
      "useFormValidation must be used within FormValidationProvider"
    );
  }
  return context;
}

/**
 * Hook to optionally access form validation context
 * Returns null if not within a provider (for standalone usage)
 */
export function useFormValidationOptional(): FormValidationContextValue | null {
  return useContext(FormValidationContext);
}

export interface FormValidationProviderProps {
  children: ReactNode;
  /** Callback when overall form validity changes */
  onValidationChange?: (isValid: boolean) => void;
  /** Callback when form dirty state changes */
  onDirtyChange?: (isDirty: boolean) => void;
}

export function FormValidationProvider({
  children,
  onValidationChange,
  onDirtyChange,
}: FormValidationProviderProps) {
  const fieldsRef = useRef<Map<string, FormField>>(new Map());
  const [isValid, setIsValid] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  const registerField = useCallback((name: string, field: FormField) => {
    fieldsRef.current.set(name, field);
  }, []);

  const unregisterField = useCallback((name: string) => {
    fieldsRef.current.delete(name);
  }, []);

  const validateAll = useCallback(() => {
    let allValid = true;
    fieldsRef.current.forEach((field) => {
      const fieldValid = field.validate();
      if (!fieldValid) {
        allValid = false;
      }
    });
    setIsValid(allValid);
    onValidationChange?.(allValid);
    return allValid;
  }, [onValidationChange]);

  const resetAll = useCallback(() => {
    fieldsRef.current.forEach((field) => {
      field.reset();
    });
    setIsValid(true);
    setIsDirty(false);
    onDirtyChange?.(false);
  }, [onDirtyChange]);

  const setDirty = useCallback(() => {
    if (!isDirty) {
      setIsDirty(true);
      onDirtyChange?.(true);
    }
  }, [isDirty, onDirtyChange]);

  return (
    <FormValidationContext.Provider
      value={{
        registerField,
        unregisterField,
        validateAll,
        resetAll,
        isValid,
        isDirty,
        setDirty,
      }}
    >
      {children}
    </FormValidationContext.Provider>
  );
}

// ============================================
// FORM COMPONENT WITH VALIDATION
// ============================================

export interface ValidatedFormProps
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
  /** Called when form is submitted and validation passes */
  onValidSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  /** Called when form submission fails validation */
  onInvalidSubmit?: () => void;
  /** Prevent default form submission */
  preventSubmit?: boolean;
}

export const ValidatedForm = forwardRef<HTMLFormElement, ValidatedFormProps>(
  (
    { onValidSubmit, onInvalidSubmit, preventSubmit = true, children, ...props },
    ref
  ) => {
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

// ============================================
// INLINE ERROR MESSAGE (for custom fields)
// ============================================

export interface InlineErrorProps {
  /** Error message to display */
  error: string | null | undefined;
  /** ID for aria-describedby linking */
  id?: string;
  /** Additional class names */
  className?: string;
}

export function InlineError({ error, id, className }: InlineErrorProps) {
  return (
    <div id={id} className={className}>
      <ValidationMessage message={error ?? null} type="error" />
    </div>
  );
}

// ============================================
// UTILITY: Combine validation rules
// ============================================

/**
 * Combines multiple validation rules into a single array
 * Useful for building conditional validation
 */
export function combineRules(
  ...ruleSets: (ValidationRule | ValidationRule[] | false | null | undefined)[]
): ValidationRule[] {
  return ruleSets.flat().filter((rule): rule is ValidationRule => Boolean(rule));
}
