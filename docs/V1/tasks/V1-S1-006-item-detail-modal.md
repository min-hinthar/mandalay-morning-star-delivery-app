# Task: V1-S1-006 — Item Detail Modal

> **Sprint**: 1 (Menu Browse)
> **Priority**: P0
> **Depends On**: V1-S1-003 (Item Card)
> **Branch**: `feat/item-detail-modal`

---

## Objective

Create the item detail modal that displays full item information, modifier selection UI, quantity selector, notes input, and live price calculation. This is the core interaction for building a cart item before adding to cart.

---

## Acceptance Criteria

- [ ] Modal opens on item card click
- [ ] Large image displayed (if available)
- [ ] Full description shown
- [ ] Modifier groups with selection UI
  - [ ] Radio buttons for `single` selection
  - [ ] Checkboxes for `multiple` selection
  - [ ] Min/max selection enforced
  - [ ] Required groups marked
- [ ] Quantity selector (1-50 range)
- [ ] Optional notes textarea (500 char max)
- [ ] Live price calculation updates on modifier/qty change
- [ ] "Add to Cart" button
  - [ ] Disabled if required modifiers missing
  - [ ] Shows total price
- [ ] Allergen warnings prominent
- [ ] Close on backdrop click or X button
- [ ] Focus trapped inside modal
- [ ] Keyboard accessible (Esc to close)
- [ ] Mobile-responsive layout
- [ ] `pnpm lint && pnpm typecheck && pnpm build` pass

---

## Technical Specification

### 1. Price Calculation Utility

Create `src/lib/utils/price.ts`:

```typescript
import type { MenuItem, ModifierOption } from '@/types/menu';

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

  for (const group of item.modifierGroups) {
    const selectedInGroup = selectedModifiers.filter(
      (m) => m.groupId === group.id
    );

    if (selectedInGroup.length < group.minSelect) {
      if (group.minSelect === 1) {
        errors.push(`Please select a ${group.name}`);
      } else {
        errors.push(`Please select at least ${group.minSelect} options for ${group.name}`);
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
```

### 2. Modifier Group Components

Create `src/components/menu/ModifierGroup.tsx`:

```typescript
'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';
import type { ModifierGroup as ModifierGroupType, ModifierOption } from '@/types/menu';

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
  const isSingle = group.selectionType === 'single';

  return (
    <div className="py-4 border-b border-border last:border-0">
      {/* Group Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-medium text-foreground">{group.name}</h4>
          {group.minSelect > 0 && group.maxSelect > 1 && (
            <p className="text-sm text-muted-foreground">
              Select {group.minSelect === group.maxSelect
                ? group.minSelect
                : `${group.minSelect}-${group.maxSelect}`}
            </p>
          )}
        </div>
        {isRequired && (
          <Badge variant="outline" className="text-brand-red border-brand-red">
            Required
          </Badge>
        )}
      </div>

      {/* Options */}
      {isSingle ? (
        <RadioGroup
          value={selectedOptions[0] ?? ''}
          onValueChange={(value) => {
            const option = group.options.find((o) => o.id === value);
            if (option) onSelect(value, option);
          }}
          className="space-y-2"
        >
          {group.options.map((option) => (
            <div
              key={option.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border',
                selectedOptions.includes(option.id)
                  ? 'border-brand-red bg-brand-red/5'
                  : 'border-border hover:border-muted-foreground/50'
              )}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value={option.id} id={option.id} />
                <Label
                  htmlFor={option.id}
                  className="font-normal cursor-pointer"
                >
                  {option.name}
                </Label>
              </div>
              {option.priceDeltaCents !== 0 && (
                <span className={cn(
                  'text-sm',
                  option.priceDeltaCents > 0 ? 'text-muted-foreground' : 'text-green-600'
                )}>
                  {option.priceDeltaCents > 0 ? '+' : ''}
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
                  'flex items-center justify-between p-3 rounded-lg border',
                  isChecked
                    ? 'border-brand-red bg-brand-red/5'
                    : 'border-border hover:border-muted-foreground/50',
                  !canSelectMore && !isChecked && 'opacity-50'
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
                      'font-normal cursor-pointer',
                      !canSelectMore && !isChecked && 'cursor-not-allowed'
                    )}
                  >
                    {option.name}
                  </Label>
                </div>
                {option.priceDeltaCents !== 0 && (
                  <span className={cn(
                    'text-sm',
                    option.priceDeltaCents > 0 ? 'text-muted-foreground' : 'text-green-600'
                  )}>
                    {option.priceDeltaCents > 0 ? '+' : ''}
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
```

