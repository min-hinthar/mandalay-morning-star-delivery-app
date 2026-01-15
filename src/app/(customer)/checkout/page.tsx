"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCart } from "@/lib/hooks/useCart";
import { useCheckoutStore } from "@/lib/stores/checkout-store";
import { CheckoutStepper } from "@/components/checkout/CheckoutStepper";
import { AddressStep } from "@/components/checkout/AddressStep";
import { TimeStep } from "@/components/checkout/TimeStep";
import { PaymentStep } from "@/components/checkout/PaymentStep";
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";
import type { CheckoutStep } from "@/types/checkout";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { isEmpty } = useCart();
  const { step, setStep, reset } = useCheckoutStore();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/checkout");
    }
  }, [user, authLoading, router]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!authLoading && user && isEmpty) {
      router.push("/menu");
    }
  }, [isEmpty, authLoading, user, router]);

  // Reset checkout state on unmount
  useEffect(() => {
    return () => reset();
  }, [reset]);

  if (authLoading || !user || isEmpty) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-brand-red" />
      </div>
    );
  }

  const handleStepClick = (clickedStep: CheckoutStep) => {
    const steps: CheckoutStep[] = ["address", "time", "payment"];
    const currentIndex = steps.indexOf(step);
    const clickedIndex = steps.indexOf(clickedStep);

    // Only allow going back
    if (clickedIndex < currentIndex) {
      setStep(clickedStep);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-display font-bold text-foreground">
          Checkout
        </h1>

        <CheckoutStepper
          currentStep={step}
          onStepClick={handleStepClick}
          className="mb-8"
        />

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              {step === "address" && <AddressStep />}
              {step === "time" && <TimeStep />}
              {step === "payment" && <PaymentStep />}
            </div>
          </div>

          <div className="lg:col-span-1">
            <CheckoutSummary />
          </div>
        </div>
      </div>
    </div>
  );
}
