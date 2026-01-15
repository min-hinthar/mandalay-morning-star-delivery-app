import type { MenuItem } from "@/types/menu";

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDeltaCents: number;
}

export interface PriceCalculation {
  basePriceCents: number;
  modifiersTotalCents: number;
  unitPriceCents: number;
  quantity: number;
  totalCents: number;
}

export function calculateItemPrice(
  item: MenuItem,
  selectedModifiers: SelectedModifier[],
  quantity: number
): PriceCalculation {
  const modifiersTotalCents = selectedModifiers.reduce(
    (sum, mod) => sum + mod.priceDeltaCents,
    0
  );

  const unitPriceCents = item.basePriceCents + modifiersTotalCents;
  const totalCents = unitPriceCents * quantity;

  return {
    basePriceCents: item.basePriceCents,
    modifiersTotalCents,
    unitPriceCents,
    quantity,
    totalCents,
  };
}

export function validateModifierSelection(
  item: MenuItem,
  selectedModifiers: SelectedModifier[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const group of item.modifierGroups || []) {
    const selectedInGroup = selectedModifiers.filter(
      (mod) => mod.groupId === group.id
    );

    if (selectedInGroup.length < group.minSelect) {
      if (group.minSelect === 1) {
        errors.push(`Please select a ${group.name}`);
      } else {
        errors.push(
          `Please select at least ${group.minSelect} options for ${group.name}`
        );
      }
    }

    if (selectedInGroup.length > group.maxSelect) {
      errors.push(`Maximum ${group.maxSelect} options allowed for ${group.name}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
