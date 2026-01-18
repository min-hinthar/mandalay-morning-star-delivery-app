import * as React from "react";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000;

type ToastVariant = "default" | "destructive" | "success" | "warning";

export type Toast = {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastAction =
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "UPDATE_TOAST"; toast: Partial<Toast> & { id: string } }
  | { type: "DISMISS_TOAST"; id: string }
  | { type: "REMOVE_TOAST"; id: string };

interface ToastState {
  toasts: Toast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function genId() {
  return Math.random().toString(36).substring(2, 9);
}

function addToRemoveQueue(id: string, dispatch: React.Dispatch<ToastAction>) {
  if (toastTimeouts.has(id)) return;

  const timeout = setTimeout(() => {
    toastTimeouts.delete(id);
    dispatch({ type: "REMOVE_TOAST", id });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(id, timeout);
}

const reducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
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

    default:
      return state;
  }
};

const listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [] };

function dispatch(action: ToastAction) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

function toast(options: ToastOptions) {
  const id = genId();

  dispatch({
    type: "ADD_TOAST",
    toast: { id, ...options },
  });

  // Auto-dismiss
  addToRemoveQueue(id, dispatch);

  return {
    id,
    dismiss: () => dispatch({ type: "DISMISS_TOAST", id }),
    update: (props: ToastOptions) =>
      dispatch({ type: "UPDATE_TOAST", toast: { id, ...props } }),
  };
}

function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (id: string) => dispatch({ type: "DISMISS_TOAST", id }),
  };
}

export { useToast, toast };
