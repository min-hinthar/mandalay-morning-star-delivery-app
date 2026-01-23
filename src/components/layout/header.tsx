"use client";

import React, { useState, useRef, useEffect, forwardRef } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { spring, duration } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useScrollDirection } from "@/lib/hooks/useScrollDirection";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { MorphingMenu } from "@/components/ui/MorphingMenu";
import { ShoppingBag, Search, X } from "lucide-react";

// ============================================
// TYPES
// ============================================

export interface HeaderProps {
  /** Logo text or element */
  logo?: React.ReactNode;
  /** Navigation items */
  navItems?: Array<{
    href: string;
    label: string;
    isActive?: boolean;
  }>;
  /** Cart item count */
  cartCount?: number;
  /** On cart click */
  onCartClick?: () => void;
  /** On mobile menu toggle */
  onMobileMenuToggle?: (isOpen: boolean) => void;
  /** Show search bar */
  showSearch?: boolean;
  /** On search */
  onSearch?: (query: string) => void;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Right side content */
  rightContent?: React.ReactNode;
  /** Additional class names */
  className?: string;
  /** Whether menu is open (controlled) */
  isMobileMenuOpen?: boolean;
}

// ============================================
// CART BADGE COMPONENT
// ============================================

interface CartBadgeProps {
  count: number;
  onClick?: () => void;
  className?: string;
}

function CartBadge({ count, onClick, className }: CartBadgeProps) {
  const { shouldAnimate, getSpring, isFullMotion } = useAnimationPreference();
  const [prevCount, setPrevCount] = useState(count);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (count !== prevCount && count > prevCount) {
      setIsAnimating(true);
      if (isFullMotion && "vibrate" in navigator) {
        navigator.vibrate([5, 50, 10]);
      }
      const timeout = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timeout);
    }
    setPrevCount(count);
  }, [count, prevCount, isFullMotion]);

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "relative p-2 rounded-xl",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        "hover:bg-surface-secondary/80 transition-colors duration-150",
        className
      )}
      whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
      transition={getSpring(spring.snappy)}
      aria-label={`Cart with ${count} items`}
    >
      <ShoppingBag className="w-5 h-5 text-text-primary" />

      {/* Badge */}
      <AnimatePresence mode="wait">
        {count > 0 && (
          <motion.span
            key={count}
            className={cn(
              "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1",
              "flex items-center justify-center",
              "bg-primary text-white text-[10px] font-bold rounded-full",
              "shadow-sm"
            )}
            initial={shouldAnimate ? { scale: 0, y: 5 } : undefined}
            animate={shouldAnimate ? { scale: 1, y: 0 } : undefined}
            exit={shouldAnimate ? { scale: 0, y: -5 } : undefined}
            transition={getSpring(spring.ultraBouncy)}
          >
            {count > 99 ? "99+" : count}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Bounce animation on add */}
      {shouldAnimate && isAnimating && (
        <motion.span
          className="absolute inset-0 rounded-xl bg-primary/20"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.4 }}
        />
      )}
    </motion.button>
  );
}

// ============================================
// EXPANDING SEARCH BAR
// ============================================

interface ExpandingSearchProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

function ExpandingSearch({ placeholder = "Search menu...", onSearch, className }: ExpandingSearchProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setQuery("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch?.(query.trim());
    }
  };

  return (
    <motion.div
      className={cn("relative flex items-center", className)}
      animate={shouldAnimate ? { width: isExpanded ? 240 : 40 } : { width: isExpanded ? 240 : 40 }}
      transition={getSpring(spring.snappy)}
    >
      {/* Collapsed state - icon button */}
      {!isExpanded && (
        <motion.button
          onClick={handleExpand}
          className={cn(
            "w-10 h-10 flex items-center justify-center rounded-xl",
            "hover:bg-surface-secondary/80 transition-colors duration-150",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          )}
          whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
          whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
          transition={getSpring(spring.snappy)}
          aria-label="Search"
        >
          <Search className="w-5 h-5 text-text-secondary" />
        </motion.button>
      )}

      {/* Expanded state - search input */}
      <AnimatePresence>
        {isExpanded && (
          <motion.form
            onSubmit={handleSubmit}
            className={cn(
              "absolute right-0 flex items-center",
              "bg-surface-tertiary rounded-xl overflow-hidden",
              "border border-border-default"
            )}
            initial={shouldAnimate ? { opacity: 0, width: 40 } : undefined}
            animate={shouldAnimate ? { opacity: 1, width: 240 } : undefined}
            exit={shouldAnimate ? { opacity: 0, width: 40 } : undefined}
            transition={getSpring(spring.snappy)}
          >
            <Search className="w-4 h-4 ml-3 text-text-muted flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className={cn(
                "flex-1 px-2 py-2 bg-transparent text-sm",
                "focus:outline-none placeholder:text-text-muted"
              )}
            />
            <button
              type="button"
              onClick={handleCollapse}
              className="p-2 hover:bg-surface-tertiary/50 transition-colors"
            >
              <X className="w-4 h-4 text-text-muted" />
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// NAV ITEM COMPONENT
// ============================================

interface NavItemProps {
  href: string;
  label: string;
  isActive?: boolean;
}

function NavItem({ href, label, isActive }: NavItemProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <Link href={href}>
      <motion.span
        className={cn(
          "relative px-3 py-2 rounded-lg text-sm font-medium",
          "transition-colors duration-150",
          isActive
            ? "text-primary"
            : "text-text-primary hover:text-primary"
        )}
        whileHover={shouldAnimate ? { y: -2 } : undefined}
        whileTap={shouldAnimate ? { y: 0 } : undefined}
        transition={getSpring(spring.snappy)}
      >
        {label}

        {/* Active indicator - animated underline */}
        <motion.span
          className="absolute bottom-0 left-1/2 h-0.5 bg-primary rounded-full"
          initial={{ width: 0, x: "-50%" }}
          animate={shouldAnimate ? {
            width: isActive ? "60%" : 0,
            x: "-50%"
          } : {
            width: isActive ? "60%" : 0,
            x: "-50%"
          }}
          transition={getSpring(spring.ultraBouncy)}
        />

        {/* Hover glow */}
        {shouldAnimate && (
          <motion.span
            className="absolute inset-0 rounded-lg bg-primary/5"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: duration.fast }}
          />
        )}
      </motion.span>
    </Link>
  );
}

