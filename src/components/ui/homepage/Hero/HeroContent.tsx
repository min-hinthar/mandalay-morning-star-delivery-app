"use client";

/**
 * HeroContent Component
 *
 * The text/CTA overlay content for the Hero section.
 * Bilingual EN/MY display with multi-day delivery support.
 */

import Link from "next/link";
import { m } from "framer-motion";
import { ArrowRight, ChefHat, Clock, MapPin, Truck, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useDynamicTheme } from "@/components/ui/theme";
import { useDeliveryGate, useDeliveryGateMultiDay } from "@/lib/hooks/useDeliveryGate";
import { DeliveryCountdown } from "@/components/ui/delivery";
import { Button } from "@/components/ui/button";
import { formatDeliveryDaysList } from "@/lib/utils/delivery-schedule";
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
    morning: { en: "Good morning!", my: "မင်္ဂလာနံနက်ခင်းပါ" },
    afternoon: { en: "Good afternoon!", my: "မင်္ဂလာနေ့လည်ခင်းပါ" },
    evening: { en: "Good evening!", my: "မင်္ဂလာညနေခင်းပါ" },
    night: { en: "Late night cravings?", my: "ညဥ့နက်ကြီး ဗိုက်ဆာနေလား" },
    dawn: { en: "Early bird?", my: "စောစောထနိုင်သူလား" },
  };
  const greeting = greetings[timeOfDay] ?? greetings.morning;

  return (
    <div className="relative flex flex-col items-center justify-start px-4 pt-24 pb-32 pb-safe md:pt-28 md:pb-32">
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
          သင့်အိမ်တံခါးဝအထိ ပို့ဆောင်ပေးသော စစ်မှန်သည့် မြန်မာ့အစားအသောက်
        </p>

        {/* EN Tagline */}
        <p className="text-lg md:text-xl text-hero-text/70 font-medium mb-1 animate-fade-in-up-delay-1">
          {tagline}
        </p>
        {/* MY Tagline */}
        <p className="text-base md:text-lg text-hero-text/60 font-medium mb-6 animate-fade-in-up-delay-1">
          စစ်မှန်သော မြန်မာအစားအသောက် ပို့ဆောင်ပေးပါသည်
        </p>

        {/* EN Subheadline */}
        <p className="text-lg md:text-xl text-hero-text/80 max-w-2xl mx-auto mb-2 font-body animate-fade-in-up-delay-2">
          {subheadline}
        </p>
        {/* MY Subheadline */}
        <p className="text-base md:text-lg text-hero-text/65 max-w-2xl mx-auto mb-10 font-body animate-fade-in-up-delay-2">
          မြန်မာ့ရသပြည့်ဝသော အစားအသောက်များကို {deliveryDaysList} တွင် လတ်ဆတ်စွာ ချက်ပြုတ်ပြီး
          ပို့ဆောင်ပေးပါသည်
        </p>

        <div className="flex flex-col items-center gap-3 mb-12 animate-fade-in-up-delay-3">
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

          {/* Next delivery date + cutoff info */}
          {gate.isOpen && (
            <p className="text-base font-semibold text-hero-text">
              Next delivery: {gate.deliveryDate.displayDate}
              <span className="mx-2 text-hero-text/40">|</span>
              <span className="font-medium text-hero-text/80">{deliveryScheduleText}</span>
            </p>
          )}

          {/* Countdown / closed state text near CTA */}
          {gate.isOpen ? (
            <div className="flex items-center gap-1.5 text-sm text-hero-text/70">
              <span>Order within</span>
              <DeliveryCountdown cutoffDate={gate.cutoffDate} urgency={gate.urgency} />
            </div>
          ) : (
            <p className="text-sm text-hero-text-muted">
              {deliveryDays && deliveryDays.length > 0
                ? `Delivery on ${deliveryDaysList}`
                : `Orders open ${DAY_NAMES[cutoffDay ?? 5]}`}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto md:grid-cols-4 md:max-w-3xl animate-fade-in-up-delay-4">
          <StatItem
            icon={<ChefHat className="w-5 h-5 text-secondary" />}
            label="Authentic"
            value="Burmese Recipes"
            subValue="မြန်မာ့ရိုးရာ ချက်ပြုတ်နည်းများ"
          />
          <StatItem
            icon={<Clock className="w-5 h-5 text-secondary" />}
            label="Delivery"
            value={deliveryScheduleText}
            subValue={`${deliveryDaysList} တွင် ပို့ဆောင်ပေးပါသည်`}
          />
          <StatItem
            icon={<MapPin className="w-5 h-5 text-secondary" />}
            label="Coverage"
            value="50 Mile Radius"
            subValue="မိုင် ၅၀ အကျယ်အဝန်း"
          />
          {deliveryFeeText && (
            <StatItem
              icon={<Truck className="w-5 h-5 text-secondary" />}
              label="Fee"
              value={deliveryFeeText}
              subValue="$၁၀၀ အထက် အခမဲ့ပို့ဆောင်"
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
          <span className="text-xs uppercase tracking-widest">Scroll · အောက်သို့ဆင်းပါ</span>
          <ChevronDown className="w-6 h-6" />
        </m.div>
      </m.div>
    </div>
  );
}
