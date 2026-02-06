"use client";

/**
 * useModal Hook
 *
 * Manages modal open/close state with convenient methods.
 */

import { useState, useCallback } from "react";
import type { UseModalReturn } from "./types";

/**
 * Hook to manage modal state with convenient methods.
 *
 * @example
 * const { isOpen, open, close } = useModal();
 *
 * <button onClick={open}>Open Modal</button>
 * <Modal isOpen={isOpen} onClose={close} title="Example">
 *   Content here
 * </Modal>
 */
export function useModal(initialOpen = false): UseModalReturn {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle, setIsOpen };
}
