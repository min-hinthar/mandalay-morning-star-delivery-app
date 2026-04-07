"use client";

import { useState, useRef, useEffect, useCallback, type MutableRefObject } from "react";
import { useRouter } from "next/navigation";
import { handleRateLimitResponse } from "@/lib/hooks/useRateLimitToast";
import { toast } from "@/lib/hooks/useToast";
import { ClientErrorCodes } from "@/types/errors";
import type { CheckoutErrorData } from "./CheckoutErrorBanner";
import type { CartItem } from "@/types/cart";
import type { PaymentMethod } from "@/types/order";

/**
 * Phase 110 CFIX-04 — Stripe checkout session fetch timeout.
 * Customer-perceived hang after ~6s; 10s gives Stripe a fair chance on
 * slow networks without leaving the user staring at a spinner forever.
 */
export const STRIPE_TIMEOUT_MS = 10000;

export interface UsePaymentSubmitArgs {
  addressId: string | undefined;
  delivery: {
    date: string;
    windowStart: string;
    windowEnd: string;
  } | null;
  canProceed: boolean;
  cutoffModalOpen: boolean;
  items: CartItem[];
  customerNotes: string;
  tipCents: number;
  promoCode: string | null;
  promoApplied: boolean;
  deliveryInstructions: string;
  paymentMethod: PaymentMethod;
  customerPhone: string;
  customerName: string;
  onCutoffPassed?: () => void;
  disableGuard?: () => void;
  saveToProfileRef: MutableRefObject<boolean>;
}

export interface UsePaymentSubmitResult {
  isCreatingSession: boolean;
  error: CheckoutErrorData | null;
  setError: (e: CheckoutErrorData | null) => void;
  handleCheckout: () => Promise<void>;
}

/**
 * Phase 110 CFIX-04 — Extracted Stripe checkout submission logic with
 * 10s AbortController timeout, cleanup useEffect, and AbortError branch
 * that surfaces CHECKOUT_NETWORK_TIMEOUT with a persistent toast + retry.
 * Retry re-invokes handleCheckout which preserves the server-side
 * idempotency key (`checkout_${order.id}`).
 */
