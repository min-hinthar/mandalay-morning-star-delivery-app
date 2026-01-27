"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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
    <motion.div variants={staggerItem}>
      <Link href={href} onClick={onClick}>
        <motion.div
          className={cn(
            "flex items-center gap-4 min-h-[56px] py-4 px-4 rounded-xl",
            "transition-colors duration-150",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-text-primary hover:bg-surface-secondary"
          )}
          whileHover={shouldAnimate ? { x: 8 } : undefined}
          whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
          transition={getSpring(spring.snappy)}
        >
          {/* Icon container with glow effect on active */}
          <motion.span
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg",
              isActive
                ? "bg-primary/10 shadow-[0_0_12px_rgba(164,16,52,0.25)]"
                : "bg-surface-tertiary"
            )}
          >
            {icon}
          </motion.span>

          {/* Label */}
          <span className="flex-1 font-medium text-base">{label}</span>

          {/* Active indicator dot */}
          {isActive && (
            <motion.span
              className="w-2 h-2 rounded-full bg-primary"
              initial={shouldAnimate ? { scale: 0 } : undefined}
              animate={shouldAnimate ? { scale: 1 } : undefined}
              transition={getSpring(spring.ultraBouncy)}
            />
          )}
        </motion.div>
      </Link>
    </motion.div>
  );
}

export default DrawerNavLink;
