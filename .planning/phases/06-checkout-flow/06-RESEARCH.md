# Phase 6: Checkout Flow - Research

**Researched:** 2026-01-23
**Domain:** Multi-step checkout, Stripe payments, form animations, celebration UI
**Confidence:** HIGH

## Summary

Phase 6 upgrades the existing V7 checkout implementation to V8 with enhanced animations. The current checkout has a solid foundation:
- Zustand store with step management (`address`, `time`, `payment`)
- React Hook Form with Zod validation for address entry
- Stripe Checkout Sessions (hosted page, not embedded)
- CheckoutStepper with spring animations already implemented

Key V8 work involves: (1) adding step transition animations, (2) form field micro-interactions on focus/error, (3) animated free delivery progress in checkout summary (pattern exists in CartSummary), and (4) celebration animation on order confirmation (confetti + animated checkmark components exist).

**Primary recommendation:** Leverage existing components (Confetti, SuccessCheckmark, ValidatedInput) and motion tokens (spring.rubbery, spring.ultraBouncy). Build step transitions using Framer Motion's `AnimatePresence`. Do not rebuild - enhance.

## Standard Stack

### Core (Already in Project)
| Library | Purpose | Status |
|---------|---------|--------|
| Framer Motion | All checkout animations | Already configured |
| Zustand | checkout-store.ts step state | Already implemented |
| React Hook Form + Zod | Address form validation | Already implemented |
| @tanstack/react-query | Address CRUD, order fetching | Already implemented |
| Stripe Checkout Sessions | Payment flow (hosted) | Already integrated |

### Supporting (Already Available)
| Library | Purpose | Status |
|---------|---------|--------|
| lucide-react | Icons (Check, MapPin, Clock, CreditCard) | In use |
| date-fns | Delivery time formatting | In use |
| class-variance-authority | Component variants | In use |

### Not Needed
| Library | Reason |
|---------|--------|
| @stripe/react-stripe-js | Using Stripe Checkout Sessions (redirect), not embedded Elements |
| react-confetti | Custom Confetti component already exists |
| Form state libraries | React Hook Form already integrated |

## Architecture Patterns

### Existing Checkout Structure (Keep)
```
src/
├── app/(customer)/checkout/
│   └── page.tsx                     # Multi-step checkout page
├── components/checkout/
│   ├── AddressStep.tsx             # Step 1: Address selection
│   ├── TimeStep.tsx                # Step 2: Time slot picker
│   ├── PaymentStep.tsx             # Step 3: Review & pay
│   ├── CheckoutStepper.tsx         # Progress indicator (has animations)
│   ├── CheckoutSummary.tsx         # Order totals sidebar
│   ├── AddressCard.tsx             # Address selection card
│   ├── AddressForm.tsx             # Add/edit address form
│   └── v7-index.ts                 # Current exports
├── components/orders/
│   ├── OrderConfirmation.tsx       # Success page (needs V8 upgrade)
│   └── ...
├── lib/stores/
│   └── checkout-store.ts           # Step state: address → time → payment
└── types/
    └── checkout.ts                 # CheckoutStep, CheckoutState types
```

### V8 Upgrade Pattern (Follow Existing)
```typescript
// Pattern from Phase 5: Same interface, V8 animations
// V7 component stays in place, V8 replaces import

// Before (v7-index.ts)
export { CheckoutStepper } from "./CheckoutStepper";

// After (index.ts - new V8 barrel)
export { CheckoutStepperV8 as CheckoutStepper } from "./CheckoutStepperV8";
```

### Step Transition Pattern
```typescript
// Use AnimatePresence with mode="wait" for step transitions
<AnimatePresence mode="wait">
  {step === "address" && (
    <motion.div
      key="address"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={spring.default}
    >
      <AddressStep />
    </motion.div>
  )}
  {/* ... other steps */}
</AnimatePresence>
```

