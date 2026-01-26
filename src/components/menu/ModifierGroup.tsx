"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatPrice } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import type { ModifierGroup as ModifierGroupType, ModifierOption } from "@/types/menu";

interface ModifierGroupProps {
  group: ModifierGroupType;
  selectedOptions: string[];
  onSelect: (optionId: string, option: ModifierOption) => void;
  onDeselect: (optionId: string) => void;
}

export function ModifierGroup({
  group,
  selectedOptions,
  onSelect,
  onDeselect,
}: ModifierGroupProps) {
  const isRequired = group.minSelect > 0;
  const isSingle = group.selectionType === "single";

  const selectionHint = (() => {
    if (group.maxSelect <= 1) return null;
    if (group.minSelect === group.maxSelect) {
      return `Select ${group.minSelect}`;
    }
    return `Select ${group.minSelect}-${group.maxSelect}`;
  })();

  return (
    <div className="py-4 border-b border-border last:border-0">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h4 className="font-medium text-foreground">{group.name}</h4>
          {selectionHint && (
            <p className="text-sm text-muted-foreground">{selectionHint}</p>
          )}
        </div>
        {isRequired && (
          <Badge
            variant="outline"
            className="border-brand-red text-brand-red"
          >
            Required
          </Badge>
        )}
      </div>

      {isSingle ? (
        <RadioGroup
          value={selectedOptions[0] ?? ""}
          onValueChange={(value) => {
            const option = group.options.find((opt) => opt.id === value);
            if (option) {
              onSelect(value, option);
            }
          }}
          className="space-y-2"
        >
          {group.options.map((option) => (
            <div
              key={option.id}
              className={cn(
                "flex items-center justify-between rounded-lg border p-3",
                selectedOptions.includes(option.id)
                  ? "border-brand-red bg-brand-red/5"
                  : "border-border hover:border-muted-foreground/50"
              )}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id} className="cursor-pointer font-normal">
                  {option.name}
                </Label>
              </div>
              {option.priceDeltaCents !== 0 && (
                <span
                  className={cn(
                    "text-sm",
                    option.priceDeltaCents > 0
                      ? "text-muted-foreground"
                      : "text-brand-green"
                  )}
                >
                  {option.priceDeltaCents > 0 ? "+" : ""}
                  {formatPrice(option.priceDeltaCents)}
                </span>
              )}
            </div>
          ))}
        </RadioGroup>
      ) : (
        <div className="space-y-2">
          {group.options.map((option) => {
            const isChecked = selectedOptions.includes(option.id);
            const canSelectMore = selectedOptions.length < group.maxSelect;

            return (
              <div
                key={option.id}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-3",
                  isChecked
                    ? "border-brand-red bg-brand-red/5"
                    : "border-border hover:border-muted-foreground/50",
                  !canSelectMore && !isChecked && "opacity-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={option.id}
                    checked={isChecked}
                    disabled={!canSelectMore && !isChecked}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onSelect(option.id, option);
                      } else {
                        onDeselect(option.id);
                      }
                    }}
                  />
                  <Label
                    htmlFor={option.id}
                    className={cn(
                      "cursor-pointer font-normal",
                      !canSelectMore && !isChecked && "cursor-not-allowed"
                    )}
                  >
                    {option.name}
                  </Label>
                </div>
                {option.priceDeltaCents !== 0 && (
                  <span
                    className={cn(
                      "text-sm",
                      option.priceDeltaCents > 0
                        ? "text-muted-foreground"
                        : "text-brand-green"
                    )}
                  >
                    {option.priceDeltaCents > 0 ? "+" : ""}
                    {formatPrice(option.priceDeltaCents)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