export function usePaymentSubmit(args: UsePaymentSubmitArgs): UsePaymentSubmitResult {
  const router = useRouter();
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [error, setError] = useState<CheckoutErrorData | null>(null);

  // Phase 110 CFIX-04 — Stripe timeout AbortController + setTimeout refs.
  // Stored in refs so cleanup useEffect can abort in-flight fetches and
  // clear pending timeouts when the component unmounts mid-request.
  const stripeControllerRef = useRef<AbortController | null>(null);
  const stripeTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Phase 110 D-15 — unmount cleanup. Empty deps means this runs once
  // on mount and the return function runs once on unmount, preventing
  // leaked fetches and orphaned setTimeouts.
  useEffect(() => {
    return () => {
      if (stripeTimeoutIdRef.current !== null) {
        clearTimeout(stripeTimeoutIdRef.current);
        stripeTimeoutIdRef.current = null;
      }
      if (stripeControllerRef.current) {
        stripeControllerRef.current.abort();
        stripeControllerRef.current = null;
      }
    };
  }, []);

  const {
    addressId,
    delivery,
    canProceed,
    cutoffModalOpen,
    items,
    customerNotes,
    tipCents,
    promoCode,
    promoApplied,
    deliveryInstructions,
    paymentMethod,
    customerPhone,
    customerName,
    onCutoffPassed,
    disableGuard,
    saveToProfileRef,
  } = args;

  const isCOD = paymentMethod === "cod";

  const handleCheckout = useCallback(async () => {
    // CFIX-03 D-07 — defense-in-depth: refuse to submit while CutoffModal
    // is open. The HTML disabled attr covers visual + click path;
    // this guard catches programmatic submission (e.g., keyboard Enter on
    // a focused form input that may bypass the disabled attribute in some
    // browsers). Server-side CUTOFF_PASSED check in /api/checkout/session
    // is the third layer.
    if (cutoffModalOpen) return;
    if (!addressId || !delivery || !canProceed) return;

    setIsCreatingSession(true);
    setError(null);

    // Phase 110 CFIX-04 — abort any stale in-flight request (customer
    // double-click on Retry). New controller per attempt keeps
    // idempotency_key=checkout_${order.id} stable on the server side.
    if (stripeControllerRef.current) {
      stripeControllerRef.current.abort();
    }
    if (stripeTimeoutIdRef.current !== null) {
      clearTimeout(stripeTimeoutIdRef.current);
    }
    const controller = new AbortController();
    stripeControllerRef.current = controller;
    stripeTimeoutIdRef.current = setTimeout(() => {
      controller.abort();
    }, STRIPE_TIMEOUT_MS);

    try {
      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          addressId,
          scheduledDate: delivery.date,
          timeWindowStart: delivery.windowStart,
          timeWindowEnd: delivery.windowEnd,
          items: items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            modifiers: item.modifiers.map((mod) => ({
              optionId: mod.optionId,
            })),
            notes: item.notes || undefined,
          })),
          customerNotes: customerNotes || undefined,
          tipCents,
          promoCode: promoApplied ? promoCode : undefined,
          deliveryInstructions: deliveryInstructions || undefined,
          paymentMethod,
          customerPhone,
          customerName,
        }),
      });

      // Response received — clear the timeout before parsing body.
      if (stripeTimeoutIdRef.current !== null) {
        clearTimeout(stripeTimeoutIdRef.current);
        stripeTimeoutIdRef.current = null;
      }

      if (handleRateLimitResponse(response, { isOrderPlacement: true })) {
        setIsCreatingSession(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.code === "CUTOFF_PASSED" && onCutoffPassed) {
          setIsCreatingSession(false);
          onCutoffPassed();
          return;
        }
        setError({
          code: data.error?.code ?? "INTERNAL_ERROR",
          message: data.error?.message ?? "Checkout failed",
          details: data.error?.details,
        });
        setIsCreatingSession(false);
        return;
      }

      if (saveToProfileRef.current) {
        fetch("/api/account/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: customerName,
            phone: customerPhone,
          }),
        }).catch(() => {});
      }

      disableGuard?.();
      if (isCOD) {
        router.push(`/orders/${data.data.orderId}/confirmation?cod=true`);
      } else {
        window.location.href = data.data.sessionUrl;
      }
    } catch (err) {
      // Phase 110 CFIX-04 — AbortError branch. The 10s timer (or manual
      // retry) fired controller.abort() before the response arrived.
      // Show a persistent toast + banner with a Retry button that
      // re-invokes handleCheckout (preserving the idempotency key).
      if (err instanceof Error && err.name === "AbortError") {
        if (stripeTimeoutIdRef.current !== null) {
          clearTimeout(stripeTimeoutIdRef.current);
          stripeTimeoutIdRef.current = null;
        }
        setError({
          code: ClientErrorCodes.CHECKOUT_NETWORK_TIMEOUT,
          message:
            "Payment is taking longer than expected. Your network may be slow. Please try again — your order has not been charged.",
        });
        toast({
          title: "Checkout timed out",
          description:
            "We couldn't reach the payment service in time. Tap Retry to try again — you haven't been charged.",
          variant: "destructive",
          persistent: true,
        });
        setIsCreatingSession(false);
        return;
      }

      if (stripeTimeoutIdRef.current !== null) {
        clearTimeout(stripeTimeoutIdRef.current);
        stripeTimeoutIdRef.current = null;
      }
      setError({
        code: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "An error occurred",
      });
      setIsCreatingSession(false);
    }
  }, [
    addressId,
    delivery,
    canProceed,
    cutoffModalOpen,
    items,
    customerNotes,
    tipCents,
    promoCode,
    promoApplied,
    deliveryInstructions,
    paymentMethod,
    customerPhone,
    customerName,
    onCutoffPassed,
    disableGuard,
    isCOD,
    router,
    saveToProfileRef,
  ]);

  return { isCreatingSession, error, setError, handleCheckout };
}
