"use client";

import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  X,
  Star,
  TrendingUp,
  Sparkles,
  Utensils,
  Crown,
  Heart,
  Flame,
  Zap,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ICONS = [
  { id: "star", icon: Star, label: "Star" },
  { id: "trending-up", icon: TrendingUp, label: "Trending" },
  { id: "sparkles", icon: Sparkles, label: "Sparkles" },
  { id: "utensils", icon: Utensils, label: "Utensils" },
  { id: "crown", icon: Crown, label: "Crown" },
  { id: "heart", icon: Heart, label: "Heart" },
  { id: "flame", icon: Flame, label: "Flame" },
  { id: "zap", icon: Zap, label: "Zap" },
];

const PRESET_COLORS = [
  "#C73E1D", // Primary red
  "#E88D67", // Secondary coral
  "#10B981", // Green
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#6366F1", // Indigo
];

export interface SectionEditorSection {
  id?: string;
  name: string;
  subtitle: string | null;
  icon: string | null;
  accentColor: string | null;
  itemCount: number;
  isVisible: boolean;
  isPredefined?: boolean;
  updatedAt?: string;
  updatedBy?: string | null;
}

interface SectionEditorProps {
  section: SectionEditorSection | null;
  onSave: (data: Omit<SectionEditorSection, "id" | "isPredefined" | "updatedAt" | "updatedBy">) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SectionEditor({
  section,
  onSave,
  onCancel,
  isLoading = false,
}: SectionEditorProps) {
  const isEditing = !!section?.id;

  const [name, setName] = useState(section?.name || "");
  const [subtitle, setSubtitle] = useState(section?.subtitle || "");
  const [icon, setIcon] = useState(section?.icon || "star");
  const [accentColor, setAccentColor] = useState(section?.accentColor || PRESET_COLORS[0]);
  const [customColor, setCustomColor] = useState("");
  const [itemCount, setItemCount] = useState(section?.itemCount || 6);
  const [isVisible, setIsVisible] = useState(section?.isVisible ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (section) {
      setName(section.name || "");
      setSubtitle(section.subtitle || "");
      setIcon(section.icon || "star");
      setAccentColor(section.accentColor || PRESET_COLORS[0]);
      setItemCount(section.itemCount || 6);
      setIsVisible(section.isVisible ?? true);
    }
  }, [section]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = "Name is required";
    }
    if (name.length > 200) {
      newErrors.name = "Name must be 200 characters or less";
    }
    if (subtitle && subtitle.length > 500) {
      newErrors.subtitle = "Subtitle must be 500 characters or less";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      name: name.trim(),
      subtitle: subtitle.trim() || null,
      icon,
      accentColor,
      itemCount,
      isVisible,
    });
  };

  const handleColorSelect = (color: string) => {
    setAccentColor(color);
    setCustomColor("");
  };

  const handleCustomColorChange = (value: string) => {
    setCustomColor(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setAccentColor(value);
    }
  };

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-surface-inverse/50 p-4"
        onClick={(e) => e.target === e.currentTarget && onCancel()}
      >
        <m.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-surface-primary rounded-card-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-display font-bold text-text-primary">
              {isEditing ? "Edit Section" : "Create Section"}
            </h2>
            <Button variant="ghost" size="sm" onClick={onCancel} className="p-1">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-body font-medium text-text-primary mb-1">
                Name <span className="text-status-error">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                }}
                placeholder="e.g., Chef's Specials"
                className={cn(errors.name && "border-status-error")}
              />
              {errors.name && (
                <p className="text-xs text-status-error mt-1">{errors.name}</p>
              )}
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-sm font-body font-medium text-text-primary mb-1">
                Subtitle
              </label>
              <Input
                value={subtitle}
                onChange={(e) => {
                  setSubtitle(e.target.value);
                  if (errors.subtitle) setErrors((prev) => ({ ...prev, subtitle: "" }));
                }}
                placeholder="e.g., Our most loved dishes"
              />
              {errors.subtitle && (
                <p className="text-xs text-status-error mt-1">{errors.subtitle}</p>
              )}
            </div>

            {/* Icon Selector */}
            <div>
              <label className="block text-sm font-body font-medium text-text-primary mb-2">
                Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map((iconItem) => {
                  const Icon = iconItem.icon;
                  return (
                    <button
                      key={iconItem.id}
                      type="button"
                      onClick={() => setIcon(iconItem.id)}
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-lg border-2",
                        "transition-all duration-fast",
                        icon === iconItem.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-surface-secondary text-text-muted hover:border-primary/30"
                      )}
                      title={iconItem.label}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-body font-medium text-text-primary mb-2">
                Accent Color
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={cn(
                      "w-8 h-8 rounded-lg border-2 transition-all duration-fast",
                      "flex items-center justify-center",
                      accentColor === color
                        ? "border-text-primary scale-110"
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                  >
                    {accentColor === color && (
                      <Check className="h-4 w-4 text-text-inverse" />
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={customColor}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  placeholder="#RRGGBB"
                  className="flex-1 font-mono text-sm"
                  maxLength={7}
                />
                {accentColor && (
                  <div
                    className="w-10 h-10 rounded-lg border border-border"
                    style={{ backgroundColor: accentColor }}
                  />
                )}
              </div>
            </div>

            {/* Item Count Slider */}
            <div>
              <label className="block text-sm font-body font-medium text-text-primary mb-2">
                Display Limit: {itemCount} items
              </label>
              <input
                type="range"
                min={1}
                max={20}
                value={itemCount}
                onChange={(e) => setItemCount(parseInt(e.target.value))}
                className="w-full h-2 bg-surface-tertiary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs font-body text-text-muted mt-1">
                <span>1</span>
                <span>20</span>
              </div>
            </div>

            {/* Visibility Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-body font-medium text-text-primary">
                Visible on Homepage
              </label>
              <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className={cn(
                  "relative w-12 h-6 rounded-full transition-colors duration-fast",
                  isVisible ? "bg-green" : "bg-surface-tertiary"
                )}
              >
                <m.div
                  className="absolute top-1 w-4 h-4 bg-surface-primary rounded-full shadow-sm"
                  animate={{ left: isVisible ? 28 : 4 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Last Updated */}
            {isEditing && section?.updatedAt && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs font-body text-text-muted">
                  Last updated: {new Date(section.updatedAt).toLocaleString()}
                </p>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !name.trim()}
              className="bg-primary hover:bg-primary-hover text-text-inverse"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <m.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Saving...
                </span>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Section"
              )}
            </Button>
          </div>
        </m.div>
      </m.div>
    </AnimatePresence>
  );
}
