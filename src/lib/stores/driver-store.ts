import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface LocationState {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

interface PendingAction {
  id: string;
  type: "status_update" | "photo_upload" | "exception";
  stopId: string;
  routeId: string;
  data: Record<string, unknown>;
  createdAt: string;
}

interface DriverState {
  // Current route state
  currentRouteId: string | null;
  currentStopIndex: number;

  // Location tracking
  isTrackingLocation: boolean;
  lastLocation: LocationState | null;

  // Offline queue
  pendingActions: PendingAction[];

  // UI state
  isOnline: boolean;

  // Actions
  setCurrentRoute: (routeId: string | null) => void;
  setCurrentStopIndex: (index: number) => void;
  setTrackingEnabled: (enabled: boolean) => void;
  setLocation: (location: LocationState) => void;
  setOnlineStatus: (isOnline: boolean) => void;

  // Offline queue actions
  addPendingAction: (action: Omit<PendingAction, "id" | "createdAt">) => void;
  removePendingAction: (id: string) => void;
  clearPendingActions: () => void;

  // Reset
  resetDriverState: () => void;
}

const initialState = {
  currentRouteId: null,
  currentStopIndex: 0,
  isTrackingLocation: false,
  lastLocation: null,
  pendingActions: [],
  isOnline: true,
};

const createMemoryStorage = (): Storage => {
  const store = new Map<string, string>();

  return {
    getItem: (name) => store.get(name) ?? null,
    setItem: (name, value) => {
      store.set(name, value);
    },
    removeItem: (name) => {
      store.delete(name);
    },
    clear: () => {
      store.clear();
    },
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
};

const getStorage = (): Storage => {
  if (typeof window === "undefined") {
    return createMemoryStorage();
  }

  const storage = window.localStorage;
  if (
    !storage ||
    typeof storage.getItem !== "function" ||
    typeof storage.setItem !== "function"
  ) {
    return createMemoryStorage();
  }

  return storage;
};

export const useDriverStore = create<DriverState>()(
  persist(
    (set) => ({
      ...initialState,

      setCurrentRoute: (routeId) => {
        set({ currentRouteId: routeId });
      },

      setCurrentStopIndex: (index) => {
        set({ currentStopIndex: index });
      },

      setTrackingEnabled: (enabled) => {
        set({ isTrackingLocation: enabled });
      },

      setLocation: (location) => {
        set({ lastLocation: location });
      },

      setOnlineStatus: (isOnline) => {
        set({ isOnline });
      },

      addPendingAction: (action) => {
        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        set((state) => ({
          pendingActions: [
            ...state.pendingActions,
            { ...action, id, createdAt },
          ],
        }));
      },

      removePendingAction: (id) => {
        set((state) => ({
          pendingActions: state.pendingActions.filter((a) => a.id !== id),
        }));
      },

      clearPendingActions: () => {
        set({ pendingActions: [] });
      },

      resetDriverState: () => {
        set(initialState);
      },
    }),
    {
      name: "mms-driver",
      storage: createJSONStorage(getStorage),
      partialize: (state) => ({
        currentRouteId: state.currentRouteId,
        currentStopIndex: state.currentStopIndex,
        lastLocation: state.lastLocation,
        pendingActions: state.pendingActions,
      }),
    }
  )
);
