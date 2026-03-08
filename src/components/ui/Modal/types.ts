/**
 * Modal Types
 *
 * Shared types for Modal, ConfirmModal, and related components.
 */

import type { ReactNode } from "react";

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title for accessibility (visually hidden) */
  title: string;
  /** Modal content */
  children: ReactNode;
  /** Whether to show close button (default: true) */
  showCloseButton?: boolean;
  /** Whether clicking backdrop closes modal (default: true) */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape closes modal (default: true) */
  closeOnEscape?: boolean;
  /** Whether swipe down closes modal on mobile (default: true) */
  closeOnSwipeDown?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Additional class names for modal content (dialog element) */
  className?: string;
  /** Additional class names for the inner content wrapper (scroll container) */
  contentClassName?: string;
  /** Additional class names for backdrop */
  backdropClassName?: string;
  /** Optional header content (replaces default) */
  header?: ReactNode;
  /** Optional footer content */
  footer?: ReactNode;
  /** Initial focus element ref */
  initialFocusRef?: React.RefObject<HTMLElement>;
}

export interface UseModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setIsOpen: (value: boolean) => void;
}

export interface ModalHeaderProps {
  children: ReactNode;
  className?: string;
}

export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  isLoading?: boolean;
}
