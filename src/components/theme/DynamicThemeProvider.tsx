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
import { v7Palettes, getTimeOfDayPalette } from "@/lib/webgl/gradients";

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
  /** Toggle dynamic theming */
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

const TIME_COLORS: Record<TimeOfDay, Partial<ThemeColors>> = {
  dawn: {
    primary: "#FFB5A7",
    secondary: "#F4ACB7",
    accent1: "#FFCAD4",
    accent2: "#FFE5D9",
  },
  morning: {
    primary: "#EBCD00",
    secondary: "#FFD93D",
    accent1: "#FFE8D6",
    accent2: "#FFF9F5",
  },
  afternoon: {
    primary: "#A41034",
    secondary: "#EBCD00",
    accent1: "#52A52E",
    accent2: "#E87D1E",
  },
  evening: {
    primary: "#FF6B6B",
    secondary: "#FFA07A",
    accent1: "#FFD93D",
    accent2: "#FF8C00",
  },
  night: {
    primary: "#4ECDC4",
    secondary: "#45B7D1",
    accent1: "#00979D",
    accent2: "#96CEB4",
  },
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
  isDynamicEnabled: boolean;
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
  isDynamicEnabled: boolean;
}): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
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
  /** Whether to enable dynamic theming by default */
  defaultDynamicEnabled?: boolean;
  /** Weather API endpoint (optional) */
  weatherApiUrl?: string;
}

export function DynamicThemeProvider({
  children,
  defaultMode = "light",
  defaultDynamicEnabled = true,
  weatherApiUrl,
}: DynamicThemeProviderProps) {
  // Load saved settings
  const savedSettings = useMemo(() => loadSettings(), []);

  // State
  const [mode, setModeState] = useState<ThemeMode>(savedSettings.mode ?? defaultMode);
  const [userAccent, setUserAccentState] = useState<string | null>(
    savedSettings.userAccent ?? null
  );
  const [isDynamicEnabled, setIsDynamicEnabled] = useState(
    savedSettings.isDynamicEnabled ?? defaultDynamicEnabled
  );
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay);
  const [weather, setWeatherState] = useState<WeatherCondition | null>(null);

  // Resolved mode (never "auto")
  const resolvedMode = useMemo((): "light" | "dark" => {
    if (mode === "auto") return getSystemTheme();
    return mode;
  }, [mode]);

  // Current colors
  const colors = useMemo((): ThemeColors => {
    const baseColors = BASE_COLORS[resolvedMode];
    const timeColors = isDynamicEnabled ? TIME_COLORS[timeOfDay] : TIME_COLORS.afternoon;

    return {
      ...baseColors,
      primary: userAccent ?? timeColors.primary ?? "#A41034",
      secondary: timeColors.secondary ?? "#EBCD00",
      accent1: timeColors.accent1 ?? "#52A52E",
      accent2: timeColors.accent2 ?? "#E87D1E",
    };
  }, [resolvedMode, timeOfDay, userAccent, isDynamicEnabled]);

  // Gradient palette - timeOfDay triggers re-computation when period changes
  const gradientPalette = useMemo((): string[] => {
    if (!isDynamicEnabled) return [...v7Palettes.brand];
    return getTimeOfDayPalette();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- timeOfDay used as trigger
  }, [isDynamicEnabled, timeOfDay]);

  // Actions
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
  }, []);

  const setUserAccent = useCallback((color: string | null) => {
    setUserAccentState(color);
  }, []);

  const toggleDynamic = useCallback(() => {
    setIsDynamicEnabled((prev) => !prev);
  }, []);

  const refreshTimeColors = useCallback(() => {
    setTimeOfDay(getTimeOfDay());
  }, []);

  const setWeather = useCallback((newWeather: WeatherCondition | null) => {
    setWeatherState(newWeather);
  }, []);

  // Save settings when they change
  useEffect(() => {
    saveSettings({ mode, userAccent, isDynamicEnabled });
  }, [mode, userAccent, isDynamicEnabled]);

  // Update time of day periodically
  useEffect(() => {
    if (!isDynamicEnabled) return;

    const interval = setInterval(() => {
      const newTimeOfDay = getTimeOfDay();
      if (newTimeOfDay !== timeOfDay) {
        setTimeOfDay(newTimeOfDay);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isDynamicEnabled, timeOfDay]);

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

  // Apply CSS variables
  useEffect(() => {
    const root = document.documentElement;

    // Set mode attribute for CSS targeting
    root.setAttribute("data-theme", resolvedMode);
    root.setAttribute("data-time", timeOfDay);

    // Set CSS custom properties
    root.style.setProperty("--theme-primary", colors.primary);
    root.style.setProperty("--theme-secondary", colors.secondary);
    root.style.setProperty("--theme-accent1", colors.accent1);
    root.style.setProperty("--theme-accent2", colors.accent2);
    root.style.setProperty("--theme-background", colors.background);
    root.style.setProperty("--theme-surface", colors.surface);
    root.style.setProperty("--theme-text", colors.text);
    root.style.setProperty("--theme-text-muted", colors.textMuted);

    // Set gradient palette
    gradientPalette.forEach((color, index) => {
      root.style.setProperty(`--gradient-color-${index + 1}`, color);
    });
  }, [colors, gradientPalette, resolvedMode, timeOfDay]);

  // Fetch weather if API provided
  useEffect(() => {
    if (!weatherApiUrl || !isDynamicEnabled) return;

    const fetchWeather = async () => {
      try {
        const response = await fetch(weatherApiUrl);
        const data = await response.json();
        // Map API response to our weather conditions
        // This is a placeholder - actual mapping depends on API
        if (data.condition) {
          setWeatherState(data.condition as WeatherCondition);
        }
      } catch {
        // Ignore weather fetch errors
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000); // Refresh every 30 min

    return () => clearInterval(interval);
  }, [weatherApiUrl, isDynamicEnabled]);

  // Context value
  const value = useMemo(
    (): DynamicThemeContextValue => ({
      mode,
      resolvedMode,
      timeOfDay,
      weather,
      userAccent,
      colors,
      gradientPalette,
      isDynamicEnabled,
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
      weather,
      userAccent,
      colors,
      gradientPalette,
      isDynamicEnabled,
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
 * --theme-primary: Primary brand color (changes with time/user)
 * --theme-secondary: Secondary brand color
 * --theme-accent1: First accent color
 * --theme-accent2: Second accent color
 * --theme-background: Page background
 * --theme-surface: Card/surface background
 * --theme-text: Primary text color
 * --theme-text-muted: Secondary text color
 * --gradient-color-1 through --gradient-color-4: Gradient palette colors
 *
 * Data attributes:
 * data-theme="light" | "dark"
 * data-time="dawn" | "morning" | "afternoon" | "evening" | "night"
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
