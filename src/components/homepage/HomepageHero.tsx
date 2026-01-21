"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  v6StaggerContainer,
  v6StaggerItem,
  v6FloatIngredient,
} from "@/lib/motion";

interface HomepageHeroProps {
  onScrollToMenu?: () => void;
  onScrollToCoverage?: () => void;
}

/**
 * V6 Floating Ingredient Placeholder
 * Colorful shapes that drift and rotate for playful aesthetic
 */
function FloatingIngredient({
  index,
  color,
  size,
  className = "",
}: {
  index: number;
  color: string;
  size: number;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const floatVariant = v6FloatIngredient(index);

  return (
    <motion.div
      animate={shouldReduceMotion ? {} : floatVariant.animate}
      transition={shouldReduceMotion ? {} : floatVariant.transition}
      className={`absolute rounded-full opacity-60 blur-[1px] ${className}`}
      style={{
        width: size,
        height: size * 0.8, // Slightly oval
        backgroundColor: color,
        boxShadow: `0 8px 32px ${color}40`,
      }}
    />
  );
}

/**
 * V6 Homepage Hero - Pepper Aesthetic
 * Features floating ingredient animations, bold typography, vibrant CTAs
 */
export function HomepageHero({ onScrollToMenu, onScrollToCoverage }: HomepageHeroProps) {
  const shouldReduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);

  // V6 Accent colors for floating ingredients
  const ingredientColors = [
    "var(--color-primary)",      // Deep red (pepper)
    "var(--color-secondary)",    // Golden yellow (turmeric)
    "var(--color-accent-green)", // Fresh green (herbs)
    "var(--color-accent-orange)", // Orange (chili)
    "var(--color-accent-teal)",  // Teal (fresh)
    "var(--color-primary)",      // More red
    "var(--color-secondary)",    // More yellow
    "var(--color-accent-green)", // More green
  ];

  return (
    <section
      ref={heroRef}
      className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-surface-secondary via-surface-primary to-surface-tertiary"
    >
      {/* Warm gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/10" />

      {/* Floating Ingredients - V6 Pepper Aesthetic */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top left cluster */}
        <FloatingIngredient index={0} color={ingredientColors[0]} size={80} className="top-[10%] left-[5%]" />
        <FloatingIngredient index={1} color={ingredientColors[1]} size={60} className="top-[20%] left-[15%]" />
        <FloatingIngredient index={2} color={ingredientColors[2]} size={40} className="top-[8%] left-[20%]" />

        {/* Top right cluster */}
        <FloatingIngredient index={3} color={ingredientColors[3]} size={70} className="top-[12%] right-[8%]" />
        <FloatingIngredient index={4} color={ingredientColors[4]} size={50} className="top-[25%] right-[15%]" />
        <FloatingIngredient index={5} color={ingredientColors[5]} size={35} className="top-[5%] right-[20%]" />

        {/* Bottom corners */}
        <FloatingIngredient index={6} color={ingredientColors[6]} size={90} className="bottom-[15%] left-[8%]" />
        <FloatingIngredient index={7} color={ingredientColors[7]} size={55} className="bottom-[20%] right-[10%]" />

        {/* Hidden on mobile, visible on larger screens */}
        <FloatingIngredient index={8} color={ingredientColors[0]} size={45} className="hidden lg:block top-[40%] left-[3%]" />
        <FloatingIngredient index={9} color={ingredientColors[2]} size={65} className="hidden lg:block top-[45%] right-[5%]" />
        <FloatingIngredient index={10} color={ingredientColors[4]} size={50} className="hidden xl:block bottom-[35%] left-[12%]" />
        <FloatingIngredient index={11} color={ingredientColors[1]} size={75} className="hidden xl:block bottom-[30%] right-[8%]" />
      </div>

      {/* Main Content */}
      <motion.div
        variants={v6StaggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center px-6 max-w-4xl mx-auto"
      >
        {/* Logo */}
        <motion.div variants={v6StaggerItem} className="mb-8">
          <div className="relative inline-block">
            <Image
              src="/logo.png"
              alt="Mandalay Morning Star"
              width={140}
              height={140}
              priority
              className="mx-auto drop-shadow-2xl"
            />
            {/* V6 Glow effect - warm primary */}
            <div className="absolute inset-0 bg-primary/15 blur-3xl -z-10 rounded-full scale-150" />
          </div>
        </motion.div>

        {/* V6 Main Heading - Bold, Playful */}
        <motion.h1
          variants={v6StaggerItem}
          className="font-display text-5xl md:text-6xl lg:text-7xl font-black mb-4 text-text-primary"
        >
          <span className="bg-gradient-to-r from-primary via-primary-hover to-primary bg-clip-text text-transparent">
            Your Food Adventure
          </span>{" "}
          <br className="hidden sm:block" />
          <span className="text-text-primary">Starts Here!</span>
        </motion.h1>

        {/* Burmese Subtitle - V6 Golden */}
        <motion.p
          variants={v6StaggerItem}
          className="font-burmese text-2xl md:text-3xl text-secondary mb-6 drop-shadow-sm"
        >
          မန္တလေး မနက်ခင်းကြယ်
        </motion.p>

        {/* English Tagline - V6 Body */}
        <motion.p
          variants={v6StaggerItem}
          className="font-body text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed text-text-secondary"
        >
          Authentic Burmese cuisine crafted with love, delivered fresh to your
          door every Saturday in Southern California.
        </motion.p>

        {/* V6 CTA Buttons - Pill Shape */}
        <motion.div
          variants={v6StaggerItem}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            variant="primary"
            size="lg"
            onClick={onScrollToMenu}
            className="shadow-elevated hover:shadow-button-hover"
          >
            Order Now
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={onScrollToCoverage}
          >
            Check Delivery Area
          </Button>
        </motion.div>

        {/* V6 Saturday Badge - Vibrant */}
        <motion.div
          variants={v6StaggerItem}
          className="mt-10 inline-flex items-center gap-3 px-6 py-3 bg-surface-primary rounded-pill shadow-card border border-border-subtle"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green" />
          </span>
          <span className="text-text-primary font-body font-semibold">
            Fresh deliveries every Saturday, 11am - 7pm
          </span>
        </motion.div>
      </motion.div>

      {/* V6 Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.button
          onClick={onScrollToMenu}
          animate={
            shouldReduceMotion
              ? {}
              : {
                  y: [0, 8, 0],
                }
          }
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="flex flex-col items-center gap-2 text-text-muted hover:text-primary transition-colors duration-normal"
          aria-label="Scroll down"
        >
          <span className="text-sm font-body font-medium">Scroll to explore</span>
          <ChevronDown className="w-6 h-6" />
        </motion.button>
      </motion.div>

      {/* Bottom fade to content */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface-primary to-transparent" />
    </section>
  );
}

export default HomepageHero;
