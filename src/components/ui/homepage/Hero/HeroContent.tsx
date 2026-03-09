"use client";

/**
 * HeroContent Component
 *
 * The text/CTA overlay content for the Hero section.
 * Bilingual EN/MY display with multi-day delivery support.
 */

import Link from "next/link";
import { m } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  ChefHat,
  Clock,
  MapPin,
  Truck,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useDynamicTheme } from "@/components/ui/theme";
import { useDeliveryGate, useDeliveryGateMultiDay } from "@/lib/hooks/useDeliveryGate";
import { DeliveryCountdown } from "@/components/ui/delivery";
import { Button } from "@/components/ui/button";
import { formatDeliveryDaysList, getNextCutoffText } from "@/lib/utils/delivery-schedule";
import { AnimatedHeadline, StatItem } from "./HeroSubComponents";
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
}: HeroContentProps) {
  const { shouldAnimate } = useAnimationPreference();
  const { timeOfDay } = useDynamicTheme();

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

  const deliveryFeeText =
    deliveryFeeCents !== undefined && freeDeliveryThresholdCents !== undefined
      ? `$${(deliveryFeeCents / 100).toFixed(0)} delivery, free over $${(freeDeliveryThresholdCents / 100).toFixed(0)}`
      : undefined;

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
    <div className="relative flex flex-col items-center justify-start px-4 pt-16 pb-56 pb-safe md:pt-24 md:pb-48">
      <div className="max-w-4xl mx-auto text-center">
        {/* Time-based greeting badge - bilingual */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-hero-stat-bg sm:backdrop-blur-md border border-hero-text/20 animate-fade-in-up-delay-1">
          <span className="text-secondary">{greeting.en}</span>
          <span className="text-sm text-hero-text/70 font-medium">{greeting.my}</span>
        </div>

        {/* EN Headline */}
        <AnimatedHeadline
          text={headline}
          className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-hero-text mb-2 leading-tight"
        />
        {/* MY Headline */}
        <p className="font-body text-2xl md:text-3xl lg:text-4xl text-hero-text/80 mb-4 animate-fade-in-up-delay-1">
          အိမ်ချက်ထမင်းဟင်း လွမ်းနေပြီလား · LA တစ်ခွင် အိမ်ရောက်ပို့ပေးမယ်
        </p>

        {/* EN Tagline */}
        <p className="text-lg md:text-xl text-hero-text/70 font-medium mb-1 animate-fade-in-up-delay-1">
          {tagline}
        </p>
        {/* MY Tagline */}
        <p className="text-base md:text-lg text-hero-text/60 font-medium mb-6 animate-fade-in-up-delay-1">
          အိမ်ချက်ထမင်းဟင်းအရသာအတိုင်း ချက်ပြုတ်ပြီး ပို့ပေးပါတယ်
        </p>

        {/* EN Subheadline */}
        <p className="text-lg md:text-xl text-hero-text/80 max-w-2xl mx-auto mb-2 font-body animate-fade-in-up-delay-2">
          {subheadline}
        </p>
        {/* MY Subheadline */}
        <p className="text-base md:text-lg text-hero-text/65 max-w-2xl mx-auto mb-10 font-body animate-fade-in-up-delay-2">
          {deliveryDaysList} တိုင်း လတ်လတ်ဆတ်ဆတ် ချက်ပြုတ်ပြီး အိမ်ရောက်ပို့ပေးပါတယ်
        </p>

        <div className="flex flex-col items-center gap-5 mb-12 animate-fade-in-up-delay-3">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <m.div
              whileHover={shouldAnimate ? { scale: 1.05, y: -2 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.97 } : undefined}
              transition={spring.snappy}
            >
              <Button
                variant="primary"
                size="lg"
                asChild
                className={cn(
                  "relative overflow-hidden group px-8 py-6 text-lg rounded-full",
                  "bg-gradient-to-r from-secondary via-secondary-hover to-secondary",
                  "hover:from-secondary-hover hover:via-secondary hover:to-secondary-hover",
                  "shadow-lg shadow-secondary/30",
                  "hover:shadow-xl hover:shadow-secondary/40",
                  "hover:ring-2 hover:ring-secondary/30",
                  "transition-all duration-300"
                )}
              >
                <Link href={ctaHref}>
                  <span className="relative z-10 flex items-center gap-2 text-text-primary font-semibold">
                    {dynamicCtaText}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </Button>
            </m.div>
          </div>

          {/* Delivery Info Card */}
          <m.div
            initial={shouldAnimate ? { opacity: 0, y: 16, scale: 0.97 } : undefined}
            animate={shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : undefined}
            transition={shouldAnimate ? { delay: 0.3, ...spring.snappy } : undefined}
            whileHover={shouldAnimate ? { scale: 1.02, y: -2 } : undefined}
            className={cn(
              "w-full max-w-lg rounded-2xl p-6",
              "bg-hero-stat-bg/80 sm:backdrop-blur-md",
              "border border-hero-text/20",
              "shadow-lg shadow-black/10",
              "transition-shadow duration-300 hover:shadow-xl hover:shadow-black/15"
            )}
          >
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
                      <CalendarClock className="w-6 h-6 text-secondary flex-shrink-0" />
                    </m.div>
                    <span className="text-xl md:text-2xl font-bold text-hero-text">
                      {gate.deliveryDate.displayDate}
                    </span>
                  </m.div>
                  <DeliveryCountdown
                    cutoffDate={gate.cutoffDate}
                    urgency={gate.urgency}
                    className="text-base"
                  />
                </div>

                {/* Row 2: Cutoff details */}
                <p className="text-base text-hero-text/80 mb-2 font-medium">
                  {deliveryDays && deliveryDays.length > 0 && gate.deliveryDayOfWeek !== undefined
                    ? getNextCutoffText(gate.deliveryDayOfWeek, deliveryDays)
                    : deliveryScheduleText}
                </p>
                <p className="text-sm text-hero-text/60 mb-4">
                  နောက်ပို့မယ့်ရက် · အချိန်မီ မှာယူလိုက်ပါ
                </p>

                {/* Row 3: Delivery schedule */}
                <m.div
                  className="flex items-center gap-3 pt-3 border-t border-hero-text/10"
                  whileHover={shouldAnimate ? { x: 3 } : undefined}
                  transition={spring.snappy}
                >
                  <m.div
                    animate={shouldAnimate ? { x: [0, 4, 0] } : undefined}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
                  >
                    <Truck className="w-5 h-5 text-secondary/70 flex-shrink-0" />
                  </m.div>
                  <span className="text-base font-semibold text-hero-text/80">
                    {deliveryDaysList}
                  </span>
                  <span className="text-sm text-hero-text/50">
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
                  <span className="text-xl md:text-2xl font-bold text-hero-text">
                    Orders Closed
                  </span>
                </div>
                <p className="text-base text-hero-text/80 mb-1 font-medium">
                  Next delivery: {gate.deliveryDate.displayDate}
                </p>
                <p className="text-sm text-hero-text/60 mb-4">
                  အော်ဒါပိတ်ထားပါတယ် · နောက်ပို့မယ့်ရက်ကို စောင့်ပါ
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-hero-text/10">
                  <Truck className="w-5 h-5 text-secondary/70 flex-shrink-0" />
                  <span className="text-base font-semibold text-hero-text/80">
                    {deliveryDaysList}
                  </span>
                  <span className="text-sm text-hero-text/50">
                    · {deliveryDaysList} တိုင်း ပို့ပေးပါတယ်
                  </span>
                </div>
              </>
            )}
          </m.div>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto md:grid-cols-4 md:max-w-3xl animate-fade-in-up-delay-4">
          <StatItem
            icon={<ChefHat className="w-5 h-5 text-secondary" />}
            label="Authentic"
            value="Burmese Recipes"
            subValue="မြန်မာ့ရိုးရာ ချက်နည်းများ"
          />
          <StatItem
            icon={<Clock className="w-5 h-5 text-secondary" />}
            label="Delivery"
            value={deliveryScheduleText}
            subValue={`${deliveryDaysList} တိုင်း ပို့ပေးပါတယ်`}
          />
          <StatItem
            icon={<MapPin className="w-5 h-5 text-secondary" />}
            label="Coverage"
            value="Greater Los Angeles"
            subValue="LA ပတ်ဝန်းကျင် မိုင် ၅၀ အတွင်း"
          />
          {deliveryFeeText && (
            <StatItem
              icon={<Truck className="w-5 h-5 text-secondary" />}
              label="Fee"
              value={deliveryFeeText}
              subValue="$၁၀၀ အထက်ဆို အခမဲ့ပို့ပေးတယ်"
            />
          )}
        </div>
      </div>

      <m.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
        initial={shouldAnimate ? { opacity: 0 } : undefined}
        animate={shouldAnimate ? { opacity: 1 } : undefined}
        transition={{ delay: 1.5 }}
      >
        <m.div
          className="flex flex-col items-center gap-1 text-hero-text-muted cursor-pointer"
          animate={shouldAnimate ? { y: [0, 8, 0] } : undefined}
          transition={{ duration: 2, repeat: 5, ease: "easeInOut" }}
          onClick={() => {
            document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
          }}
          role="button"
          aria-label="Scroll to learn more"
        >
          <span className="text-xs uppercase tracking-widest">Scroll · အောက်ကိုဆင်းကြည့်ပါ</span>
          <ChevronDown className="w-6 h-6" />
        </m.div>
      </m.div>
    </div>
  );
}
