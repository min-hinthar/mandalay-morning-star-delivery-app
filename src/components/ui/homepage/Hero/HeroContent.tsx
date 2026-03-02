"use client";

/**
 * HeroContent Component
 *
 * The text/CTA overlay content for the Hero section.
 */

import Link from "next/link";
import { m } from "framer-motion";
import { ArrowRight, ChefHat, Clock, MapPin, Truck, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useDynamicTheme } from "@/components/ui/theme";
import { useDeliveryGate } from "@/lib/hooks/useDeliveryGate";
import { DeliveryCountdown } from "@/components/ui/delivery";
import { Button } from "@/components/ui/button";
import { AnimatedHeadline, StatItem } from "./HeroSubComponents";

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
}: HeroContentProps) {
  const { shouldAnimate } = useAnimationPreference();
  const { timeOfDay } = useDynamicTheme();
  const gate = useDeliveryGate(cutoffDay ?? 5, cutoffHour ?? 15);

  // Dynamic CTA text based on gate state
  const dynamicCtaText = gate.isOpen
    ? ctaText
    : `Pre-Order for ${gate.deliveryDate.displayDate}`;

  // Compute dynamic delivery schedule text from business rules
  // cutoffDay is the cutoff day (e.g., 5=Friday), delivery day is next day (e.g., 6=Saturday)
  const deliveryDayName = cutoffDay !== undefined ? DAY_NAMES[(cutoffDay + 1) % 7] : "Saturday";
  const deliveryScheduleText = gate.isOpen
    ? cutoffDay !== undefined && cutoffHour !== undefined
      ? `Order by ${DAY_NAMES[cutoffDay]} ${formatCutoffHour(cutoffHour)}`
      : `Every ${deliveryDayName}`
    : `Orders closed -- next ${gate.deliveryDate.displayDate}`;
  const deliveryFeeText =
    deliveryFeeCents !== undefined && freeDeliveryThresholdCents !== undefined
      ? `$${(deliveryFeeCents / 100).toFixed(0)} delivery, free over $${(freeDeliveryThresholdCents / 100).toFixed(0)}`
      : undefined;

  return (
    <div className="relative flex flex-col items-center justify-start min-h-[100svh] min-h-[100dvh] px-4 pt-24 pb-20 pb-safe md:pt-28 md:pb-24">
      <div className="max-w-4xl mx-auto text-center">
        {/* Time-based greeting badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-hero-stat-bg sm:backdrop-blur-md border border-hero-text/20 animate-fade-in-up-delay-1">
          <span className="text-secondary">
            {timeOfDay === "morning" && "Good morning!"}
            {timeOfDay === "afternoon" && "Good afternoon!"}
            {timeOfDay === "evening" && "Good evening!"}
            {timeOfDay === "night" && "Late night cravings?"}
            {timeOfDay === "dawn" && "Early bird?"}
          </span>
          <span className="text-sm text-hero-text/90 font-medium">
            Fresh Burmese cuisine awaits
          </span>
        </div>

        <AnimatedHeadline
          text={headline}
          className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-hero-text mb-4 leading-tight"
        />

        <p className="text-lg md:text-xl text-hero-text/70 font-medium mb-6 animate-fade-in-up-delay-1">
          {tagline}
        </p>

        <p className="text-lg md:text-xl text-hero-text/80 max-w-2xl mx-auto mb-10 font-body animate-fade-in-up-delay-2">
          {subheadline}
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

          {/* Countdown / closed state text near CTA */}
          {gate.isOpen ? (
            <div className="flex items-center gap-1.5 text-sm text-hero-text/70">
              <span>Order within</span>
              <DeliveryCountdown cutoffDate={gate.cutoffDate} urgency={gate.urgency} />
            </div>
          ) : (
            <p className="text-sm text-hero-text-muted">
              Orders open {DAY_NAMES[cutoffDay ?? 5]}
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4 p-4 rounded-2xl bg-hero-stat-bg sm:bg-hero-stat-bg/50 sm:backdrop-blur-md border border-hero-text/10 animate-fade-in-up-delay-4">
          <StatItem
            icon={<ChefHat className="w-4 h-4 text-secondary" />}
            label="Authentic"
            value="Burmese Recipes"
          />
          <div className="hidden md:block w-px h-10 bg-hero-text/20" />
          <StatItem
            icon={<Clock className="w-4 h-4 text-secondary" />}
            label="Delivery"
            value={deliveryScheduleText}
          />
          <div className="hidden md:block w-px h-10 bg-hero-text/20" />
          <StatItem
            icon={<MapPin className="w-4 h-4 text-secondary" />}
            label="Coverage"
            value="50 Mile Radius"
          />
          {deliveryFeeText && (
            <>
              <div className="hidden md:block w-px h-10 bg-hero-text/20" />
              <StatItem
                icon={<Truck className="w-4 h-4 text-secondary" />}
                label="Fee"
                value={deliveryFeeText}
              />
            </>
          )}
        </div>
      </div>

      <m.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
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
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <ChevronDown className="w-6 h-6" />
        </m.div>
      </m.div>
    </div>
  );
}
