# Task: V1-S2-007 — Checkout Stepper

> **Sprint**: 2 (Cart + Checkout)
> **Priority**: P0
> **Depends On**: V1-S2-001, V1-S2-004, V1-S2-005, V1-S2-006
> **Branch**: `feat/checkout-stepper`

---

## Objective

Create the multi-step checkout flow that guides users through Address → Time → Payment. The stepper must validate each step before allowing progression, integrate with the cart state, handle authentication requirements, and ultimately create a Stripe Checkout Session for payment.

---

## Acceptance Criteria

- [ ] 3-step stepper UI (Address → Time → Payment)
- [ ] Step indicators show progress
- [ ] Can navigate back to previous steps
- [ ] Cannot skip ahead without completing current step
- [ ] Step 1: Select/add delivery address
- [ ] Step 2: Select delivery time window
- [ ] Step 3: Review order and proceed to payment
- [ ] Order summary visible throughout checkout
- [ ] Authentication required to start checkout
- [ ] Redirects unauthenticated users to login
- [ ] Creates order and Stripe session on submit
- [ ] Mobile-responsive layout
- [ ] `pnpm lint && pnpm typecheck && pnpm build` pass

---

## Technical Specification

### 1. Checkout Types

Create `src/types/checkout.ts`:

```typescript
import type { CartItem } from './cart';
import type { Address } from './address';
import type { DeliverySelection } from './delivery';

export type CheckoutStep = 'address' | 'time' | 'payment';

export const CHECKOUT_STEPS: CheckoutStep[] = ['address', 'time', 'payment'];

export interface CheckoutState {
  step: CheckoutStep;
  addressId: string | null;
  address: Address | null;
  delivery: DeliverySelection | null;
  customerNotes: string;
}

export interface CreateCheckoutSessionRequest {
  addressId: string;
  scheduledDate: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    modifiers: Array<{ optionId: string }>;
    notes?: string;
  }>;
  customerNotes?: string;
}

export interface CreateCheckoutSessionResponse {
  data: {
    sessionUrl: string;
    orderId: string;
  };
}

export interface CheckoutError {
  code: CheckoutErrorCode;
  message: string;
  details?: unknown;
}

export type CheckoutErrorCode =
  | 'UNAUTHORIZED'
  | 'CART_EMPTY'
  | 'ITEM_UNAVAILABLE'
  | 'ITEM_SOLD_OUT'
  | 'MODIFIER_UNAVAILABLE'
  | 'ADDRESS_INVALID'
  | 'OUT_OF_COVERAGE'
  | 'CUTOFF_PASSED'
  | 'VALIDATION_ERROR'
  | 'STRIPE_ERROR'
  | 'INTERNAL_ERROR';
```

### 2. Checkout Store

Create `src/lib/stores/checkout-store.ts`:

```typescript
import { create } from 'zustand';
import type { CheckoutState, CheckoutStep } from '@/types/checkout';
import type { Address } from '@/types/address';
import type { DeliverySelection } from '@/types/delivery';

interface CheckoutStore extends CheckoutState {
  // Navigation
  setStep: (step: CheckoutStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  canProceed: () => boolean;

  // Data
  setAddress: (address: Address) => void;
  setDelivery: (delivery: DeliverySelection) => void;
  setCustomerNotes: (notes: string) => void;

  // Reset
  reset: () => void;
}

const initialState: CheckoutState = {
  step: 'address',
  addressId: null,
  address: null,
  delivery: null,
  customerNotes: '',
};

const STEP_ORDER: CheckoutStep[] = ['address', 'time', 'payment'];

export const useCheckoutStore = create<CheckoutStore>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  nextStep: () => {
    const { step } = get();
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex < STEP_ORDER.length - 1) {
      set({ step: STEP_ORDER[currentIndex + 1] });
    }
  },

  prevStep: () => {
    const { step } = get();
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex > 0) {
      set({ step: STEP_ORDER[currentIndex - 1] });
    }
  },

  canProceed: () => {
    const { step, address, delivery } = get();
    switch (step) {
      case 'address':
        return address !== null;
      case 'time':
        return delivery !== null;
      case 'payment':
        return true;
      default:
        return false;
    }
  },

  setAddress: (address) => set({ address, addressId: address.id }),
  setDelivery: (delivery) => set({ delivery }),
  setCustomerNotes: (notes) => set({ customerNotes: notes }),

  reset: () => set(initialState),
}));
```

