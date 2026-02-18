"use client";

import { type Dispatch, type SetStateAction } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const ALLERGEN_OPTIONS = [
  "Gluten",
  "Dairy",
  "Nuts",
  "Peanuts",
  "Shellfish",
  "Soy",
  "Eggs",
  "Fish",
  "Sesame",
];

interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface MenuItemFormData {
  name_en: string;
  name_my: string;
  description_en: string;
  base_price_cents: number;
  category_id: string;
  is_active: boolean;
  is_sold_out: boolean;
  allergens: string[];
  tags: string[];
  image_url: string | null;
}

interface MenuItemFormFieldsProps {
  formData: MenuItemFormData;
  categories: Category[];
  onFormDataChange: Dispatch<SetStateAction<MenuItemFormData>>;
}

export function MenuItemFormFields({
  formData,
  categories,
  onFormDataChange,
}: MenuItemFormFieldsProps) {
  const toggleAllergen = (allergen: string) => {
    onFormDataChange((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter((a) => a !== allergen)
        : [...prev.allergens, allergen],
    }));
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-6"
    >
      {/* Basic Info */}
      <div className="bg-surface-secondary rounded-card-sm border border-border p-6 space-y-4">
        <h2 className="font-display font-semibold text-text-primary">Basic Info</h2>

        <div className="space-y-2">
          <label className="text-sm font-body font-medium text-text-secondary">
            Name (English) *
          </label>
          <Input
            value={formData.name_en}
            onChange={(e) => onFormDataChange((prev) => ({ ...prev, name_en: e.target.value }))}
            className="bg-surface-primary border-border"
            placeholder="Enter item name"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-body font-medium text-text-secondary">
            Name (Myanmar)
          </label>
          <Input
            value={formData.name_my}
            onChange={(e) => onFormDataChange((prev) => ({ ...prev, name_my: e.target.value }))}
            className="bg-surface-primary border-border"
            placeholder="Enter Myanmar name (optional)"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-body font-medium text-text-secondary">Description</label>
          <textarea
            value={formData.description_en}
            onChange={(e) =>
              onFormDataChange((prev) => ({ ...prev, description_en: e.target.value }))
            }
            rows={3}
            className={cn(
              "w-full px-3 py-2 rounded-input",
              "bg-surface-primary border border-border",
              "font-body text-text-primary",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            )}
            placeholder="Enter description (optional)"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-body font-medium text-text-secondary">Price (USD)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={(formData.base_price_cents / 100).toFixed(2)}
            onChange={(e) =>
              onFormDataChange((prev) => ({
                ...prev,
                base_price_cents: Math.round(parseFloat(e.target.value || "0") * 100),
              }))
            }
            className="bg-surface-primary border-border"
          />
        </div>

        {categories.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-body font-medium text-text-secondary">Category</label>
            <select
              value={formData.category_id}
              onChange={(e) =>
                onFormDataChange((prev) => ({ ...prev, category_id: e.target.value }))
              }
              className={cn(
                "w-full px-3 py-2 rounded-input",
                "bg-surface-primary border border-border",
                "font-body text-text-primary",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              )}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="bg-surface-secondary rounded-card-sm border border-border p-6 space-y-4">
        <h2 className="font-display font-semibold text-text-primary">Status</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-body font-medium text-text-primary">Active</p>
            <p className="text-sm font-body text-text-muted">Show item on menu</p>
          </div>
          <button
            type="button"
            onClick={() => onFormDataChange((prev) => ({ ...prev, is_active: !prev.is_active }))}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              formData.is_active ? "bg-green" : "bg-surface-tertiary"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-surface-primary transition-transform",
                formData.is_active ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-body font-medium text-text-primary">Sold Out</p>
            <p className="text-sm font-body text-text-muted">Mark as unavailable</p>
          </div>
          <button
            type="button"
            onClick={() =>
              onFormDataChange((prev) => ({ ...prev, is_sold_out: !prev.is_sold_out }))
            }
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              formData.is_sold_out ? "bg-secondary" : "bg-surface-tertiary"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-surface-primary transition-transform",
                formData.is_sold_out ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>
      </div>

      {/* Allergens */}
      <div className="bg-surface-secondary rounded-card-sm border border-border p-6 space-y-4">
        <h2 className="font-display font-semibold text-text-primary">Allergens</h2>
        <div className="flex flex-wrap gap-2">
          {ALLERGEN_OPTIONS.map((allergen) => (
            <Badge
              key={allergen}
              variant={formData.allergens.includes(allergen) ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-all",
                formData.allergens.includes(allergen)
                  ? "bg-primary text-text-inverse"
                  : "bg-surface-primary border-border hover:bg-primary/10"
              )}
              onClick={() => toggleAllergen(allergen)}
            >
              {allergen}
            </Badge>
          ))}
        </div>
      </div>
    </m.div>
  );
}
