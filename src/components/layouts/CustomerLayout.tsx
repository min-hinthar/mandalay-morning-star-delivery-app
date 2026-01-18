"use client";

import { type ReactNode, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Search, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { useCart } from "@/lib/hooks/useCart";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import { useScrollDirection } from "@/lib/hooks/useScrollDirection";
import { fadeIn, spring } from "@/lib/animations";

interface CustomerLayoutProps {
  children: ReactNode;
  /** Header content slot for custom header elements */
  headerSlot?: ReactNode;
  /** Hide the cart bar (e.g., during checkout) */
  hideCartBar?: boolean;
  /** Custom className for the main content area */
  contentClassName?: string;
}

/**
 * Customer App Shell
 * Mobile-first layout for the customer ordering experience
 *
 * Structure:
 * - Header (sticky, 56px) - logo, search, avatar
 * - Main Content (scrollable)
 * - Cart Bar (sticky, 64px) - hidden when cart empty
 */
export function CustomerLayout({
  children,
  headerSlot,
  hideCartBar = false,
  contentClassName,
}: CustomerLayoutProps) {
  const { itemCount, estimatedTotal } = useCart();
  const { open: openCart } = useCartDrawer();
  const { isCollapsed, isAtTop, scrollY } = useScrollDirection({ threshold: 10 });
  const [showSearch, setShowSearch] = useState(false);

  // Derive isScrolled from scroll position
  const isScrolled = scrollY > 10;

  const handleSearchToggle = useCallback(() => {
    setShowSearch((prev) => !prev);
  }, []);

  const showCartBar = !hideCartBar && itemCount > 0;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      {/* Header - Collapsible on scroll */}
      <motion.header
        initial={false}
        animate={{
          y: isCollapsed && !showSearch ? -56 : 0,
        }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          "sticky top-0 z-[var(--z-sticky)] h-14",
          "bg-[var(--color-cream)]/95 dark:bg-[var(--color-background)]/95",
          "backdrop-blur-lg border-b border-[var(--color-border)]",
          "transition-shadow duration-[var(--duration-fast)]",
          isScrolled && "shadow-[var(--shadow-md)]"
        )}
      >
        <div className="mx-auto flex h-full max-w-[var(--max-content-width)] items-center justify-between px-4">
          {/* Logo */}
          <Link
            href="/"
            className={cn(
              "font-display text-lg font-bold tracking-tight",
              "text-[var(--color-primary)]",
              "transition-opacity hover:opacity-80"
            )}
          >
            Mandalay Morning Star
          </Link>

          {/* Center/Right Controls */}
          <div className="flex items-center gap-2">
            {headerSlot}

            {/* Search Toggle */}
            <motion.button
              onClick={handleSearchToggle}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                "text-[var(--color-charcoal-muted)]",
                "transition-colors hover:bg-[var(--color-cream-darker)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              )}
              aria-label={showSearch ? "Close search" : "Open search"}
            >
              {showSearch ? (
                <X className="h-5 w-5" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </motion.button>

            {/* User Avatar - placeholder for auth component */}
            <div className="h-9 w-9 rounded-full bg-[var(--color-cream-darker)]" />
          </div>
        </div>

        {/* Search Overlay */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={spring.snappy}
              className="border-t border-[var(--color-border)] bg-[var(--color-cream)]"
            >
              <div className="mx-auto max-w-[var(--max-content-width)] px-4 py-3">
                <input
                  type="search"
                  placeholder="Search menu..."
                  autoFocus
                  className={cn(
                    "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]",
                    "px-4 py-2.5 text-sm",
                    "placeholder:text-[var(--color-charcoal-muted)]",
                    "focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                  )}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1",
          "min-h-[calc(100vh-56px-64px)]",
          contentClassName
        )}
        style={{
          paddingBottom: showCartBar
            ? "calc(64px + env(safe-area-inset-bottom, 0px))"
            : undefined,
        }}
      >
        {children}
      </main>

      {/* Cart Bar */}
      <AnimatePresence>
        {showCartBar && (
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeIn}
            transition={spring.smooth}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-[var(--z-fixed)]",
              "bg-[var(--color-cream-darker)]",
              "shadow-[0_-4px_20px_rgba(139,69,19,0.1)]"
            )}
            style={{
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            <div className="mx-auto flex h-16 max-w-[var(--max-content-width)] items-center justify-between px-4">
              {/* Cart Info */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart className="h-5 w-5 text-[var(--color-charcoal)]" />
                  <span
                    className={cn(
                      "absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center",
                      "rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-bold text-white"
                    )}
                  >
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-[var(--color-charcoal-muted)]">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </span>
                  <span className="font-semibold text-[var(--color-charcoal)]">
                    ${estimatedTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* View Cart Button */}
              <motion.button
                onClick={openCart}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "h-11 rounded-lg px-6",
                  "bg-[var(--color-primary)] text-white",
                  "font-semibold text-sm",
                  "shadow-[var(--shadow-glow-primary)]",
                  "transition-all hover:brightness-110",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cta)]"
                )}
              >
                View Cart
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CustomerLayout;
