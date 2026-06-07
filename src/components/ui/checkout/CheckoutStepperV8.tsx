"use client";

import { type CSSProperties, useRef } from "react";
import { MapPin, Clock, CreditCard } from "lucide-react";
import { m, useInView } from "framer-motion";
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
      className="h-[18px] w-[18px]"
      aria-hidden="true"
    >
      <m.path
        d="M20 6L9 17L4 12"
        initial={shouldAnimate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={shouldAnimate ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{
          pathLength: { duration: 0.32, ease: "easeOut" },
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
  /** Filled-node gradient for the active step. */
  fill: string;
}

/**
 * Step config — bilingual labels + a triad accent that cycles clay → blue →
 * sage (Anthropic's own guideline for non-text shapes).
 */
const STEP_CONFIG: Record<CheckoutStep, StepMeta> = {
  address: {
    label: "Address",
    my: "လိပ်စာ",
    icon: MapPin,
    accent: "clay",
    fill: "linear-gradient(135deg, var(--hero-clay), var(--hero-accent-strong))",
  },
  time: {
    label: "Time",
    my: "အချိန်",
    icon: Clock,
    accent: "blue",
    fill: "linear-gradient(135deg, var(--hero-blue), #4d7cb0)",
  },
  payment: {
    label: "Pay",
    my: "ငွေပေး",
    icon: CreditCard,
    accent: "sage",
    fill: "linear-gradient(135deg, var(--hero-sage), #5d7343)",
  },
};

const ACCENT_VAR: Record<Triad, string> = {
  clay: "--hero-clay",
  blue: "--hero-blue",
  sage: "--hero-sage",
};

/** A single connector segment that fills with the flowing progress gradient. */
function Connector({
  filled,
  getSpring,
}: {
  filled: boolean;
  getSpring: ReturnType<typeof useAnimationPreference>["getSpring"];
}) {
  return (
    <div className="checkout-hairline relative mx-0.5 h-[3px] flex-1 overflow-hidden rounded-full">
      <m.div
        className="checkout-progress-fill h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: filled ? "100%" : "0%" }}
        transition={getSpring(spring.rubbery)}
      />
    </div>
  );
}

/**
 * Checkout "After Dark" journey rail.
 *
 * Filled triad nodes (clay → blue → sage) — current node is a glowing gradient
 * coin with a pulsing radial halo + animated icon; completed nodes are filled
 * with a drawn check (clickable, back-nav only); upcoming nodes are faint
 * outlines. The connector is a vivid clay→amber→sage progress bar with a
 * flowing shimmer + glow. Theme-aware labels, 44px taps, reduced-motion safe.
 */
export function CheckoutStepperV8({ currentStep, onStepClick, className }: CheckoutStepperV8Props) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const currentIndex = CHECKOUT_STEPS.indexOf(currentStep);

  // Gate the perpetual halo/icon loops to on-screen only — per the project
  // gotcha, framer `repeat: Infinity` JS loops keep ticking offscreen (unlike
  // `.hero-anim-paused`, which only halts CSS). useInView stops them once the
  // rail scrolls away on a tall step.
  const navRef = useRef<HTMLElement>(null);
  const inView = useInView(navRef, { margin: "0px 0px -20% 0px" });
  const loop = shouldAnimate && inView;

  return (
    <nav ref={navRef} className={cn("w-full", className)} aria-label="Checkout progress">
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
                {index > 0 && <Connector filled={isDone} getSpring={getSpring} />}

                {/* Node */}
                <div className="relative shrink-0">
                  {/* Active halo — radial-gradient falloff (no blur) */}
                  {isCurrent && loop && (
                    <m.span
                      aria-hidden="true"
                      className="absolute -inset-2.5 rounded-full"
                      style={
                        {
                          background: `radial-gradient(circle, var(${ACCENT_VAR[meta.accent]}) 0%, transparent 68%)`,
                        } as CSSProperties
                      }
                      initial={{ opacity: 0.3, scale: 0.9 }}
                      animate={{ opacity: [0.32, 0.14, 0.32], scale: [0.95, 1.18, 0.95] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}

                  <m.button
                    type="button"
                    onClick={() => isClickable && onStepClick?.(step)}
                    disabled={!isClickable}
                    initial={shouldAnimate ? { scale: 0.6, opacity: 0 } : undefined}
                    animate={
                      shouldAnimate ? { scale: isCurrent ? 1.08 : 1, opacity: 1 } : undefined
                    }
                    whileHover={shouldAnimate && isClickable ? { scale: 1.14 } : undefined}
                    whileTap={shouldAnimate && isClickable ? { scale: 0.94 } : undefined}
                    transition={getSpring(spring.ultraBouncy)}
                    style={isDone ? ({ backgroundImage: meta.fill } as CSSProperties) : undefined}
                    className={cn(
                      "relative flex h-11 w-11 items-center justify-center rounded-full",
                      "transition-shadow duration-200",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-hero-accent focus-visible:ring-offset-2",
                      isCurrent && "checkout-node-active",
                      isCompleted && "checkout-node-done cursor-pointer",
                      !isDone && "checkout-hairline-border border bg-transparent"
                    )}
                    aria-current={isCurrent ? "step" : undefined}
                    aria-label={`${meta.label}${isCompleted ? " (completed)" : isCurrent ? " (current)" : ""}`}
                  >
                    {isCompleted ? (
                      <span className="text-hero-card">
                        <AnimatedCheckmark shouldAnimate={shouldAnimate} />
                      </span>
                    ) : isCurrent ? (
                      <m.span
                        className="text-hero-card"
                        animate={loop ? { y: [0, -1.5, 0], rotate: [0, -4, 4, 0] } : undefined}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Icon className="h-[19px] w-[19px]" aria-hidden="true" strokeWidth={2.4} />
                      </m.span>
                    ) : (
                      <Icon className="checkout-ink-muted h-[18px] w-[18px]" aria-hidden="true" />
                    )}
                  </m.button>
                </div>

                {index < CHECKOUT_STEPS.length - 1 && (
                  <Connector filled={isCompleted} getSpring={getSpring} />
                )}
              </div>

              {/* Bilingual label */}
              <m.span
                initial={shouldAnimate ? { opacity: 0, y: 4 } : undefined}
                animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
                transition={{ delay: index * 0.08, ...getSpring(spring.gentle) }}
                className={cn(
                  "mt-2.5 flex flex-col items-center gap-0.5 text-center transition-opacity",
                  isCurrent ? "checkout-ink opacity-100" : "checkout-ink-muted"
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
