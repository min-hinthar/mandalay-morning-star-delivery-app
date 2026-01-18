"use client";

import {
  createContext,
  useContext,
  useId,
  type ReactNode,
  type ComponentPropsWithoutRef,
} from "react";
import {
  useField,
  type FieldMetadata,
  getInputProps,
  getTextareaProps,
  getSelectProps,
} from "@conform-to/react";
import { cn } from "@/lib/utils/cn";

/**
 * V5 Sprint 2.8 - FormField Compound Component
 *
 * Progressive enhancement form fields with Conform integration.
 * Works without JavaScript, validates on server.
 *
 * @example
 * <FormField name="email" field={fields.email}>
 *   <FormField.Label>Email</FormField.Label>
 *   <FormField.Input type="email" placeholder="you@example.com" />
 *   <FormField.Error />
 * </FormField>
 */

// ============================================
// CONTEXT
// ============================================

interface FormFieldContextValue {
  id: string;
  name: string;
  field: FieldMetadata<string>;
  hasError: boolean;
  errorId: string;
  descriptionId: string;
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

function useFormFieldContext() {
  const context = useContext(FormFieldContext);
  if (!context) {
    throw new Error("FormField components must be used within FormField");
  }
  return context;
}

// ============================================
// ROOT COMPONENT
// ============================================

interface FormFieldProps {
  /** Field name (must match schema) */
  name: string;
  /** Field metadata from useForm */
  field: FieldMetadata<string>;
  /** Child components */
  children: ReactNode;
  /** Additional wrapper class */
  className?: string;
}

function FormFieldRoot({ name, field, children, className }: FormFieldProps) {
  const id = useId();
  const hasError = Boolean(field.errors?.length);
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  return (
    <FormFieldContext.Provider
      value={{ id, name, field, hasError, errorId, descriptionId }}
    >
      <div className={cn("space-y-1.5", className)}>{children}</div>
    </FormFieldContext.Provider>
  );
}

// ============================================
// LABEL
// ============================================

interface FormFieldLabelProps extends ComponentPropsWithoutRef<"label"> {
  /** Mark as required */
  required?: boolean;
}

function FormFieldLabel({
  children,
  className,
  required,
  ...props
}: FormFieldLabelProps) {
  const { id } = useFormFieldContext();

  return (
    <label
      htmlFor={id}
      className={cn(
        "block text-sm font-medium text-[var(--color-text-primary)]",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-1 text-[var(--color-status-error)]" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

// ============================================
// INPUT
// ============================================

interface FormFieldInputProps
  extends Omit<ComponentPropsWithoutRef<"input">, "id" | "name"> {}

function FormFieldInput({ className, type = "text", ...props }: FormFieldInputProps) {
  const { id, field, hasError, errorId, descriptionId } = useFormFieldContext();

  // Cast type to Conform-compatible input types
  const conformType = type as "text" | "email" | "password" | "tel" | "url" | "number" | "date" | "time" | "datetime-local" | "search" | "hidden" | "color" | "file" | "month" | "week" | "range" | "checkbox" | "radio";
  const inputProps = getInputProps(field, { type: conformType, ariaAttributes: true });

  return (
    <input
      {...inputProps}
      {...props}
      id={id}
      className={cn(
        // Base styles
        "flex w-full h-11 px-4 py-3",
        "bg-[var(--color-surface-primary)] text-[var(--color-text-primary)]",
        "border rounded-[var(--radius-sm)]",
        "text-base font-[var(--font-body)]",
        "placeholder:text-[var(--color-text-secondary)]",
        "transition-all duration-[var(--duration-fast)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--color-surface-tertiary)]",
        // State styles
        hasError
          ? "border-[var(--color-status-error)] focus-visible:border-[var(--color-status-error)] focus-visible:ring-[var(--color-status-error)]/20 bg-[var(--color-status-error)]/5"
          : "border-[var(--color-border-default)] focus-visible:border-[var(--color-interactive-primary)] focus-visible:ring-[var(--color-interactive-primary)]/20",
        className
      )}
      aria-invalid={hasError}
      aria-describedby={
        hasError ? errorId : props["aria-describedby"] || descriptionId
      }
    />
  );
}

// ============================================
// TEXTAREA
// ============================================

interface FormFieldTextareaProps
  extends Omit<ComponentPropsWithoutRef<"textarea">, "id" | "name"> {}

function FormFieldTextarea({ className, ...props }: FormFieldTextareaProps) {
  const { id, field, hasError, errorId, descriptionId } = useFormFieldContext();

  const textareaProps = getTextareaProps(field, { ariaAttributes: true });

  return (
    <textarea
      {...textareaProps}
      {...props}
      id={id}
      className={cn(
        // Base styles
        "flex w-full min-h-[100px] px-4 py-3",
        "bg-[var(--color-surface-primary)] text-[var(--color-text-primary)]",
        "border rounded-[var(--radius-sm)]",
        "text-base font-[var(--font-body)]",
        "placeholder:text-[var(--color-text-secondary)]",
        "transition-all duration-[var(--duration-fast)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--color-surface-tertiary)]",
        "resize-y",
        // State styles
        hasError
          ? "border-[var(--color-status-error)] focus-visible:border-[var(--color-status-error)] focus-visible:ring-[var(--color-status-error)]/20 bg-[var(--color-status-error)]/5"
          : "border-[var(--color-border-default)] focus-visible:border-[var(--color-interactive-primary)] focus-visible:ring-[var(--color-interactive-primary)]/20",
        className
      )}
      aria-invalid={hasError}
      aria-describedby={
        hasError ? errorId : props["aria-describedby"] || descriptionId
      }
    />
  );
}

// ============================================
// SELECT
// ============================================

interface FormFieldSelectProps
  extends Omit<ComponentPropsWithoutRef<"select">, "id" | "name"> {}

function FormFieldSelect({
  className,
  children,
  ...props
}: FormFieldSelectProps) {
  const { id, field, hasError, errorId, descriptionId } = useFormFieldContext();

  const selectProps = getSelectProps(field, { ariaAttributes: true });

  return (
    <select
      {...selectProps}
      {...props}
      id={id}
      className={cn(
        // Base styles
        "flex w-full h-11 px-4 py-2",
        "bg-[var(--color-surface-primary)] text-[var(--color-text-primary)]",
        "border rounded-[var(--radius-sm)]",
        "text-base font-[var(--font-body)]",
        "transition-all duration-[var(--duration-fast)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--color-surface-tertiary)]",
        "appearance-none bg-no-repeat bg-right",
        // Arrow icon
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]",
        "bg-[position:right_12px_center]",
        "pr-10",
        // State styles
        hasError
          ? "border-[var(--color-status-error)] focus-visible:border-[var(--color-status-error)] focus-visible:ring-[var(--color-status-error)]/20 bg-[var(--color-status-error)]/5"
          : "border-[var(--color-border-default)] focus-visible:border-[var(--color-interactive-primary)] focus-visible:ring-[var(--color-interactive-primary)]/20",
        className
      )}
      aria-invalid={hasError}
      aria-describedby={
        hasError ? errorId : props["aria-describedby"] || descriptionId
      }
    >
      {children}
    </select>
  );
}

// ============================================
// ERROR
// ============================================

interface FormFieldErrorProps extends ComponentPropsWithoutRef<"p"> {}

function FormFieldError({ className, ...props }: FormFieldErrorProps) {
  const { field, errorId } = useFormFieldContext();

  if (!field.errors?.length) return null;

  return (
    <p
      id={errorId}
      role="alert"
      className={cn(
        "flex items-center gap-1.5 text-sm text-[var(--color-status-error)]",
        className
      )}
      {...props}
    >
      <svg
        className="h-4 w-4 shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      {field.errors[0]}
    </p>
  );
}

// ============================================
// DESCRIPTION
// ============================================

interface FormFieldDescriptionProps extends ComponentPropsWithoutRef<"p"> {}

function FormFieldDescription({
  className,
  children,
  ...props
}: FormFieldDescriptionProps) {
  const { descriptionId, hasError } = useFormFieldContext();

  // Don't show description when there's an error
  if (hasError) return null;

  return (
    <p
      id={descriptionId}
      className={cn("text-sm text-[var(--color-text-secondary)]", className)}
      {...props}
    >
      {children}
    </p>
  );
}

// ============================================
// COMPOUND EXPORT
// ============================================

export const FormField = Object.assign(FormFieldRoot, {
  Label: FormFieldLabel,
  Input: FormFieldInput,
  Textarea: FormFieldTextarea,
  Select: FormFieldSelect,
  Error: FormFieldError,
  Description: FormFieldDescription,
});

export type { FormFieldProps };