### 3. Checkout Stepper Component

Create `src/components/checkout/CheckoutStepper.tsx`:

```typescript
'use client';

import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { CHECKOUT_STEPS, type CheckoutStep } from '@/types/checkout';
import { cn } from '@/lib/utils/cn';

interface CheckoutStepperProps {
  currentStep: CheckoutStep;
  onStepClick?: (step: CheckoutStep) => void;
  className?: string;
}

const STEP_LABELS: Record<CheckoutStep, string> = {
  address: 'Address',
  time: 'Time',
  payment: 'Payment',
};

export function CheckoutStepper({
  currentStep,
  onStepClick,
  className,
}: CheckoutStepperProps) {
  const currentIndex = CHECKOUT_STEPS.indexOf(currentStep);

  return (
    <nav className={cn('w-full', className)} aria-label="Checkout progress">
      <ol className="flex items-center justify-between">
        {CHECKOUT_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isClickable = isCompleted && onStepClick;

          return (
            <li key={step} className="flex flex-1 items-center">
              {/* Step Circle */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step)}
                disabled={!isClickable}
                className={cn(
                  'relative flex h-10 w-10 items-center justify-center rounded-full',
                  'text-sm font-medium transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2',
                  isCompleted && 'bg-brand-red text-white cursor-pointer',
                  isCurrent && 'border-2 border-brand-red bg-white text-brand-red',
                  !isCompleted && !isCurrent && 'border-2 border-gray-300 bg-white text-gray-400'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    <Check className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>

              {/* Step Label */}
              <span
                className={cn(
                  'ml-2 hidden text-sm font-medium sm:block',
                  (isCompleted || isCurrent) ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {STEP_LABELS[step]}
              </span>

              {/* Connector Line */}
              {index < CHECKOUT_STEPS.length - 1 && (
                <div className="mx-4 h-0.5 flex-1 bg-gray-200">
                  <motion.div
                    className="h-full bg-brand-red"
                    initial={{ width: 0 }}
                    animate={{ width: isCompleted ? '100%' : '0%' }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

### 4. Checkout Page

Create `src/app/checkout/page.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCart } from '@/lib/hooks/useCart';
import { useCheckoutStore } from '@/lib/stores/checkout-store';
import { CheckoutStepper } from '@/components/checkout/CheckoutStepper';
import { AddressStep } from '@/components/checkout/AddressStep';
import { TimeStep } from '@/components/checkout/TimeStep';
import { PaymentStep } from '@/components/checkout/PaymentStep';
import { CheckoutSummary } from '@/components/checkout/CheckoutSummary';
import { Loader2 } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { isEmpty } = useCart();
  const { step, setStep, reset } = useCheckoutStore();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/checkout');
    }
  }, [user, authLoading, router]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!authLoading && isEmpty) {
      router.push('/menu');
    }
  }, [isEmpty, authLoading, router]);

  // Reset checkout state on mount
  useEffect(() => {
    return () => reset();
  }, [reset]);

  if (authLoading || !user || isEmpty) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-red" />
      </div>
    );
  }

  const handleStepClick = (clickedStep: string) => {
    const steps = ['address', 'time', 'payment'];
    const currentIndex = steps.indexOf(step);
    const clickedIndex = steps.indexOf(clickedStep);

    // Only allow going back
    if (clickedIndex < currentIndex) {
      setStep(clickedStep as any);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <h1 className="mb-8 text-2xl font-bold">Checkout</h1>

        {/* Stepper */}
        <CheckoutStepper
          currentStep={step}
          onStepClick={handleStepClick}
          className="mb-8"
        />

        {/* Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border bg-card p-6">
              {step === 'address' && <AddressStep />}
              {step === 'time' && <TimeStep />}
              {step === 'payment' && <PaymentStep />}
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <CheckoutSummary />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 5. Address Step Component

Create `src/components/checkout/AddressStep.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useAddresses, useCreateAddress } from '@/lib/hooks/useAddresses';
import { useCheckoutStore } from '@/lib/stores/checkout-store';
import { AddressForm } from './AddressForm';
import { AddressCard } from './AddressCard';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';

export function AddressStep() {
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading } = useAddresses();
  const createAddress = useCreateAddress();
  const { address, setAddress, nextStep, canProceed } = useCheckoutStore();

  const addresses = data?.data || [];

  const handleSelectAddress = (addr: Address) => {
    setAddress(addr);
  };

  const handleCreateAddress = async (formData: AddressFormValues) => {
    try {
      const result = await createAddress.mutateAsync(formData);
      setAddress(result.data);
      setShowForm(false);
    } catch (error) {
      // Error handling
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Delivery Address</h2>
        <p className="text-sm text-muted-foreground">
          Select or add a delivery address
        </p>
      </div>

      {/* Existing Addresses */}
      {addresses.length > 0 && !showForm && (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              isSelected={address?.id === addr.id}
              onSelect={() => handleSelectAddress(addr)}
            />
          ))}
        </div>
      )}

      {/* Add New Address */}
      {showForm ? (
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 font-medium">Add New Address</h3>
          <AddressForm
            onSubmit={handleCreateAddress}
            onCancel={() => setShowForm(false)}
            isLoading={createAddress.isPending}
            error={createAddress.error?.message}
          />
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowForm(true)}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Address
        </Button>
      )}

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={nextStep}
          disabled={!canProceed()}
          className="bg-brand-red hover:bg-brand-red/90"
        >
          Continue to Time Selection
        </Button>
      </div>
    </div>
  );
}
```

### 6. Time Step Component

Create `src/components/checkout/TimeStep.tsx`:

```typescript
'use client';

