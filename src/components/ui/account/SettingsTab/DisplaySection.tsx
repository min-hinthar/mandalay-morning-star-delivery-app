"use client";

/**
 * DisplaySection — Display preferences sub-tab.
 * Theme selector, font size, reduce-animations toggle, sound-effects toggle.
 * All prefs persist to localStorage. Theme also syncs to DB via onThemeChange.
 */

import { ThemeSelector } from "./ThemeSelector";
import { FontSizeSelector } from "./FontSizeSelector";
import { ToggleSwitch } from "@/components/ui/admin/settings/ToggleSwitch";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useSoundPreference } from "@/lib/hooks/useSoundPreference";

interface DisplaySectionProps {
  onThemeChange?: (theme: string) => void;
}

export function DisplaySection({ onThemeChange }: DisplaySectionProps) {
  const { preference, setPreference } = useAnimationPreference();
  const { isEnabled, setEnabled } = useSoundPreference();

  return (
    <div className="space-y-6">
      {/* Theme */}
      <section className="rounded-card bg-surface-primary p-5">
        <h3 className="text-base font-semibold text-text-primary">Theme</h3>
        <p className="mt-1 mb-4 text-sm text-text-secondary">
          Choose your preferred color scheme
        </p>
        <ThemeSelector onThemeChange={onThemeChange} />
      </section>

      {/* Font Size */}
      <section className="rounded-card bg-surface-primary p-5">
        <h3 className="text-base font-semibold text-text-primary">
          Font Size
        </h3>
        <p className="mt-1 mb-4 text-sm text-text-secondary">
          Adjust text size for readability
        </p>
        <FontSizeSelector />
      </section>

      {/* Animations */}
      <section className="rounded-card bg-surface-primary p-5">
        <h3 className="text-base font-semibold text-text-primary">
          Animations
        </h3>
        <p className="mt-1 mb-3 text-sm text-text-secondary">
          Control motion effects throughout the app
        </p>
        <ToggleSwitch
          id="reduce-animations"
          checked={preference !== "full"}
          onChange={(checked) =>
            setPreference(checked ? "reduced" : "full")
          }
          label="Reduce animations"
        />
      </section>

      {/* Sound Effects */}
      <section className="rounded-card bg-surface-primary p-5">
        <h3 className="text-base font-semibold text-text-primary">
          Sound Effects
        </h3>
        <p className="mt-1 mb-3 text-sm text-text-secondary">
          Toggle interaction sounds
        </p>
        <ToggleSwitch
          id="sound-effects"
          checked={isEnabled}
          onChange={setEnabled}
          label="Sound effects"
        />
      </section>
    </div>
  );
}
