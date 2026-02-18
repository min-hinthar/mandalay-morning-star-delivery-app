"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { CustomerSettings, DEFAULT_CUSTOMER_SETTINGS, DIETARY_OPTIONS } from "./settings-types";
interface UseCustomerSettingsReturn {
  settings: CustomerSettings | null;
  setSettings: React.Dispatch<React.SetStateAction<CustomerSettings | null>>;
  isLoading: boolean;
  isSaving: boolean;
  hasChanges: boolean;
  error: string | null;
  save: () => Promise<void>;
  discard: () => void;
  updateField: <K extends keyof CustomerSettings>(key: K, value: CustomerSettings[K]) => void;
}

/** Known predefined dietary options set for splitting */
const PREDEFINED_SET = new Set<string>(DIETARY_OPTIONS as readonly string[]);

/**
 * Splits a flat dietary_restrictions array from the API into
 * predefined dietaryRestrictions and custom customAllergies.
 */
function splitDietaryRestrictions(restrictions: string[]): {
  dietaryRestrictions: string[];
  customAllergies: string[];
} {
  const dietaryRestrictions: string[] = [];
  const customAllergies: string[] = [];
  for (const item of restrictions) {
    if (PREDEFINED_SET.has(item)) {
      dietaryRestrictions.push(item);
    } else {
      customAllergies.push(item);
    }
  }
  return { dietaryRestrictions, customAllergies };
}

/**
 * Converts camelCase settings keys to snake_case for the API.
 */
function toSnakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function useCustomerSettings(): UseCustomerSettingsReturn {
  const [settings, setSettings] = useState<CustomerSettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<CustomerSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchSettings() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/account/settings");
        if (!response.ok) {
          throw new Error("Failed to fetch settings");
        }

        const json = await response.json();
        const data = json.data;

        // API returns flat dietary_restrictions — split into predefined vs custom
        const rawRestrictions: string[] = data.dietaryRestrictions ?? [];
        const { dietaryRestrictions, customAllergies } = splitDietaryRestrictions(rawRestrictions);

        const parsed: CustomerSettings = {
          dietaryRestrictions,
          customAllergies,
          deliveryInstructions: data.deliveryInstructions ?? "",
          notificationPrefs: data.notificationPrefs ?? DEFAULT_CUSTOMER_SETTINGS.notificationPrefs,
          theme: data.theme ?? "system",
        };

        if (!cancelled) {
          setSettings(parsed);
          setOriginalSettings(parsed);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch settings");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  // Deep compare settings vs original to detect changes
  const hasChanges = useMemo(() => {
    if (!settings || !originalSettings) return false;
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  }, [settings, originalSettings]);

  const updateField = useCallback(
    <K extends keyof CustomerSettings>(key: K, value: CustomerSettings[K]) => {
      setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    },
    []
  );

  const save = useCallback(async () => {
    if (!settings || !originalSettings) return;

    try {
      setIsSaving(true);
      setError(null);

      // Build partial payload with only changed fields
      const payload: Record<string, unknown> = {};

      // Check each field for changes
      const keys = Object.keys(settings) as (keyof CustomerSettings)[];
      for (const key of keys) {
        if (JSON.stringify(settings[key]) !== JSON.stringify(originalSettings[key])) {
          // Special handling: merge dietaryRestrictions + customAllergies into one API field
          if (key === "dietaryRestrictions" || key === "customAllergies") {
            // Only add once
            if (!payload.dietary_restrictions) {
              payload.dietary_restrictions = [
                ...settings.dietaryRestrictions,
                ...settings.customAllergies,
              ];
            }
          } else {
            // Convert key to snake_case for API
            const snakeKey = toSnakeCase(key);
            payload[snakeKey] = settings[key];
          }
        }
      }

      const response = await fetch("/api/account/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error?.message ?? "Failed to save settings");
      }

      // On success, update originalSettings to match current
      setOriginalSettings({ ...settings });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }, [settings, originalSettings]);

  const discard = useCallback(() => {
    if (originalSettings) {
      setSettings({ ...originalSettings });
    }
  }, [originalSettings]);

  return {
    settings,
    setSettings,
    isLoading,
    isSaving,
    hasChanges,
    error,
    save,
    discard,
    updateField,
  };
}
