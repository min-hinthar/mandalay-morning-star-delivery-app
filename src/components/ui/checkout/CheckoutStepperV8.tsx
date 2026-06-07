"use client";

import type { CSSProperties } from "react";
import { MapPin, Clock, CreditCard } from "lucide-react";
import { m } from "framer-motion";
import { CHECKOUT_STEPS, type CheckoutStep } from "@/types/checkout";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

/**
 * Animated checkmark with draw-in effect using SVG pathLength.
 */
function AnimatedCheckmark({ shouldAnimate }: { shouldAnimate: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <m.path
        d="M20 6L9 17L4 12"
        initial={shouldAnimate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={shouldAnimate ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{
          pathLength: { duration: 0.3, ease: "easeOut" },
          opacity: { duration: 0.1 },
        }}
      />
    </svg>
  );
}

interface CheckoutStepperV8Props {
  currentStep: CheckoutStep;
  onStepClick?: (step: CheckoutStep) => void;
  className?: string;
}

type Triad = "clay" | "blue" | "sage";

interface StepMeta {
  label: string;
  my: string;
  icon: typeof MapPin;
  accent: Triad;
  varName: string;
}

/**
 * Step config — bilingual labels + a triad accent that cycles clay → blue →
 * sage (Anthropic's own guideline for non-text shapes).
 */
const STEP_CONFIG: Record<CheckoutStep, StepMeta> = {
  address: { label: "Address", my: "လိပ်စာ", icon: MapPin, accent: "clay", varName: "--hero-clay" },
  time: { label: "Time", my: "အချိန်", icon: Clock, accent: "blue", varName: "--hero-blue" },
  payment: { label: "Pay", my: "ငွေပေး", icon: CreditCard, accent: "sage", varName: "--hero-sage" },
};

const ACCENT_TEXT: Record<Triad, string> = {
  clay: "text-hero-clay",
  blue: "text-hero-blue",
  sage: "text-hero-sage",
};

/**
 * Checkout "After Dark" journey rail.
 *
 * A warm-paper progress rail: triad-cycling nodes (clay → blue → sage), a
 * connector that draws on with a gradient as you advance, a soft radial halo
 * (no blur — iOS GPU budget) on the active node, and a drawn checkmark on
 * completed steps. Completed nodes are clickable (back-navigation only).
 * 44px tap targets, bilingual labels, reduced-motion safe.
 */
export function CheckoutStepperV8({ currentStep, onStepClick, className }: CheckoutStepperV8Props) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const currentIndex = CHECKOUT_STEPS.indexOf(currentStep);

  return (
    <nav className={cn("w-full", className)} aria-label="Checkout progress">
      <ol className="mx-auto flex max-w-md items-start justify-between">
        {CHECKOUT_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isClickable = isCompleted && Boolean(onStepClick);
          const meta = STEP_CONFIG[step];
          const Icon = meta.icon;
          const isDone = isCompleted || isCurrent;

          return (
            <li key={step} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {/* Connector — left side, fills with a triad gradient */}
                {index > 0 && (
                  <div className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-hero-line/60">
                    <m.div
                      className="h-full rounded-full"
                      style={{
                        background:
                          "linear-gradient(90deg, var(--hero-clay), var(--hero-blue), var(--hero-sage))",
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: isDone ? "100%" : "0%" }}
                      transition={getSpring(spring.rubbery)}
                    />
                  </div>
                )}

                {/* Node */}
                <div className="relative">
                  {/* Active halo — radial-gradient falloff (no blur) */}
                  {isCurrent && shouldAnimate && (
                    <m.span
                      aria-hidden="true"
                      className="absolute -inset-2 rounded-full"
                      style={
                        {
                          background: `radial-gradient(circle, var(${meta.varName}) 0%, transparent 68%)`,
                        } as CSSProperties
                      }
                      initial={{ opacity: 0.25, scale: 0.9 }}
                      animate={{ opacity: [0.28, 0.12, 0.28], scale: [0.95, 1.12, 0.95] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}

                  <m.button
                    type="button"
                    onClick={() => isClickable && onStepClick?.(step)}
                    disabled={!isClickable}
                    whileHover={shouldAnimate && isClickable ? { scale: 1.08 } : undefined}
                    whileTap={shouldAnimate && isClickable ? { scale: 0.94 } : undefined}
                    transition={getSpring(spring.snappy)}
                    className={cn(
                      "relative flex h-11 w-11 items-center justify-center rounded-full",
                      "font-body text-sm font-bold transition-colors duration-200",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-hero-accent focus-visible:ring-offset-2",
                      isCompleted &&
                        "cursor-pointer border border-hero-line bg-hero-card text-hero-accent shadow-sm",
                      isCurrent && "border-2 border-hero-accent/40 bg-hero-card shadow-md",
                      !isDone && "border border-hero-line bg-hero-card/70 text-hero-ink-muted"
                    )}
                    aria-current={isCurrent ? "step" : undefined}
                    aria-label={`${meta.label}${isCompleted ? " (completed)" : ""}`}
                  >
                    {isCompleted ? (
                      <m.span
                        className="text-hero-accent"
                        initial={shouldAnimate ? { scale: 0, rotate: -90 } : undefined}
                        animate={shouldAnimate ? { scale: 1, rotate: 0 } : undefined}
                        transition={getSpring(spring.ultraBouncy)}
                      >
                        <AnimatedCheckmark shouldAnimate={shouldAnimate} />
                      </m.span>
                    ) : (
                      <Icon
                        className={cn("h-[18px] w-[18px]", isCurrent && ACCENT_TEXT[meta.accent])}
                        aria-hidden="true"
                      />
                    )}
                  </m.button>
                </div>

                {/* Connector — right side */}
                {index < CHECKOUT_STEPS.length - 1 && (
                  <div className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-hero-line/60">
                    <m.div
                      className="h-full rounded-full"
                      style={{
                        background:
                          "linear-gradient(90deg, var(--hero-clay), var(--hero-blue), var(--hero-sage))",
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: isCompleted ? "100%" : "0%" }}
                      transition={getSpring(spring.rubbery)}
                    />
                  </div>
                )}
              </div>

              {/* Bilingual label */}
              <m.span
                initial={shouldAnimate ? { opacity: 0, y: 4 } : undefined}
                animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
                transition={{ delay: index * 0.08, ...getSpring(spring.gentle) }}
                className={cn(
                  "mt-2 flex flex-col items-center gap-0.5 text-center transition-colors duration-200",
                  isCurrent ? "text-hero-ink" : "text-hero-ink-muted"
                )}
              >
                <span className="font-body text-2xs font-bold uppercase tracking-wider">
                  {meta.label}
                </span>
                <span className="font-burmese text-[0.65rem] leading-none opacity-80" lang="my">
                  {meta.my}
                </span>
              </m.span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
