"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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

/** Shared option-row styling: a distinct surface layer that lifts on select/press. */
function optionRowClass(isSelected: boolean, disabled = false) {
  return cn(
    "flex items-center justify-between rounded-lg border p-3",
    "bg-surface-primary transition-[transform,background-color,border-color,box-shadow] duration-150",
    "motion-safe:active:scale-[0.99]",
    isSelected
      ? "border-brand-red bg-brand-red/[0.06] shadow-sm"
      : "border-border hover:border-muted-foreground/50",
    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
  );
}

function PriceDelta({ cents }: { cents: number }) {
  if (cents === 0) return null;
  return (
    <span
      className={cn("text-sm tabular-nums", cents > 0 ? "text-text-muted" : "text-brand-green")}
    >
      {cents > 0 ? "+" : ""}
      {formatPrice(cents)}
    </span>
  );
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
    if (group.minSelect === group.maxSelect) return `Select ${group.minSelect}`;
    return `Select ${group.minSelect}-${group.maxSelect}`;
  })();

  return (
    // Each group is its own layered card so the sections read as distinct strata
    <section className="rounded-xl border border-border bg-surface-secondary/50 p-3.5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-display text-base font-semibold text-text-primary">{group.name}</h4>
          {selectionHint && <p className="text-xs text-text-muted">{selectionHint}</p>}
        </div>
        {isRequired && (
          <Badge variant="outline" className="shrink-0 border-brand-red text-brand-red">
            Required
          </Badge>
        )}
      </div>

      {isSingle ? (
        <RadioGroup
          value={selectedOptions[0] ?? ""}
          onValueChange={(value) => {
            const option = group.options.find((opt) => opt.id === value);
            if (option) onSelect(value, option);
          }}
          className="space-y-2"
        >
          {group.options.map((option) => (
            <label
              key={option.id}
              htmlFor={option.id}
              className={optionRowClass(selectedOptions.includes(option.id))}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value={option.id} id={option.id} />
                <span className="font-normal text-text-primary">{option.name}</span>
              </div>
              <PriceDelta cents={option.priceDeltaCents} />
            </label>
          ))}
        </RadioGroup>
      ) : (
        <div className="space-y-2">
          {group.options.map((option) => {
            const isChecked = selectedOptions.includes(option.id);
            const canSelectMore = selectedOptions.length < group.maxSelect;
            const disabled = !canSelectMore && !isChecked;

            return (
              <label
                key={option.id}
                htmlFor={option.id}
                className={optionRowClass(isChecked, disabled)}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={option.id}
                    checked={isChecked}
                    disabled={disabled}
                    onCheckedChange={(checked) => {
                      if (checked) onSelect(option.id, option);
                      else onDeselect(option.id);
                    }}
                  />
                  <span className="font-normal text-text-primary">{option.name}</span>
                </div>
                <PriceDelta cents={option.priceDeltaCents} />
              </label>
            );
          })}
        </div>
      )}
    </section>
  );
}
