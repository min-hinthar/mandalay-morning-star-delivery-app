"use client";

import { useState, useCallback, type ReactNode } from "react";
import { Loader2, type LucideIcon } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";

type DropdownActionVariant = "default" | "destructive";

interface DropdownActionProps {
  /** Async or sync click handler */
  onClick: () => void | Promise<void>;
  /** Icon to display before the label */
  icon?: LucideIcon;
  /** Button label text */
  children: ReactNode;
  /** Whether the action is disabled */
  disabled?: boolean;
  /** Visual variant */
  variant?: DropdownActionVariant;
  /** Additional CSS classes */
  className?: string;
  /** Called on error during async onClick */
  onError?: (error: Error) => void;
  /** Called on successful completion of async onClick */
  onSuccess?: () => void;
  /** If true, don't prevent menu close (use for actions that redirect) */
  allowMenuClose?: boolean;
}

/**
 * DropdownAction - A dropdown menu item that handles async actions
 *
 * Fixes the form-in-Radix-dropdown issue by using onSelect instead of form action.
 * Shows loading state during async operations and handles errors gracefully.
 * Uses event.preventDefault() to keep menu open during async operations.
 *
 * @example
 * ```tsx
 * <DropdownAction
 *   icon={LogOut}
 *   onClick={async () => await signOut()}
 *   variant="destructive"
 * >
 *   Sign Out
 * </DropdownAction>
 * ```
 */
export function DropdownAction({
  onClick,
  icon: Icon,
  children,
  disabled = false,
  variant = "default",
  className,
  onError,
  onSuccess,
  allowMenuClose = false,
}: DropdownActionProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(() => {
    if (disabled || isLoading) return;

    setIsLoading(true);

    try {
      // Execute onClick - can be sync or async
      const result = onClick();

      // Handle async actions
      if (result instanceof Promise) {
        // Only attach success handler
        // For error handling: we intentionally DON'T attach a rejection handler
        // This allows Next.js server action errors (including redirects) to propagate
        // through the framework's own error boundary handling
        result.then(() => {
          onSuccess?.();
          setIsLoading(false);
        });
        // NOTE: Unhandled rejections from redirects are expected - Next.js handles them
      } else {
        // Sync action completed
        onSuccess?.();
        setIsLoading(false);
      }
    } catch (syncError) {
      // Handle synchronous errors (rare for actions)
      console.error("[DropdownAction] Sync error:", syncError);
      if (onError) {
        onError(syncError instanceof Error ? syncError : new Error(String(syncError)));
      }
      setIsLoading(false);
    }
  }, [onClick, disabled, isLoading, onError, onSuccess]);

  const variantStyles: Record<DropdownActionVariant, string> = {
    default: "",
    destructive: "text-[var(--color-error)] focus:text-[var(--color-error)] focus:bg-[var(--color-error-light)]",
  };

  const isDisabled = disabled || isLoading;

  return (
    <DropdownMenuItem
      onSelect={(event) => {
        if (isDisabled) return;
        // Prevent menu from closing until action completes (unless allowMenuClose is true)
        if (!allowMenuClose) {
          event.preventDefault();
        }
        // Execute the action - let redirect errors propagate to Next.js handler
        // Do NOT use void or .catch() that swallows errors - Next.js needs to see redirects
        handleClick();
      }}
      className={cn(
        "cursor-pointer",
        variantStyles[variant],
        isDisabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : Icon ? (
        <Icon className="mr-2 h-4 w-4" />
      ) : null}
      {children}
    </DropdownMenuItem>
  );
}

export default DropdownAction;
