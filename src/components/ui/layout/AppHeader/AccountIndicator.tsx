"use client";

/**
 * AccountIndicator - User avatar/initials with dropdown menu
 *
 * Features:
 * - When not logged in: User icon button linking to /login
 * - When logged in: Avatar image or initials fallback with status dot
 * - Dropdown menu: Profile, Orders, Sign Out
 * - Animated dropdown with spring physics
 * - Close on click outside and Escape key
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { User, LogOut, Package, UserCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { zClass } from "@/lib/design-system/tokens/z-index";

export interface AccountIndicatorProps {
  className?: string;
}

/**
 * Dropdown animation variants per CONTEXT.md
 * Slide down + scale + fade with spring physics
 */
const dropdownVariants = {
  initial: { opacity: 0, scale: 0.95, y: -10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: spring.snappy,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: { duration: 0.1 },
  },
};

/**
 * Get initials from user email or name
 */
function getInitials(email?: string | null, name?: string | null): string {
  if (name) {
    const parts = name.split(" ");
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name[0].toUpperCase();
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return "?";
}

/**
 * Get a gradient style based on user email for consistent avatar background
 * Uses CSS variables for theme-awareness
 */
function getGradientStyleFromEmail(email?: string | null): React.CSSProperties {
  // Default gradient uses primary theme colors
  const defaultGradient: React.CSSProperties = {
    background: "linear-gradient(to bottom right, var(--color-secondary), var(--color-primary))",
  };

  if (!email) return defaultGradient;

  // Simple hash to pick from color options
  const hash = email.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients: React.CSSProperties[] = [
    { background: "linear-gradient(to bottom right, var(--color-secondary), var(--color-primary))" },
    { background: "linear-gradient(to bottom right, var(--color-accent-magenta), var(--color-primary))" },
    { background: "linear-gradient(to bottom right, var(--color-accent-teal), var(--color-accent-magenta))" },
    { background: "linear-gradient(to bottom right, var(--color-accent-teal), var(--color-primary))" },
    { background: "linear-gradient(to bottom right, var(--color-accent-green), var(--color-accent-teal))" },
  ];
  return gradients[hash % gradients.length];
}

export function AccountIndicator({ className }: AccountIndicatorProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  // Handle sign out
  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsOpen(false);
    router.push("/");
    router.refresh();
  }, [router]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          "bg-zinc-100/50 dark:bg-zinc-800/50 animate-pulse",
          className
        )}
        aria-hidden="true"
      />
    );
  }

  // Not logged in - show login link
  if (!user) {
    return (
      <Link href="/login">
        <motion.span
          whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
          whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
          transition={getSpring(spring.snappy)}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            "bg-zinc-100/80 dark:bg-zinc-800/80",
            "text-zinc-700 dark:text-zinc-300",
            "transition-colors duration-150",
            "hover:bg-amber-500 hover:text-text-inverse",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2",
            className
          )}
          aria-label="Sign in"
        >
          <User className="h-5 w-5" />
        </motion.span>
      </Link>
    );
  }

  // Logged in - show avatar with dropdown
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const name = user.user_metadata?.full_name as string | undefined;
  const initials = getInitials(user.email, name);
  const gradientStyle = getGradientStyleFromEmail(user.email);

  return (
    <div className="relative">
      <motion.button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
        whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
        transition={getSpring(spring.snappy)}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-full",
          "transition-shadow duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2",
          isOpen && "ring-2 ring-primary/30 ring-offset-2",
          className
        )}
        aria-label="Account menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar image or initials fallback - use full size to respect className override */}
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span
            className="flex w-full h-full items-center justify-center rounded-full text-sm font-bold text-text-inverse"
            style={gradientStyle}
          >
            {initials}
          </span>
        )}

        {/* Online status dot */}
        <span
          className={cn(
            "absolute bottom-0 right-0",
            "w-2.5 h-2.5 rounded-full",
            "bg-green-500",
            "ring-2 ring-white dark:ring-zinc-950"
          )}
          aria-hidden="true"
        />
      </motion.button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            variants={shouldAnimate ? dropdownVariants : undefined}
            initial={shouldAnimate ? "initial" : false}
            animate={shouldAnimate ? "animate" : { opacity: 1 }}
            exit={shouldAnimate ? "exit" : { opacity: 0 }}
            className={cn(
              // Position: left-aligned on mobile (avatar is on left), right-aligned on desktop
              "absolute left-0 sm:left-auto sm:right-0 top-full mt-2",
              "w-48 py-1 rounded-xl",
              "bg-surface-primary",
              "border border-border",
              // Gradient shadow per CONTEXT.md (brand-tinted with depth)
              "shadow-hint-md",
              zClass.popover
            )}
            role="menu"
            aria-orientation="vertical"
          >
            {/* User info header */}
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm font-medium text-text-primary truncate">
                {name || user.email}
              </p>
              {name && user.email && (
                <p className="text-xs text-text-muted truncate">{user.email}</p>
              )}
            </div>

            {/* Menu items */}
            <div className="py-1">
              <Link
                href="/account"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2",
                  "text-sm text-text-primary",
                  "hover:bg-surface-secondary",
                  "transition-colors duration-150"
                )}
                role="menuitem"
              >
                <UserCircle className="h-4 w-4 text-text-muted" />
                Profile
              </Link>

              <Link
                href="/orders"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2",
                  "text-sm text-text-primary",
                  "hover:bg-surface-secondary",
                  "transition-colors duration-150"
                )}
                role="menuitem"
              >
                <Package className="h-4 w-4 text-text-muted" />
                Orders
              </Link>
            </div>

            {/* Sign out */}
            <div className="border-t border-border py-1">
              <button
                type="button"
                onClick={handleSignOut}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2",
                  "text-sm text-red-600 dark:text-red-400",
                  "hover:bg-red-50 dark:hover:bg-red-950/20",
                  "transition-colors duration-150"
                )}
                role="menuitem"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AccountIndicator;
