"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface DriverContrastContextValue {
  /** Whether high contrast mode is enabled */
  isHighContrast: boolean;
  /** Toggle high contrast mode */
  toggleContrast: () => void;
  /** Set high contrast mode explicitly */
  setHighContrast: (enabled: boolean) => void;
}

const DriverContrastContext = createContext<DriverContrastContextValue | null>(null);

const STORAGE_KEY = "driver-high-contrast";

interface DriverContrastProviderProps {
  children: ReactNode;
}

/**
 * Provider for driver high-contrast mode
 *
 * Features:
 * - 7:1 contrast ratio in high-contrast mode
 * - 48px minimum touch targets
 * - Bolder typography weights
 * - Persists preference in localStorage
 */
export function DriverContrastProvider({ children }: DriverContrastProviderProps) {
  const [isHighContrast, setIsHighContrastState] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load preference from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") {
      setIsHighContrastState(true);
    }
    setIsHydrated(true);
  }, []);

  // Update document attribute and localStorage when state changes
  useEffect(() => {
    if (!isHydrated) return;

    if (isHighContrast) {
      document.documentElement.setAttribute("data-contrast", "high");
      localStorage.setItem(STORAGE_KEY, "true");
    } else {
      document.documentElement.removeAttribute("data-contrast");
      localStorage.setItem(STORAGE_KEY, "false");
    }
  }, [isHighContrast, isHydrated]);

  const toggleContrast = useCallback(() => {
    setIsHighContrastState((prev) => !prev);
  }, []);

  const setHighContrast = useCallback((enabled: boolean) => {
    setIsHighContrastState(enabled);
  }, []);

  return (
    <DriverContrastContext.Provider
      value={{
        isHighContrast,
        toggleContrast,
        setHighContrast,
      }}
    >
      {children}
    </DriverContrastContext.Provider>
  );
}

/**
 * Hook to access driver contrast mode
 *
 * @example
 * ```tsx
 * function DriverHeader() {
 *   const { isHighContrast, toggleContrast } = useDriverContrast();
 *
 *   return (
 *     <button onClick={toggleContrast}>
 *       {isHighContrast ? "◐" : "☀️"}
 *     </button>
 *   );
 * }
 * ```
 */
export function useDriverContrast(): DriverContrastContextValue {
  const context = useContext(DriverContrastContext);

  if (!context) {
    throw new Error(
      "useDriverContrast must be used within a DriverContrastProvider"
    );
  }

  return context;
}
