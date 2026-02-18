"use client";

/**
 * CustomAllergyInput
 * Allows customers to add custom allergy chips via inline text input.
 * Max 5 custom items, 50 chars each. Chips are removable.
 */

import { useState, useRef } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const MAX_CUSTOM_ITEMS = 5;
const MAX_ITEM_LENGTH = 50;

interface CustomAllergyInputProps {
  customItems: string[];
  onChange: (items: string[]) => void;
}

export function CustomAllergyInput({ customItems, onChange }: CustomAllergyInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addItem = (raw: string) => {
    const trimmed = raw.trim();
    setValidationMsg(null);

    if (!trimmed) return;

    if (trimmed.length > MAX_ITEM_LENGTH) {
      setValidationMsg(`Max ${MAX_ITEM_LENGTH} characters`);
      return;
    }

    if (customItems.some((i) => i.toLowerCase() === trimmed.toLowerCase())) {
      setValidationMsg("Already added");
      return;
    }

    if (customItems.length >= MAX_CUSTOM_ITEMS) {
      setValidationMsg(`Max ${MAX_CUSTOM_ITEMS} custom items`);
      return;
    }

    onChange([...customItems, trimmed]);
    setInputValue("");
  };

  const removeItem = (index: number) => {
    onChange(customItems.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addItem(inputValue);
    }
    if (e.key === "Escape") {
      setIsAdding(false);
      setInputValue("");
      setValidationMsg(null);
    }
  };

  const handleAddClick = () => {
    if (customItems.length >= MAX_CUSTOM_ITEMS) {
      setValidationMsg(`Max ${MAX_CUSTOM_ITEMS} custom items`);
      return;
    }
    setIsAdding(true);
    setValidationMsg(null);
    // Focus input after render
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="space-y-2">
      {/* Custom chips */}
      {customItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customItems.map((item, index) => (
            <span
              key={item}
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1.5 rounded-pill text-sm font-medium",
                "border border-dashed border-amber-400 bg-amber-50 text-amber-800"
              )}
            >
              {item}
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="ml-0.5 p-0.5 rounded-full hover:bg-amber-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Remove ${item}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add input or button */}
      {isAdding ? (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setValidationMsg(null);
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputValue.trim()) {
                addItem(inputValue);
              }
              setIsAdding(false);
              setInputValue("");
            }}
            placeholder="Type allergy, press Enter"
            maxLength={MAX_ITEM_LENGTH}
            className={cn(
              "flex-1 px-3 py-1.5 text-sm rounded-pill",
              "border border-border bg-surface-primary",
              "placeholder:text-text-tertiary",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            )}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={handleAddClick}
          className={cn(
            "inline-flex items-center gap-1 px-3 py-1.5 rounded-pill text-sm font-medium",
            "border border-dashed border-border text-text-secondary",
            "hover:border-primary hover:text-primary transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          )}
        >
          <Plus className="h-3.5 w-3.5" />
          Add custom
        </button>
      )}

      {/* Validation feedback */}
      {validationMsg && <p className="text-xs text-status-warning">{validationMsg}</p>}
    </div>
  );
}
