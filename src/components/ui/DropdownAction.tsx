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

  const handleClick = useCallback(async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);

    try {
      const result = onClick();
      // Handle both sync and async onClick
      if (result instanceof Promise) {
        await result;
      }
      onSuccess?.();
    } catch (error) {
      // Next.js redirect() throws NEXT_REDIRECT error - must re-throw to work
      const errorString = String(error);
      if (errorString.includes("NEXT_REDIRECT") || errorString.includes("redirect")) {
        throw error; // Re-throw redirect errors
      }
      console.error("[DropdownAction] Error:", error);
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
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
        // Execute the async action - don't catch redirect errors, let them bubble
        void handleClick();
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