### Form Field Micro-Interaction Pattern
```typescript
// Existing ValidatedInput has shake animation + icons
// Wrap with motion for focus animations
<motion.div
  animate={isFocused ? { scale: 1.02 } : { scale: 1 }}
  transition={spring.snappy}
>
  <ValidatedInput
    rules={[validationRules.required("Required")]}
    shakeOnError={true}
    showSuccess={true}
    {...props}
  />
</motion.div>
```

### Free Delivery Progress Pattern (Reuse from CartSummary)
```typescript
// CartSummary already implements this with spring.rubbery
<motion.div
  className="h-2 bg-surface-tertiary rounded-full overflow-hidden"
>
  <motion.div
    className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
    initial={{ width: 0 }}
    animate={{ width: `${progressPercent}%` }}
    transition={getSpring(spring.rubbery)}
  />
</motion.div>
```

## Existing Code Inventory

### Components to ENHANCE (V8 Upgrade)
| Component | File | What to Add |
|-----------|------|-------------|
| CheckoutStepper | `checkout/CheckoutStepper.tsx` | Already has animations, minor tweaks |
| AddressStep | `checkout/AddressStep.tsx` | Step entry/exit animation |
| TimeStep | `checkout/TimeStep.tsx` | Step entry/exit animation |
| PaymentStep | `checkout/PaymentStep.tsx` | Step entry/exit animation |
| CheckoutSummary | `checkout/CheckoutSummary.tsx` | Animated free delivery progress (CHKT-09) |
| AddressCard | `checkout/AddressCard.tsx` | Already animated, review |
| AddressForm | `checkout/AddressForm.tsx` | Form field micro-interactions |
| OrderConfirmation | `orders/OrderConfirmation.tsx` | Add confetti, enhanced checkmark |

### Components to REUSE (Already V8 Ready)
| Component | File | Use Case |
|-----------|------|----------|
| Confetti | `ui/Confetti.tsx` | Order success celebration |
| SuccessCheckmark | `ui/success-checkmark.tsx` | Confirmation page checkmark |
| PaymentSuccess | `checkout/PaymentSuccess.tsx` | Has confetti + timeline (reference) |
| ValidatedInput | `ui/FormValidation.tsx` | Form field micro-interactions |
| PriceTicker | `ui/PriceTicker.tsx` | Animated price updates |
| Toast | `ui-v8/Toast.tsx` | Error/success feedback |
| Modal | `ui-v8/Modal.tsx` | Address add/edit overlay |
| BottomSheet | `ui-v8/BottomSheet.tsx` | Mobile address selection |

### Hooks to Use
| Hook | File | Purpose |
|------|------|---------|
| useCheckoutStore | `stores/checkout-store.ts` | Step state management |
| useAddresses | `hooks/useAddresses.ts` | Address CRUD |
| useCart | `hooks/useCart.ts` | Cart items, totals |
| useAnimationPreference | `hooks/useAnimationPreference.ts` | shouldAnimate, getSpring |

### Motion Tokens Reference
| Token | Use Case |
|-------|----------|
| `spring.default` | Step transitions, standard animations |
| `spring.ultraBouncy` | Success checkmark, celebration |
| `spring.rubbery` | Free delivery progress bar (per decision) |
| `spring.snappy` | Button press, form focus |
| `spring.gentle` | Large element transitions |
| `variants.slideRight/slideLeft` | Step navigation |
| `celebration.success` | Checkmark animation |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation animations | Custom shake/error logic | `ValidatedInput` from `FormValidation.tsx` | Has shake, icons, aria |
| Confetti animation | Custom particle system | `Confetti` from `ui/Confetti.tsx` | 25 particles, reduced motion |
| Checkmark animation | Custom SVG path | `SuccessCheckmark` from `ui/success-checkmark.tsx` | Path drawing, spring scale |
| Price animation | Number increment | `PriceTicker` from `ui/PriceTicker.tsx` | Digit-by-digit animation |
| Progress indicator | Step circles | Enhance `CheckoutStepper` | Already has spring animations |
| Free delivery bar | Linear fill | Copy pattern from `CartSummary.tsx` | Uses spring.rubbery per decision |
| Step state | Custom useState | `useCheckoutStore` | Zustand with persist |

