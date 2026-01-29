"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { palettes } from "@/lib/webgl/gradients";

// ============================================
// TYPES
// ============================================

export type ThemeMode = "light" | "dark" | "auto";
export type TimeOfDay = "dawn" | "morning" | "afternoon" | "evening" | "night";
export type WeatherCondition = "clear" | "cloudy" | "rainy" | "sunny";

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent1: string;
  accent2: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
}

export interface DynamicThemeState {
  /** Current theme mode */
  mode: ThemeMode;
  /** Resolved mode (light or dark, never auto) */
  resolvedMode: "light" | "dark";
  /** Time of day */
  timeOfDay: TimeOfDay;
  /** Weather condition (if available) */
  weather: WeatherCondition | null;
  /** User's custom accent color (if set) */
  userAccent: string | null;
  /** Current active colors */
  colors: ThemeColors;
  /** Current gradient palette */
  gradientPalette: string[];
  /** Whether dynamic theming is enabled */
  isDynamicEnabled: boolean;
}

export interface DynamicThemeContextValue extends DynamicThemeState {
  /** Set theme mode */
  setMode: (mode: ThemeMode) => void;
  /** Set user accent color */
  setUserAccent: (color: string | null) => void;
  /** Toggle dynamic theming (no-op — dynamic theming disabled for performance) */
  toggleDynamic: () => void;
  /** Force refresh time-based colors */
  refreshTimeColors: () => void;
  /** Set weather condition manually */
  setWeather: (weather: WeatherCondition | null) => void;
}

// ============================================
// STORAGE KEY
// ============================================

const STORAGE_KEY = "v7-theme-settings";

// ============================================
// COLOR DEFINITIONS
// ============================================

const BASE_COLORS = {
  light: {
    background: "#FFFFFF",
    surface: "#FFF9F5",
    text: "#111111",
    textMuted: "#666666",
  },
  dark: {
    background: "#0f0f0f",
    surface: "#1a1a1a",
    text: "#FFFFFF",
    textMuted: "#999999",
  },
} as const;

// Static brand colors (no time-of-day switching)
const BRAND_COLORS: Partial<ThemeColors> = {
  primary: "#A41034",
  secondary: "#EBCD00",
  accent1: "#52A52E",
  accent2: "#E87D1E",
};

// ============================================
// CONTEXT
// ============================================

const DynamicThemeContext = createContext<DynamicThemeContextValue | null>(null);

// ============================================
// UTILITIES
// ============================================

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function loadSettings(): Partial<{
  mode: ThemeMode;
  userAccent: string | null;
}> {
  if (typeof window === "undefined") return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveSettings(settings: {
  mode: ThemeMode;
  userAccent: string | null;
}): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings, isDynamicEnabled: false }));
  } catch {
    // Ignore storage errors
  }
}

// ============================================
// PROVIDER COMPONENT
// ============================================

export interface DynamicThemeProviderProps {
  children: ReactNode;
  /** Default theme mode */
  defaultMode?: ThemeMode;
  /** @deprecated Dynamic theming disabled for performance */
  defaultDynamicEnabled?: boolean;
  /** @deprecated Weather API disabled for performance */
  weatherApiUrl?: string;
}

