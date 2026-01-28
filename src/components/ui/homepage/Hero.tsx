"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, ChefHat, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerContainer, parallaxPresets } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useDynamicTheme } from "@/components/ui/theme";
import { Button } from "@/components/ui/button";

// ============================================
// TYPES
// ============================================

export interface HeroProps {
  /** Hero headline */
  headline?: string;
  /** Hero subheadline */
  subheadline?: string;
  /** Primary CTA text */
  ctaText?: string;
  /** Primary CTA href */
  ctaHref?: string;
  /** Secondary CTA text */
  secondaryCtaText?: string;
  /** Secondary CTA href */
  secondaryCtaHref?: string;
  /** Additional className */
  className?: string;
}

// ============================================
// ANIMATED HEADLINE
// ============================================

interface AnimatedHeadlineProps {
  text: string;
  className?: string;
}

function AnimatedHeadline({ text, className }: AnimatedHeadlineProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const words = text.split(" ");

  if (!shouldAnimate) {
    return <h1 className={className}>{text}</h1>;
  }

  return (
    <motion.h1
      className={cn("flex flex-wrap justify-center gap-x-3 gap-y-1", className)}
      variants={staggerContainer()}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          className="inline-block"
          variants={{
            hidden: {
              opacity: 0,
              y: 40,
              rotateX: -90,
              filter: "blur(10px)",
            },
            visible: {
              opacity: 1,
              y: 0,
              rotateX: 0,
              filter: "blur(0px)",
            },
          }}
          transition={getSpring(spring.rubbery)}
        >
          {word}
        </motion.span>
      ))}
    </motion.h1>
  );
}

// ============================================
// HERO STATS BAR
// ============================================

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  delay?: number;
}

function StatItem({ icon, label, value, delay = 0 }: StatItemProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-2"
      initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={shouldAnimate ? { ...getSpring(spring.default), delay } : undefined}
    >
      <div className="p-2 rounded-full bg-hero-stat-bg backdrop-blur-sm">
        {icon}
      </div>
      <div className="text-left">
        <div className="text-xs text-hero-text-muted uppercase tracking-wide">{label}</div>
        <div className="text-sm font-semibold text-hero-text">{value}</div>
      </div>
    </motion.div>
  );
}

// ============================================
// GRADIENT FALLBACK BACKGROUND
// ============================================

interface GradientFallbackProps {
  children: React.ReactNode;
  className?: string;
}

