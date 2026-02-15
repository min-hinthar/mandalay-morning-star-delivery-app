"use client";

import { m, type Variants } from "framer-motion";
import Link from "next/link";
import { MapPin, Phone, Mail, Clock, ExternalLink } from "lucide-react";
import { easing } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { KITCHEN_LOCATION } from "@/types/address";

/**
 * Column variants for staggered footer reveals.
 * Each column animates with increasing delay based on custom index.
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
 * Copyright fade-in variant - appears after all 4 columns.
 */
const copyrightVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delay: 0.5,
      duration: 0.5,
      ease: easing.default,
    },
  },
};

/** Business listing links (external) */
const BUSINESS_LISTINGS = [
  {
    name: "Yelp",
    // TODO: Replace with verified Yelp business page URL once confirmed
    href: "https://www.yelp.com/search?find_desc=Mandalay+Morning+Star+Burmese+Kitchen&find_loc=Covina+CA",
  },
  {
    name: "Google Maps",
    href: `https://maps.google.com/?q=${encodeURIComponent(KITCHEN_LOCATION.address)}`,
  },
  {
    name: "Uber Eats",
    // TODO: Replace with specific Uber Eats restaurant page URL
    href: "https://www.ubereats.com",
  },
  {
    name: "DoorDash",
    // TODO: Replace with specific DoorDash restaurant page URL
    href: "https://www.doordash.com",
  },
  {
    name: "GrubHub",
    // TODO: Replace with specific GrubHub restaurant page URL
    href: "https://www.grubhub.com",
  },
] as const;

/**
 * Shared site footer for all public pages.
 * Renders contact info, delivery hours, business listings, legal links,
 * copyright, and attribution tagline.
 *
 * Added to (public)/layout.tsx so it appears on /, /menu, /privacy, /terms
 * but NOT on authenticated routes (/admin, /driver, /cart, /checkout).
 */
export function SiteFooter() {
  const { shouldAnimate } = useAnimationPreference();

  return (
    <footer className="py-12 px-4 bg-footer-bg">
      <div className="max-w-6xl mx-auto">
        {/* 4-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-footer-text">
          {/* Column 1: Contact Us */}
          <m.div
            custom={0}
            variants={columnVariants}
            initial={shouldAnimate ? "hidden" : false}
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <h3 className="font-display text-xl text-footer-text font-semibold mb-4">
              Contact Us
            </h3>
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
          </m.div>

          {/* Column 2: Delivery Hours */}
          <m.div
            custom={1}
            variants={columnVariants}
            initial={shouldAnimate ? "hidden" : false}
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <h3 className="font-display text-xl text-footer-text font-semibold mb-4">
              Delivery Hours
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5" />
                <div>
                  <p className="text-sm font-body font-medium">Saturday Delivery</p>
                  <p className="text-sm font-body text-footer-text-muted">
                    11:00 AM - 7:00 PM PT
                  </p>
                </div>
              </div>
              <div className="p-3 bg-footer-text/10 rounded-input">
                <p className="text-sm font-body">
                  <strong className="text-secondary">Order Cutoff:</strong> Friday 3:00 PM PT
                </p>
              </div>
            </div>
          </m.div>

          {/* Column 3: Find Us Online */}
          <m.div
            custom={2}
            variants={columnVariants}
            initial={shouldAnimate ? "hidden" : false}
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <h3 className="font-display text-xl text-footer-text font-semibold mb-4">
              Find Us Online
            </h3>
            <ul className="space-y-2.5">
              {BUSINESS_LISTINGS.map((listing) => (
                <li key={listing.name}>
                  <a
                    href={listing.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-body hover:text-secondary transition-colors duration-fast hover:underline underline-offset-2"
                  >
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                    {listing.name}
                  </a>
                </li>
              ))}
            </ul>
          </m.div>

          {/* Column 4: Legal */}
          <m.div
            custom={3}
            variants={columnVariants}
            initial={shouldAnimate ? "hidden" : false}
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <h3 className="font-display text-xl text-footer-text font-semibold mb-4">
              Legal
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm font-body hover:text-secondary transition-colors duration-fast hover:underline underline-offset-2"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm font-body hover:text-secondary transition-colors duration-fast hover:underline underline-offset-2"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </m.div>
        </div>

        {/* Bottom bar: copyright + attribution */}
        <m.div
          variants={copyrightVariants}
          initial={shouldAnimate ? "hidden" : false}
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="mt-12 pt-8 border-t border-footer-border text-center"
        >
          <p className="text-sm font-body text-footer-text-muted">
            &copy; {new Date().getFullYear()} Mandalay Morning Star Burmese Kitchen.
            All rights reserved.
          </p>
          <p className="text-xs font-body text-footer-text-muted mt-2">
            Cooked with Love &#10084;&#65039; for the Burmese &#127474;&#127474; Community of Los Angeles &#128059;
          </p>
        </m.div>
      </div>
    </footer>
  );
}
