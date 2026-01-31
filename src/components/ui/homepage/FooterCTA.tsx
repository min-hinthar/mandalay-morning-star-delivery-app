"use client";

import { motion, type Variants } from "framer-motion";
import { Heart, Phone, Mail, MapPin, Clock, Instagram, Facebook } from "lucide-react";
import { spring, easing, staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { KITCHEN_LOCATION } from "@/types/address";

/**
 * Column variants for staggered footer reveals.
 * Each column animates with increasing delay.
 */
const columnVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: easing.default,
    },
  }),
};

/**
 * Copyright fade-in variant - appears after columns.
 */
const copyrightVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delay: 0.4, // After 3 columns
      duration: 0.5,
      ease: easing.default,
    },
  },
};

/**
 * Top CTA section content variants for staggered reveal.
 */
const ctaContainerVariants: Variants = staggerContainer(0.08, 0.1);

export function FooterCTA() {
  const { shouldAnimate } = useAnimationPreference();

  return (
    <footer className="relative overflow-hidden isolate">
      {/* Top CTA Section */}
      <section className="relative py-16 md:py-24 px-4 bg-gradient-to-br from-primary via-primary-hover to-primary">
        {/* Decorative overlay */}
        <div className="absolute inset-0 bg-overlay/20" />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            variants={ctaContainerVariants}
            initial={shouldAnimate ? "hidden" : false}
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="space-y-6"
          >
            {/* Badge */}
            <motion.div
              variants={staggerItem}
              // MOBILE CRASH PREVENTION: No backdrop-blur on mobile (causes Safari crashes)
              className="inline-flex items-center gap-2 px-4 py-2 bg-overlay-light sm:backdrop-blur-sm rounded-pill"
            >
              <Heart className="w-4 h-4 text-text-inverse" />
              <span className="text-sm font-body font-medium text-text-inverse">Made with Love in Covina</span>
            </motion.div>

            {/* Headline */}
            <motion.h2
              variants={staggerItem}
              className="font-display text-3xl md:text-4xl lg:text-5xl text-text-inverse font-bold"
            >
              Ready to Taste{" "}
              <span className="text-secondary">Authentic Burma?</span>
            </motion.h2>

            {/* Subtext */}
            <motion.p
              variants={staggerItem}
              className="text-lg font-body text-text-inverse/90 max-w-2xl mx-auto"
            >
              Order by Friday 3pm and we&apos;ll deliver fresh, homemade Burmese dishes
              straight to your door on Saturday.
            </motion.p>

            {/* Buttons */}
            <motion.div
              variants={staggerItem}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
            >
              <motion.a
                href="#menu"
                whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
                whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
                transition={spring.snappy}
                className="px-8 py-4 bg-surface-primary text-primary font-body font-semibold rounded-pill shadow-md hover:shadow-lg transition-shadow duration-fast"
              >
                Order Now
              </motion.a>

              <motion.a
                href="tel:+16261234567"
                whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
                whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
                transition={spring.snappy}
                className="px-8 py-4 bg-transparent border-2 border-text-inverse text-text-inverse font-body font-semibold rounded-pill hover:bg-text-inverse/10 transition-colors duration-fast flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Call Us
              </motion.a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Bottom Info Section */}
      <section className="py-12 px-4 bg-footer-bg">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-footer-text">
            {/* Contact Info - Column 0 */}
            <motion.div
              custom={0}
              variants={columnVariants}
              initial={shouldAnimate ? "hidden" : false}
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              <h3 className="font-display text-xl text-footer-text font-semibold mb-4">Contact Us</h3>
              <div className="space-y-3">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(KITCHEN_LOCATION.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 hover:text-secondary transition-colors duration-fast hover:underline underline-offset-2"
                >
                  <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-body">{KITCHEN_LOCATION.address}</span>
                </a>
                <a
                  href="tel:+16261234567"
                  className="flex items-center gap-3 hover:text-secondary transition-colors duration-fast hover:underline underline-offset-2"
                >
                  <Phone className="w-5 h-5" />
                  <span className="text-sm font-body">(626) 123-4567</span>
                </a>
                <a
                  href="mailto:hello@mandalaymorningstar.com"
                  className="flex items-center gap-3 hover:text-secondary transition-colors duration-fast hover:underline underline-offset-2"
                >
                  <Mail className="w-5 h-5" />
                  <span className="text-sm font-body">hello@mandalaymorningstar.com</span>
                </a>
              </div>
            </motion.div>

            {/* Hours - Column 1 */}
            <motion.div
              custom={1}
              variants={columnVariants}
              initial={shouldAnimate ? "hidden" : false}
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              <h3 className="font-display text-xl text-footer-text font-semibold mb-4">Delivery Hours</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-body font-medium">Saturday Delivery</p>
                    <p className="text-sm font-body text-footer-text-muted">11:00 AM - 7:00 PM PT</p>
                  </div>
                </div>
                <div className="p-3 bg-footer-text/10 rounded-input">
                  <p className="text-sm font-body">
                    <strong className="text-secondary">Order Cutoff:</strong> Friday 3:00 PM PT
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Social - Column 2 */}
            <motion.div
              custom={2}
              variants={columnVariants}
              initial={shouldAnimate ? "hidden" : false}
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              <h3 className="font-display text-xl text-footer-text font-semibold mb-4">Follow Us</h3>
              <div className="flex gap-4">
                <motion.a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
                  whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
                  transition={spring.snappy}
                  className="p-3 bg-footer-text/10 rounded-full hover:bg-secondary/20 transition-colors duration-fast"
                >
                  <Instagram className="w-6 h-6" />
                </motion.a>
                <motion.a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
                  whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
                  transition={spring.snappy}
                  className="p-3 bg-footer-text/10 rounded-full hover:bg-secondary/20 transition-colors duration-fast"
                >
                  <Facebook className="w-6 h-6" />
                </motion.a>
              </div>
              <p className="mt-4 text-sm font-body text-footer-text-muted">
                Share your dishes with #MandalayMorningStar
              </p>
            </motion.div>
          </div>

          {/* Copyright - fades in last */}
          <motion.div
            variants={copyrightVariants}
            initial={shouldAnimate ? "hidden" : false}
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="mt-12 pt-8 border-t border-footer-border text-center"
          >
            <p className="text-sm font-body text-footer-text-muted">
              © {new Date().getFullYear()} Mandalay Morning Star. All rights reserved.
            </p>
            <p className="text-xs font-body text-footer-text-muted mt-2">
              Authentic Burmese Cuisine • Southern California
            </p>
          </motion.div>
        </div>
      </section>
    </footer>
  );
}

export default FooterCTA;
