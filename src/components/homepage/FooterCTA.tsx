"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Heart, Phone, Mail, MapPin, Clock, Instagram, Facebook } from "lucide-react";
import {
  v6StaggerItem,
  v6ViewportOnce,
  v6Spring,
} from "@/lib/motion";
import { KITCHEN_LOCATION } from "@/types/address";

export function FooterCTA() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <footer className="relative overflow-hidden">
      {/* Top CTA Section */}
      <section className="relative py-16 md:py-24 px-4 bg-gradient-to-br from-primary via-primary-hover to-primary">
        {/* Decorative overlay */}
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={v6ViewportOnce.viewport}
            transition={{ duration: 0.55 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-pill">
              <Heart className="w-4 h-4 text-white" />
              <span className="text-sm font-body font-medium text-white">Made with Love in Covina</span>
            </div>

            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-white font-bold">
              Ready to Taste{" "}
              <span className="text-secondary">Authentic Burma?</span>
            </h2>

            <p className="text-lg font-body text-white/90 max-w-2xl mx-auto">
              Order by Friday 3pm and we&apos;ll deliver fresh, homemade Burmese dishes
              straight to your door on Saturday.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <motion.a
                href="#menu"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={v6Spring}
                className="px-8 py-4 bg-surface-primary text-primary font-body font-semibold rounded-pill shadow-md hover:shadow-lg transition-shadow duration-fast"
              >
                Order Now
              </motion.a>

              <motion.a
                href="tel:+16261234567"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={v6Spring}
                className="px-8 py-4 bg-transparent border-2 border-white text-white font-body font-semibold rounded-pill hover:bg-white/10 transition-colors duration-fast flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Call Us
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bottom Info Section */}
      <section className="py-12 px-4 bg-text-primary">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-white/90">
            {/* Contact Info */}
            <motion.div
              variants={v6StaggerItem}
              initial={shouldReduceMotion ? false : "hidden"}
              whileInView="visible"
              viewport={v6ViewportOnce.viewport}
            >
              <h3 className="font-display text-xl text-white font-semibold mb-4">Contact Us</h3>
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

            {/* Hours */}
            <motion.div
              variants={v6StaggerItem}
              initial={shouldReduceMotion ? false : "hidden"}
              whileInView="visible"
              viewport={v6ViewportOnce.viewport}
            >
              <h3 className="font-display text-xl text-white font-semibold mb-4">Delivery Hours</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-body font-medium">Saturday Delivery</p>
                    <p className="text-sm font-body text-white/80">11:00 AM - 7:00 PM PT</p>
                  </div>
                </div>
                <div className="p-3 bg-white/10 rounded-input">
                  <p className="text-sm font-body">
                    <strong className="text-secondary">Order Cutoff:</strong> Friday 3:00 PM PT
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Social */}
            <motion.div
              variants={v6StaggerItem}
              initial={shouldReduceMotion ? false : "hidden"}
              whileInView="visible"
              viewport={v6ViewportOnce.viewport}
            >
              <h3 className="font-display text-xl text-white font-semibold mb-4">Follow Us</h3>
              <div className="flex gap-4">
                <motion.a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={v6Spring}
                  className="p-3 bg-white/10 rounded-full hover:bg-secondary/20 transition-colors duration-fast"
                >
                  <Instagram className="w-6 h-6" />
                </motion.a>
                <motion.a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={v6Spring}
                  className="p-3 bg-white/10 rounded-full hover:bg-secondary/20 transition-colors duration-fast"
                >
                  <Facebook className="w-6 h-6" />
                </motion.a>
              </div>
              <p className="mt-4 text-sm font-body text-white/80">
                Share your dishes with #MandalayMorningStar
              </p>
            </motion.div>
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t border-white/10 text-center">
            <p className="text-sm font-body text-white/70">
              © {new Date().getFullYear()} Mandalay Morning Star. All rights reserved.
            </p>
            <p className="text-xs font-body text-white/60 mt-2">
              Authentic Burmese Cuisine • Southern California
            </p>
          </div>
        </div>
      </section>
    </footer>
  );
}

export default FooterCTA;
