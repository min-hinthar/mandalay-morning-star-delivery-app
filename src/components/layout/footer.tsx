"use client";

import React, { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import {
  spring,
  staggerItem,
} from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { FooterLink } from "@/components/ui/AnimatedLink";
import { Heart, MapPin, Clock, Phone, Mail, Instagram, Facebook, Twitter } from "lucide-react";

// ============================================
// TYPES
// ============================================

export interface FooterProps {
  /** Business info */
  businessInfo?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    hours?: string;
  };
  /** Footer navigation links */
  navLinks?: Array<{
    title: string;
    links: Array<{ href: string; label: string; external?: boolean }>;
  }>;
  /** Social media links */
  socialLinks?: Array<{
    platform: "instagram" | "facebook" | "twitter" | "email";
    href: string;
  }>;
  /** Show newsletter signup */
  showNewsletter?: boolean;
  /** Copyright text */
  copyright?: string;
  /** Additional class names */
  className?: string;
}

// ============================================
// CONSTANTS
// ============================================

const defaultNavLinks = [
  {
    title: "Menu",
    links: [
      { href: "/menu", label: "Full Menu" },
      { href: "/menu?category=entrees", label: "Entrees" },
      { href: "/menu?category=salads", label: "Salads" },
      { href: "/menu?category=desserts", label: "Desserts" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact Us" },
      { href: "/delivery-areas", label: "Delivery Areas" },
      { href: "/about", label: "About Us" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/accessibility", label: "Accessibility" },
    ],
  },
];

const defaultSocialLinks = [
  { platform: "instagram" as const, href: "https://instagram.com" },
  { platform: "facebook" as const, href: "https://facebook.com" },
  { platform: "twitter" as const, href: "https://twitter.com" },
];

// ============================================
// LOTUS PATTERN SVG
// ============================================

function LotusPattern({ className }: { className?: string }) {
  return (
    <svg
      className={cn("w-full h-12 opacity-20", className)}
      viewBox="0 0 400 48"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <defs>
        <pattern id="lotusFooterPattern" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
          {/* Lotus flower */}
          <path
            d="M24 8 C20 14, 16 20, 16 28 C16 34, 20 38, 24 38 C28 38, 32 34, 32 28 C32 20, 28 14, 24 8Z"
            fill="#D4A017"
            opacity="0.4"
          />
          <path
            d="M24 12 C21 16, 19 22, 19 28 C19 32, 21 35, 24 35 C27 35, 29 32, 29 28 C29 22, 27 16, 24 12Z"
            fill="#EBCD00"
            opacity="0.3"
          />
          <circle cx="24" cy="26" r="3" fill="#A41034" opacity="0.5" />
          {/* Petals */}
          <ellipse cx="10" cy="28" rx="6" ry="12" fill="#52A52E" opacity="0.2" transform="rotate(-30 10 28)" />
          <ellipse cx="38" cy="28" rx="6" ry="12" fill="#52A52E" opacity="0.2" transform="rotate(30 38 28)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#lotusFooterPattern)" />
    </svg>
  );
}

// ============================================
// PEACOCK FEATHER SVG (Easter egg)
// ============================================

function PeacockFeather({ className, animate = false }: { className?: string; animate?: boolean }) {
  const { shouldAnimate } = useAnimationPreference();

  return (
    <motion.svg
      className={cn("w-20 h-32", className)}
      viewBox="0 0 80 128"
      fill="none"
      animate={shouldAnimate && animate ? { rotate: [0, 2, -2, 0] } : undefined}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id="featherGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#52A52E" />
          <stop offset="50%" stopColor="#D4A017" />
          <stop offset="100%" stopColor="#A41034" />
        </linearGradient>
      </defs>
      {/* Feather body */}
      <ellipse cx="40" cy="50" rx="32" ry="44" fill="url(#featherGradient)" opacity="0.8" />
      <ellipse cx="40" cy="48" rx="24" ry="36" fill="#D4A017" />
      <ellipse cx="40" cy="46" rx="18" ry="28" fill="#52A52E" />
      <ellipse cx="40" cy="44" rx="12" ry="20" fill="#A41034" />
      <circle cx="40" cy="40" r="8" fill="#1a1a2e" />
      <circle cx="40" cy="40" r="4" fill="#D4A017" />
      {/* Feather stem */}
      <path d="M40 90 Q38 110 40 128" stroke="#52A52E" strokeWidth="3" fill="none" />
    </motion.svg>
  );
}

// ============================================
// WOBBLING ICON (Easter egg on hover)
// ============================================

interface WobblingIconProps {
  icon: React.ReactNode;
  href: string;
  label: string;
}

function WobblingIcon({ icon, href, label }: WobblingIconProps) {
  const { shouldAnimate, getSpring, isFullMotion } = useAnimationPreference();
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  // Easter egg: spin after 5 clicks
  const handleClick = () => {
    if (isFullMotion) {
      setClickCount((c) => c + 1);
      navigator.vibrate?.(5);
    }
  };

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        "w-10 h-10 flex items-center justify-center rounded-xl",
        "bg-white/10 hover:bg-white/20 transition-colors",
        "text-white/80 hover:text-white"
      )}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
      whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
      animate={shouldAnimate ? {
        rotate: clickCount >= 5 ? 360 : isHovered ? [0, -10, 10, -5, 5, 0] : 0,
      } : undefined}
      transition={clickCount >= 5
        ? { duration: 0.5, onComplete: () => setClickCount(0) }
        : getSpring(spring.wobbly)
      }
    >
      {icon}
    </motion.a>
  );
}