import { TimeSlotPicker } from './TimeSlotPicker';
import { useCheckoutStore } from '@/lib/stores/checkout-store';
import { useTimeSlot } from '@/lib/hooks/useTimeSlot';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { TimeWindow } from '@/types/delivery';

export function TimeStep() {
  const { setDelivery, nextStep, prevStep, canProceed } = useCheckoutStore();
  const { selectedWindow, setSelectedWindow, selection, deliveryDate } = useTimeSlot();

  const handleSelectWindow = (window: TimeWindow) => {
    setSelectedWindow(window);
    if (selection) {
      setDelivery({
        date: deliveryDate.dateString,
        windowStart: window.start,
        windowEnd: window.end,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Delivery Time</h2>
        <p className="text-sm text-muted-foreground">
          Choose your preferred delivery window
        </p>
      </div>

      <TimeSlotPicker
        selectedWindow={selectedWindow}
        onSelect={handleSelectWindow}
      />

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={prevStep}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={nextStep}
          disabled={!canProceed()}
          className="bg-brand-red hover:bg-brand-red/90"
        >
          Continue to Payment
        </Button>
      </div>
    </div>
  );
}
```

### 7. Payment Step Component

Create `src/components/checkout/PaymentStep.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, CreditCard, ShieldCheck } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import { useCheckoutStore } from '@/lib/stores/checkout-store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { TimeSlotDisplay } from './TimeSlotDisplay';

export function PaymentStep() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { items, clearCart } = useCart();
  const {
    address,
    delivery,
    customerNotes,
    setCustomerNotes,
    prevStep,
  } = useCheckoutStore();

  const handleCheckout = async () => {
    if (!address || !delivery) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressId: address.id,
          scheduledDate: delivery.date,
          timeWindowStart: delivery.windowStart,
          timeWindowEnd: delivery.windowEnd,
          items: items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            modifiers: item.modifiers.map((m) => ({ optionId: m.optionId })),
            notes: item.notes || undefined,
          })),
          customerNotes: customerNotes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Checkout failed');
      }

      // Redirect to Stripe
      window.location.href = data.data.sessionUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Review & Pay</h2>
        <p className="text-sm text-muted-foreground">
          Review your order and proceed to payment
        </p>
      </div>

      {/* Order Summary */}
      <div className="space-y-4 rounded-lg bg-muted/50 p-4">
        {/* Delivery Address */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Delivery Address</h3>
          <p className="mt-1">{address?.formattedAddress}</p>
        </div>

        {/* Delivery Time */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Delivery Time</h3>
          {delivery && <TimeSlotDisplay selection={delivery} className="mt-1" />}
        </div>
      </div>

      {/* Customer Notes */}
      <div className="space-y-2">
        <Label htmlFor="customerNotes">Order Notes (optional)</Label>
        <Textarea
          id="customerNotes"
          placeholder="Any special instructions for your order..."
          value={customerNotes}
          onChange={(e) => setCustomerNotes(e.target.value)}
          maxLength={500}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          {customerNotes.length}/500 characters
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Security Note */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="h-4 w-4" />
        <span>Secure payment powered by Stripe</span>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={prevStep} disabled={isLoading}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleCheckout}
          disabled={isLoading}
          className="bg-brand-red hover:bg-brand-red/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay Now
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
```

### 8. Checkout Summary Component

Create `src/components/checkout/CheckoutSummary.tsx`:

```typescript
'use client';

import { useCart } from '@/lib/hooks/useCart';
import { CartSummary } from '@/components/cart/CartSummary';
import { formatPrice } from '@/lib/utils/format';

export function CheckoutSummary() {
  const { items } = useCart();

  return (
    <div className="sticky top-4 rounded-lg border bg-card p-4">
      <h3 className="mb-4 font-semibold">Order Summary</h3>

      {/* Items */}
      <ul className="max-h-64 space-y-3 overflow-y-auto border-b pb-4">
        {items.map((item) => (
          <li key={item.cartItemId} className="flex justify-between text-sm">
            <div>
              <span className="font-medium">{item.quantity}×</span>{' '}
              <span>{item.nameEn}</span>
              {item.modifiers.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {item.modifiers.map((m) => m.optionName).join(', ')}
                </p>
              )}
            </div>
            <span className="font-medium">
              {formatPrice(
                (item.basePriceCents +
                  item.modifiers.reduce((sum, m) => sum + m.priceDeltaCents, 0)) *
                  item.quantity
              )}
            </span>
          </li>
        ))}
      </ul>

      {/* Totals */}
      <div className="pt-4">
        <CartSummary showEstimate={false} />
      </div>
    </div>
  );
}
```

---

## Test Plan

### Visual Testing

1. **Stepper Navigation**
   - [ ] Steps display correctly
   - [ ] Current step highlighted
   - [ ] Completed steps show checkmark
   - [ ] Can click back to previous steps
   - [ ] Cannot skip ahead

2. **Address Step**
   - [ ] Lists saved addresses
   - [ ] Can add new address
   - [ ] Selected address highlighted
   - [ ] Continue disabled until address selected

3. **Time Step**
   - [ ] Shows correct Saturday
   - [ ] All 8 slots displayed
   - [ ] Selected slot highlighted
   - [ ] Continue disabled until slot selected

4. **Payment Step**
   - [ ] Shows order summary
   - [ ] Shows address and time
   - [ ] Notes field works
   - [ ] "Pay Now" button works
   - [ ] Loading state shown
   - [ ] Errors displayed

### Build Verification

```bash
pnpm lint
pnpm typecheck
pnpm build
```

---

## Definition of Done

1. [ ] Checkout types defined
2. [ ] Checkout store implemented
3. [ ] CheckoutStepper component created
4. [ ] AddressStep integrates address selection
5. [ ] TimeStep integrates time slot picker
6. [ ] PaymentStep creates checkout session
7. [ ] CheckoutSummary shows order details
8. [ ] Navigation (back/forward) works
9. [ ] Auth redirect works
10. [ ] Empty cart redirect works
11. [ ] Mobile-responsive layout
12. [ ] Error handling implemented
13. [ ] `pnpm lint` passes
14. [ ] `pnpm typecheck` passes
15. [ ] `pnpm build` succeeds
16. [ ] `docs/project_status.md` updated

---

## Notes for Codex

- Checkout requires authentication - redirect to login if needed
- Checkout requires non-empty cart - redirect to menu if empty
- Reset checkout state when leaving/re-entering
- Order is created server-side during session creation
- Server recalculates ALL prices (never trust client)
- Stripe Checkout handles the actual payment UI
- Store checkout step in URL params for bookmarking (optional)
- Consider localStorage backup for checkout progress

---

*Task ready for implementation*
