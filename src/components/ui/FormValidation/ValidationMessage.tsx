"use client";

/**
 * ValidationMessage & InlineError Components
 *
 * Animated error/success message display for form fields.
 */

import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

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

// ============================================
// VALIDATION MESSAGE
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
        <m.div
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
        </m.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// INLINE ERROR (for custom fields)
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
