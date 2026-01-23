"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, ChefHat, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  spring,
  staggerContainer,
} from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useDynamicTheme } from "@/components/theme/DynamicThemeProvider";
import { useParticleSystem } from "@/lib/webgl/particles";
import { useGrainEffect } from "@/lib/webgl/grain";
import { ParallaxContainer, ParallaxLayer, ParallaxGradient } from "@/components/layouts/v7-index";
import { FloatingFood, defaultFoodItems } from "./FloatingFood";
import { BrandMascot } from "@/components/mascot/BrandMascot";
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
  /** Show floating food elements */
  showFloatingFood?: boolean;
  /** Show WebGL particles */
  showParticles?: boolean;
  /** Show brand mascot */
  showMascot?: boolean;
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
      <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm">
        {icon}
      </div>
      <div className="text-left">
        <div className="text-xs text-white/70 uppercase tracking-wide">{label}</div>
        <div className="text-sm font-semibold text-white">{value}</div>
      </div>
    </motion.div>
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
  secondaryCtaText = "View Menu",
  secondaryCtaHref = "/menu",
  showFloatingFood = true,
  showParticles = true,
  showMascot = true,
  className,
}: HeroProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const { timeOfDay } = useDynamicTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Particle system for WebGL effects
  const { canvasRef, burst } = useParticleSystem({
    maxParticles: 50,
    colors: ["#EBCD00", "#A41034", "#52A52E", "#FFD700"],
    types: ["circle", "star", "confetti"],
  });

  // Grain effect
  const { canvasRef: grainRef } = useGrainEffect({
    intensity: 0.03,
    animate: true,
  });

  // Scroll-based parallax
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const smoothBackgroundY = useSpring(backgroundY, { stiffness: 100, damping: 30 });
  const smoothContentY = useSpring(contentY, { stiffness: 100, damping: 30 });
  const smoothOpacity = useSpring(opacity, { stiffness: 100, damping: 30 });

  // Hydration fix
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Burst particles on CTA hover
  const handleCtaHover = () => {
    if (showParticles && shouldAnimate && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      burst(rect.width / 2, rect.height / 2, 20);
    }
  };

  // Time-based gradient colors from DynamicThemeProvider
  const { gradientPalette } = useDynamicTheme();
  const gradientColors = gradientPalette || ["#A41034", "#5C0A1E", "#1a0a0f"];

  return (
    <section
      ref={containerRef}
      className={cn(
        "relative min-h-[100svh] overflow-hidden isolate",
        className
      )}
    >
      {/* Local stacking context - intentionally using small numbers (1-4)
          for relative layering within this component. Do NOT migrate to
          global z-index tokens as these are not global layers. */}
      {/* WebGL Canvas Layers - local stacking only, no global z-index competition */}
      {showParticles && shouldAnimate && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ width: "100%", height: "100%", zIndex: 1 }}
        />
      )}
      {shouldAnimate && (
        <canvas
          ref={grainRef}
          className="absolute inset-0 pointer-events-none mix-blend-overlay"
          style={{ width: "100%", height: "100%", zIndex: 2 }}
        />
      )}

      {/* Parallax Background */}
      <ParallaxContainer height="100svh" className="absolute inset-0">
        {/* Base gradient layer */}
        <ParallaxGradient
          colors={gradientColors}
          direction={180}
          speed="background"
          zIndex={0}
        />

        {/* Decorative patterns - Burmese-inspired */}
        <ParallaxLayer speed="far" zIndex={1} className="opacity-10">
          <motion.div
            className="absolute inset-0"
            style={shouldAnimate ? { y: smoothBackgroundY } : {}}
          >
            {/* Lotus pattern overlay */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 Q35 15 30 25 Q25 15 30 5' fill='%23EBCD00' opacity='0.3'/%3E%3Cpath d='M30 35 Q35 45 30 55 Q25 45 30 35' fill='%23EBCD00' opacity='0.3'/%3E%3Cpath d='M5 30 Q15 35 25 30 Q15 25 5 30' fill='%23EBCD00' opacity='0.3'/%3E%3Cpath d='M35 30 Q45 35 55 30 Q45 25 35 30' fill='%23EBCD00' opacity='0.3'/%3E%3C/svg%3E")`,
                backgroundSize: "60px 60px",
              }}
            />
          </motion.div>
        </ParallaxLayer>

        {/* Mid layer - radial glow */}
        <ParallaxLayer speed="mid" zIndex={2}>
          <div className="absolute inset-0 bg-gradient-radial from-secondary/20 via-transparent to-transparent" />
        </ParallaxLayer>

        {/* Floating food elements */}
        {showFloatingFood && (
          <ParallaxLayer speed="near" zIndex={3}>
            <FloatingFood
              items={defaultFoodItems}
              mouseParallax={true}
              parallaxIntensity={0.4}
            />
          </ParallaxLayer>
        )}
      </ParallaxContainer>

      {/* Main Content - relative positioning for internal stacking, no global z-index */}
      <motion.div
        className="relative flex flex-col items-center justify-center min-h-[100svh] px-4 py-24"
        style={shouldAnimate ? { y: smoothContentY, opacity: smoothOpacity, zIndex: 3 } : { zIndex: 3 }}
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Brand Mascot */}
          {showMascot && isMounted && (
            <motion.div
              className="mb-8"
              initial={shouldAnimate ? { opacity: 0, scale: 0 } : undefined}
              animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
              transition={shouldAnimate ? { ...getSpring(spring.rubbery), delay: 0.2 } : undefined}
            >
              <BrandMascot
                size="lg"
                expression="waving"
                idleAnimations={true}
                onClick={() => {
                  if (canvasRef.current) {
                    const rect = canvasRef.current.getBoundingClientRect();
                    burst(rect.width / 2, rect.height / 3, 30);
                  }
                }}
              />
            </motion.div>
          )}

          {/* Time-based greeting badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20"
            initial={shouldAnimate ? { opacity: 0, y: -20 } : undefined}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
            transition={shouldAnimate ? { ...getSpring(spring.default), delay: 0.3 } : undefined}
          >
            <span className="text-secondary">
              {timeOfDay === "morning" && "🌅"}
              {timeOfDay === "afternoon" && "☀️"}
              {timeOfDay === "evening" && "🌆"}
              {timeOfDay === "night" && "🌙"}
              {timeOfDay === "dawn" && "🌄"}
            </span>
            <span className="text-sm text-white/90 font-medium">
              {timeOfDay === "morning" && "Good morning! Ready for some delicious Burmese food?"}
              {timeOfDay === "afternoon" && "Good afternoon! Perfect time to order lunch"}
              {timeOfDay === "evening" && "Good evening! Treat yourself to dinner"}
              {timeOfDay === "night" && "Late night cravings? We've got you covered"}
              {timeOfDay === "dawn" && "Early bird? Plan your Saturday feast"}
            </span>
          </motion.div>

          {/* Animated Headline */}
          <AnimatedHeadline
            text={headline}
            className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight"
          />

          {/* Subheadline */}
          <motion.p
            className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 font-body"
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
            <Link href={ctaHref}>
              <motion.div
                onHoverStart={handleCtaHover}
                whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
                whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
              >
                <Button
                  variant="primary"
                  size="lg"
                  className="relative overflow-hidden group px-8 py-6 text-lg bg-secondary hover:bg-secondary-hover shadow-lg shadow-secondary/30"
                >
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
                </Button>
              </motion.div>
            </Link>

            <Link href={secondaryCtaHref}>
              <motion.div
                whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
                whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-6 text-lg border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                >
                  {secondaryCtaText}
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            className="flex flex-wrap justify-center items-center gap-2 md:gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10"
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
            <div className="hidden md:block w-px h-10 bg-white/20" />
            <StatItem
              icon={<Clock className="w-4 h-4 text-secondary" />}
              label="Delivery"
              value="Every Saturday"
              delay={1.2}
            />
            <div className="hidden md:block w-px h-10 bg-white/20" />
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
            className="flex flex-col items-center gap-2 text-white/60"
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
      </motion.div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface-primary to-transparent pointer-events-none" style={{ zIndex: 4 }} />
    </section>
  );
}

export default Hero;
