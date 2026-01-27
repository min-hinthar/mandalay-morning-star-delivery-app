"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Return type for command palette hook
 */
export interface UseCommandPaletteReturn {
  /** Whether the command palette is open */
  isOpen: boolean;
  /** Open the command palette */
  open: () => void;
  /** Close the command palette */
  close: () => void;
  /** Toggle the command palette */
  toggle: () => void;
}

/**
 * Command palette state management with keyboard shortcut
 *
 * Handles Cmd/Ctrl+K keyboard shortcut with preventDefault to avoid
 * browser conflicts (some browsers use Cmd+K for search bar focus).
 *
 * @example
 * ```tsx
 * import { Command } from "cmdk";
 *
 * function SearchCommand() {
 *   const { isOpen, close, toggle } = useCommandPalette();
 *
 *   return (
 *     <>
 *       <button onClick={toggle}>
 *         <Search />
 *         <kbd className="hidden md:inline">Cmd+K</kbd>
 *       </button>
 *
 *       <Command.Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
 *         <Command.Input placeholder="Search menu..." />
 *         <Command.List>
 *           ...
 *         </Command.List>
 *       </Command.Dialog>
 *     </>
 *   );
 * }
 * ```
 */
export function useCommandPalette(): UseCommandPaletteReturn {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Handle Cmd/Ctrl+K keyboard shortcut
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      const isK = event.key === "k" || event.key === "K";

      if (isCmdOrCtrl && isK) {
        // Prevent default immediately to avoid browser conflicts
        // Some browsers use Cmd+K for search bar focus
        event.preventDefault();
        event.stopPropagation();

        toggle();
      }
    }

    // Use capture phase to catch before browser
    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      window.addEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [toggle]);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

export default useCommandPalette;