## Common Pitfalls

### Pitfall 1: Rebuilding Stripe Integration
**What goes wrong:** Attempting to embed Stripe Elements instead of using existing Checkout Sessions
**Why it happens:** Requirements mention "Stripe payment form renders" which suggests embedded
**How to avoid:** The app uses Stripe Checkout Sessions (hosted page). PaymentStep creates session, redirects to Stripe. Enhancement is review UI, not payment form.
**Warning signs:** Importing @stripe/react-stripe-js, PaymentElement

### Pitfall 2: Step Animation Fighting State
**What goes wrong:** Step content flashes or jumps during transitions
**Why it happens:** AnimatePresence not configured correctly
**How to avoid:** Use `mode="wait"` on AnimatePresence, unique `key` per step
**Warning signs:** Content appears before previous exits

### Pitfall 3: Form Shake Overuse
**What goes wrong:** Every keystroke triggers animations
**Why it happens:** Validating on every change instead of blur
**How to avoid:** ValidatedInput validates on blur, re-validates on change only after error
**Warning signs:** Performance issues, user frustration

### Pitfall 4: Mobile Scroll Issues with BottomSheet
**What goes wrong:** Address selection scrolls behind sheet
**Why it happens:** Not using existing V8 BottomSheet with scroll lock
**How to avoid:** Use BottomSheet from ui-v8 for mobile address picker
**Warning signs:** Body scroll visible while sheet open

### Pitfall 5: Animation Preference Ignored
**What goes wrong:** Animations run when user disabled them
**Why it happens:** Direct animation props without useAnimationPreference
**How to avoid:** Always use `shouldAnimate` guard and `getSpring()` wrapper
**Warning signs:** Animations running when data-motion="none"

### Pitfall 6: Confetti Z-Index Issues
**What goes wrong:** Confetti appears behind header or modals
**Why it happens:** Not using z-index tokens
**How to avoid:** Confetti uses `z-[var(--z-max)]`, verify order confirmation z-index
**Warning signs:** Confetti partially hidden

## Animation Mapping

### CHKT-01: Multi-step checkout form
- Step transitions with `AnimatePresence mode="wait"`
- Slide direction based on forward/back navigation

### CHKT-02: Address selection/management
- AddressCard selection: existing spring scale animation
- Add address modal: V8 Modal with spring enter
- Mobile: V8 BottomSheet for address picker

### CHKT-06: Animated step progress indicator
- CheckoutStepper already has:
  - Line fill animation on complete
  - Check icon spring scale
  - Ring pulse on current step
- Enhance: smoother step transitions

### CHKT-07: Form field micro-interactions
- Focus: subtle scale with spring.snappy
- Error: shake animation (ValidatedInput has this)
- Success: check icon fade in
- Validation: animated error message slide

### CHKT-08: Success celebration animation
- Confetti burst on mount (25 particles)
- Animated checkmark with path drawing
- Staggered content reveal
- Existing: PaymentSuccess.tsx has full implementation

### CHKT-09: Animated free delivery in checkout summary
- Progress bar with spring.rubbery fill
- Sparkle icon rotation on threshold reach
- Pattern exists in CartSummary.tsx

## Code Examples

### Step Transition (Source: motion-tokens.ts)
```typescript
import { motion, AnimatePresence } from "framer-motion";
import { spring, variants } from "@/lib/motion-tokens";

// In CheckoutPage
const direction = newStep > oldStep ? 1 : -1;

<AnimatePresence mode="wait" custom={direction}>
  <motion.div
    key={step}
    custom={direction}
    initial={{ opacity: 0, x: 30 * direction }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -30 * direction }}
    transition={spring.default}
  >
    {step === "address" && <AddressStep />}
    {step === "time" && <TimeStep />}
    {step === "payment" && <PaymentStep />}
  </motion.div>
</AnimatePresence>
```

