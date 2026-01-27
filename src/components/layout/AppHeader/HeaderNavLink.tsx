"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

/**
 * Props for HeaderNavLink component
 */
export interface HeaderNavLinkProps {
  /** Navigation URL */
  href: string;
  /** Display label text */
  label: string;
  /** Icon element (lucide-react recommended) */
  icon: React.ReactNode;
  /** Whether this link is currently active */
  isActive?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * HeaderNavLink - Multi-layer hover nav link for desktop header
 *
 * Features:
 * 1. Background highlight - opacity 0->1 on hover
 * 2. Icon + label lift - y: -2 on hover with spring.snappy
 * 3. Icon wiggle - rotate: [-5, 5, 0] on hover
 * 4. Animated underline - width 0->60% on hover with spring.ultraBouncy
 *
 * Active state: underline stays visible, text-primary color
 *
 * @example
 * <HeaderNavLink
 *   href="/menu"
 *   label="Menu"
 *   icon={<UtensilsCrossed className="w-5 h-5" />}
 *   isActive={pathname === "/menu"}
 * />
 */
export function HeaderNavLink({
  href,
  label,
  icon,
  isActive = false,
  className,
}: HeaderNavLinkProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <Link
      href={href}
      className={cn(
        "relative px-3 py-2 rounded-lg",
        "text-sm font-medium",
        "transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2",
        isActive ? "text-primary" : "text-text-primary hover:text-primary",
        "group",
        className
      )}
    >
      {/* Layer 1: Background highlight */}
      <motion.span
        className="absolute inset-0 rounded-lg bg-primary/5 pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={shouldAnimate ? { opacity: 1 } : undefined}
        transition={{ duration: 0.15 }}
        style={{ opacity: isActive ? 0.5 : 0 }}
      />

      {/* Layer 2 & 3: Icon + label lift with icon wiggle */}
      <motion.span
        className="relative flex items-center gap-2"
        whileHover={shouldAnimate ? { y: -2 } : undefined}
        transition={getSpring(spring.snappy)}
      >
        {/* Icon with wiggle animation */}
        <motion.span
          className="inline-flex"
          whileHover={
            shouldAnimate
              ? {
                  rotate: [-5, 5, 0],
                  transition: { duration: 0.3 },
                }
              : undefined
          }
        >
          {icon}
        </motion.span>

        {/* Label text */}
        <span>{label}</span>
      </motion.span>

      {/* Layer 4: Animated underline */}
      <motion.span
        className={cn(
          "absolute bottom-0 left-1/2 h-0.5 bg-primary rounded-full",
          "pointer-events-none"
        )}
        initial={false}
        animate={
          shouldAnimate
            ? {
                width: isActive ? "60%" : "0%",
                x: "-50%",
              }
            : {
                width: isActive ? "60%" : "0%",
                x: "-50%",
              }
        }
        whileHover={
          shouldAnimate
            ? {
                width: "60%",
                x: "-50%",
              }
            : undefined
        }
        transition={getSpring(spring.ultraBouncy)}
      />
    </Link>
  );
}

export default HeaderNavLink;