### 3. Quantity Selector

Create `src/components/menu/QuantitySelector.tsx`:

```typescript
'use client';

import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 50,
  disabled = false,
}: QuantitySelectorProps) {
  const canDecrement = value > min && !disabled;
  const canIncrement = value < max && !disabled;

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(value - 1)}
        disabled={!canDecrement}
        aria-label="Decrease quantity"
        className="h-10 w-10"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <span
        className={cn(
          'w-12 text-center text-lg font-semibold tabular-nums',
          disabled && 'text-muted-foreground'
        )}
        aria-live="polite"
        aria-atomic="true"
      >
        {value}
      </span>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(value + 1)}
        disabled={!canIncrement}
        aria-label="Increase quantity"
        className="h-10 w-10"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

### 4. Item Detail Modal

Create `src/components/menu/ItemDetailModal.tsx`:

```typescript
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { X, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ModifierGroup } from './ModifierGroup';
import { QuantitySelector } from './QuantitySelector';
import { formatPrice } from '@/lib/utils/currency';
import {
  calculateItemPrice,
  validateModifierSelection,
  type SelectedModifier,
} from '@/lib/utils/price';
import { ALLERGEN_MAP } from '@/lib/constants/allergens';
import { cn } from '@/lib/utils/cn';
import type { MenuItem, ModifierOption } from '@/types/menu';

interface ItemDetailModalProps {
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
  onAddToCart?: (
    item: MenuItem,
    modifiers: SelectedModifier[],
    quantity: number,
    notes: string
  ) => void;
}