### Form Focus Animation (Source: FormValidation.tsx pattern)
```typescript
import { ValidatedInput, validationRules } from "@/components/ui/FormValidation";

// Enhanced with focus scale
<ValidatedInput
  label="Street Address"
  rules={[
    validationRules.required("Street address is required"),
    validationRules.minLength(5, "Address too short"),
  ]}
  shakeOnError={true}
  showSuccess={true}
  placeholder="123 Main St"
/>
```

### Success Celebration (Source: Confetti.tsx, success-checkmark.tsx)
```typescript
import { Confetti, useConfetti } from "@/components/ui/Confetti";
import { SuccessCheckmark } from "@/components/ui/success-checkmark";

function OrderSuccess() {
  const { isActive, trigger, Confetti: ConfettiComponent } = useConfetti();

  useEffect(() => {
    trigger(); // Trigger on mount
  }, [trigger]);

  return (
    <>
      <ConfettiComponent particleCount={30} duration={2.5} />
      <SuccessCheckmark show size={80} variant="default" />
    </>
  );
}
```

### Free Delivery Progress (Source: CartSummary.tsx)
```typescript
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

function FreeDeliveryProgress({ percent }: { percent: number }) {
  const { getSpring } = useAnimationPreference();

  return (
    <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={getSpring(spring.rubbery)}
      />
    </div>
  );
}
```

## Stripe Flow (Reference)

Current implementation uses Stripe Checkout Sessions (hosted page):

```
1. User completes checkout steps (address, time)
2. PaymentStep.tsx calls POST /api/checkout/session
3. API creates Order (status: pending) in Supabase
4. API creates Stripe Checkout Session with metadata
5. User redirected to Stripe hosted checkout
6. Stripe webhook: checkout.session.completed
7. Webhook updates order status to confirmed
8. User redirected to /orders/[id]/confirmation
```

**Key insight:** No embedded Stripe UI needed. PaymentStep is a review/confirm screen, not a payment form. The "Stripe payment form renders" requirement is satisfied by the Stripe hosted page.

## Open Questions

### 1. Address Edit Flow
**What we know:** AddressForm exists, useUpdateAddress hook exists
**What's unclear:** Should edit be in-page or Modal overlay?
**Recommendation:** Use V8 Modal for edit (consistent with add)

### 2. Mobile Step Navigation
**What we know:** Current navigation is button-based (Continue/Back)
**What's unclear:** Should stepper be swipeable on mobile?
**Recommendation:** Keep button-based; swipe gestures add complexity without clear benefit

### 3. Loading State Granularity
**What we know:** CHKT-05 requires "Loading states throughout checkout"
**What's unclear:** Which specific transitions need skeleton/spinner?
**Recommendation:** Address list loading, time slots loading, checkout session creation

## Sources

### Primary (HIGH confidence)
- `/home/user/mandalay-morning-star-delivery-app/src/lib/stores/checkout-store.ts` - Checkout state
- `/home/user/mandalay-morning-star-delivery-app/src/components/checkout/PaymentStep.tsx` - Stripe flow
- `/home/user/mandalay-morning-star-delivery-app/src/lib/motion-tokens.ts` - Animation presets
- `/home/user/mandalay-morning-star-delivery-app/src/components/ui/FormValidation.tsx` - Form animations
- `/home/user/mandalay-morning-star-delivery-app/src/components/ui/Confetti.tsx` - Celebration
- `/home/user/mandalay-morning-star-delivery-app/src/components/ui-v8/cart/CartSummary.tsx` - Free delivery pattern
- `/home/user/mandalay-morning-star-delivery-app/docs/06-stripe.md` - Stripe architecture

### Secondary (HIGH confidence)
- `/home/user/mandalay-morning-star-delivery-app/src/types/checkout.ts` - Types
- `/home/user/mandalay-morning-star-delivery-app/src/app/api/checkout/session/route.ts` - API route
- `/home/user/mandalay-morning-star-delivery-app/src/components/checkout/CheckoutStepper.tsx` - Existing animations

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project
- Architecture: HIGH - Existing patterns well documented
- Pitfalls: HIGH - Based on actual code review
- Animation patterns: HIGH - Motion tokens and examples verified

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (stable, internal patterns)
