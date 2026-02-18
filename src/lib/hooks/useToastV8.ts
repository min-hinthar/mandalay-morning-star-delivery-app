"use client";

/**
 * Toast State Management Hook (V8)
 * Global toast state with listener pattern, sound support, and stacking.
 *
 * @example
 * // Imperative API
 * import { toast } from "@/lib/hooks/useToastV8";
 * toast({ message: "Success!", type: "success" });
 * toast({ message: "New order!", type: "order" }); // plays chime
 *
 * // Hook API in components
 * const { toasts, dismiss, expanded, toggleExpanded } = useToast();
 */

import { useState, useEffect, useCallback } from "react";

// ============================================
// TYPES
// ============================================

export type ToastType = "success" | "error" | "info" | "warning" | "order" | "exception";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  /** Auto-dismiss duration in ms (default: 5000) */
  duration?: number;
  /** Whether to play a chime sound (auto-set for order/exception types) */
  sound?: boolean;
}

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  sound?: boolean;
}

type ToastAction =
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "DISMISS_TOAST"; id: string }
  | { type: "REMOVE_TOAST"; id: string }
  | { type: "TOGGLE_EXPANDED" };

interface ToastState {
  toasts: Toast[];
  expanded: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000;
const CHIME_TYPES: ToastType[] = ["order", "exception"];

// ============================================
// GLOBAL STATE
// ============================================

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [], expanded: false };

// ============================================
// AUDIO
// ============================================

let audioContext: AudioContext | null = null;
let userHasInteracted = false;

function markUserInteraction() {
  userHasInteracted = true;
}

// Listen for first interaction to enable audio
if (typeof window !== "undefined") {
  const handler = () => {
    markUserInteraction();
    window.removeEventListener("click", handler);
    window.removeEventListener("touchstart", handler);
    window.removeEventListener("keydown", handler);
  };
  window.addEventListener("click", handler, { once: true });
  window.addEventListener("touchstart", handler, { once: true });
  window.addEventListener("keydown", handler, { once: true });
}

function playChimeSound() {
  if (!userHasInteracted || typeof window === "undefined") return;

  try {
    if (!audioContext) {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      audioContext = new AudioContextClass();
    }

    const ctx = audioContext;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    // Create a pleasant chime: 440Hz sine wave, 150ms, exponential decay
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(440, ctx.currentTime);
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  } catch {
    // Silently fail - audio is non-critical
  }
}

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
        // Collapse when new toast arrives (show only first)
        expanded: false,
      };

    case "DISMISS_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      };

    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      };

    case "TOGGLE_EXPANDED":
      return {
        ...state,
        expanded: !state.expanded,
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
  const toastType = options.type ?? "info";
  const shouldSound = options.sound ?? CHIME_TYPES.includes(toastType);

  const newToast: Toast = {
    id,
    message: options.message,
    type: toastType,
    duration,
    sound: shouldSound,
  };

  dispatch({
    type: "ADD_TOAST",
    toast: newToast,
  });

  // Play chime for order/exception toasts
  if (shouldSound) {
    playChimeSound();
  }

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

  const toggleExpanded = useCallback(() => {
    dispatch({ type: "TOGGLE_EXPANDED" });
  }, []);

  return {
    toasts: state.toasts,
    expanded: state.expanded,
    toast,
    dismiss,
    toggleExpanded,
  };
}
