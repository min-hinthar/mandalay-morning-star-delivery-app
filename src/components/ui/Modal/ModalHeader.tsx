/**
 * ModalHeader & ModalFooter Components
 *
 * Styled header/footer for modal content.
 */

import { cn } from "@/lib/utils/cn";
import type { ModalHeaderProps, ModalFooterProps } from "./types";

/**
 * Styled header for modal content.
 */
export function ModalHeader({ children, className }: ModalHeaderProps) {
  return (
    <div
      className={cn(
        "text-lg font-semibold",
        "text-[var(--color-text-primary,#1a1918)] dark:text-[var(--color-text-primary-dark,#f8f7f6)]",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Styled footer for modal actions.
 */
export function ModalFooter({ children, className }: ModalFooterProps) {
  return <div className={cn("flex items-center justify-end gap-3", className)}>{children}</div>;
}
