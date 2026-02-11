"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export interface FloatingLabelInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Floating label text */
  label: string;
  /** Validation error message */
  error?: string;
  /** Optional leading icon */
  icon?: LucideIcon;
}

// ============================================
// COMPONENT
// ============================================

export const FloatingLabelInput = forwardRef<
  HTMLInputElement,
  FloatingLabelInputProps
>(function FloatingLabelInput(
  { label, error, icon: Icon, className, id, ...props },
  ref
) {
  const { shouldAnimate } = useAnimationPreference();
  const [isShaking, setIsShaking] = useState(false);
  const prevErrorRef = useRef(error);

  // Trigger shake when error changes to a truthy value
  useEffect(() => {
    if (error && error !== prevErrorRef.current && shouldAnimate) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 400);
      return () => clearTimeout(timer);
    }
    prevErrorRef.current = error;
  }, [error, shouldAnimate]);

  const inputId = id ?? `floating-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const hasIcon = Boolean(Icon);

  return (
    <m.div
      animate={isShaking ? { x: [0, -4, 4, -4, 0] } : undefined}
      transition={{ duration: 0.3 }}
      className="space-y-1.5"
    >
      <div className="relative group">
        {/* Icon */}
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-accent-teal transition-colors duration-200 z-10 pointer-events-none">
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          placeholder=" "
          className={cn(
            "peer w-full rounded-2xl border border-border bg-surface-secondary/50 pr-4 pt-6 pb-2 text-base text-text-primary",
            hasIcon ? "pl-11" : "pl-4",
            "transition-all duration-200",
            "focus:border-accent-teal focus:bg-surface-primary focus:ring-2 focus:ring-accent-teal/20 focus:outline-none",
            error && "border-status-error ring-2 ring-status-error/20",
            className
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />

        <label
          htmlFor={inputId}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 text-sm text-muted-foreground",
            hasIcon ? "left-11" : "left-4",
            "transition-all duration-200 pointer-events-none",
            "peer-focus:top-3 peer-focus:text-xs peer-focus:text-accent-teal peer-focus:font-medium",
            "peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs"
          )}
        >
          {label}
        </label>
      </div>

      {/* Error message */}
      {error && (
        <p
          id={`${inputId}-error`}
          className="text-status-error text-sm pl-1"
        >
          {error}
        </p>
      )}
    </m.div>
  );
});
