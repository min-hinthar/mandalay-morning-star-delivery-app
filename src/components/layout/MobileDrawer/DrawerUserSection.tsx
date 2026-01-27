"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { User } from "lucide-react";

// ============================================
// TYPES
// ============================================

export interface DrawerUserSectionProps {
  user: { name?: string; email?: string; avatar?: string } | null;
  onClose: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function DrawerUserSection({ user, onClose }: DrawerUserSectionProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <motion.div
      className="px-4 py-4"
      initial={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ delay: 0.1, ...getSpring(spring.gentle) }}
    >
      {user ? (
        <div className="flex items-center gap-3">
          {/* Avatar with status dot */}
          <div className="relative">
            <motion.div
              className={cn(
                "w-12 h-12 rounded-xl overflow-hidden",
                "bg-gradient-to-br from-primary to-secondary",
                "flex items-center justify-center text-white font-bold text-lg"
              )}
              whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
              transition={getSpring(spring.snappy)}
            >
              {user.avatar ? (
                /* eslint-disable-next-line @next/next/no-img-element -- User avatar with dynamic URL */
                <img
                  src={user.avatar}
                  alt={user.name || "User"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const sibling = e.currentTarget.nextElementSibling;
                    if (sibling) sibling.classList.remove("hidden");
                  }}
                />
              ) : null}
              <span className={cn("text-lg font-bold", user.avatar && "hidden")}>
                {user.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </motion.div>

            {/* Online status dot */}
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5",
                "w-3 h-3 rounded-full bg-green-500",
                "ring-2 ring-white dark:ring-zinc-900"
              )}
            />
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-text-primary truncate">
              {user.name || "Guest"}
            </p>
            {user.email && (
              <p className="text-sm text-text-muted truncate">{user.email}</p>
            )}
          </div>
        </div>
      ) : (
        <Link
          href="/login"
          onClick={onClose}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-3 rounded-xl",
            "bg-primary text-white font-medium",
            "hover:bg-primary-hover transition-colors",
            "min-h-[48px]"
          )}
        >
          <User className="w-5 h-5" />
          Sign In
        </Link>
      )}
    </motion.div>
  );
}

export default DrawerUserSection;
