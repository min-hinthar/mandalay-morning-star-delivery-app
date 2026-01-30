"use client";

/**
 *  Auth Modal - Glassmorphism Magic Link Authentication
 *
 * Sprint 9: Auth & Onboarding
 * Features: Glassmorphism design, animated form, loading states,
 * success/error animations, haptic feedback
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFormStatus } from "react-dom";
import {
  Mail,
  Sparkles,
  X,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  spring,
  hover,
} from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { ErrorShake, useErrorShake } from "@/components/ui/error-shake";
import { signIn } from "@/lib/supabase/actions";

// ============================================
// TYPES
// ============================================

export interface AuthModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Called when modal should close */
  onClose: () => void;
  /** Called on successful auth */
  onSuccess?: (email: string) => void;
  /** Additional className */
  className?: string;
}

// ============================================
// ANIMATED INPUT
// ============================================

interface AnimatedInputProps {
  id: string;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: string;
  icon?: React.ReactNode;
}

function AnimatedInput({
  id,
  name,
  type,
  placeholder,
  value,
  onChange,
  disabled,
  error,
  icon,
}: AnimatedInputProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ delay: 0.2 }}
      className="relative"
    >
      {/* Focus ring */}
      <AnimatePresence>
        {isFocused && shouldAnimate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={getSpring(spring.snappy)}
            className={cn(
              "absolute -inset-1 rounded-2xl",
              error
                ? "bg-red-500/20 ring-2 ring-red-500/50"
                : "bg-primary/10 ring-2 ring-primary/30"
            )}
          />
        )}
      </AnimatePresence>

      {/* Input container */}
      <div className="relative">
        {/* Icon */}
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "w-full py-4 rounded-xl",
            "bg-overlay-light backdrop-blur-sm",
            "border-2 transition-colors",
            error
              ? "border-red-500/50 focus:border-red-500"
              : "border-white/50 focus:border-primary/50",
            "text-text-primary placeholder:text-text-muted",
            "focus:outline-none",
            icon ? "pl-12 pr-4" : "px-4",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -5, height: 0 }}
            className="mt-2 text-sm text-red-500 flex items-center gap-1"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// SUBMIT BUTTON
// ============================================

interface SubmitButtonProps {
  children: React.ReactNode;
  disabled?: boolean;
}

