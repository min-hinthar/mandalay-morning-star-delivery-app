"use client";

/**
 * Toast State Management Hook (V8)
 * Global toast state with listener pattern
 *
 * Uses same pattern as existing useToast.ts but with V8 suffix
 * to avoid conflicts during migration.
 *
 * @example
 * // Imperative API
 * import { toast } from "@/lib/hooks/useToastV8";
 * toast({ message: "Success!", type: "success" });
 *
 * // Hook API in components
 * const { toasts, dismiss } = useToast();
 */

import { useState, useEffect, useCallback } from "react";

// ============================================
// TYPES
// ============================================

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  /** Auto-dismiss duration in ms (default: 5000) */
  duration?: number;
}

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

type ToastAction =
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "DISMISS_TOAST"; id: string }
  | { type: "REMOVE_TOAST"; id: string };

interface ToastState {
  toasts: Toast[];
}

// ============================================
// CONSTANTS
// ============================================

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000;

// ============================================
// GLOBAL STATE
// ============================================

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [] };

// ============================================
// HELPERS
// ============================================

function genId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function reducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "DISMISS_TOAST":
      // Mark for removal, but keep in state briefly for exit animation
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      };

    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      };

    default:
      return state;
  }
}

function dispatch(action: ToastAction) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

function addToRemoveQueue(id: string, duration: number) {
  if (toastTimeouts.has(id)) return;

  const timeout = setTimeout(() => {
    toastTimeouts.delete(id);
    dispatch({ type: "REMOVE_TOAST", id });
  }, duration);

  toastTimeouts.set(id, timeout);
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Create a toast notification
 * @returns Object with id, dismiss, and update functions
 */
export function toast(options: ToastOptions) {
  const id = genId();
  const duration = options.duration ?? TOAST_REMOVE_DELAY;

  const newToast: Toast = {
    id,
    message: options.message,
    type: options.type ?? "info",
    duration,
  };

  dispatch({
    type: "ADD_TOAST",
    toast: newToast,
  });

  // Auto-dismiss after duration
  addToRemoveQueue(id, duration);

  return {
    id,
    dismiss: () => {
      // Clear auto-dismiss timer
      const timeout = toastTimeouts.get(id);
      if (timeout) {
        clearTimeout(timeout);
        toastTimeouts.delete(id);
      }
      dispatch({ type: "DISMISS_TOAST", id });
    },
    update: (updateOptions: Partial<ToastOptions>) => {
      // For update, remove old and add new with same id
      dispatch({ type: "DISMISS_TOAST", id });
      dispatch({
        type: "ADD_TOAST",
        toast: {
          ...newToast,
          ...updateOptions,
          message: updateOptions.message ?? newToast.message,
        },
      });
    },
  };
}

/**
 * Hook to access toast state and actions
 */
export function useToast() {
  const [state, setState] = useState<ToastState>(memoryState);

  useEffect(() => {
    // Capture setState in a stable reference for cleanup comparison
    const listener = setState;
    listeners.push(listener);
    return () => {
      // Use filter instead of splice for thread-safety during concurrent unmounts
      const index = listeners.indexOf(listener);
      if (index > -1) {
        // Create new array to avoid mutation issues during iteration
        listeners.splice(index, 1);
      }
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    // Clear auto-dismiss timer
    const timeout = toastTimeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      toastTimeouts.delete(id);
    }
    dispatch({ type: "DISMISS_TOAST", id });
  }, []);

  return {
    toasts: state.toasts,
    toast,
    dismiss,
  };
}