function GradientFallback({ children, className }: GradientFallbackProps) {
  const { gradientPalette } = useDynamicTheme();

  // Use CSS custom properties for theme-aware gradient (dark gradient in both themes)
  // Falls back to dynamic palette if provided by DynamicThemeProvider
  const useCustomGradient = gradientPalette && gradientPalette.length >= 3;

  return (
    <div className={cn("relative w-full min-h-[100svh] min-h-[100dvh] overflow-hidden", className)}>
      {/* Dark dramatic gradient background - theme-aware via CSS vars */}
      <div
        className="absolute inset-0"
        style={useCustomGradient ? {
          background: `linear-gradient(180deg, ${gradientPalette[0]} 0%, ${gradientPalette[1]} 50%, ${gradientPalette[2]} 100%)`,
        } : {
          background: `linear-gradient(180deg, var(--hero-bg-start) 0%, var(--hero-bg-mid) 50%, var(--hero-bg-end) 100%)`,
        }}
      />

      {/* Decorative pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 Q35 15 30 25 Q25 15 30 5' fill='%23EBCD00' opacity='0.3'/%3E%3Cpath d='M30 35 Q35 45 30 55 Q25 45 30 35' fill='%23EBCD00' opacity='0.3'/%3E%3Cpath d='M5 30 Q15 35 25 30 Q15 25 5 30' fill='%23EBCD00' opacity='0.3'/%3E%3Cpath d='M35 30 Q45 35 55 30 Q45 25 35 30' fill='%23EBCD00' opacity='0.3'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial glow effect */}
      <div className="absolute inset-0 bg-gradient-radial from-secondary/20 via-transparent to-transparent" />

      {/* Gradient overlay for text readability - uses theme-aware hero overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-t via-transparent to-transparent"
        style={{ ['--tw-gradient-from' as string]: 'var(--hero-overlay)' }}
      />

      {/* Layer 5: Text + CTA content - z-index 4 to stay above orbs and emojis */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        // eslint-disable-next-line no-restricted-syntax -- Local stacking context (isolate on parent), not global z-index
        style={{ zIndex: 4 }}
      >
        {children}
      </div>
    </div>
  );
}

// ============================================
// HERO CONTENT OVERLAY
// ============================================

interface HeroContentProps {
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaHref: string;
  secondaryCtaText: string;
  secondaryCtaHref: string;
}

function HeroContent({
  headline,
  subheadline,
  ctaText,
  ctaHref,
  secondaryCtaText,
  secondaryCtaHref,
}: HeroContentProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const { timeOfDay } = useDynamicTheme();

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[100svh] min-h-[100dvh] px-4 pt-16 pb-20 pb-safe md:pt-20 md:pb-24">
      <div className="max-w-4xl mx-auto text-center">
        {/* Time-based greeting badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-hero-stat-bg backdrop-blur-md border border-hero-text/20"
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
        </motion.div>

        {/* Animated Headline */}
        <AnimatedHeadline
          text={headline}
          className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-hero-text mb-6 leading-tight"
        />

        {/* Subheadline */}
        <motion.p
          className="text-lg md:text-xl text-hero-text/80 max-w-2xl mx-auto mb-10 font-body"
          initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={shouldAnimate ? { ...getSpring(spring.default), delay: 0.6 } : undefined}
        >
          {subheadline}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={shouldAnimate ? { ...getSpring(spring.default), delay: 0.8 } : undefined}
        >
          <motion.div
            whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
          >
            <Button
              variant="primary"
              size="lg"
              asChild
              className="relative overflow-hidden group px-8 py-6 text-lg bg-secondary hover:bg-secondary-hover shadow-lg shadow-secondary/30"
            >
              <Link href={ctaHref}>
                <span className="relative z-10 flex items-center gap-2">
                  {ctaText}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                  animate={shouldAnimate ? {
                    x: ["-100%", "100%"],
                  } : undefined}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
          >
            <Button
              variant="outline"
              size="lg"
              asChild
              className="px-8 py-6 text-lg border-hero-text/30 text-hero-text hover:bg-hero-stat-bg backdrop-blur-sm"
            >
              <Link href={secondaryCtaHref}>{secondaryCtaText}</Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          className="flex flex-wrap justify-center items-center gap-2 md:gap-4 p-4 rounded-2xl bg-hero-stat-bg/50 backdrop-blur-md border border-hero-text/10"
          initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={shouldAnimate ? { ...getSpring(spring.default), delay: 1 } : undefined}
        >
          <StatItem
            icon={<ChefHat className="w-4 h-4 text-secondary" />}
            label="Authentic"
            value="Burmese Recipes"
            delay={1.1}
          />
          <div className="hidden md:block w-px h-10 bg-hero-text/20" />
          <StatItem
            icon={<Clock className="w-4 h-4 text-secondary" />}
            label="Delivery"
            value="Every Saturday"
            delay={1.2}
          />
          <div className="hidden md:block w-px h-10 bg-hero-text/20" />
          <StatItem
            icon={<MapPin className="w-4 h-4 text-secondary" />}
            label="Coverage"
            value="50 Mile Radius"
            delay={1.3}
          />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={shouldAnimate ? { opacity: 0 } : undefined}
        animate={shouldAnimate ? { opacity: 1 } : undefined}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          className="flex flex-col items-center gap-2 text-hero-text-muted"
          animate={shouldAnimate ? { y: [0, 8, 0] } : undefined}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ============================================
// MAIN HERO COMPONENT
// ============================================

export function Hero({
  headline = "Authentic Burmese Cuisine Delivered to Your Door",
  subheadline = "Experience the rich flavors of Myanmar with our weekly Saturday deliveries. Fresh, homemade dishes prepared with love and tradition.",
  ctaText = "Order Now",
  ctaHref = "/menu",
  secondaryCtaText = "How It Works",
  secondaryCtaHref = "#how-it-works",
  className,
}: HeroProps) {
  const { shouldAnimate } = useAnimationPreference();
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll-based parallax for content
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Layer transforms using parallaxPresets from motion-tokens
  // Each layer moves at different speeds for depth perception
  const orbsFarY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", `${parallaxPresets.far.speedFactor * 100}%`]
  );
  const orbsMidY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", `${parallaxPresets.mid.speedFactor * 100}%`]
  );
  const emojisY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", `${parallaxPresets.near.speedFactor * 100}%`]
  );
  // Content layer uses parallaxPresets.content for consistency (15% max travel)
  const contentY = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", `${parallaxPresets.content.speedFactor * 15}%`]
  );
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Smooth springs for all parallax values
  const smoothOrbsFarY = useSpring(orbsFarY, { stiffness: 100, damping: 30 });
  const smoothOrbsMidY = useSpring(orbsMidY, { stiffness: 100, damping: 30 });
  const smoothEmojisY = useSpring(emojisY, { stiffness: 100, damping: 30 });
  const smoothContentY = useSpring(contentY, { stiffness: 100, damping: 30 });
  const smoothOpacity = useSpring(opacity, { stiffness: 100, damping: 30 });

  // Export parallax values for layer components (used in 31-03)
  // These are accessible via data attributes on layer elements
  void smoothOrbsFarY;
  void smoothOrbsMidY;
  void smoothEmojisY;

  // Common hero content
  const heroContent = (
    <HeroContent
      headline={headline}
      subheadline={subheadline}
      ctaText={ctaText}
      ctaHref={ctaHref}
      secondaryCtaText={secondaryCtaText}
      secondaryCtaHref={secondaryCtaHref}
    />
  );

  return (
    <section
      ref={containerRef}
      id="hero"
      className={cn(
        "relative min-h-[100svh] min-h-[100dvh] overflow-hidden isolate",
        className
      )}
    >
      {/* Gradient background - consistent SSR/CSR rendering (no hydration flicker) */}
      <GradientFallback>
        <motion.div
          style={shouldAnimate ? { y: smoothContentY, opacity: smoothOpacity } : undefined}
        >
          {heroContent}
        </motion.div>
      </GradientFallback>

      {/* Layer 2: Background orbs (far) - populated in 31-03 */}
      <div
        className="absolute inset-0 pointer-events-none"
        // eslint-disable-next-line no-restricted-syntax -- Local stacking context (isolate on parent), not global z-index
        style={{ zIndex: 1 }}
        aria-hidden="true"
        id="hero-layer-orbs-far"
      />

      {/* Layer 3: Mid-distance orbs - populated in 31-03 */}
      <div
        className="absolute inset-0 pointer-events-none"
        // eslint-disable-next-line no-restricted-syntax -- Local stacking context (isolate on parent), not global z-index
        style={{ zIndex: 2 }}
        aria-hidden="true"
        id="hero-layer-orbs-mid"
      />

      {/* Layer 4: Floating emojis - populated in 31-03 */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        // eslint-disable-next-line no-restricted-syntax -- Local stacking context (isolate on parent), not global z-index
        style={{ zIndex: 3 }}
        aria-hidden="true"
        id="hero-layer-emojis"
      />

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface-primary to-transparent pointer-events-none"
        // eslint-disable-next-line no-restricted-syntax -- Local stacking context (isolate), not global z-index
        style={{ zIndex: 4 }}
      />
    </section>
  );
}

export default Hero;
