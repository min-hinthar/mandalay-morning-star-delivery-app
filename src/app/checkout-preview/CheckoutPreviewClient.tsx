"use client";

import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { CheckoutMasthead, CheckoutStepperV8, CheckoutSummary } from "@/components/ui/checkout";
import { HeroCardLayers } from "@/components/ui/homepage/Hero/HeroCardLayers";
import { useCartStore } from "@/lib/stores/cart-store";
import { CHECKOUT_STEPS, type CheckoutStep } from "@/types/checkout";
import type { CartItem } from "@/types/cart";
import { cn } from "@/lib/utils/cn";

/**
 * Mock cart so the living receipt + summary render with real, lively numbers.
 * Subtotal sits below the free-delivery threshold so the progress bar shows.
 */
const MOCK_ITEMS: CartItem[] = [
  {
    cartItemId: "preview-1",
    menuItemId: "preview-lahpet",
    menuItemSlug: "tea-leaf-salad",
    nameEn: "Tea Leaf Salad",
    nameMy: "လက်ဖက်သုပ်",
    imageUrl: null,
    basePriceCents: 1400,
    quantity: 2,
    modifiers: [
      {
        groupId: "g1",
        groupName: "Add-ons",
        optionId: "o1",
        optionName: "Extra crispy nuts",
        priceDeltaCents: 150,
      },
    ],
    notes: "",
    addedAt: new Date().toISOString(),
  },
  {
    cartItemId: "preview-2",
    menuItemId: "preview-mohinga",
    menuItemSlug: "mohinga",
    nameEn: "Mohinga",
    nameMy: "မုန့်ဟင်းခါး",
    imageUrl: null,
    basePriceCents: 1200,
    quantity: 1,
    modifiers: [],
    notes: "",
    addedAt: new Date().toISOString(),
  },
  {
    cartItemId: "preview-3",
    menuItemId: "preview-ohnno",
    menuItemSlug: "coconut-chicken-noodle",
    nameEn: "Coconut Chicken Noodle",
    nameMy: "အုန်းနို့ခေါက်ဆွဲ",
    imageUrl: null,
    basePriceCents: 1550,
    quantity: 1,
    modifiers: [],
    notes: "",
    addedAt: new Date().toISOString(),
  },
];

const STEP_LABEL: Record<CheckoutStep, string> = {
  address: "Address",
  time: "Time",
  payment: "Pay",
};

const STEP_NOTE: Record<CheckoutStep, string> = {
  address: "Address step body — saved-address cards, coverage check, map preview.",
  time: "Time step body — delivery-day rail + time-window pills.",
  payment: "Payment step body — method toggle, tip, promo seal, contact, submit CTA.",
};

export function CheckoutPreviewClient() {
  const [step, setStep] = useState<CheckoutStep>("address");

  // Seed the mock cart + delivery settings; restore on unmount so a later
  // real session on this preview origin isn't polluted with preview items.
  useEffect(() => {
    const prev = useCartStore.getState().items;
    useCartStore.setState({
      items: MOCK_ITEMS,
      deliveryFeeCents: 1500,
      freeDeliveryThresholdCents: 10000,
      addressDistanceMiles: 8,
      longDistanceFeeCents: 2000,
      longDistanceThresholdMiles: 25,
      _hasHydrated: true,
    });
    return () => {
      useCartStore.setState({ items: prev });
    };
  }, []);

  const handleStepClick = (clicked: CheckoutStep) => {
    if (CHECKOUT_STEPS.indexOf(clicked) < CHECKOUT_STEPS.indexOf(step)) setStep(clicked);
  };

  return (
    <div className="checkout-canvas relative min-h-screen pb-32">
      <div className="relative mx-auto max-w-4xl px-4 py-6 sm:py-8">
        {/* Non-prod review banner + step jumper */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hero-clay/30 bg-hero-clay/10 px-4 py-2.5">
          <p className="text-xs font-semibold text-hero-ink">
            Non-production preview · mock cart · no login
          </p>
          <div className="flex items-center gap-1 rounded-full border border-hero-line bg-hero-card/70 p-1">
            {CHECKOUT_STEPS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStep(s)}
                className={cn(
                  "rounded-full px-3 py-1 text-2xs font-bold uppercase tracking-wider transition-colors",
                  step === s ? "bg-hero-accent text-hero-card" : "text-hero-ink-muted"
                )}
              >
                {STEP_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <CheckoutMasthead step={step} className="mb-6 animate-hero-develop-1" />

        <CheckoutStepperV8
          currentStep={step}
          onStepClick={handleStepClick}
          className="mb-6 animate-hero-develop-2 sm:mb-8"
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2">
            <div className="hero-surface-glass animate-hero-develop-3 relative overflow-hidden rounded-2xl p-4 sm:p-6">
              <span
                aria-hidden="true"
                className="checkout-card-rail absolute inset-x-0 top-0 h-[3px]"
              />
              <span
                aria-hidden="true"
                className="checkout-card-aura pointer-events-none absolute inset-0 rounded-2xl"
              />
              <HeroCardLayers accent="clay" radius="rounded-2xl" />
              <AnimatePresence mode="wait">
                <m.div
                  key={step}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  className="relative flex min-h-[14rem] flex-col items-center justify-center gap-2 text-center"
                >
                  <span className="font-display text-lg font-semibold text-hero-ink">
                    {STEP_LABEL[step]} step
                  </span>
                  <p className="max-w-xs text-sm text-hero-ink-muted">{STEP_NOTE[step]}</p>
                  <p className="mt-1 text-2xs font-semibold uppercase tracking-wider text-hero-accent">
                    Reskin in progress
                  </p>
                </m.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="animate-hero-develop-4 lg:sticky lg:top-24">
              <CheckoutSummary />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
