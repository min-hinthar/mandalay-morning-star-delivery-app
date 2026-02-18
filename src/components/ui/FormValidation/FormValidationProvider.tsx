"use client";

/**
 * FormValidationProvider & Context Hooks
 *
 * Provides form-level validation context for coordinating
 * multiple validated fields.
 */

import { useState, useCallback, useRef, createContext, useContext, type ReactNode } from "react";

// ============================================
// CONTEXT TYPES
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

const FormValidationContext = createContext<FormValidationContextValue | null>(null);

// ============================================
// CONTEXT HOOKS
// ============================================

/**
 * Hook to access form validation context
 * @throws Error if used outside FormValidationProvider
 */
export function useFormValidation(): FormValidationContextValue {
  const context = useContext(FormValidationContext);
  if (!context) {
    throw new Error("useFormValidation must be used within FormValidationProvider");
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

// ============================================
// PROVIDER COMPONENT
// ============================================

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