// ============================================
// ANIMATED GRADIENT BACKGROUND
// ============================================

function GradientBackground() {
  const { shouldAnimate } = useAnimationPreference();

  return (
    <>
      {/* Dark footer gradient - intentional custom colors for dark theme (not migrated to tokens) */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23]"
      />

      {/* Animated color overlay */}
      {shouldAnimate && (
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(164,16,52,0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, rgba(212,160,23,0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 80%, rgba(82,165,46,0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 50%, rgba(164,16,52,0.3) 0%, transparent 50%)",
            ],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      )}

      {/* Grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </>
  );
}

// ============================================
// NEWSLETTER SIGNUP
// ============================================

function NewsletterSignup() {
  const { shouldAnimate, getSpring, isFullMotion } = useAnimationPreference();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    setIsLoading(false);
    setIsSubmitted(true);

    if (isFullMotion) {
      navigator.vibrate?.([10, 50, 20]);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <motion.h4
        className="text-white text-lg font-semibold mb-2"
        initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
        whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        viewport={{ once: true }}
        transition={getSpring(spring.gentle)}
      >
        Stay Updated
      </motion.h4>
      <p className="text-white/60 text-sm mb-4">
        Get notified about new menu items and special offers.
      </p>

      <AnimatePresence mode="wait">
        {isSubmitted ? (
          <motion.div
            key="success"
            className="flex items-center gap-2 text-green"
            initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
            animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
            exit={shouldAnimate ? { opacity: 0 } : undefined}
            transition={getSpring(spring.ultraBouncy)}
          >
            <motion.span
              initial={shouldAnimate ? { scale: 0, rotate: -180 } : undefined}
              animate={shouldAnimate ? { scale: 1, rotate: 0 } : undefined}
              transition={getSpring(spring.ultraBouncy)}
            >
              ✓
            </motion.span>
            <span>Thanks for subscribing!</span>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            className="flex gap-2"
            initial={shouldAnimate ? { opacity: 0 } : undefined}
            animate={shouldAnimate ? { opacity: 1 } : undefined}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className={cn(
                "flex-1 px-4 py-2 rounded-xl",
                "bg-white/10 border border-white/20",
                "text-white placeholder:text-white/40",
                "focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50"
              )}
              required
            />
            <motion.button
              type="submit"
              disabled={isLoading}
              className={cn(
                "px-4 py-2 rounded-xl font-medium",
                "bg-secondary text-text-primary",
                "hover:bg-secondary-hover transition-colors",
                "disabled:opacity-50"
              )}
              whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
              transition={getSpring(spring.snappy)}
            >
              {isLoading ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  ⟳
                </motion.span>
              ) : (
                "Subscribe"
              )}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// MAIN FOOTER COMPONENT
// ============================================

export function Footer({
  businessInfo = {
    name: "Mandalay Morning Star",
    address: "Seattle, WA",
    phone: "(206) 555-0123",
    email: "hello@mandalaymorningstar.com",
    hours: "Saturday delivery only",
  },
  navLinks = defaultNavLinks,
  socialLinks = defaultSocialLinks,
  showNewsletter = true,
  copyright = `© ${new Date().getFullYear()} Mandalay Morning Star. All rights reserved.`,
  className,
}: FooterProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const footerRef = useRef<HTMLElement>(null);
  const isInView = useInView(footerRef, { once: true, margin: "-100px" });

  // Easter egg state
  const [secretClicks, setSecretClicks] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  const handleSecretClick = () => {
    const newCount = secretClicks + 1;
    setSecretClicks(newCount);
    if (newCount >= 7) {
      setShowEasterEgg(true);
      setTimeout(() => setShowEasterEgg(false), 3000);
      setSecretClicks(0);
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case "instagram": return <Instagram className="w-5 h-5" />;
      case "facebook": return <Facebook className="w-5 h-5" />;
      case "twitter": return <Twitter className="w-5 h-5" />;
      case "email": return <Mail className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <footer
      ref={footerRef}
      className={cn("relative overflow-hidden", className)}
    >
      {/* Animated gradient background */}
      <GradientBackground />

      {/* Lotus pattern border at top */}
      <LotusPattern className="relative z-10" />

      {/* Main content */}
      <motion.div
        className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 pt-12 pb-8"
        initial={shouldAnimate ? { opacity: 0, y: 40 } : undefined}
        animate={shouldAnimate && isInView ? { opacity: 1, y: 0 } : undefined}
        transition={getSpring(spring.gentle)}
      >
        {/* Newsletter section */}
        {showNewsletter && (
          <div className="mb-12 pb-12 border-b border-white/10">
            <NewsletterSignup />
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Business info */}
          <motion.div
            className="col-span-2 md:col-span-1"
            variants={staggerItem}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <motion.div
              className="flex items-center gap-2 mb-4 cursor-pointer"
              onClick={handleSecretClick}
              whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
            >
              {/* Logo */}
              <Image
                src="/logo.png"
                alt="Mandalay Morning Star"
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="text-white font-display font-semibold">{businessInfo.name}</span>
            </motion.div>

            <div className="space-y-2 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-secondary" />
                <span>{businessInfo.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-secondary" />
                <span>{businessInfo.hours}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-secondary" />
                <span>{businessInfo.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-secondary" />
                <span className="truncate">{businessInfo.email}</span>
              </div>
            </div>
          </motion.div>

          {/* Navigation columns */}
          {navLinks.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              variants={staggerItem}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              custom={sectionIndex}
            >
              <h4 className="text-white font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <FooterLink
                      href={link.href}
                      external={link.external}
                      className="text-white/60 hover:text-white"
                      underlineColor="#D4A017"
                    >
                      {link.label}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom bar */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10"
          initial={shouldAnimate ? { opacity: 0 } : undefined}
          animate={shouldAnimate && isInView ? { opacity: 1 } : undefined}
          transition={{ delay: 0.4 }}
        >
          {/* Social links */}
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <WobblingIcon
                key={social.platform}
                icon={getSocialIcon(social.platform)}
                href={social.href}
                label={social.platform}
              />
            ))}
          </div>

          {/* Copyright */}
          <p className="text-white/40 text-sm flex items-center gap-1">
            {copyright}
            <motion.span
              whileHover={shouldAnimate ? {
                scale: [1, 1.2, 1],
                color: ["#fff", "#A41034", "#fff"],
              } : undefined}
              transition={{ duration: 0.3 }}
            >
              <Heart className="w-3 h-3 inline-block mx-1" />
            </motion.span>
            Seattle
          </p>
        </motion.div>
      </motion.div>

      {/* Decorative peacock feather (hidden easter egg) */}
      <AnimatePresence>
        {showEasterEgg && (
          <motion.div
            className="absolute bottom-0 right-8 pointer-events-none"
            initial={{ y: 100, opacity: 0, rotate: -10 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 100, opacity: 0, rotate: 10 }}
            transition={getSpring(spring.ultraBouncy)}
          >
            <PeacockFeather animate />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background decorative peacock (always visible, subtle) */}
      <div className="absolute bottom-0 right-0 opacity-[0.03] pointer-events-none transform translate-x-1/4 translate-y-1/4">
        <PeacockFeather className="w-64 h-96" />
      </div>
    </footer>
  );
}

export default Footer;