function SubmitButton({ children, disabled }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const { shouldAnimate } = useAnimationPreference();

  const isDisabled = disabled || pending;

  return (
    <motion.button
      type="submit"
      disabled={isDisabled}
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ delay: 0.3 }}
      whileHover={shouldAnimate && !isDisabled ? { scale: 1.02 } : undefined}
      whileTap={shouldAnimate && !isDisabled ? { scale: 0.98 } : undefined}
      className={cn(
        "w-full py-4 rounded-xl",
        "bg-gradient-primary",
        "text-text-inverse font-semibold",
        "flex items-center justify-center gap-2",
        "shadow-lg shadow-primary/30",
        "transition-all",
        isDisabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:shadow-xl hover:shadow-primary/40"
      )}
    >
      {pending ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          {children}
          <ArrowRight className="w-5 h-5" />
        </>
      )}
    </motion.button>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  className,
}: AuthModalProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { shake: errorShake, triggerShake } = useErrorShake();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  // Handle form submit
  const handleSubmit = useCallback(
    async (formData: FormData) => {
      setError(null);

      // Validate email
      const emailValue = formData.get("email") as string;
      if (!emailValue || !emailValue.includes("@")) {
        setError("Please enter a valid email address");
        triggerShake();
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([50, 30, 50]);
        }
        return;
      }

      try {
        const result = await signIn(formData);

        if (result?.error) {
          setError(result.error);
          triggerShake();
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([50, 30, 50]);
          }
        } else if (result?.success) {
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([50, 30, 100, 30, 50]);
          }
          onSuccess?.(emailValue);
        }
      } catch {
        setError("Something went wrong. Please try again.");
        triggerShake();
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([50, 30, 50]);
        }
      }
    },
    [onSuccess, triggerShake]
  );

  // Handle close
  const handleClose = useCallback(() => {
    setEmail("");
    setError(null);
    onClose();
  }, [onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose]
  );

  // Handle escape key - only add listener when open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={shouldAnimate ? { opacity: 0 } : undefined}
          animate={shouldAnimate ? { opacity: 1 } : undefined}
          exit={shouldAnimate ? { opacity: 0 } : undefined}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
          className={cn(
            "fixed inset-0 z-modal",
            "flex items-center justify-center",
            "bg-overlay backdrop-blur-md",
            "p-4",
            className
          )}
        >
          {/* Modal */}
          <motion.div
            initial={
              shouldAnimate ? { opacity: 0, scale: 0.9, y: 20 } : undefined
            }
            animate={shouldAnimate ? { opacity: 1, scale: 1, y: 0 } : undefined}
            exit={shouldAnimate ? { opacity: 0, scale: 0.9, y: 20 } : undefined}
            transition={getSpring(spring.default)}
            className={cn(
              "relative w-full max-w-md",
              "p-8 rounded-3xl",
              // Glassmorphism
              "bg-surface-primary/80 backdrop-blur-xl",
              "border border-white/50",
              "shadow-2xl shadow-black/10"
            )}
          >
            {/* Close button */}
            <motion.button
              {...(shouldAnimate ? hover.scale : {})}
              onClick={handleClose}
              className={cn(
                "absolute top-4 right-4",
                "p-2 rounded-full",
                "text-text-muted hover:text-text-primary",
                "hover:bg-surface-secondary",
                "transition-colors"
              )}
            >
              <X className="w-5 h-5" />
            </motion.button>

            {/* Header */}
            <div className="text-center mb-8">
              {/* Icon */}
              <motion.div
                initial={
                  shouldAnimate
                    ? { scale: 0, rotate: -180 }
                    : undefined
                }
                animate={shouldAnimate ? { scale: 1, rotate: 0 } : undefined}
                transition={getSpring(spring.ultraBouncy)}
                className={cn(
                  "inline-flex items-center justify-center",
                  "w-16 h-16 rounded-2xl mb-4",
                  "bg-gradient-primary",
                  "shadow-lg shadow-primary/30"
                )}
              >
                <Sparkles className="w-8 h-8 text-text-inverse" />
              </motion.div>

              <motion.h2
                initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
                animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
                transition={{ delay: 0.1 }}
                className="text-2xl font-bold text-text-primary mb-2"
              >
                Welcome Back
              </motion.h2>

              <motion.p
                initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
                animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
                transition={{ delay: 0.15 }}
                className="text-text-secondary"
              >
                Enter your email for a magic link
              </motion.p>
            </div>

            {/* Form */}
            <form action={handleSubmit}>
              <div className="space-y-6">
                {/* Email input with shake on error */}
                <ErrorShake shake={errorShake && !!error}>
                  <AnimatedInput
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    error={error || undefined}
                    icon={<Mail className="w-5 h-5" />}
                  />
                </ErrorShake>

                {/* Submit button */}
                <SubmitButton disabled={!email}>
                  Send Magic Link
                </SubmitButton>
              </div>
            </form>

            {/* Footer */}
            <motion.p
              initial={shouldAnimate ? { opacity: 0 } : undefined}
              animate={shouldAnimate ? { opacity: 0.6 } : undefined}
              transition={{ delay: 0.4 }}
              className="mt-6 text-center text-xs text-text-muted"
            >
              We&apos;ll email you a secure link to sign in.
              <br />
              No password needed.
            </motion.p>

            {/* Decorative gradient */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
              <div
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-2xl"
                style={{ background: "linear-gradient(to bottom right, var(--color-secondary-light), transparent)" }}
              />
              <div
                className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-2xl"
                style={{ background: "linear-gradient(to top right, var(--color-primary-light), transparent)" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AuthModal;
