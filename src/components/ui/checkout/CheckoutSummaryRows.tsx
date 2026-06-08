"use client";

import { m } from "framer-motion";

import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

/** A ledger row: muted label left, value right; subtle slide-in. */
export function LedgerRow({
  label,
  children,
  shouldAnimate,
  delay = 0,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  shouldAnimate: boolean;
  delay?: number;
}) {
  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, x: -10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
      transition={{ delay, type: "spring", stiffness: 300, damping: 25 }}
      className="flex justify-between text-sm text-hero-ink-muted"
    >
      <span>{label}</span>
      {children}
    </m.div>
  );
}

/** A gentle fade/rise wrapper for the delivery-status callouts. */
export function FadeRow({
  children,
  shouldAnimate,
  getSpring,
}: {
  children: React.ReactNode;
  shouldAnimate: boolean;
  getSpring: ReturnType<typeof useAnimationPreference>["getSpring"];
}) {
  return (
    <m.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={getSpring(spring.gentle)}
    >
      {children}
    </m.div>
  );
}
