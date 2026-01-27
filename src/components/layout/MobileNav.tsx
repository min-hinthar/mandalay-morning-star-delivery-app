"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence, useDragControls, PanInfo } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  spring,
  duration,
  staggerContainer,
  staggerItem,
} from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { FooterLink } from "@/components/ui/AnimatedLink";
import { Home, UtensilsCrossed, Package, User, Phone, MapPin, Clock } from "lucide-react";

// ============================================
// TYPES
// ============================================

export interface NavItemConfig {
  href: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  roles?: string[];
}

export interface MobileNavProps {
  /** Whether the nav is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Navigation items */
  navItems?: NavItemConfig[];
  /** Footer links */
  footerLinks?: Array<{ href: string; label: string; external?: boolean }>;
  /** Show quick info section */
  showQuickInfo?: boolean;
  /** User info */
  user?: { name?: string; email?: string; avatar?: string } | null;
  /** Additional class names */
  className?: string;
  /** Slide direction */
  direction?: "left" | "right" | "top";
}

// ============================================
// DEFAULT NAV ITEMS
// ============================================

const defaultNavItems: NavItemConfig[] = [
  { href: "/", label: "Home", icon: <Home className="w-5 h-5" /> },
  { href: "/menu", label: "Menu", icon: <UtensilsCrossed className="w-5 h-5" /> },
  { href: "/orders", label: "Orders", icon: <Package className="w-5 h-5" /> },
  { href: "/account", label: "Account", icon: <User className="w-5 h-5" /> },
];

const defaultFooterLinks = [
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
];

// ============================================
// NAV ITEM COMPONENT
// ============================================

interface MobileNavItemProps extends NavItemConfig {
  index: number;
  isActive: boolean;
  onClick?: () => void;
}

function MobileNavItem({ href, label, icon, badge, index, isActive, onClick }: MobileNavItemProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <motion.div
      variants={staggerItem}
      custom={index}
    >
      <Link href={href} onClick={onClick}>
        <motion.div
          className={cn(
            "flex items-center gap-4 px-4 py-3 rounded-xl",
            "transition-colors duration-150",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-text-primary hover:bg-surface-secondary"
          )}
          whileHover={shouldAnimate ? { x: 8, scale: 1.01 } : undefined}
          whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
          transition={getSpring(spring.snappy)}
        >
          {/* Icon with glow on active */}
          <motion.span
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg",
              isActive ? "bg-primary/10" : "bg-surface-tertiary"
            )}
            animate={shouldAnimate && isActive ? {
              boxShadow: ["0 0 0 0 rgba(164,16,52,0.3)", "0 0 0 8px rgba(164,16,52,0)", "0 0 0 0 rgba(164,16,52,0)"],
            } : undefined}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {icon}
          </motion.span>

          {/* Label */}
          <span className="flex-1 font-medium">{label}</span>

          {/* Badge */}
          {badge && (
            <motion.span
              className={cn(
                "px-2 py-0.5 text-xs font-semibold rounded-full",
                "bg-primary text-white"
              )}
              initial={shouldAnimate ? { scale: 0 } : undefined}
              animate={shouldAnimate ? { scale: 1 } : undefined}
              transition={getSpring(spring.ultraBouncy)}
            >
              {badge}
            </motion.span>
          )}

          {/* Active indicator */}
          {isActive && (
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-primary"
              layoutId="activeNavIndicator"
              transition={getSpring(spring.default)}
            />
          )}
        </motion.div>
      </Link>
    </motion.div>
  );
}

// ============================================
// QUICK INFO SECTION
// ============================================

