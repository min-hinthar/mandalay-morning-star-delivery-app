"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export interface DrawerNavLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function DrawerNavLink({
  href,
  label,
  icon,
  isActive = false,
  onClick,
}: DrawerNavLinkProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <m.div variants={staggerItem}>
      <Link href={href} onClick={onClick}>
        <m.div
          className={cn(
            "flex items-center gap-4 min-h-[56px] py-4 px-4 rounded-xl",
            "transition-colors duration-150",
            // Active = warm clay pill (self-contained: fill + text on ONE element)
            isActive
              ? "bg-hero-clay/15 text-text-primary ring-1 ring-inset ring-hero-clay/25"
              : "text-text-primary hover:bg-hero-clay/[0.07]"
          )}
          whileHover={shouldAnimate ? { x: 8 } : undefined}
          whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
          transition={getSpring(spring.snappy)}
        >
          {/* Icon disc — clay-lit when active */}
          <m.span
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg",
              isActive
                ? "bg-hero-clay/20 text-hero-clay"
                : "bg-surface-tertiary text-text-secondary"
            )}
          >
            {icon}
          </m.span>

          {/* Label */}
          <span className="flex-1 font-medium text-base">{label}</span>

          {/* Active indicator dot */}
          {isActive && (
            <m.span
              className="w-2 h-2 rounded-full bg-hero-clay"
              initial={shouldAnimate ? { scale: 0 } : undefined}
              animate={shouldAnimate ? { scale: 1 } : undefined}
              transition={getSpring(spring.ultraBouncy)}
            />
          )}
        </m.div>
      </Link>
    </m.div>
  );
}

export default DrawerNavLink;
