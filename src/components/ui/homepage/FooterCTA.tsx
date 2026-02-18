"use client";

import { m, type Variants } from "framer-motion";
import { Heart, Phone } from "lucide-react";
import { spring, staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

/**
 * Top CTA section content variants for staggered reveal.
 */
const ctaContainerVariants: Variants = staggerContainer(0.08, 0.1);

/**
 * Homepage-only CTA section: "Ready to Taste Authentic Burma?"
 * Renders above the shared SiteFooter (which comes from the public layout).
 */
export function FooterCTA() {
  const { shouldAnimate } = useAnimationPreference();

  return (
    <section className="relative overflow-hidden isolate">
      <div className="relative py-16 md:py-24 px-4 bg-gradient-to-br from-primary via-primary-hover to-primary">
        {/* Decorative overlay */}
        <div className="absolute inset-0 bg-overlay/20" />
        <div className="relative max-w-4xl mx-auto text-center">
          <m.div
            variants={ctaContainerVariants}
            initial={shouldAnimate ? "hidden" : false}
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="space-y-6"
          >
            {/* Badge */}
            <m.div
              variants={staggerItem}
              // MOBILE CRASH PREVENTION: No backdrop-blur on mobile (causes Safari crashes)
              className="inline-flex items-center gap-2 px-4 py-2 bg-overlay-light sm:backdrop-blur-sm rounded-pill"
            >
              <Heart className="w-4 h-4 text-text-inverse" />
              <span className="text-sm font-body font-medium text-text-inverse">
                Made with Love in Covina
              </span>
            </m.div>

            {/* Headline */}
            <m.h2
              variants={staggerItem}
              className="font-display text-3xl md:text-4xl lg:text-5xl text-text-inverse font-bold"
            >
              Ready to Taste <span className="text-secondary">Authentic Burma?</span>
            </m.h2>

            {/* Subtext */}
            <m.p
              variants={staggerItem}
              className="text-lg font-body text-text-inverse/90 max-w-2xl mx-auto"
            >
              Order by Friday 3pm and we&apos;ll deliver fresh, homemade Burmese dishes straight to
              your door on Saturday.
            </m.p>

            {/* Buttons */}
            <m.div
              variants={staggerItem}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
            >
              <m.a
                href="#menu"
                whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
                whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
                transition={spring.snappy}
                className="px-8 py-4 bg-surface-primary text-primary font-body font-semibold rounded-pill shadow-md hover:shadow-lg transition-shadow duration-fast"
              >
                Order Now
              </m.a>

              <m.a
                href="tel:+16266655317"
                whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
                whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
                transition={spring.snappy}
                className="px-8 py-4 bg-transparent border-2 border-text-inverse text-text-inverse font-body font-semibold rounded-pill hover:bg-text-inverse/10 transition-colors duration-fast flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Call Us
              </m.a>
            </m.div>
          </m.div>
        </div>
      </div>
    </section>
  );
}

export default FooterCTA;
