"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { heroContainer, heroItem, floatingElement } from "@/lib/animations/variants";
import { useDynamicLuminance, getContrastTextClasses } from "@/lib/hooks/useLuminance";

interface HomepageHeroProps {
  onScrollToMenu?: () => void;
  onScrollToCoverage?: () => void;
}

// Floating lotus SVG component
function LotusFlower({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Center petal */}
      <path
        d="M50 15 C55 25, 55 40, 50 55 C45 40, 45 25, 50 15"
        fill="#D4AF37"
        fillOpacity="0.6"
      />
      {/* Left petals */}
      <path
        d="M30 30 C40 35, 48 45, 50 55 C38 48, 32 38, 30 30"
        fill="#D4AF37"
        fillOpacity="0.5"
      />
      <path
        d="M15 45 C28 45, 42 50, 50 55 C38 55, 22 52, 15 45"
        fill="#D4AF37"
        fillOpacity="0.4"
      />
      {/* Right petals */}
      <path
        d="M70 30 C60 35, 52 45, 50 55 C62 48, 68 38, 70 30"
        fill="#D4AF37"
        fillOpacity="0.5"
      />
      <path
        d="M85 45 C72 45, 58 50, 50 55 C62 55, 78 52, 85 45"
        fill="#D4AF37"
        fillOpacity="0.4"
      />
      {/* Base */}
      <ellipse cx="50" cy="60" rx="12" ry="5" fill="#8B4513" fillOpacity="0.3" />
    </svg>
  );
}

// Pagoda silhouette SVG
function PagodaSilhouette({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Spire */}
      <path d="M60 0 L65 20 L55 20 Z" fill="#8B1A1A" fillOpacity="0.2" />
      {/* Top tier */}
      <path d="M50 20 L70 20 L75 40 L45 40 Z" fill="#8B1A1A" fillOpacity="0.15" />
      {/* Second tier */}
      <path d="M40 40 L80 40 L90 70 L30 70 Z" fill="#8B1A1A" fillOpacity="0.12" />
      {/* Third tier */}
      <path d="M25 70 L95 70 L105 110 L15 110 Z" fill="#8B1A1A" fillOpacity="0.1" />
      {/* Base */}
      <path d="M10 110 L110 110 L120 160 L0 160 Z" fill="#8B1A1A" fillOpacity="0.08" />
      <rect x="5" y="160" width="110" height="40" fill="#8B1A1A" fillOpacity="0.06" />
    </svg>
  );
}

export function HomepageHero({ onScrollToMenu, onScrollToCoverage }: HomepageHeroProps) {
  const shouldReduceMotion = useReducedMotion();
  const backgroundRef = useRef<HTMLDivElement>(null);

  // Dynamic text color based on background luminance
  const { luminance } = useDynamicLuminance(backgroundRef, "dark");
  const textClasses = getContrastTextClasses(luminance, { withShadow: true, intensity: "strong" });
  const textClassesMuted = getContrastTextClasses(luminance, { withShadow: true });

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden">
      {/* Animated Gradient Background */}
      <div ref={backgroundRef} className="absolute inset-0 bg-gradient-animated opacity-90" />

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />

      {/* Decorative Elements - Hidden on mobile */}
      <motion.div
        variants={floatingElement}
        animate={shouldReduceMotion ? {} : "animate"}
        className="absolute top-20 left-10 hidden lg:block"
      >
        <LotusFlower className="w-24 h-24 opacity-60" />
      </motion.div>

      <motion.div
        variants={floatingElement}
        animate={shouldReduceMotion ? {} : "animate"}
        style={{ animationDelay: "2s" }}
        className="absolute top-40 right-16 hidden lg:block"
      >
        <LotusFlower className="w-16 h-16 opacity-50" />
      </motion.div>

      <motion.div
        variants={floatingElement}
        animate={shouldReduceMotion ? {} : "animate"}
        style={{ animationDelay: "4s" }}
        className="absolute bottom-40 left-20 hidden lg:block"
      >
        <LotusFlower className="w-20 h-20 opacity-55" />
      </motion.div>

      {/* Pagoda silhouettes */}
      <div className="absolute bottom-0 left-0 hidden xl:block">
        <PagodaSilhouette className="w-32 h-48 opacity-35" />
      </div>
      <div className="absolute bottom-0 right-10 hidden xl:block">
        <PagodaSilhouette className="w-24 h-36 opacity-30" />
      </div>

      {/* Main Content */}
      <motion.div
        variants={heroContainer}
        initial={shouldReduceMotion ? false : "hidden"}
        animate={shouldReduceMotion ? false : "visible"}
        className="relative z-10 text-center px-6 max-w-4xl mx-auto"
      >
        {/* Logo */}
        <motion.div variants={heroItem} className="mb-8">
          <div className="relative inline-block">
            <Image
              src="/logo.png"
              alt="Mandalay Morning Star"
              width={140}
              height={140}
              priority
              className="mx-auto drop-shadow-2xl"
            />
            {/* Glow effect behind logo */}
            <div className="absolute inset-0 bg-[var(--color-interactive-primary)]/20 blur-3xl -z-10 rounded-full scale-150" />
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          variants={heroItem}
          className={`font-display text-5xl md:text-6xl lg:text-7xl font-bold mb-4 ${textClasses}`}
        >
          <span className="text-gradient-gold">Mandalay</span>{" "}
          <span className={textClasses}>Morning Star</span>
        </motion.h1>

        {/* Burmese Subtitle */}
        <motion.p
          variants={heroItem}
          className="font-burmese text-2xl md:text-3xl text-[var(--color-interactive-primary)] mb-6 drop-shadow-md"
        >
          မန္တလေး မနက်ခင်းကြယ်
        </motion.p>

        {/* English Tagline */}
        <motion.p
          variants={heroItem}
          className={`text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed opacity-90 ${textClassesMuted}`}
        >
          Authentic Burmese cuisine crafted with love, delivered fresh to your
          door every Saturday in Southern California.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={heroItem}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={onScrollToMenu}
            className="px-8 py-4 bg-[var(--color-surface)] text-[var(--color-accent-tertiary)] font-semibold rounded-xl shadow-[var(--elevation-2)] hover:shadow-[var(--elevation-3)] transition-shadow animate-cta-shimmer"
          >
            View Our Menu
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={onScrollToCoverage}
            className="px-8 py-4 bg-black/20 backdrop-blur-sm border-2 border-[var(--color-text-inverse)]/80 text-[var(--color-text-inverse)] font-semibold rounded-xl hover:bg-black/30 transition-colors"
          >
            Check Delivery Area
          </motion.button>
        </motion.div>

        {/* Saturday Badge */}
        <motion.div
          variants={heroItem}
          className="mt-10 inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-accent-tertiary)]/90 backdrop-blur-sm rounded-full shadow-[var(--elevation-3)]"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent-secondary)] opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-accent-secondary)]" />
          </span>
          <span className="text-[var(--color-text-inverse)] font-medium drop-shadow-sm">
            Fresh deliveries every Saturday, 11am - 7pm
          </span>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
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
                  y: [0, 10, 0],
                }
          }
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity ${textClassesMuted}`}
          aria-label="Scroll down"
        >
          <span className="text-sm font-medium">Scroll to explore</span>
          <ChevronDown className="w-6 h-6" />
        </motion.button>
      </motion.div>

      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}

export default HomepageHero;
