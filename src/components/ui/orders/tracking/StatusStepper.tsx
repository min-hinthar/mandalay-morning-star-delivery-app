"use client";

/**
 * StatusStepper — the After Dark delivery journey rail.
 *
 * Confirmed → Preparing → Out for Delivery → Delivered, as a warm-paper journey:
 * completed steps fill clay, the current step glows + pulses, the connecting line
 * fills toward the goal. Bilingual EN/MY. Skips "pending"; cancelled greys out
 * with a status badge. Keeps the accessible progressbar + sr-only live region.
 */

import { useRef } from "react";
import { m, useInView } from "framer-motion";
import { Check, ChefHat, Truck, Package, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { HeroCardLayers } from "@/components/ui/homepage/Hero/HeroCardLayers";
import type { OrderStatus } from "@/types/database";

interface StatusStepperProps {
  currentStatus: OrderStatus;
  cancelledAt?: string | null;
}

const STEPPER_STEPS: {
  status: OrderStatus;
  label: string;
  labelMy: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { status: "confirmed", label: "Confirmed", labelMy: "အတည်ပြု", icon: ShieldCheck },
  { status: "preparing", label: "Preparing", labelMy: "ပြင်ဆင်", icon: ChefHat },
  { status: "out_for_delivery", label: "Out for Delivery", labelMy: "ပို့ဆောင်", icon: Truck },
  { status: "delivered", label: "Delivered", labelMy: "ရောက်ရှိ", icon: Package },
];

const STATUS_INDEX: Record<string, number> = {
  pending: -1,
  confirmed: 0,
  preparing: 1,
  out_for_delivery: 2,
  delivered: 3,
  cancelled: -1,
};

function getStepIndex(status: OrderStatus): number {
  return STATUS_INDEX[status] ?? -1;
}

export function StatusStepper({ currentStatus, cancelledAt }: StatusStepperProps) {
  const { shouldAnimate } = useAnimationPreference();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { margin: "0px 0px -10% 0px" });
  const loop = shouldAnimate && inView;

  const isCancelled = currentStatus === "cancelled" || !!cancelledAt;
  const activeIndex = getStepIndex(currentStatus);

  const ariaValue = isCancelled ? 0 : Math.max(0, activeIndex + 1);
  const ariaMax = STEPPER_STEPS.length;

  const statusText = isCancelled
    ? "Order cancelled"
    : (STEPPER_STEPS[activeIndex]?.label ?? "Order placed");

  return (
    <div ref={rootRef} className="hero-surface-paper relative overflow-hidden rounded-2xl p-4">
      <HeroCardLayers accent="clay" radius="rounded-2xl" />

      <div
        role="progressbar"
        aria-valuenow={ariaValue}
        aria-valuemin={0}
        aria-valuemax={ariaMax}
        aria-label="Order progress"
        className="relative"
      >
        <div className="flex items-start justify-between">
          {STEPPER_STEPS.map((step, index) => {
            const isCompleted = !isCancelled && activeIndex > index;
            const isCurrent = !isCancelled && activeIndex === index;
            const isFuture = isCancelled || activeIndex < index;
            const lineFilled = !isCancelled && activeIndex > index;
            // The frontier line leads INTO the active stop (last filled segment) —
            // the comet rides here. Skip when delivered (no further frontier).
            const isFrontierLine =
              !isCancelled &&
              activeIndex < STEPPER_STEPS.length - 1 &&
              index === activeIndex - 1;

            return (
              <div key={step.status} className="flex flex-1 items-start">
                <div className="flex flex-col items-center gap-1.5">
                  {/* Circle */}
                  {isCurrent ? (
                    <span className="relative flex h-9 w-9 items-center justify-center">
                      {loop && (
                        <m.span
                          aria-hidden="true"
                          className="absolute inset-0 rounded-full bg-hero-clay/40"
                          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                        />
                      )}
                      <m.span
                        // Arrival glow — a warm box-shadow pulse on the active stop
                        // (the frontier the journey has reached). Box-shadow blur is
                        // GPU-cheap (no filter blur). Loop gated shouldAnimate && inView.
                        animate={
                          loop
                            ? {
                                scale: [1, 1.1, 1],
                                boxShadow: [
                                  "0 0 0 0 rgba(217,119,87,0)",
                                  "0 0 16px 3px rgba(217,119,87,0.55)",
                                  "0 0 0 0 rgba(217,119,87,0)",
                                ],
                              }
                            : undefined
                        }
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-hero-clay shadow-md"
                      >
                        <step.icon className="h-4 w-4 text-hero-card-strong" />
                      </m.span>
                    </span>
                  ) : isCompleted ? (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-hero-clay">
                      <Check className="h-4 w-4 text-hero-card-strong" />
                    </span>
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-hero-line bg-hero-card/50">
                      <step.icon className="h-4 w-4 text-hero-ink-muted/60" />
                    </span>
                  )}

                  {/* Bilingual label */}
                  <span className="max-w-[76px] text-center leading-tight">
                    <span
                      className={cn(
                        "block text-2xs font-semibold",
                        isFuture ? "text-hero-ink-muted/70" : "text-hero-ink"
                      )}
                    >
                      {step.label}
                    </span>
                    <span
                      className={cn(
                        "block font-burmese text-2xs",
                        isFuture ? "text-hero-ink-muted/50" : "text-hero-ink-muted"
                      )}
                      lang="my"
                    >
                      {step.labelMy}
                    </span>
                  </span>
                </div>

                {/* Connecting line */}
                {index < STEPPER_STEPS.length - 1 && (
                  <div className="relative mx-1 mt-4 h-1 flex-1 overflow-hidden rounded-full bg-hero-ink/10">
                    <m.div
                      className="h-full rounded-full bg-hero-clay"
                      initial={shouldAnimate ? { scaleX: 0 } : undefined}
                      animate={shouldAnimate ? { scaleX: lineFilled ? 1 : 0 } : undefined}
                      style={{ transformOrigin: "left center" }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    />
                    {/* Journey comet — a warm gradient streak that travels along the
                        FILLED segment at the current frontier (the line leading into
                        the active stop). Pure gradient strip (no blur). Loop gated. */}
                    {loop && isFrontierLine && (
                      <m.span
                        aria-hidden="true"
                        className="absolute top-0 h-full w-1/3 rounded-full"
                        style={{
                          background:
                            "linear-gradient(to right, transparent, rgba(251,191,36,0.85))",
                        }}
                        initial={{ left: "-33%" }}
                        animate={{ left: ["-33%", "100%"] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cancelled badge */}
      {isCancelled && (
        <div className="relative mt-3 flex justify-center">
          <span className="rounded-full bg-status-error/10 px-3 py-1 text-xs font-semibold text-status-error">
            Cancelled · ပယ်ဖျက်
          </span>
        </div>
      )}

      {/* Screen reader live region */}
      <div aria-live="polite" className="sr-only">
        Current status: {statusText}
      </div>
    </div>
  );
}

export type { StatusStepperProps };
