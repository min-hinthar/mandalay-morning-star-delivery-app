"use client";

import React, { useState, useRef, useEffect, forwardRef } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { v7Spring, v7Duration } from "@/lib/motion-tokens-v7";
import { useAnimationPreferenceV7 } from "@/lib/hooks/useAnimationPreferenceV7";
import { useScrollDirection } from "@/lib/hooks/useScrollDirection";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { MorphingMenu } from "@/components/ui/MorphingMenu";
import { ShoppingBag, Search, X } from "lucide-react";

// ============================================
// TYPES
// ============================================

export interface HeaderV7Props {
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
  const { shouldAnimate, getSpring, isFullMotion } = useAnimationPreferenceV7();
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
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A41034]/30",
        "hover:bg-neutral-100/80 transition-colors duration-150",
        className
      )}
      whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
      transition={getSpring(v7Spring.snappy)}
      aria-label={`Cart with ${count} items`}
    >
      <ShoppingBag className="w-5 h-5 text-neutral-700" />

      {/* Badge */}
      <AnimatePresence mode="wait">
        {count > 0 && (
          <motion.span
            key={count}
            className={cn(
              "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1",
              "flex items-center justify-center",
              "bg-v6-primary text-white text-[10px] font-bold rounded-full",
              "shadow-sm"
            )}
            initial={shouldAnimate ? { scale: 0, y: 5 } : undefined}
            animate={shouldAnimate ? { scale: 1, y: 0 } : undefined}
            exit={shouldAnimate ? { scale: 0, y: -5 } : undefined}
            transition={getSpring(v7Spring.ultraBouncy)}
          >
            {count > 99 ? "99+" : count}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Bounce animation on add */}
      {shouldAnimate && isAnimating && (
        <motion.span
          className="absolute inset-0 rounded-xl bg-v6-primary/20"
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
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();
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
      transition={getSpring(v7Spring.snappy)}
    >
      {/* Collapsed state - icon button */}
      {!isExpanded && (
        <motion.button
          onClick={handleExpand}
          className={cn(
            "w-10 h-10 flex items-center justify-center rounded-xl",
            "hover:bg-neutral-100/80 transition-colors duration-150",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A41034]/30"
          )}
          whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
          whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
          transition={getSpring(v7Spring.snappy)}
          aria-label="Search"
        >
          <Search className="w-5 h-5 text-neutral-600" />
        </motion.button>
      )}

      {/* Expanded state - search input */}
      <AnimatePresence>
        {isExpanded && (
          <motion.form
            onSubmit={handleSubmit}
            className={cn(
              "absolute right-0 flex items-center",
              "bg-neutral-100 rounded-xl overflow-hidden",
              "border border-neutral-200"
            )}
            initial={shouldAnimate ? { opacity: 0, width: 40 } : undefined}
            animate={shouldAnimate ? { opacity: 1, width: 240 } : undefined}
            exit={shouldAnimate ? { opacity: 0, width: 40 } : undefined}
            transition={getSpring(v7Spring.snappy)}
          >
            <Search className="w-4 h-4 ml-3 text-neutral-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className={cn(
                "flex-1 px-2 py-2 bg-transparent text-sm",
                "focus:outline-none placeholder:text-neutral-400"
              )}
            />
            <button
              type="button"
              onClick={handleCollapse}
              className="p-2 hover:bg-neutral-200/50 transition-colors"
            >
              <X className="w-4 h-4 text-neutral-500" />
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

interface NavItemV7Props {
  href: string;
  label: string;
  isActive?: boolean;
}

function NavItemV7({ href, label, isActive }: NavItemV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();

  return (
    <Link href={href}>
      <motion.span
        className={cn(
          "relative px-3 py-2 rounded-lg text-sm font-medium",
          "transition-colors duration-150",
          isActive
            ? "text-v6-primary"
            : "text-neutral-700 hover:text-v6-primary"
        )}
        whileHover={shouldAnimate ? { y: -2 } : undefined}
        whileTap={shouldAnimate ? { y: 0 } : undefined}
        transition={getSpring(v7Spring.snappy)}
      >
        {label}

        {/* Active indicator - animated underline */}
        <motion.span
          className="absolute bottom-0 left-1/2 h-0.5 bg-v6-primary rounded-full"
          initial={{ width: 0, x: "-50%" }}
          animate={shouldAnimate ? {
            width: isActive ? "60%" : 0,
            x: "-50%"
          } : {
            width: isActive ? "60%" : 0,
            x: "-50%"
          }}
          transition={getSpring(v7Spring.ultraBouncy)}
        />

        {/* Hover glow */}
        {shouldAnimate && (
          <motion.span
            className="absolute inset-0 rounded-lg bg-v6-primary/5"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: v7Duration.fast }}
          />
        )}
      </motion.span>
    </Link>
  );
}

// ============================================
// MAIN HEADER COMPONENT
// ============================================

export const HeaderV7 = forwardRef<HTMLElement, HeaderV7Props>(
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
    const { shouldAnimate, getSpring, isFullMotion } = useAnimationPreferenceV7();
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
          "fixed top-0 left-0 right-0 z-50",
          "border-b border-neutral-200/50",
          className
        )}
        initial={false}
        animate={shouldAnimate ? {
          y: isCollapsed && !isMobileMenuOpen ? -72 : 0,
        } : {
          y: isCollapsed && !isMobileMenuOpen ? -72 : 0,
        }}
        transition={getSpring(v7Spring.snappy)}
        style={{
          backgroundColor: `rgba(255, 255, 255, ${isAtTop ? 0.6 : 0.95})`,
          backdropFilter: `blur(${isAtTop ? 8 : 16}px)`,
          WebkitBackdropFilter: `blur(${isAtTop ? 8 : 16}px)`,
        }}
      >
        {/* Burmese ornate top border */}
        <div
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D4A017] via-[#A41034] to-[#D4A017]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              #D4A017 0px,
              #D4A017 4px,
              #A41034 4px,
              #A41034 8px,
              #D4A017 8px,
              #D4A017 12px
            )`,
          }}
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div
              whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
              transition={getSpring(v7Spring.snappy)}
            >
              <Link
                href="/"
                className={cn(
                  "font-display text-lg font-semibold",
                  "text-v6-primary hover:text-v6-primary-hover transition-colors"
                )}
              >
                {typeof logo === "string" ? (
                  <span className="flex items-center gap-2">
                    {/* Mini lotus icon */}
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-v6-secondary"
                    >
                      <path d="M12 2C10 6 8 8 8 12c0 2 1.5 4 4 4s4-2 4-4c0-4-2-6-4-10z" />
                      <path d="M6 10c-2 2-4 4-4 7 0 2 2 3 4 3 1.5 0 3-1 4-3-3 0-4-3-4-7z" opacity="0.7" />
                      <path d="M18 10c2 2 4 4 4 7 0 2-2 3-4 3-1.5 0-3-1-4-3 3 0 4-3 4-7z" opacity="0.7" />
                    </svg>
                    {logo}
                  </span>
                ) : logo}
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavItemV7
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
            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#A41034] to-[#D4A017]"
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

HeaderV7.displayName = "HeaderV7";

// ============================================
// HEADER SPACER
// Add below header to prevent content overlap
// ============================================

export function HeaderSpacer({ className }: { className?: string }) {
  return <div className={cn("h-16", className)} aria-hidden="true" />;
}

export default HeaderV7;
