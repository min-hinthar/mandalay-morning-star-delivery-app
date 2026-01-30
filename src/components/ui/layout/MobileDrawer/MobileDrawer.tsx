"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring, staggerContainer80, duration } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import { useSwipeToClose } from "@/lib/swipe-gestures";
import { zClass } from "@/lib/design-system/tokens/z-index";
import { Home, UtensilsCrossed, Package, User, X } from "lucide-react";

import { DrawerNavLink } from "./DrawerNavLink";
import { DrawerUserSection } from "./DrawerUserSection";
import { DrawerFooter } from "./DrawerFooter";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// ============================================
// TYPES
// ============================================

export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user?: { name?: string; email?: string; avatar?: string } | null;
}

// ============================================
// NAV ITEMS
// ============================================

const navItems = [
  { href: "/", label: "Home", icon: <Home className="w-5 h-5" /> },
  { href: "/menu", label: "Menu", icon: <UtensilsCrossed className="w-5 h-5" /> },
  { href: "/orders", label: "Orders", icon: <Package className="w-5 h-5" /> },
  { href: "/account", label: "Account", icon: <User className="w-5 h-5" /> },
];

// ============================================
// COMPONENT
// ============================================

export function MobileDrawer({ isOpen, onClose, user }: MobileDrawerProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  // Swipe to close hook
  const { motionProps, isDragging } = useSwipeToClose({
    onClose,
    direction: "left",
    threshold: 100,
  });

  // Body scroll lock (deferred restore for animation safety)
  const { restoreScrollPosition } = useBodyScrollLock(isOpen, { deferRestore: true });

  // Escape key handler - defined inside useEffect to ensure same reference for add/remove
  useEffect(() => {
    if (!isOpen) return; // No listener when closed

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Get current path for active state
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";

  return (
    <AnimatePresence onExitComplete={restoreScrollPosition}>
      {/* Backdrop - rendered separately to avoid Fragment inside AnimatePresence */}
      {isOpen && (
        <motion.div
          key="drawer-backdrop"
          className={cn(
            "fixed inset-0 bg-overlay backdrop-blur-sm",
            zClass.modalBackdrop
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration.fast }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel - rendered separately to avoid Fragment inside AnimatePresence */}
      {isOpen && (
        <motion.nav
          key="drawer-panel"
          className={cn(
            "fixed left-0 top-0 bottom-0 w-[85%] max-w-sm",
            "bg-surface-primary",
            "rounded-r-2xl shadow-2xl",
            "flex flex-col",
            zClass.modal
          )}
          style={{
            paddingTop: "env(safe-area-inset-top)",
            touchAction: isDragging ? "none" : "pan-y",
          }}
          initial={shouldAnimate ? { x: "-100%" } : undefined}
          animate={shouldAnimate ? { x: 0 } : undefined}
          exit={shouldAnimate ? { x: "-100%" } : undefined}
          transition={getSpring(spring.default)}
          {...motionProps}
          role="navigation"
          aria-label="Mobile navigation"
        >
          {/* Header with close button and theme toggle */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
            <span className="text-lg font-semibold text-text-primary">Menu</span>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <motion.button
                onClick={onClose}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full",
                  "bg-surface-secondary hover:bg-surface-tertiary",
                  "transition-colors duration-150"
                )}
                whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
                whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
                transition={getSpring(spring.snappy)}
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </motion.button>
            </div>
          </div>

          {/* User section */}
          <DrawerUserSection user={user ?? null} onClose={onClose} />

          {/* Nav links with stagger animation */}
          <motion.div
            className="flex-1 overflow-y-auto px-2 py-2"
            variants={staggerContainer80(0.15)}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {navItems.map((item) => (
              <DrawerNavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href))
                }
                onClick={onClose}
              />
            ))}
          </motion.div>

          {/* Footer */}
          <DrawerFooter />
        </motion.nav>
      )}
    </AnimatePresence>
  );
}

export default MobileDrawer;
