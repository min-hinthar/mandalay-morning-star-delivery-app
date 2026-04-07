"use client";

import Link from "next/link";
import { ShoppingCart, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

/**
 * Phase 110 CFIX-02 — Empty cart render-time error component.
 *
 * Triggered when a customer direct-links to /checkout with an empty cart.
 * Render-time only — no useEffect, no redirect, no spinner-then-redirect
 * loop. The previous implementation used a `useEffect` + `router.replace`
 * pattern that created a spinner → toast → redirect flash cycle.
 *
 * Per UI-SPEC §EmptyCheckoutError: warm family-business tone, lucide
 * ShoppingCart icon at 64px in text-text-muted, primary CTA "Browse Menu"
 * → /menu. Uses animate-fade-in token (300ms ease-out) gated on
 * useAnimationPreference for reduced-motion support.
 */
export function EmptyCheckoutError() {
  const { shouldAnimate } = useAnimationPreference();

  return (
    <div
      role="status"
      className={`flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 text-center ${
        shouldAnimate ? "animate-fade-in" : ""
      }`}
    >
      <div className="mb-6">
        <ShoppingCart aria-hidden="true" className="h-16 w-16 text-text-muted" />
      </div>
      <h1 className="mb-2 font-display text-xl font-bold text-text-primary">
        Your cart is empty
      </h1>
      <p className="mb-8 max-w-sm font-body text-sm text-text-secondary">
        Start by browsing our menu — we&apos;ll get a fresh meal to your door on the next delivery
        day.
      </p>
      <Button
        asChild
        variant="primary"
        size="lg"
        leftIcon={<ChevronLeft className="h-4 w-4" />}
        className="shadow-elevated"
      >
        <Link href="/menu" aria-label="Browse the menu">
          Browse Menu
        </Link>
      </Button>
    </div>
  );
}

export default EmptyCheckoutError;
