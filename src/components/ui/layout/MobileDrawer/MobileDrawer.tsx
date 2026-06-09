"use client";

import { useEffect, type ReactNode } from "react";
import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring, staggerContainer80, duration } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import { useSwipeToClose } from "@/lib/swipe-gestures";
import { zClass } from "@/lib/design-system/tokens/z-index";
import { Home, UtensilsCrossed, Package, User, Star, X } from "lucide-react";

import { DrawerNavLink } from "./DrawerNavLink";
import { DrawerUserSection } from "./DrawerUserSection";
import { DrawerFooter } from "./DrawerFooter";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AfterDarkAmbient } from "@/components/ui/AfterDarkAmbient";
import { HeroSunburst } from "@/components/ui/homepage/Hero/HeroSunburst";

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

/* Grouped nav — "Order" (browse + buy) and "You" (account-side), matching the
   AccountIndicator dropdown's destinations so the two menus agree. */
const navGroups: Array<{
  kicker: string;
  kickerMy: string;
  items: Array<{ href: string; label: string; icon: ReactNode }>;
}> = [
  {
    kicker: "Order",
    kickerMy: "မှာယူရန်",
    items: [
      { href: "/", label: "Home", icon: <Home className="w-5 h-5" /> },
      { href: "/menu", label: "Menu", icon: <UtensilsCrossed className="w-5 h-5" /> },
      { href: "/orders", label: "My Orders", icon: <Package className="w-5 h-5" /> },
    ],
  },
  {
    kicker: "You",
    kickerMy: "သင့်အကောင့်",
    items: [
      { href: "/account", label: "Account", icon: <User className="w-5 h-5" /> },
      { href: "/account?tab=rewards", label: "Rewards", icon: <Star className="w-5 h-5" /> },
    ],
  },
];

// Memoize stagger variants at module level to prevent re-creation on every render
// This prevents animation re-triggers during exit and improves performance
const navStaggerVariants = staggerContainer80(0.15);

/* Active state — query-aware so "Account" and "Rewards" (same path, different
   ?tab=) can't both light up. */
function isItemActive(href: string, pathname: string, search: string): boolean {
  const [path, query] = href.split("?");
  if (query) return pathname.startsWith(path) && search.includes(query);
  if (path === "/") return pathname === "/";
  if (path === "/account") return pathname.startsWith(path) && !search.includes("tab=rewards");
  return pathname === path || pathname.startsWith(path);
}

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

  // Get current path + query for active state
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const search = typeof window !== "undefined" ? window.location.search : "";

  return (
    <AnimatePresence onExitComplete={restoreScrollPosition}>
      {/* Backdrop - rendered separately to avoid Fragment inside AnimatePresence */}
      {isOpen && (
        <m.div
          key="drawer-backdrop"
          className={cn(
            // MOBILE CRASH PREVENTION: No backdrop-blur on mobile (causes Safari crashes)
            // MobileDrawer is mobile-only so no blur at all
            "fixed inset-0 bg-overlay",
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
        <m.nav
          key="drawer-panel"
          className={cn(
            "fixed left-0 top-0 bottom-0 w-[85%] max-w-sm",
            // Warm After Dark canvas (opaque, doubled-specificity rule beats any
            // utility bg) — replaces the old hardcoded bg-white dark:bg-black.
            "after-dark-canvas",
            "rounded-r-2xl shadow-2xl",
            "flex flex-col overflow-hidden",
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
          {/* Editorial texture — masked dot/line grids + warm blooms (a11y-inert) */}
          <AfterDarkAmbient />

          {/* Header — editorial bilingual masthead + theme toggle + close */}
          <div className="relative flex items-center justify-between border-b border-border-subtle px-4 py-3">
            <div className="flex items-center gap-2">
              <HeroSunburst className="h-4 w-4 text-hero-clay" rays={8} aria-hidden="true" />
              <div className="leading-tight">
                <span className="font-display text-lg font-semibold tracking-tight text-text-primary">
                  Menu
                </span>
                <span lang="my" className="ml-1.5 font-burmese text-xs text-text-muted">
                  မီနူး
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <m.button
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
              </m.button>
            </div>
          </div>

          {/* User section */}
          <div className="relative">
            <DrawerUserSection user={user ?? null} onClose={onClose} />
          </div>

          {/* Grouped nav links with stagger animation
              Note: Using module-level memoized variants to prevent re-creation on render.
              Removed exit="exit" - let parent drawer handle exit animation to prevent
              nested animation conflicts that can cause crashes on mobile. */}
          <m.div
            className="relative flex-1 overflow-y-auto px-2 py-2"
            variants={navStaggerVariants}
            initial="hidden"
            animate="visible"
          >
            {navGroups.map((group) => (
              <div key={group.kicker} className="mb-2">
                {/* Editorial kicker — bilingual section label */}
                <p className="px-3 pb-1 pt-2 text-2xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                  {group.kicker}
                  <span lang="my" className="ml-1.5 font-burmese normal-case tracking-normal">
                    · {group.kickerMy}
                  </span>
                </p>
                {group.items.map((item) => (
                  <DrawerNavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    isActive={isItemActive(item.href, pathname, search)}
                    onClick={onClose}
                  />
                ))}
              </div>
            ))}
          </m.div>

          {/* Footer */}
          <div className="relative">
            <DrawerFooter />
          </div>
        </m.nav>
      )}
    </AnimatePresence>
  );
}

export default MobileDrawer;