function QuickInfo() {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const infoItems = [
    { icon: <Clock className="w-4 h-4" />, text: "Sat delivery only", highlight: "Orders close Fri 3pm" },
    { icon: <MapPin className="w-4 h-4" />, text: "Seattle area", highlight: "Check coverage" },
    { icon: <Phone className="w-4 h-4" />, text: "Questions?", highlight: "Contact us" },
  ];

  return (
    <motion.div
      className="mt-4 p-4 bg-surface-secondary rounded-xl space-y-3"
      variants={staggerItem}
    >
      {infoItems.map((item) => (
        <motion.div
          key={item.text}
          className="flex items-center gap-3 text-sm text-text-secondary"
          whileHover={shouldAnimate ? { x: 4 } : undefined}
          transition={getSpring(spring.snappy)}
        >
          <span className="text-secondary">{item.icon}</span>
          <span>{item.text}</span>
          <span className="text-primary font-medium">{item.highlight}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MobileNav({
  isOpen,
  onClose,
  navItems = defaultNavItems,
  footerLinks = defaultFooterLinks,
  showQuickInfo = true,
  user,
  className,
  direction = "left",
}: MobileNavProps) {
  const { shouldAnimate, getSpring, isFullMotion } = useAnimationPreference();
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Handle swipe to close
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    const velocity = 500;

    const shouldClose =
      (direction === "left" && (info.offset.x < -threshold || info.velocity.x < -velocity)) ||
      (direction === "right" && (info.offset.x > threshold || info.velocity.x > velocity)) ||
      (direction === "top" && (info.offset.y < -threshold || info.velocity.y < -velocity));

    if (shouldClose) {
      if (isFullMotion && "vibrate" in navigator) {
        navigator.vibrate(8);
      }
      onClose();
    }
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Get slide variants based on direction
  const getSlideVariants = () => {
    switch (direction) {
      case "right":
        return {
          initial: { x: "100%" },
          animate: { x: 0 },
          exit: { x: "100%" },
        };
      case "top":
        return {
          initial: { y: "-100%" },
          animate: { y: 0 },
          exit: { y: "-100%" },
        };
      default: // left
        return {
          initial: { x: "-100%" },
          animate: { x: 0 },
          exit: { x: "-100%" },
        };
    }
  };

  const slideVariants = getSlideVariants();
  const dragConstraints =
    direction === "left" ? { right: 0 } :
    direction === "right" ? { left: 0 } :
    { bottom: 0 };
  const dragDirection = direction === "top" ? "y" : "x";

  return (
    <AnimatePresence>
      {/* Backdrop - rendered separately to avoid Fragment inside AnimatePresence */}
      {isOpen && (
        <motion.div
          key="mobile-nav-backdrop"
          className="fixed inset-0 z-40 bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration.fast }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Navigation panel - rendered separately to avoid Fragment inside AnimatePresence */}
      {isOpen && (
        <motion.nav
            key="mobile-nav-panel"
            ref={navRef}
            className={cn(
              "fixed z-50 bg-white shadow-2xl",
              "flex flex-col",
              direction === "left" && "left-0 top-0 bottom-0 w-[85%] max-w-sm rounded-r-2xl",
              direction === "right" && "right-0 top-0 bottom-0 w-[85%] max-w-sm rounded-l-2xl",
              direction === "top" && "left-0 right-0 top-0 max-h-[85vh] rounded-b-2xl",
              className
            )}
            initial={shouldAnimate ? slideVariants.initial : undefined}
            animate={shouldAnimate ? slideVariants.animate : undefined}
            exit={shouldAnimate ? slideVariants.exit : undefined}
            transition={getSpring(spring.default)}
            drag={dragDirection}
            dragControls={dragControls}
            dragConstraints={dragConstraints}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            role="navigation"
            aria-label="Mobile navigation"
          >
            {/* Drag handle indicator */}
            {direction === "top" && (
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 rounded-full bg-border-strong" />
              </div>
            )}

            {/* Header with user info */}
            <div className="p-4 border-b border-border-subtle">
              {user ? (
                <motion.div
                  className="flex items-center gap-3"
                  initial={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
                  animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
                  transition={{ delay: 0.1, ...getSpring(spring.gentle) }}
                >
                  {/* Avatar */}
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
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                      />
                    ) : null}
                    <span className={cn("text-lg font-bold", user.avatar && "hidden")}>
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary truncate">
                      {user.name || "Guest"}
                    </p>
                    {user.email && (
                      <p className="text-sm text-text-muted truncate">{user.email}</p>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={shouldAnimate ? { opacity: 0 } : undefined}
                  animate={shouldAnimate ? { opacity: 1 } : undefined}
                  transition={{ delay: 0.1 }}
                >
                  <Link
                    href="/login"
                    onClick={onClose}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-xl",
                      "bg-primary text-white font-medium",
                      "hover:bg-primary-hover transition-colors"
                    )}
                  >
                    <User className="w-4 h-4" />
                    Sign In
                  </Link>
                </motion.div>
              )}
            </div>

            {/* Navigation items with stagger */}
            <motion.div
              className="flex-1 overflow-y-auto p-4 space-y-1"
              variants={staggerContainer(0.08, 0.15)}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {navItems.map((item, index) => (
                <MobileNavItem
                  key={item.href}
                  {...item}
                  index={index}
                  isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                  onClick={onClose}
                />
              ))}

              {/* Quick info */}
              {showQuickInfo && <QuickInfo />}
            </motion.div>

            {/* Footer links */}
            <motion.div
              className="p-4 border-t border-border-subtle bg-surface-secondary/50"
              initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.3, ...getSpring(spring.gentle) }}
            >
              <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
                {footerLinks.map((link) => (
                  <FooterLink
                    key={link.href}
                    href={link.href}
                    external={link.external}
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

            {/* Decorative logo accent */}
            <Image
              src="/logo.png"
              alt=""
              width={48}
              height={48}
              className="absolute bottom-20 right-4 opacity-10 pointer-events-none"
              aria-hidden="true"
            />
          </motion.nav>
      )}
    </AnimatePresence>
  );
}

export default MobileNav;
