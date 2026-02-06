/**
 * Modal - Barrel Export
 *
 * Re-exports all 10 original exports from the split sub-files.
 */

// Types (5 exports)
export type {
  ModalProps,
  UseModalReturn,
  ModalHeaderProps,
  ModalFooterProps,
  ConfirmModalProps,
} from "./types";

// useModal hook (1 export)
export { useModal } from "./useModal";

// ModalHeader + ModalFooter (2 exports)
export { ModalHeader, ModalFooter } from "./ModalHeader";

// Modal component (1 export)
export { Modal } from "./Modal";

// ConfirmModal component (1 export)
export { ConfirmModal } from "./ConfirmModal";
