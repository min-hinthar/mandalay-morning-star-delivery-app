"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { FooterLink } from "@/components/ui/AnimatedLink";

// ============================================
// TYPES
// ============================================

export interface DrawerFooterProps {
  className?: string;
}

// ============================================
// DEFAULT LINKS
// ============================================

const defaultLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
];

// ============================================
// COMPONENT
// ============================================

export function DrawerFooter({ className }: DrawerFooterProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <motion.div
      className={cn(
        "px-4 py-4 border-t border-border-subtle bg-surface-secondary/50",
        className
      )}
      initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ delay: 0.3, ...getSpring(spring.gentle) }}
    >
      {/* Footer links */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
        {defaultLinks.map((link) => (
          <FooterLink
            key={link.href}
            href={link.href}
            subtle
            className="text-xs"
          >
            {link.label}
          </FooterLink>
        ))}
      </div>

      {/* Copyright */}
      <p className="mt-3 text-center text-[10px] text-text-muted">
        Made with love in Seattle
      </p>
    </motion.div>
  );
}

export default DrawerFooter;
