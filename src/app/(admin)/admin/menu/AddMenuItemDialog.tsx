"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Loader2, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/hooks/useToastV8";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const ALLERGEN_OPTIONS = [
  { value: "peanuts", label: "Peanuts" },
  { value: "tree_nuts", label: "Tree Nuts" },
  { value: "egg", label: "Egg" },
  { value: "shellfish", label: "Shellfish" },
  { value: "fish", label: "Fish" },
  { value: "soy", label: "Soy" },
  { value: "gluten_wheat", label: "Gluten/Wheat" },
  { value: "sesame", label: "Sesame" },
  { value: "dairy", label: "Dairy" },
];

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface AddMenuItemDialogProps {
  categories: Category[];
  onItemCreated: () => void;
}

interface FormData {
  name_en: string;
  name_my: string;
  description_en: string;
  base_price_cents: number;
  category_id: string;
  slug: string;
  is_active: boolean;
  is_sold_out: boolean;
  allergens: string[];
  tags: string[];
}

const INITIAL_FORM: FormData = {
  name_en: "",
  name_my: "",
  description_en: "",
  base_price_cents: 0,
  category_id: "",
  slug: "",
  is_active: true,
  is_sold_out: false,
  allergens: [],
  tags: [],
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function AddMenuItemDialog({ categories, onItemCreated }: AddMenuItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [creating, setCreating] = useState(false);
  const [priceDisplay, setPriceDisplay] = useState("0.00");

  // Set default category when categories load
  useEffect(() => {
    if (categories.length > 0 && !formData.category_id) {
      setFormData((prev) => ({ ...prev, category_id: categories[0].id }));
    }
  }, [categories, formData.category_id]);

  const resetForm = useCallback(() => {
    setFormData({
      ...INITIAL_FORM,
      category_id: categories.length > 0 ? categories[0].id : "",
    });
    setPriceDisplay("0.00");
  }, [categories]);

  const toggleAllergen = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(value)
        ? prev.allergens.filter((a) => a !== value)
        : [...prev.allergens, value],
    }));
  };

  const handleCreate = async () => {
    if (!formData.name_en.trim()) {
      toast({ message: "Item name is required", type: "error" });
      return;
    }
    if (!formData.category_id) {
      toast({ message: "Category is required", type: "error" });
      return;
    }
    if (formData.base_price_cents <= 0) {
      toast({ message: "Price must be greater than zero", type: "error" });
      return;
    }

    const slug = formData.slug.trim() || generateSlug(formData.name_en);
    if (!slug) {
      toast({ message: "Slug is required", type: "error" });
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name_en: formData.name_en.trim(),
          name_my: formData.name_my.trim() || null,
          description_en: formData.description_en.trim() || null,
          base_price_cents: formData.base_price_cents,
          category_id: formData.category_id,
          slug,
          is_active: formData.is_active,
          is_sold_out: formData.is_sold_out,
          allergens: formData.allergens,
          tags: formData.tags,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create menu item");
      }

      toast({
        message: `"${formData.name_en}" created successfully`,
        type: "success",
      });
      resetForm();
      setOpen(false);
      onItemCreated();
    } catch (err) {
      toast({
        message: err instanceof Error ? err.message : "Failed to create menu item",
        type: "error",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary-hover text-text-inverse shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px] bg-surface-primary border-border rounded-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl text-text-primary">
            <div className="p-2 rounded-input bg-primary text-text-inverse">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            Add Menu Item
          </DialogTitle>
          <DialogDescription className="font-body text-text-secondary">
            Create a new menu item. Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name (English) */}
          <div className="space-y-2">
            <Label
              htmlFor="add-name-en"
              className="text-sm font-body font-medium text-text-primary"
            >
              Name (English) *
            </Label>
            <Input
              id="add-name-en"
              placeholder="e.g., Mohinga"
              value={formData.name_en}
              onChange={(e) => {
                const name = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  name_en: name,
                  slug: generateSlug(name),
                }));
              }}
              className="bg-surface-primary border-border focus:border-primary focus-visible:ring-primary/20 rounded-input"
            />
          </div>

          {/* Name (Myanmar) */}
          <div className="space-y-2">
            <Label
              htmlFor="add-name-my"
              className="text-sm font-body font-medium text-text-primary"
            >
              Name (Myanmar)
            </Label>
            <Input
              id="add-name-my"
              placeholder="Optional"
              value={formData.name_my}
              onChange={(e) => setFormData((prev) => ({ ...prev, name_my: e.target.value }))}
              className="bg-surface-primary border-border focus:border-primary focus-visible:ring-primary/20 rounded-input"
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="add-slug" className="text-sm font-body font-medium text-text-primary">
              Slug
            </Label>
            <Input
              id="add-slug"
              placeholder="auto-generated-from-name"
              value={formData.slug}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                }))
              }
              className="bg-surface-primary border-border focus:border-primary focus-visible:ring-primary/20 rounded-input font-mono"
            />
            <p className="text-xs font-body text-text-muted">
              URL-friendly identifier. Auto-generated from name.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label
              htmlFor="add-description"
              className="text-sm font-body font-medium text-text-primary"
            >
              Description
            </Label>
            <textarea
              id="add-description"
              value={formData.description_en}
              onChange={(e) => setFormData((prev) => ({ ...prev, description_en: e.target.value }))}
              rows={3}
              className={cn(
                "w-full px-3 py-2 rounded-input text-sm",
                "bg-surface-primary border border-border",
                "font-body text-text-primary",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus:border-primary"
              )}
              placeholder="Optional description"
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="add-price" className="text-sm font-body font-medium text-text-primary">
              Price (USD) *
            </Label>
            <Input
              id="add-price"
              type="number"
              step="0.01"
              min="0"
              value={priceDisplay}
              onChange={(e) => {
                setPriceDisplay(e.target.value);
                setFormData((prev) => ({
                  ...prev,
                  base_price_cents: Math.round(parseFloat(e.target.value || "0") * 100),
                }));
              }}
              className="bg-surface-primary border-border focus:border-primary focus-visible:ring-primary/20 rounded-input"
            />
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-body font-medium text-text-primary">Category *</Label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, category_id: e.target.value }))}
                className={cn(
                  "w-full px-3 py-2 rounded-input text-sm",
                  "bg-surface-primary border border-border",
                  "font-body text-text-primary",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus:border-primary"
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

          {/* Status toggles */}
          <div className="bg-surface-secondary rounded-input border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-body font-medium text-text-primary">Active</p>
                <p className="text-xs font-body text-text-muted">Show on menu</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))}
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
                <p className="text-sm font-body font-medium text-text-primary">Sold Out</p>
                <p className="text-xs font-body text-text-muted">Mark as unavailable</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, is_sold_out: !prev.is_sold_out }))}
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
          <div className="space-y-2">
            <Label className="text-sm font-body font-medium text-text-primary">Allergens</Label>
            <div className="flex flex-wrap gap-2">
              {ALLERGEN_OPTIONS.map((allergen) => (
                <Badge
                  key={allergen.value}
                  variant={formData.allergens.includes(allergen.value) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all text-xs",
                    formData.allergens.includes(allergen.value)
                      ? "bg-primary text-text-inverse"
                      : "bg-surface-primary border-border hover:bg-primary/10"
                  )}
                  onClick={() => toggleAllergen(allergen.value)}
                >
                  {allergen.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-border hover:bg-surface-tertiary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="bg-primary hover:bg-primary-hover text-text-inverse shadow-sm"
          >
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
