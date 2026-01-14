# Task: V1-S2-003 — Cart Summary Component

> **Sprint**: 2 (Cart + Checkout)
> **Priority**: P0
> **Depends On**: V1-S2-001 (Cart State)
> **Branch**: `feat/cart-summary`

---

## Objective

Create the cart summary component that displays items subtotal, delivery fee with threshold messaging, and estimated total. This component is used in the cart drawer and on the checkout page. It must clearly communicate the $100 free delivery threshold to encourage higher order values.

---

## Acceptance Criteria

- [ ] Shows items subtotal
- [ ] Shows delivery fee ($15 or FREE)
- [ ] Shows "Add $X more for FREE delivery!" when applicable
- [ ] Shows estimated total
- [ ] Clear visual hierarchy
- [ ] Consistent formatting (currency)
- [ ] Responsive design
- [ ] `pnpm lint && pnpm typecheck && pnpm build` pass

---

## Technical Specification

### 1. Cart Summary Component

Create `src/components/cart/CartSummary.tsx`:

```typescript
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Check, Info } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import {
  FREE_DELIVERY_THRESHOLD_CENTS,
  DELIVERY_FEE_CENTS,
} from '@/types/cart';

interface CartSummaryProps {
  className?: string;
  showEstimate?: boolean;
}

export function CartSummary({ className, showEstimate = true }: CartSummaryProps) {
  const {
    itemsSubtotal,
    estimatedDeliveryFee,
    estimatedTotal,
    formattedSubtotal,
    formattedDeliveryFee,
    formattedTotal,
    amountToFreeDelivery,
  } = useCart();

  const hasFreeDelivery = estimatedDeliveryFee === 0;
  const progressPercent = Math.min(
    (itemsSubtotal / FREE_DELIVERY_THRESHOLD_CENTS) * 100,
    100
  );

  return (
    <div className={cn('space-y-3', className)}>
      {/* Free Delivery Progress */}
      {!hasFreeDelivery && (
        <FreeDeliveryProgress
          amountRemaining={amountToFreeDelivery}
          progressPercent={progressPercent}
        />
      )}

      {/* Summary Lines */}
      <div className="space-y-2 text-sm">
        <SummaryLine label="Subtotal" value={formattedSubtotal} />
        <SummaryLine
          label="Delivery"
          value={hasFreeDelivery ? 'FREE' : formattedDeliveryFee}
          valueClassName={hasFreeDelivery ? 'text-green-600 font-medium' : ''}
          icon={
            hasFreeDelivery ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Truck className="h-4 w-4 text-muted-foreground" />
            )
          }
        />
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="font-semibold">
          {showEstimate ? 'Estimated Total' : 'Total'}
        </span>
        <span className="text-lg font-bold">{formattedTotal}</span>
      </div>

      {/* Estimate Note */}
      {showEstimate && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span>
            Final total calculated at checkout. Tax not included.
          </span>
        </p>
      )}
    </div>
  );
}

interface SummaryLineProps {
  label: string;
  value: string;
  valueClassName?: string;
  icon?: React.ReactNode;
}

function SummaryLine({ label, value, valueClassName, icon }: SummaryLineProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className={valueClassName}>{value}</span>
    </div>
  );
}

interface FreeDeliveryProgressProps {
  amountRemaining: number;
  progressPercent: number;
}

function FreeDeliveryProgress({
  amountRemaining,
  progressPercent,
}: FreeDeliveryProgressProps) {
  return (
    <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
        Add {formatPrice(amountRemaining)} more for{' '}
        <span className="font-bold">FREE delivery!</span>
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-amber-200/50 dark:bg-amber-900/50">
        <motion.div
          className="h-full bg-amber-500 dark:bg-amber-400"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
        Free delivery on orders $100+
      </p>
    </div>
  );
}
```

### 2. Cart Summary Skeleton

Create `src/components/cart/CartSummarySkeleton.tsx`:

