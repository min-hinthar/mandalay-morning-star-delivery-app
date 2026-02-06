"use client";

/**
 * ConfirmModal Component
 *
 * Pre-built confirmation dialog modal.
 */

import { useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import type { ConfirmModalProps } from "./types";
import { Modal } from "./Modal";

/**
 * Pre-built confirmation dialog modal.
 *
 * @example
 * <ConfirmModal
 *   isOpen={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Item"
 *   message="Are you sure you want to delete this item?"
 *   variant="danger"
 * />
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isLoading = false,
}: ConfirmModalProps) {
  const handleConfirm = useCallback(() => {
    onConfirm();
    onClose();
  }, [onConfirm, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnSwipeDown={false}
    >
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary,#1a1918)] dark:text-[var(--color-text-primary-dark,#f8f7f6)]">
            {title}
          </h3>
          <p className="mt-2 text-sm text-[var(--color-text-secondary,#4a4845)] dark:text-[var(--color-text-secondary-dark,#b5b3b0)]">
            {message}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-lg",
              "text-sm font-medium",
              "bg-[var(--color-surface-secondary,#f8f7f6)] dark:bg-[var(--color-surface-secondary-dark,#2a2827)]",
              "text-[var(--color-text-primary,#1a1918)] dark:text-[var(--color-text-primary-dark,#f8f7f6)]",
              "hover:bg-[var(--color-surface-tertiary,#f0eeec)] dark:hover:bg-[var(--color-surface-tertiary-dark,#3a3837)]",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-lg",
              "text-sm font-medium",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              variant === "danger"
                ? [
                    "bg-[var(--color-status-error,#C45C4A)]",
                    "text-text-inverse",
                    "hover:bg-[var(--color-accent-tertiary,#b54a3a)]",
                    "focus-visible:ring-[var(--color-status-error,#C45C4A)]",
                  ]
                : [
                    "bg-[var(--color-interactive-primary,#D4A853)]",
                    "text-text-inverse",
                    "hover:bg-[var(--color-interactive-hover,#C49843)]",
                    "focus-visible:ring-[var(--color-interactive-primary,#D4A853)]",
                  ]
            )}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Loading...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
