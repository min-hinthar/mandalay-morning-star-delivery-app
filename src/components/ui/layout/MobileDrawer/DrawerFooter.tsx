"use client";

import { m } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { FooterLink } from "@/components/ui/AnimatedLink";
import { useFeedbackStore } from "@/components/ui/feedback/feedback-store";
import { MyanmarFlagIcon, CaliforniaFlagIcon } from "@/components/ui/icons/BrandIcons";

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
  const openFeedback = useFeedbackStore((s) => s.open);

  return (
    <m.div
      className={cn("px-4 py-4 border-t border-border-subtle bg-surface-secondary/50", className)}
      initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ delay: 0.3, ...getSpring(spring.gentle) }}
    >
      {/* Footer links */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
        {defaultLinks.map((link) => (
          <FooterLink key={link.href} href={link.href} subtle className="text-xs">
            {link.label}
          </FooterLink>
        ))}
        <button
          type="button"
          onClick={() => openFeedback()}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          Help & Feedback
        </button>
      </div>

      {/* Attribution — mirrors the site footer's line */}
      <p className="mt-3 flex flex-wrap items-center justify-center gap-1 text-center text-2xs text-text-muted">
        <span>Cooked with Love</span>
        <Heart className="h-3 w-3 fill-red-500 text-red-500" aria-hidden="true" />
        <span>for the Burmese</span>
        <MyanmarFlagIcon className="h-3 w-4" />
        <span>Community of Los Angeles</span>
        <CaliforniaFlagIcon className="h-3 w-4" />
      </p>
    </m.div>
  );
}

export default DrawerFooter;