export function ItemDetailModal({
  item,
  open,
  onClose,
  onAddToCart,
}: ItemDetailModalProps) {
  // State
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // Reset state when item changes
  useEffect(() => {
    if (item) {
      setSelectedModifiers([]);
      setQuantity(1);
      setNotes('');
    }
  }, [item?.id]);

  // Price calculation
  const priceCalc = useMemo(() => {
    if (!item) return null;
    return calculateItemPrice(item, selectedModifiers, quantity);
  }, [item, selectedModifiers, quantity]);

  // Validation
  const validation = useMemo(() => {
    if (!item) return { isValid: false, errors: [] };
    return validateModifierSelection(item, selectedModifiers);
  }, [item, selectedModifiers]);

  // Handlers
  const handleModifierSelect = (
    groupId: string,
    groupName: string,
    optionId: string,
    option: ModifierOption
  ) => {
    const group = item?.modifierGroups.find((g) => g.id === groupId);
    if (!group) return;

    if (group.selectionType === 'single') {
      // Replace any existing selection in this group
      setSelectedModifiers((prev) => [
        ...prev.filter((m) => m.groupId !== groupId),
        {
          groupId,
          groupName,
          optionId,
          optionName: option.name,
          priceDeltaCents: option.priceDeltaCents,
        },
      ]);
    } else {
      // Add to selections
      setSelectedModifiers((prev) => [
        ...prev,
        {
          groupId,
          groupName,
          optionId,
          optionName: option.name,
          priceDeltaCents: option.priceDeltaCents,
        },
      ]);
    }
  };

  const handleModifierDeselect = (optionId: string) => {
    setSelectedModifiers((prev) => prev.filter((m) => m.optionId !== optionId));
  };

  const handleAddToCart = () => {
    if (!item || !validation.isValid || !onAddToCart) return;
    onAddToCart(item, selectedModifiers, quantity, notes);
    onClose();
  };

  if (!item) return null;

  const hasAllergens = item.allergens && item.allergens.length > 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0 overflow-hidden">
        {/* Image */}
        <div className="relative h-48 sm:h-56 bg-muted">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.nameEn}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gold/20 to-brand-red/10 flex items-center justify-center">
              <span className="text-6xl">🍜</span>
            </div>
          )}

          {/* Close Button */}
          <Button
            variant="secondary"
            size="icon"
            onClick={onClose}
            className="absolute top-3 right-3 rounded-full bg-white/90 hover:bg-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Sold Out Badge */}
          {item.isSoldOut && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge className="text-lg px-4 py-2 bg-white text-foreground">
                Sold Out
              </Badge>
            </div>
          )}
        </div>

        <ScrollArea className="max-h-[calc(90vh-12rem-80px)]">
          <div className="p-6 space-y-6">
            {/* Header */}
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-xl font-display">
                {item.nameEn}
              </DialogTitle>
              {item.nameMy && (
                <p className="text-muted-foreground font-burmese">
                  {item.nameMy}
                </p>
              )}
              <p className="text-2xl font-bold text-brand-red">
                {formatPrice(item.basePriceCents)}
              </p>
            </DialogHeader>

            {/* Description */}
            {item.descriptionEn && (
              <p className="text-muted-foreground">{item.descriptionEn}</p>
            )}

            {/* Allergen Warning */}
            {hasAllergens && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Allergen Information</p>
                  <p className="text-sm text-amber-700">
                    Contains: {item.allergens
                      .map((a) => ALLERGEN_MAP[a]?.label || a)
                      .join(', ')}
                  </p>
                </div>
              </div>
            )}

            {/* Modifier Groups */}
            {item.modifierGroups.length > 0 && (
              <div className="space-y-0 divide-y divide-border">
                {item.modifierGroups.map((group) => (
                  <ModifierGroup
                    key={group.id}
                    group={group}
                    selectedOptions={selectedModifiers
                      .filter((m) => m.groupId === group.id)
                      .map((m) => m.optionId)}
                    onSelect={(optionId, option) =>
                      handleModifierSelect(group.id, group.name, optionId, option)
                    }
                    onDeselect={handleModifierDeselect}
                  />
                ))}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Special Instructions (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                placeholder="Any special requests? Let us know..."
                className="resize-none"
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">
                {notes.length}/500
              </p>
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between">
              <Label>Quantity</Label>
              <QuantitySelector
                value={quantity}
                onChange={setQuantity}
                disabled={item.isSoldOut}
              />
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-background">
          {/* Validation Errors */}
          {!validation.isValid && validation.errors.length > 0 && (
            <p className="text-sm text-destructive mb-3">
              {validation.errors[0]}
            </p>
          )}

          <Button
            onClick={handleAddToCart}
            disabled={item.isSoldOut || !validation.isValid}
            className="w-full h-12 text-lg bg-brand-red hover:bg-brand-red/90"
          >
            {item.isSoldOut ? (
              'Sold Out'
            ) : (
              <>
                Add to Cart — {formatPrice(priceCalc?.totalCents ?? 0)}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 5. Export Components

Update `src/components/menu/index.ts`:

```typescript
export { MenuContent } from './MenuContent';
export { MenuHeader } from './MenuHeader';
export { CategoryTabs } from './CategoryTabs';
export { MenuGrid } from './MenuGrid';
export { MenuSection } from './MenuSection';
export { SearchResultsGrid } from './SearchResultsGrid';
export { ItemCard } from './ItemCard';
export { ItemCardSkeleton } from './ItemCardSkeleton';
export { ItemDetailModal } from './ItemDetailModal';
export { ModifierGroup } from './ModifierGroup';
export { QuantitySelector } from './QuantitySelector';
export { SearchInput } from './SearchInput';
export { MenuSkeleton } from './MenuSkeleton';
export { MenuEmptyState } from './MenuEmptyState';
```

---

## Test Plan

### Unit Tests

```typescript
// Price calculation tests
describe('calculateItemPrice', () => {
  it('calculates base price correctly', () => {
    const item = { basePriceCents: 1500, ... };
    const result = calculateItemPrice(item, [], 1);
    expect(result.totalCents).toBe(1500);
  });

  it('adds modifier price deltas', () => {
    const item = { basePriceCents: 1500, ... };
    const modifiers = [{ priceDeltaCents: 200, ... }];
    const result = calculateItemPrice(item, modifiers, 1);
    expect(result.totalCents).toBe(1700);
  });

  it('multiplies by quantity', () => {
    const item = { basePriceCents: 1500, ... };
    const result = calculateItemPrice(item, [], 3);
    expect(result.totalCents).toBe(4500);
  });
});

// Modifier validation tests
describe('validateModifierSelection', () => {
  it('requires selection for required groups', () => {
    const item = { modifierGroups: [{ minSelect: 1, ... }] };
    const result = validateModifierSelection(item, []);
    expect(result.isValid).toBe(false);
  });

  it('enforces max selection', () => {
    const item = { modifierGroups: [{ maxSelect: 2, ... }] };
    const modifiers = [/* 3 selections */];
    const result = validateModifierSelection(item, modifiers);
    expect(result.isValid).toBe(false);
  });
});
```

### Visual Testing

1. **Modal Layout**
   - [ ] Image displays correctly
   - [ ] Name, description, price show
   - [ ] Allergen warning prominent
   - [ ] Scrolls on overflow

2. **Modifier Selection**
   - [ ] Radio for single selection
   - [ ] Checkbox for multiple
   - [ ] Required badge shows
   - [ ] Price deltas display

3. **Quantity & Notes**
   - [ ] +/- buttons work
   - [ ] Min/max enforced
   - [ ] Notes textarea works
   - [ ] Character count shows

4. **Add to Cart Button**
   - [ ] Shows total price
   - [ ] Disabled when invalid
   - [ ] Disabled when sold out

### Accessibility Testing

- [ ] Focus trapped in modal
- [ ] Escape closes modal
- [ ] Screen reader announces
- [ ] Form controls labeled

### Build Verification

```bash
pnpm lint
pnpm typecheck
pnpm build
```

---

## Definition of Done

1. [ ] Modal opens on item click
2. [ ] Image displays (or placeholder)
3. [ ] Full description shown
4. [ ] Radio buttons for single selection
5. [ ] Checkboxes for multiple selection
6. [ ] Min/max selection enforced
7. [ ] Required groups marked
8. [ ] Quantity selector (1-50)
9. [ ] Notes textarea (500 char)
10. [ ] Live price calculation
11. [ ] Add to Cart button
12. [ ] Disabled states correct
13. [ ] Allergen warnings
14. [ ] Focus trap
15. [ ] Esc to close
16. [ ] Mobile responsive
17. [ ] Unit tests for price calc
18. [ ] `pnpm lint` passes
19. [ ] `pnpm typecheck` passes
20. [ ] `pnpm build` succeeds
21. [ ] `docs/project_status.md` updated

---

## Notes for Codex

- State resets when `item.id` changes (via useEffect)
- Single selection modifiers replace existing in same group
- Multiple selection modifiers are additive (up to max)
- `onAddToCart` prop is optional (Sprint 2 will implement cart)
- Use shadcn Dialog component (built on Radix)
- ScrollArea for content overflow on mobile
- Price calculated client-side for UI only (server recalculates at checkout)
- Character counter shows remaining vs. max

---

*Task ready for implementation*
