"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Truck } from "lucide-react";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { spring, easing } from "@/lib/motion-tokens";

interface CTABannerProps {
  id?: string;
}

/**
 * Promotional CTA banner with floating entrance and pulsing glow border.
 *
 * Features:
 * - Floats up from below when scrolled into view
 * - Pulsing glow border (gold color) for attention
 * - Respects reduced motion preference (disables glow)
 * - Always replays animations on scroll re-entry
 */
export function CTABanner({ id }: CTABannerProps) {
  const { shouldAnimate, isFullMotion } = useAnimationPreference();

  return (
    <section id={id} className="relative py-16 md:py-20 px-4 bg-gradient-to-br from-primary via-primary-hover to-primary overflow-hidden">
      {/* Decorative background overlay */}
      <div className="absolute inset-0 bg-overlay/10" />

      <div className="relative max-w-4xl mx-auto">
        {/* Floating entrance with shadow animation - ~--shadow-xl equivalent, kept numeric for FM interpolation */}
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 40, boxShadow: "0 0 0 rgba(0,0,0,0)" } : false}
          whileInView={{
            opacity: 1,
            y: 0,
            boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
          }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.5, ease: easing.default }}
          className="relative rounded-2xl bg-surface-primary p-8 md:p-12 text-center shadow-xl"
        >
          {/* Pulsing glow border - secondary/gold color, ~--shadow-glow-warning equivalent */}
          {isFullMotion && (
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              animate={{
                // Kept numeric for FM keyframe interpolation
                boxShadow: [
                  "0 0 0 0 rgba(235, 205, 0, 0)",
                  "0 0 20px 4px rgba(235, 205, 0, 0.3)",
                  "0 0 0 0 rgba(235, 205, 0, 0)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          {/* Promo badge */}
          <motion.div
            initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : false}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ delay: 0.1, ...spring.default }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/20 text-secondary rounded-pill mb-6"
          >
            <Truck className="w-4 h-4" />
            <span className="text-sm font-body font-semibold">Free delivery over $100</span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ delay: 0.15, duration: 0.4, ease: easing.default }}
            className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-text-primary mb-4"
          >
            Order by Friday 3pm for{" "}
            <span className="text-primary">Saturday Delivery</span>
          </motion.h2>

          {/* Subtext */}
          <motion.p
            initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ delay: 0.2, duration: 0.4, ease: easing.default }}
            className="font-body text-lg text-text-secondary max-w-xl mx-auto mb-8"
          >
            Fresh homemade Burmese dishes, delivered to your door
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ delay: 0.25, duration: 0.4, ease: easing.default }}
            whileHover={shouldAnimate ? { scale: 1.03 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.97 } : undefined}
          >
            <Link
              href="/menu"
              className="inline-flex items-center justify-center px-10 py-4 bg-primary text-text-inverse font-body font-semibold text-lg rounded-pill shadow-lg hover:bg-primary-hover transition-colors duration-fast"
            >
              Order Now
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default CTABanner;
