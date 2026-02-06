"use client";

/**
 * HeroContent Component
 *
 * The text/CTA overlay content for the Hero section.
 */

import Link from "next/link";
import { m } from "framer-motion";
import { ArrowRight, ChefHat, Clock, MapPin, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useDynamicTheme } from "@/components/ui/theme";
import { Button } from "@/components/ui/button";
import { AnimatedHeadline, StatItem } from "./HeroSubComponents";

interface HeroContentProps {
  headline: string;
  tagline: string;
  subheadline: string;
  ctaText: string;
  ctaHref: string;
}

export function HeroContent({
  headline,
  tagline,
  subheadline,
  ctaText,
  ctaHref,
}: HeroContentProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const { timeOfDay } = useDynamicTheme();

  return (
    <div className="relative flex flex-col items-center justify-start min-h-[100svh] min-h-[100dvh] px-4 pt-24 pb-20 pb-safe md:pt-28 md:pb-24">
      <div className="max-w-4xl mx-auto text-center">
        {/* Time-based greeting badge */}
        <m.div
          className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-hero-stat-bg sm:backdrop-blur-md border border-hero-text/20"
          initial={shouldAnimate ? { opacity: 0, y: -20 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={shouldAnimate ? { ...getSpring(spring.default), delay: 0.3 } : undefined}
        >
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
        </m.div>

        <AnimatedHeadline
          text={headline}
          className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-hero-text mb-4 leading-tight"
        />

        <m.p
          className="text-lg md:text-xl text-hero-text/70 font-medium mb-6"
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={shouldAnimate ? { ...getSpring(spring.default), delay: 0.5 } : undefined}
        >
          {tagline}
        </m.p>

        <m.p
          className="text-lg md:text-xl text-hero-text/80 max-w-2xl mx-auto mb-10 font-body"
          initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={shouldAnimate ? { ...getSpring(spring.default), delay: 0.6 } : undefined}
        >
          {subheadline}
        </m.p>

        <m.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={shouldAnimate ? { ...getSpring(spring.default), delay: 0.8 } : undefined}
        >
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
                  {ctaText}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </Button>
          </m.div>
        </m.div>

        <m.div
          className="flex flex-wrap justify-center items-center gap-2 md:gap-4 p-4 rounded-2xl bg-hero-stat-bg sm:bg-hero-stat-bg/50 sm:backdrop-blur-md border border-hero-text/10"
          initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={shouldAnimate ? { ...getSpring(spring.default), delay: 1 } : undefined}
        >
          <StatItem icon={<ChefHat className="w-4 h-4 text-secondary" />} label="Authentic" value="Burmese Recipes" delay={1.1} />
          <div className="hidden md:block w-px h-10 bg-hero-text/20" />
          <StatItem icon={<Clock className="w-4 h-4 text-secondary" />} label="Delivery" value="Every Saturday" delay={1.2} />
          <div className="hidden md:block w-px h-10 bg-hero-text/20" />
          <StatItem icon={<MapPin className="w-4 h-4 text-secondary" />} label="Coverage" value="50 Mile Radius" delay={1.3} />
        </m.div>
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