// ============================================
// MAIN HEADER COMPONENT
// ============================================

export const Header = forwardRef<HTMLElement, HeaderProps>(
  (
    {
      logo = "Mandalay Morning Star",
      navItems = [],
      cartCount = 0,
      onCartClick,
      onMobileMenuToggle,
      showSearch = true,
      onSearch,
      searchPlaceholder,
      rightContent,
      className,
      isMobileMenuOpen = false,
    },
    ref
  ) => {
    const { shouldAnimate, getSpring, isFullMotion } = useAnimationPreference();
    const { isCollapsed, scrollY, isAtTop } = useScrollDirection({ threshold: 50 });
    const isMobile = useMediaQuery("(max-width: 768px)");

    // Track scroll for background opacity
    const scrollProgress = useMotionValue(0);

    useEffect(() => {
      scrollProgress.set(Math.min(scrollY / 100, 1));
    }, [scrollY, scrollProgress]);

    // Transform scroll to background opacity (prepared for future use)
    useTransform(scrollProgress, [0, 1], [0.6, 0.95]);
    useTransform(scrollProgress, [0, 1], [8, 16]);

    const handleMenuToggle = () => {
      onMobileMenuToggle?.(!isMobileMenuOpen);
    };

    return (
      <motion.header
        ref={ref}
        className={cn(
          "fixed top-0 left-0 right-0 z-30",
          "border-b border-border-default/50",
          className
        )}
        initial={false}
        animate={shouldAnimate ? {
          y: isCollapsed && !isMobileMenuOpen ? -72 : 0,
        } : {
          y: isCollapsed && !isMobileMenuOpen ? -72 : 0,
        }}
        transition={getSpring(spring.snappy)}
        style={{
          backgroundColor: `rgba(255, 255, 255, ${isAtTop ? 0.6 : 0.95})`,
          backdropFilter: `blur(${isAtTop ? 8 : 16}px)`,
          WebkitBackdropFilter: `blur(${isAtTop ? 8 : 16}px)`,
        }}
      >
        {/* Burmese ornate top border */}
        <div
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-primary to-secondary"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              var(--color-secondary) 0px,
              var(--color-secondary) 4px,
              var(--color-primary) 4px,
              var(--color-primary) 8px,
              var(--color-secondary) 8px,
              var(--color-secondary) 12px
            )`,
          }}
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div
              whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
              transition={getSpring(spring.snappy)}
            >
              <Link
                href="/"
                className={cn(
                  "font-display text-lg font-semibold",
                  "text-primary hover:text-primary-hover transition-colors"
                )}
              >
                {typeof logo === "string" ? (
                  <span className="flex items-center gap-2">
                    <Image
                      src="/logo.png"
                      alt="Mandalay Morning Star"
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                    {logo}
                  </span>
                ) : logo ? logo : (
                  <span className="flex items-center gap-2">
                    <Image
                      src="/logo.png"
                      alt="Mandalay Morning Star"
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                    <span className="hidden sm:inline">Mandalay Morning Star</span>
                  </span>
                )}
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  isActive={item.isActive}
                />
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Search (desktop only) */}
              {showSearch && !isMobile && (
                <ExpandingSearch
                  placeholder={searchPlaceholder}
                  onSearch={onSearch}
                />
              )}

              {/* Custom right content */}
              {rightContent}

              {/* Cart */}
              <CartBadge
                count={cartCount}
                onClick={onCartClick}
              />

              {/* Mobile menu toggle */}
              <div className="md:hidden">
                <MorphingMenu
                  isOpen={isMobileMenuOpen}
                  onToggle={handleMenuToggle}
                  size={20}
                  color="#374151"
                  openColor="#A41034"
                  variant="rounded"
                  haptic={isFullMotion}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll progress indicator */}
        {shouldAnimate && (
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-secondary"
            style={{
              width: `${Math.min(scrollY / 500, 1) * 100}%`,
              opacity: isAtTop ? 0 : 0.6,
            }}
          />
        )}
      </motion.header>
    );
  }
);

Header.displayName = "Header";

// ============================================
// HEADER SPACER
// Add below header to prevent content overlap
// ============================================

export function HeaderSpacer({ className }: { className?: string }) {
  return <div className={cn("h-16", className)} aria-hidden="true" />;
}

export default Header;
