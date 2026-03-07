"use client";

import { m, type Variants } from "framer-motion";
import Link from "next/link";
import { MapPin, Phone, Mail, Clock, Heart } from "lucide-react";
import {
  YelpIcon,
  GoogleMapsIcon,
  UberEatsIcon,
  DoorDashIcon,
  GrubHubIcon,
  MyanmarFlagIcon,
  CaliforniaFlagIcon,
} from "@/components/ui/icons/BrandIcons";
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

/** Business listing links with brand icons */
const BUSINESS_LISTINGS = [
  {
    name: "Yelp",
    icon: YelpIcon,
    href: "https://www.yelp.com/biz/mandalay-morning-star-covina",
  },
  {
    name: "Google Maps",
    icon: GoogleMapsIcon,
    href: "https://maps.app.goo.gl/UYuCYzaWnpVF1dUQ9",
  },
  {
    name: "Uber Eats",
    icon: UberEatsIcon,
    href: "https://www.order.store/store/mandalay-morning-star-burmese-kitchen/RxuPcCBjVy2v1vLh9I7pwQ",
  },
  {
    name: "DoorDash",
    icon: DoorDashIcon,
    href: "https://order.online/store/-28733114/",
  },
  {
    name: "GrubHub",
    icon: GrubHubIcon,
    href: "https://mandalaymorningstar.dine.online/locations/6986528/",
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
                href="tel:+16266655317"
                className="flex items-center gap-3 hover:text-secondary transition-colors duration-fast hover:underline underline-offset-2"
              >
                <Phone className="w-5 h-5" />
                <span className="text-sm font-body">(626) 665-5317</span>
              </a>
              <a
                href="mailto:admin@mandalaymorningstar.com"
                className="flex items-center gap-3 hover:text-secondary transition-colors duration-fast hover:underline underline-offset-2"
              >
                <Mail className="w-5 h-5" />
                <span className="text-sm font-body">admin@mandalaymorningstar.com</span>
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
                  <p className="text-sm font-body font-medium">Weekly Delivery</p>
                  <p className="text-sm font-body text-footer-text-muted">
                    Check schedule for details
                  </p>
                </div>
              </div>
              <div className="p-3 bg-footer-text/10 rounded-input">
                <p className="text-sm font-body">
                  <strong className="text-secondary">Order Cutoff:</strong> See delivery schedule
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
                    className="flex items-center gap-2.5 text-sm font-body hover:text-secondary transition-colors duration-fast hover:underline underline-offset-2"
                  >
                    <listing.icon className="w-5 h-5 flex-shrink-0" />
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
            <h3 className="font-display text-xl text-footer-text font-semibold mb-4">Legal</h3>
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
            &copy; {new Date().getFullYear()} Mandalay Morning Star Burmese Kitchen. All rights
            reserved.
          </p>
          <p className="text-xs font-body text-footer-text-muted mt-2 inline-flex items-center justify-center gap-1 flex-wrap">
            <span>Cooked with Love</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>for the Burmese</span>
            <MyanmarFlagIcon className="w-5 h-3.5" />
            <span>Community of Los Angeles</span>
            <CaliforniaFlagIcon className="w-5 h-3.5" />
          </p>
        </m.div>
      </div>
    </footer>
  );
}