export function DynamicThemeProvider({
  children,
  defaultMode = "light",
}: DynamicThemeProviderProps) {
  // State - use consistent defaults for SSR hydration
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);
  const [userAccent, setUserAccentState] = useState<string | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("afternoon");

  // Load saved settings AFTER mount to avoid hydration mismatch
  useEffect(() => {
    const savedSettings = loadSettings();
    if (savedSettings.mode) setModeState(savedSettings.mode);
    if (savedSettings.userAccent !== undefined) setUserAccentState(savedSettings.userAccent);
    // Set actual time of day on mount
    setTimeOfDay(getTimeOfDay());

    // Update time of day every minute to catch hour changes
    const interval = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Resolved mode (never "auto")
  const resolvedMode = useMemo((): "light" | "dark" => {
    if (mode === "auto") return getSystemTheme();
    return mode;
  }, [mode]);

  // Static brand colors (no time-based switching)
  const colors = useMemo((): ThemeColors => {
    const baseColors = BASE_COLORS[resolvedMode];
    return {
      ...baseColors,
      primary: userAccent ?? BRAND_COLORS.primary ?? "#A41034",
      secondary: BRAND_COLORS.secondary ?? "#EBCD00",
      accent1: BRAND_COLORS.accent1 ?? "#52A52E",
      accent2: BRAND_COLORS.accent2 ?? "#E87D1E",
    };
  }, [resolvedMode, userAccent]);

  // Dynamic gradient palette based on time of day
  const gradientPalette = useMemo((): string[] => {
    switch (timeOfDay) {
      case "dawn":
        return [...palettes.dawn];
      case "morning":
        return ["#FFF9F5", "#FFE8D6", "#EBCD00", "#FFD93D"];
      case "afternoon":
        return [...palettes.brand];
      case "evening":
        return [...palettes.sunset];
      case "night":
        return [...palettes.night];
      default:
        return [...palettes.brand];
    }
  }, [timeOfDay]);

  // Actions
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
  }, []);

  const setUserAccent = useCallback((color: string | null) => {
    setUserAccentState(color);
  }, []);

  // No-op: dynamic theming disabled for performance and consistency
  const toggleDynamic = useCallback(() => {}, []);

  const refreshTimeColors = useCallback(() => {
    setTimeOfDay(getTimeOfDay());
  }, []);

  // No-op: weather disabled for performance
  const setWeather = useCallback((_weather: WeatherCondition | null) => {}, []);

  // Save settings when they change
  useEffect(() => {
    saveSettings({ mode, userAccent });
  }, [mode, userAccent]);

  // Listen for system theme changes
  useEffect(() => {
    if (mode !== "auto") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      // Force re-render when system theme changes
      setModeState("auto");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mode]);

  // Apply CSS variables (static — no dynamic color updates)
  useEffect(() => {
    const root = document.documentElement;

    // Set mode attribute for CSS targeting
    root.setAttribute("data-theme", resolvedMode);
    root.setAttribute("data-time", timeOfDay);

    // Set CSS custom properties (static brand colors)
    root.style.setProperty("--theme-primary", colors.primary);
    root.style.setProperty("--theme-secondary", colors.secondary);
    root.style.setProperty("--theme-accent1", colors.accent1);
    root.style.setProperty("--theme-accent2", colors.accent2);
    root.style.setProperty("--theme-background", colors.background);
    root.style.setProperty("--theme-surface", colors.surface);
    root.style.setProperty("--theme-text", colors.text);
    root.style.setProperty("--theme-text-muted", colors.textMuted);
  }, [colors, resolvedMode, timeOfDay]);

  // No intervals, no weather polling — performance optimized

  // Context value
  const value = useMemo(
    (): DynamicThemeContextValue => ({
      mode,
      resolvedMode,
      timeOfDay,
      weather: null,
      userAccent,
      colors,
      gradientPalette,
      isDynamicEnabled: true,
      setMode,
      setUserAccent,
      toggleDynamic,
      refreshTimeColors,
      setWeather,
    }),
    [
      mode,
      resolvedMode,
      timeOfDay,
      userAccent,
      colors,
      gradientPalette,
      setMode,
      setUserAccent,
      toggleDynamic,
      refreshTimeColors,
      setWeather,
    ]
  );

  return (
    <DynamicThemeContext.Provider value={value}>
      {children}
    </DynamicThemeContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useDynamicTheme(): DynamicThemeContextValue {
  const context = useContext(DynamicThemeContext);

  if (!context) {
    throw new Error("useDynamicTheme must be used within a DynamicThemeProvider");
  }

  return context;
}

// ============================================
// CSS VARIABLE REFERENCE
// ============================================

/**
 * CSS variables set by DynamicThemeProvider:
 *
 * --theme-primary: Primary brand color (static)
 * --theme-secondary: Secondary brand color (static)
 * --theme-accent1: First accent color (static)
 * --theme-accent2: Second accent color (static)
 * --theme-background: Page background
 * --theme-surface: Card/surface background
 * --theme-text: Primary text color
 * --theme-text-muted: Secondary text color
 *
 * Data attributes:
 * data-theme="light" | "dark"
 * data-time="dawn" | "morning" | "afternoon" | "evening" | "night"
 *
 * Note: Dynamic theming (time-based colors, weather, gradient palettes) is disabled
 * for performance and consistency. Colors use static brand values.
 */
export const themeVariables = {
  primary: "var(--theme-primary)",
  secondary: "var(--theme-secondary)",
  accent1: "var(--theme-accent1)",
  accent2: "var(--theme-accent2)",
  background: "var(--theme-background)",
  surface: "var(--theme-surface)",
  text: "var(--theme-text)",
  textMuted: "var(--theme-text-muted)",
} as const;