```typescript
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';

interface CartSummarySkeletonProps {
  className?: string;
}

export function CartSummarySkeleton({ className }: CartSummarySkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Progress Bar Skeleton */}
      <div className="rounded-lg bg-muted p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-2 h-2 w-full" />
        <Skeleton className="mt-1 h-3 w-1/2" />
      </div>

      {/* Summary Lines */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Total */}
      <div className="flex justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}
```

### 3. Compact Cart Summary (for Header/Mini Cart)

Create `src/components/cart/CartSummaryCompact.tsx`:

```typescript
'use client';

import { useCart } from '@/lib/hooks/useCart';
import { cn } from '@/lib/utils/cn';

interface CartSummaryCompactProps {
  className?: string;
}

export function CartSummaryCompact({ className }: CartSummaryCompactProps) {
  const { formattedSubtotal, itemCount, amountToFreeDelivery } = useCart();

  if (itemCount === 0) return null;

  return (
    <div className={cn('text-sm', className)}>
      <span className="font-medium">{formattedSubtotal}</span>
      {amountToFreeDelivery > 0 && (
        <span className="ml-2 text-xs text-muted-foreground">
          (${(amountToFreeDelivery / 100).toFixed(0)} to free delivery)
        </span>
      )}
    </div>
  );
}
```

### 4. Fee Display Constants

Update `src/types/cart.ts` to export human-readable strings:

```typescript
// Fee display helpers
export function getDeliveryFeeMessage(subtotalCents: number): {
  fee: string;
  message: string;
} {
  if (subtotalCents >= FREE_DELIVERY_THRESHOLD_CENTS) {
    return {
      fee: 'FREE',
      message: 'You qualify for free delivery!',
    };
  }

  const remaining = FREE_DELIVERY_THRESHOLD_CENTS - subtotalCents;
  return {
    fee: '$15.00',
    message: `Add $${(remaining / 100).toFixed(2)} more for free delivery`,
  };
}
```

---

## Test Plan

### Visual Testing

1. **Subtotal Display**
   - [ ] Shows correct subtotal
   - [ ] Updates when cart changes
   - [ ] Currency formatted correctly

2. **Delivery Fee Display**
   - [ ] Shows "$15.00" when under $100
   - [ ] Shows "FREE" with checkmark when at/above $100
   - [ ] Green color for free delivery

3. **Progress Bar**
   - [ ] Shows when under $100
   - [ ] Hidden when at/above $100
   - [ ] Animates smoothly
   - [ ] Shows correct remaining amount

4. **Total Display**
   - [ ] Shows correct estimated total
   - [ ] "Estimated" label for cart drawer
   - [ ] Info note about final calculation

### Unit Tests

```typescript
describe('CartSummary', () => {
  it('shows free delivery message when at threshold', () => {
    // Test with $100 subtotal
  });

  it('shows progress bar when under threshold', () => {
    // Test with $50 subtotal
  });

  it('calculates remaining amount correctly', () => {
    // $100 - $75 = $25 remaining
  });
});
```

### Build Verification

```bash
pnpm lint
pnpm typecheck
pnpm build
```

---

## Definition of Done

1. [ ] CartSummary component created
2. [ ] Shows subtotal, delivery fee, total
3. [ ] Free delivery progress bar works
4. [ ] Progress bar animates smoothly
5. [ ] FREE badge shows when threshold met
6. [ ] Compact variant created
7. [ ] Skeleton loader created
8. [ ] Currency formatting consistent
9. [ ] Dark mode support
10. [ ] `pnpm lint` passes
11. [ ] `pnpm typecheck` passes
12. [ ] `pnpm build` succeeds
13. [ ] `docs/project_status.md` updated

---

## Notes for Codex

- Progress bar should animate when cart changes
- Use amber/gold colors for progress bar (matches brand)
- "FREE" should be prominent green to encourage higher orders
- Keep "Estimated" prefix clear - server calculates final
- Compact variant is for header mini-cart display
- Dark mode uses adjusted amber shades

---

*Task ready for implementation*
