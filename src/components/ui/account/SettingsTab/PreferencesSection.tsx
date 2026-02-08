"use client";

/**
 * PreferencesSection
 * Dietary restrictions (predefined chips + custom allergies) and
 * default delivery instructions textarea.
 */

import { DietaryChipPicker } from "./DietaryChipPicker";
import { CustomAllergyInput } from "./CustomAllergyInput";
import type { CustomerSettings } from "./settings-types";

interface PreferencesSectionProps {
  settings: CustomerSettings;
  updateField: <K extends keyof CustomerSettings>(
    key: K,
    value: CustomerSettings[K],
  ) => void;
}

export function PreferencesSection({
  settings,
  updateField,
}: PreferencesSectionProps) {
  const charCount = settings.deliveryInstructions.length;

  return (
    <div className="space-y-8">
      {/* Dietary Restrictions */}
      <section>
        <h3 className="text-base font-semibold text-text-primary">
          Dietary Restrictions
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          Select any that apply to you
        </p>

        <div className="mt-4 space-y-4">
          <DietaryChipPicker
            selected={settings.dietaryRestrictions}
            onChange={(items) => updateField("dietaryRestrictions", items)}
          />
          <CustomAllergyInput
            customItems={settings.customAllergies}
            onChange={(items) => updateField("customAllergies", items)}
          />
        </div>
      </section>

      {/* Divider */}
      <hr className="border-border" />

      {/* Delivery Instructions */}
      <section>
        <h3 className="text-base font-semibold text-text-primary">
          Default Delivery Instructions
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          Added to every order automatically
        </p>

        <div className="mt-4">
          <textarea
            value={settings.deliveryInstructions}
            onChange={(e) =>
              updateField("deliveryInstructions", e.target.value)
            }
            maxLength={500}
            rows={3}
            placeholder="e.g. Leave at door, Ring doorbell twice"
            className="w-full rounded-card-sm border border-border bg-surface-primary px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
          />
          <p className="mt-1 text-right text-xs text-text-tertiary">
            {charCount}/500
          </p>
        </div>
      </section>
    </div>
  );
}
