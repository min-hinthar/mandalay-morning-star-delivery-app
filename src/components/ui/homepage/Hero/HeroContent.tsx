"use client";

/**
 * HeroContent Component
 *
 * The text/CTA overlay content for the Hero section.
 * Bilingual EN/MY display with multi-day delivery support.
 */

import Link from "next/link";
import { m } from "framer-motion";
import { ArrowRight, CalendarClock, Truck } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useDynamicTheme } from "@/components/ui/theme";
import { useDeliveryGate, useDeliveryGateMultiDay } from "@/lib/hooks/useDeliveryGate";
import { Button } from "@/components/ui/button";
import { COVERAGE_LIMITS } from "@/types/address";
import { formatDeliveryDaysList, getNextCutoffText } from "@/lib/utils/delivery-schedule";
import { AnimatedHeadline } from "./HeroSubComponents";
import { HeroStatBand } from "./HeroStatBand";
import { HeroCountdown } from "./HeroCountdown";
import { HeroSunburst } from "./HeroSunburst";
import { useMagnetic, useTilt } from "./interactions";
import type { DeliveryDayConfig } from "@/types/delivery";

/** Day names for cutoff display */
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Format hour as 12-hour time (e.g., "3 PM") */
function formatCutoffHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:00 ${period}`;
}

interface HeroContentProps {
  headline: string;
  tagline: string;
  subheadline: string;
  ctaText: string;
  ctaHref: string;
  deliveryFeeCents?: number;
  freeDeliveryThresholdCents?: number;
  cutoffDay?: number;
  cutoffHour?: number;
  deliveryDays?: DeliveryDayConfig[];
  longDistanceFeeCents?: number;
  longDistanceThresholdMiles?: number;
  deliveriesThisMonth?: number;
}

export function HeroContent({
  headline,
  tagline,
  subheadline,
  ctaText,
  ctaHref,
  deliveryFeeCents,
  freeDeliveryThresholdCents,
  cutoffDay,
  cutoffHour,
  deliveryDays,
  longDistanceFeeCents,
  longDistanceThresholdMiles,
  deliveriesThisMonth = 0,
}: HeroContentProps) {
  const { shouldAnimate } = useAnimationPreference();
  const { timeOfDay } = useDynamicTheme();
  const ctaMagnet = useMagnetic(0.3);
  const cardTilt = useTilt(5);

  // Use multi-day gate if deliveryDays available, fallback to legacy
  const multiDayGate = useDeliveryGateMultiDay(deliveryDays ?? []);
  const legacyGate = useDeliveryGate(cutoffDay ?? 5, cutoffHour ?? 15);
  const gate = deliveryDays && deliveryDays.length > 0 ? multiDayGate : legacyGate;

  // Dynamic delivery schedule text
  const deliveryDaysList = deliveryDays ? formatDeliveryDaysList(deliveryDays) : "Saturday";

  // Dynamic CTA text based on gate state
  const dynamicCtaText = gate.isOpen ? ctaText : `Pre-Order for ${gate.deliveryDate.displayDate}`;

  // Compute delivery schedule text
  const deliveryScheduleText = gate.isOpen
    ? deliveryDays && deliveryDays.length > 0
      ? `Delivery on ${deliveryDaysList}`
      : cutoffDay !== undefined && cutoffHour !== undefined
        ? `Order by ${DAY_NAMES[cutoffDay]} ${formatCutoffHour(cutoffHour)}`
        : "Every Saturday"
    : `Orders closed — next ${gate.deliveryDate.displayDate}`;

  // Fee values (dollars) for the stat band
  const toDollars = (cents?: number) => (cents !== undefined ? Math.round(cents / 100) : undefined);
  const deliveryFeeDollars = toDollars(deliveryFeeCents);
  const freeThresholdDollars = toDollars(freeDeliveryThresholdCents);
  const longDistanceFeeDollars = toDollars(longDistanceFeeCents);

  // Bilingual greetings
  const greetings: Record<string, { en: string; my: string }> = {
    morning: { en: "Good morning!", my: "မင်္ဂလာပါ နံနက်ခင်းလေးပါ" },
    afternoon: { en: "Good afternoon!", my: "နေ့လည်ခင်းလေး မင်္ဂလာပါ" },
    evening: { en: "Good evening!", my: "ညနေခင်းလေး မင်္ဂလာပါ" },
    night: { en: "Late night cravings?", my: "ညဥ့နက်ကြီး ဗိုက်ဆာနေပြီလား" },
    dawn: { en: "Early bird?", my: "စောစောထတာပဲ" },
  };
  const greeting = greetings[timeOfDay] ?? greetings.morning;

  return (
    <div className="relative flex flex-col items-center justify-start px-4 pt-16 pb-12 pb-safe md:pt-24 md:pb-16">
      <div className="max-w-4xl mx-auto text-center">
        {/* Editorial masthead — Fraunces serif, ink on frosted paper */}
        <div className="relative mx-auto mb-7 max-w-3xl animate-hero-develop-1">
          <div className="relative overflow-hidden rounded-3xl hero-surface-glass px-6 py-7 text-center md:px-10 md:py-9">
            {/* Paper grain */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-3xl opacity-[0.06] mix-blend-multiply hero-paper-grain"
            />
            {/* Kicker */}
            <div className="relative mb-3 flex items-center justify-center gap-2 text-hero-accent">
              <HeroSunburst className="h-4 w-4 text-hero-clay" rays={8} />
              <span className="text-2xs font-semibold uppercase tracking-[0.2em] md:text-xs">
                {greeting.en} · Straight from our Covina kitchen
              </span>
            </div>
            {/* Hairline rule */}
            <div className="relative mx-auto mb-5 h-px w-24 bg-hero-line" />
            {/* EN headline — Fraunces serif, ink, clay italic accent word */}
            <AnimatedHeadline
              text={headline}
              highlight="Burmese"
              className="relative font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-hero-ink leading-[1.04]"
            />
            {/* MY headline */}
            <p className="relative mt-3 font-burmese text-lg md:text-2xl text-hero-ink-muted leading-snug">
              အိမ်ချက်ထမင်းဟင်း လွမ်းနေပြီလား · LA တစ်ခွင် အိမ်ရောက်ပို့ပေးမယ်
            </p>
          </div>
        </div>

        {/* EN Tagline */}
        <p className="text-lg md:text-xl text-hero-text/70 font-medium mb-1 animate-hero-develop-2">
          {tagline}
        </p>
        {/* MY Tagline */}
        <p className="text-base md:text-lg text-hero-text/60 font-medium mb-4 animate-hero-develop-3">
          အိမ်ချက်ထမင်းဟင်းအရသာအတိုင်း ချက်ပြုတ်ပြီး ပို့ပေးပါတယ်
        </p>

        {/* EN Subheadline */}
        <p className="text-lg md:text-xl text-hero-text/80 max-w-2xl mx-auto mb-2 font-body animate-hero-develop-3">
          {subheadline}
        </p>
        {/* MY Subheadline */}
        <p className="text-base md:text-lg text-hero-text/65 max-w-2xl mx-auto mb-8 font-body animate-hero-develop-4">
          {deliveryDaysList} တိုင်း လတ်လတ်ဆတ်ဆတ် ချက်ပြုတ်ပြီး အိမ်ရောက်ပို့ပေးပါတယ်
        </p>

        <div className="flex flex-col items-center gap-6 mb-10 animate-hero-develop-5">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <m.div
              className="relative"
              whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.97 } : undefined}
              transition={spring.snappy}
              style={{ x: ctaMagnet.x, y: ctaMagnet.y }}
              onPointerMove={ctaMagnet.onPointerMove}
              onPointerLeave={ctaMagnet.onPointerLeave}
            >
              {/* Pulsing sunset glow halo */}
              {shouldAnimate && (
                <m.span
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-2.5 rounded-full bg-gradient-to-r from-amber-400/50 via-secondary/50 to-orange-400/50 blur-xl"
                  animate={{ opacity: [0.45, 0.8, 0.45], scale: [0.97, 1.03, 0.97] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <Button
                variant="primary"
                size="lg"
                asChild
                className={cn(
                  "relative overflow-hidden group px-8 py-6 text-lg rounded-full",
                  "bg-gradient-to-br from-hero-clay to-hero-clay-2",
                  "hover:from-hero-clay-2 hover:to-hero-clay",
                  "shadow-lg shadow-hero-clay/40",
                  "hover:shadow-xl hover:shadow-hero-clay/60",
                  "hover:ring-2 hover:ring-hero-ink/15",
                  "transition-all duration-300"
                )}
              >
                <Link href={ctaHref}>
                  {/* Press glow (ripple-style flash from center) */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-full bg-hero-card opacity-0 scale-50 transition-[opacity,transform] duration-500 ease-out group-active:opacity-30 group-active:scale-100"
                  />
                  {/* Periodic shine sweep (paused under reduced motion) */}
                  {shouldAnimate && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/45 to-transparent animate-shine-sweep"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2 text-hero-ink font-semibold">
                    {dynamicCtaText}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </Button>
            </m.div>
          </div>

          {/* Delivery Info Card — tinted vellum surface */}
          <m.div
            initial={shouldAnimate ? { opacity: 0, y: 16, scale: 0.97 } : undefined}
            animate={shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : undefined}
            transition={shouldAnimate ? { delay: 0.3, ...spring.snappy } : undefined}
            whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
            onPointerMove={cardTilt.onPointerMove}
            onPointerLeave={cardTilt.onPointerLeave}
            style={{
              rotateX: cardTilt.rotateX,
              rotateY: cardTilt.rotateY,
              transformPerspective: 1000,
            }}
            className="relative w-full max-w-lg rounded-2xl p-6 hero-surface-vellum"
          >
            {/* Drifting paper grain texture */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.07] mix-blend-multiply hero-paper-grain hero-grain-drift"
            />
            {gate.isOpen ? (
              <>
                {/* Row 1: Next delivery date + countdown */}
                <div className="flex items-center justify-between mb-4">
                  <m.div
                    className="flex items-center gap-3"
                    whileHover={shouldAnimate ? { x: 2 } : undefined}
                    transition={spring.snappy}
                  >
                    <m.div
                      animate={shouldAnimate ? { rotate: [0, -8, 8, 0] } : undefined}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
                    >
                      <CalendarClock className="w-6 h-6 text-hero-clay flex-shrink-0" />
                    </m.div>
                    <span className="text-xl md:text-2xl font-bold text-hero-ink">
                      {gate.deliveryDate.displayDate}
                    </span>
                  </m.div>
                  <HeroCountdown
                    cutoffDate={gate.cutoffDate}
                    urgency={gate.urgency}
                    className="text-base"
                  />
                </div>

                {/* Row 2: Cutoff details */}
                <p className="text-base text-hero-ink mb-2 font-medium">
                  {deliveryDays && deliveryDays.length > 0 && gate.deliveryDayOfWeek !== undefined
                    ? getNextCutoffText(gate.deliveryDayOfWeek, deliveryDays)
                    : deliveryScheduleText}
                </p>
                <p className="text-sm text-hero-ink-muted mb-4">
                  နောက်ပို့မယ့်ရက် · အချိန်မီ မှာယူလိုက်ပါ
                </p>

                {/* Row 3: Delivery schedule */}
                <m.div
                  className="flex items-center gap-3 pt-3 border-t border-hero-line"
                  whileHover={shouldAnimate ? { x: 3 } : undefined}
                  transition={spring.snappy}
                >
                  <m.div
                    animate={shouldAnimate ? { x: [0, 4, 0] } : undefined}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
                  >
                    <Truck className="w-5 h-5 text-hero-sage flex-shrink-0" />
                  </m.div>
                  <span className="text-base font-semibold text-hero-ink">{deliveryDaysList}</span>
                  <span className="text-sm text-hero-ink-muted">
                    · {deliveryDaysList} တိုင်း ပို့ပေးပါတယ်
                  </span>
                </m.div>
              </>
            ) : (
              <>
                {/* Closed state */}
                <div className="flex items-center gap-3 mb-4">
                  <m.div
                    animate={shouldAnimate ? { scale: [1, 1.15, 1] } : undefined}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <CalendarClock className="w-6 h-6 text-amber-500 flex-shrink-0" />
                  </m.div>
                  <span className="text-xl md:text-2xl font-bold text-hero-ink">Orders Closed</span>
                </div>
                <p className="text-base text-hero-ink mb-1 font-medium">
                  Next delivery: {gate.deliveryDate.displayDate}
                </p>
                <p className="text-sm text-hero-ink-muted mb-4">
                  အော်ဒါပိတ်ထားပါတယ် · နောက်ပို့မယ့်ရက်ကို စောင့်ပါ
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-hero-line">
                  <Truck className="w-5 h-5 text-hero-sage flex-shrink-0" />
                  <span className="text-base font-semibold text-hero-ink">{deliveryDaysList}</span>
                  <span className="text-sm text-hero-ink-muted">
                    · {deliveryDaysList} တိုင်း ပို့ပေးပါတယ်
                  </span>
                </div>
              </>
            )}
          </m.div>
        </div>

        <HeroStatBand
          className="mt-2"
          deliveriesThisMonth={deliveriesThisMonth}
          coverageMiles={COVERAGE_LIMITS.maxDistanceMiles}
          coverageMinutes={COVERAGE_LIMITS.maxDurationMinutes}
          freeThresholdDollars={freeThresholdDollars}
          deliveryFeeDollars={deliveryFeeDollars}
          longDistanceFeeDollars={longDistanceFeeDollars}
          longDistanceMiles={longDistanceThresholdMiles}
        />
      </div>
    </div>
  );
}
