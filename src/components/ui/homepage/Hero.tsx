"use client";

import React, { useRef, useState, useCallback } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, ChefHat, Clock, MapPin, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, staggerContainer, parallaxPresets } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCanHover } from "@/lib/hooks/useResponsive";
import { useDynamicTheme } from "@/components/ui/theme";
import { Button } from "@/components/ui/button";
import { FloatingEmoji, EMOJI_CONFIG } from "./FloatingEmoji";
import { GradientOrb, ORB_CONFIG_FAR, ORB_CONFIG_MID } from "./GradientOrb";

// ============================================
// TYPES
// ============================================

export interface HeroProps {
  /** Hero headline */
  headline?: string;
  /** Short tagline below headline */
  tagline?: string;
  /** Hero subheadline */
  subheadline?: string;
  /** Primary CTA text */
  ctaText?: string;
  /** Primary CTA href */
  ctaHref?: string;
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
              // eslint-disable-next-line no-restricted-syntax -- FM animation interpolation requires numeric blur (~--blur-md)
              filter: "blur(10px)",
            },
            visible: {
              opacity: 1,
              y: 0,
              rotateX: 0,
              // eslint-disable-next-line no-restricted-syntax -- FM animation interpolation requires numeric blur
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
  // Always use CSS variable tokens for consistent hero gradient (no dynamic override)
  return (
    <div className={cn("relative w-full min-h-[100svh] min-h-[100dvh] overflow-hidden", className)}>
      {/* Muted warm gradient background - theme-aware via CSS vars with smooth 300ms transition */}
      <div
        className="absolute inset-0 hero-gradient-transition"
        style={{
          background: `linear-gradient(180deg, var(--hero-bg-end) 0%, var(--hero-bg-mid) 50%, var(--hero-bg-start) 100%)`,
        }}
      />

      {/* Shimmer overlay - traveling light effect per CONTEXT.md */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 animate-hero-shimmer"
          style={{
            background: `linear-gradient(45deg, transparent 40%, var(--hero-shimmer) 50%, transparent 60%)`,
            width: "200%",
            height: "200%",
            top: "-50%",
            left: "-50%",
          }}
        />
      </div>

      {/* Radial glow effect - uses secondary color for brand accent */}
      <div className="absolute inset-0 bg-gradient-radial from-secondary/15 via-transparent to-transparent" />

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
  tagline: string;
  subheadline: string;
  ctaText: string;
  ctaHref: string;
}

function HeroContent({
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
          className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-hero-text mb-4 leading-tight"
        />

        {/* Tagline per CONTEXT.md */}
        <motion.p
          className="text-lg md:text-xl text-hero-text/70 font-medium mb-6"
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          transition={shouldAnimate ? { ...getSpring(spring.default), delay: 0.5 } : undefined}
        >
          {tagline}
        </motion.p>

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
            whileHover={shouldAnimate ? {
              scale: 1.05,
              y: -2,  // Lift effect per CONTEXT.md
            } : undefined}
            whileTap={shouldAnimate ? { scale: 0.97 } : undefined}
            transition={spring.snappy}
          >
            <Button
              variant="primary"
              size="lg"
              asChild
              className={cn(
                "relative overflow-hidden group px-8 py-6 text-lg rounded-full",
                // Gradient background with shift on hover
                "bg-gradient-to-r from-secondary via-secondary-hover to-secondary",
                "hover:from-secondary-hover hover:via-secondary hover:to-secondary-hover",
                // Shadow lift
                "shadow-lg shadow-secondary/30",
                "hover:shadow-xl hover:shadow-secondary/40",
                // Subtle glow ring on hover
                "hover:ring-2 hover:ring-secondary/30",
                // Smooth transitions
                "transition-all duration-300"
              )}
            >
              <Link href={ctaHref}>
                <span className="relative z-10 flex items-center gap-2 text-text-primary font-semibold">
                  {ctaText}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                {/* Glow sweep effect inside button */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0"
                  animate={shouldAnimate ? {
                    x: ["-100%", "200%"],
                  } : undefined}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    repeatDelay: 4,
                    ease: "easeInOut",
                  }}
                />
              </Link>
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
          className="flex flex-col items-center gap-1 text-hero-text-muted cursor-pointer"
          animate={shouldAnimate ? { y: [0, 8, 0] } : undefined}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          onClick={() => {
            document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
          }}
          role="button"
          aria-label="Scroll to learn more"
        >
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <ChevronDown className="w-6 h-6" />
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
  tagline = "Authentic Burmese delivered",
  subheadline = "Experience the rich flavors of Myanmar with our weekly Saturday deliveries. Fresh, homemade dishes prepared with love and tradition.",
  ctaText = "Order Now",
  ctaHref = "/menu",
  className,
}: HeroProps) {
  const { shouldAnimate } = useAnimationPreference();
  const canHover = useCanHover();
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for emoji repel effect (desktop only)
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!canHover) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    // Calculate offset from center, max 20px repel
    const offsetX = Math.max(-20, Math.min(20, (mouseX - centerX) / centerX * 20));
    const offsetY = Math.max(-20, Math.min(20, (mouseY - centerY) / centerY * 20));
    setMouseOffset({ x: offsetX, y: offsetY });
  }, [canHover]);

  const handleMouseLeave = useCallback(() => {
    setMouseOffset({ x: 0, y: 0 });
  }, []);

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
  // Emojis: no scroll parallax - they stay fixed and only use their own floating animation
  // (parallax removed per design: emojis should not shift with scroll)
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
  const smoothContentY = useSpring(contentY, { stiffness: 100, damping: 30 });
  const smoothOpacity = useSpring(opacity, { stiffness: 100, damping: 30 });

  // Common hero content
  const heroContent = (
    <HeroContent
      headline={headline}
      tagline={tagline}
      subheadline={subheadline}
      ctaText={ctaText}
      ctaHref={ctaHref}
    />
  );

  return (
    <section
      ref={containerRef}
      id="hero"
      data-testid="hero-section"
      className={cn(
        "relative min-h-[100svh] min-h-[100dvh] overflow-hidden isolate",
        className
      )}
      style={{ position: "relative" }}
      onMouseMove={canHover ? handleMouseMove : undefined}
      onMouseLeave={canHover ? handleMouseLeave : undefined}
    >
      {/* Gradient background - consistent SSR/CSR rendering (no hydration flicker) */}
      <GradientFallback>
        <motion.div
          style={shouldAnimate ? { y: smoothContentY, opacity: smoothOpacity } : undefined}
        >
          {heroContent}
        </motion.div>
      </GradientFallback>

      {/* Layer 2: Background orbs (far) */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        // eslint-disable-next-line no-restricted-syntax -- Local stacking context (isolate on parent), not global z-index
        style={{ y: smoothOrbsFarY, zIndex: 1 }}
        aria-hidden="true"
      >
        {ORB_CONFIG_FAR.map((orb, i) => (
          <GradientOrb key={`orb-far-${i}`} {...orb} />
        ))}
      </motion.div>

      {/* Layer 3: Mid-distance orbs */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        // eslint-disable-next-line no-restricted-syntax -- Local stacking context (isolate on parent), not global z-index
        style={{ y: smoothOrbsMidY, zIndex: 2 }}
        aria-hidden="true"
      >
        {ORB_CONFIG_MID.map((orb, i) => (
          <GradientOrb key={`orb-mid-${i}`} {...orb} />
        ))}
      </motion.div>

      {/* Layer 4: Floating emojis - no scroll parallax, emojis animate independently */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{
          // eslint-disable-next-line no-restricted-syntax -- Local stacking context (isolate on parent), not global z-index
          zIndex: 3,
          maskImage: "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
        }}
        aria-hidden="true"
      >
        {EMOJI_CONFIG.map((emoji, i) => (
          <FloatingEmoji
            key={`emoji-${i}`}
            {...emoji}
            index={i}
            mouseOffset={mouseOffset}
          />
        ))}
      </div>

      {/* Bottom gradient fade - warm orange to blend into How It Works section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          // eslint-disable-next-line no-restricted-syntax -- Local stacking context (isolate), not global z-index
          zIndex: 4,
          background: `linear-gradient(to top, var(--hero-bg-start), transparent)`,
        }}
      />
    </section>
  );
}

export default Hero;
