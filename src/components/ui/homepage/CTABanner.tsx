"use client";

import Link from "next/link";
import { m } from "framer-motion";
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
    <section
      id={id}
      className="relative py-16 md:py-20 px-4 bg-gradient-to-br from-primary via-primary-hover to-primary overflow-hidden"
    >
      {/* Decorative background overlay */}
      <div className="absolute inset-0 bg-overlay/10" />

      <div className="relative max-w-4xl mx-auto">
        {/* Floating entrance with shadow animation - ~--shadow-xl equivalent, kept numeric for FM interpolation */}
        {/* eslint-disable no-restricted-syntax -- FM animation needs numeric boxShadow for interpolation */}
        <m.div
          initial={shouldAnimate ? { opacity: 0, y: 40, boxShadow: "0 0 0 rgba(0,0,0,0)" } : false}
          whileInView={{
            opacity: 1,
            y: 0,
            boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
          }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, ease: easing.default }}
          className="relative rounded-2xl bg-surface-primary p-8 md:p-12 text-center shadow-xl"
        >
          {/* Pulsing glow border - secondary/gold color, ~--shadow-glow-warning equivalent */}
          {isFullMotion && (
            <m.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              animate={{
                // Kept numeric for FM keyframe interpolation
                boxShadow: [
                  "0 0 0 0 rgba(235, 205, 0, 0)",
                  "0 0 20px 4px rgba(235, 205, 0, 0.3)",
                  "0 0 0 0 rgba(235, 205, 0, 0)",
                ],
              }}
              transition={{ duration: 2, repeat: 5, ease: "easeInOut" }}
            />
          )}
          {/* eslint-enable no-restricted-syntax */}

          {/* Promo badge */}
          <m.div
            initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : false}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: 0.1, ...spring.default }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/20 text-secondary rounded-pill mb-6"
          >
            <Truck className="w-4 h-4" />
            <span className="text-sm font-body font-semibold">
              Free delivery over $100 · $၁၀၀ အထက် အခမဲ့ပို့ဆောင်
            </span>
          </m.div>

          {/* EN Headline */}
          <m.h2
            initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: 0.15, duration: 0.4, ease: easing.default }}
            className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-text-primary mb-2"
          >
            Fresh Burmese Cuisine, <span className="text-primary">Delivered Weekly</span>
          </m.h2>
          {/* MY Headline */}
          <m.p
            initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: 0.17, duration: 0.4, ease: easing.default }}
            className="font-body text-xl md:text-2xl text-text-primary/70 mb-4"
          >
            လတ်ဆတ်သော မြန်မာ့အစားအသောက်{" "}
            <span className="text-primary/80">အပတ်စဉ် ပို့ဆောင်ပေးပါသည်</span>
          </m.p>

          {/* EN Subtext */}
          <m.p
            initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: 0.2, duration: 0.4, ease: easing.default }}
            className="font-body text-lg text-text-secondary max-w-xl mx-auto mb-1"
          >
            Fresh homemade Burmese dishes, delivered to your door
          </m.p>
          {/* MY Subtext */}
          <m.p
            initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: 0.22, duration: 0.4, ease: easing.default }}
            className="font-body text-base text-text-secondary/70 max-w-xl mx-auto mb-8"
          >
            အိမ်လုပ် မြန်မာအစားအသောက်များ သင့်အိမ်တံခါးဝအထိ ပို့ဆောင်ပေးပါသည်
          </m.p>

          {/* CTA Buttons - bilingual */}
          <m.div
            initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: 0.25, duration: 0.4, ease: easing.default }}
            whileHover={shouldAnimate ? { scale: 1.03 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.97 } : undefined}
          >
            <Link
              href="/menu"
              className="inline-flex items-center justify-center px-10 py-4 bg-primary text-text-inverse font-body font-semibold text-lg rounded-pill shadow-lg hover:bg-primary-hover transition-colors duration-fast"
            >
              Order Now · ယခု မှာယူမည်
            </Link>
          </m.div>
        </m.div>
      </div>
    </section>
  );
}

export default CTABanner;
