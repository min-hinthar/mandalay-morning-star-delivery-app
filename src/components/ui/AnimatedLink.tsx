"use client";

import { forwardRef, type ReactNode } from "react";
import { motion } from "framer-motion";
import Link, { type LinkProps } from "next/link";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export interface AnimatedLinkProps extends Omit<LinkProps, "className"> {
  children: ReactNode;
  /** Underline animation style */
  underlineStyle?: "slide" | "expand" | "wave" | "glow" | "double" | "none";
  /** Underline color */
  underlineColor?: string;
  /** Text color on hover */
  hoverColor?: string;
  /** Additional class names */
  className?: string;
  /** Whether link is currently active */
  isActive?: boolean;
  /** Icon to show on hover */
  hoverIcon?: ReactNode;
  /** External link (opens in new tab) */
  external?: boolean;
}

// ============================================
// UNDERLINE VARIANTS
// ============================================

const underlineVariants = {
  slide: {
    initial: { scaleX: 0, originX: 0 },
    hover: { scaleX: 1, originX: 0 },
  },
  expand: {
    initial: { scaleX: 0, originX: 0.5 },
    hover: { scaleX: 1, originX: 0.5 },
  },
  wave: {
    initial: {
      scaleX: 0,
      originX: 0,
      skewX: -20,
    },
    hover: {
      scaleX: 1,
      originX: 0,
      skewX: 0,
    },
  },
  glow: {
    initial: { opacity: 0, scaleX: 0.8 },
    hover: { opacity: 1, scaleX: 1 },
  },
  double: {
    initial: { scaleX: 0 },
    hover: { scaleX: 1 },
  },
};

// ============================================
// COMPONENT
// ============================================

export const AnimatedLink = forwardRef<HTMLAnchorElement, AnimatedLinkProps>(
  (
    {
      children,
      underlineStyle = "slide",
      underlineColor = "#A41034",
      hoverColor: _hoverColor,
      className,
      isActive = false,
      hoverIcon,
      external = false,
      href,
      ...linkProps
    },
    ref
  ) => {
    const { shouldAnimate, getSpring } = useAnimationPreference();

    const springConfig = getSpring(spring.snappy);
    const variant = underlineStyle !== "none"
      ? underlineVariants[underlineStyle as keyof typeof underlineVariants] || underlineVariants.slide
      : null;

    const linkContent = (
      <motion.span
        className={cn(
          "relative inline-flex items-center gap-1.5 group",
          "font-medium transition-colors duration-150",
          isActive ? "text-primary" : "text-text-primary hover:text-primary",
          className
        )}
        initial="initial"
        whileHover="hover"
        animate={isActive ? "hover" : "initial"}
      >
        {/* Text Content */}
        <span className="relative">
          {children}

          {/* Underline */}
          {underlineStyle !== "none" && (
            <>
              {/* Primary underline */}
              <motion.span
                className="absolute left-0 right-0 -bottom-0.5 h-0.5 rounded-full"
                style={{ backgroundColor: underlineColor }}
                variants={shouldAnimate && variant ? variant : undefined}
                transition={springConfig}
              />

              {/* Glow effect for glow style */}
              {underlineStyle === "glow" && (
                <motion.span
                  className="absolute left-0 right-0 -bottom-0.5 h-0.5 rounded-full blur-sm"
                  style={{ backgroundColor: underlineColor }}
                  variants={
                    shouldAnimate
                      ? {
                          initial: { opacity: 0 },
                          hover: { opacity: 0.5 },
                        }
                      : undefined
                  }
                  transition={springConfig}
                />
              )}

              {/* Second line for double style */}
              {underlineStyle === "double" && (
                <motion.span
                  className="absolute left-0 right-0 -bottom-1.5 h-0.5 rounded-full"
                  style={{ backgroundColor: underlineColor, opacity: 0.4 }}
                  variants={
                    shouldAnimate
                      ? {
                          initial: { scaleX: 0, originX: 1 },
                          hover: { scaleX: 1, originX: 1 },
                        }
                      : undefined
                  }
                  transition={{ ...springConfig, delay: 0.05 }}
                />
              )}
            </>
          )}
        </span>

        {/* Hover Icon */}
        {hoverIcon && (
          <motion.span
            variants={
              shouldAnimate
                ? {
                    initial: { opacity: 0, x: -4, scale: 0.8 },
                    hover: { opacity: 1, x: 0, scale: 1 },
                  }
                : undefined
            }
            transition={springConfig}
          >
            {hoverIcon}
          </motion.span>
        )}

        {/* External link arrow */}
        {external && (
          <motion.svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-50"
            variants={
              shouldAnimate
                ? {
                    initial: { x: 0, y: 0, opacity: 0.5 },
                    hover: { x: 2, y: -2, opacity: 1 },
                  }
                : undefined
            }
            transition={springConfig}
          >
            <path d="M7 17L17 7" />
            <path d="M7 7h10v10" />
          </motion.svg>
        )}
      </motion.span>
    );

    // Handle external links
    if (external) {
      return (
        <a
          ref={ref}
          href={href as string}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block"
        >
          {linkContent}
        </a>
      );
    }

    return (
      <Link ref={ref} href={href} {...linkProps} className="inline-block">
        {linkContent}
      </Link>
    );
  }
);

AnimatedLink.displayName = "AnimatedLink";

// ============================================
// NAV LINK VARIANT
// Pre-styled for navigation menus
// ============================================

export interface NavLinkProps extends Omit<AnimatedLinkProps, "underlineStyle"> {
  /** Show indicator dot when active */
  showDot?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  (
    {
      showDot = true,
      size = "md",
      isActive,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { shouldAnimate, getSpring } = useAnimationPreference();

    const sizeClasses = {
      sm: "text-sm py-1",
      md: "text-base py-1.5",
      lg: "text-lg py-2",
    };

    return (
      <AnimatedLink
        ref={ref}
        isActive={isActive}
        underlineStyle="slide"
        className={cn(sizeClasses[size], className)}
        {...props}
      >
        <span className="flex items-center gap-2">
          {/* Active dot indicator */}
          {showDot && (
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-primary"
              initial={{ scale: 0, opacity: 0 }}
              animate={
                shouldAnimate
                  ? isActive
                    ? { scale: 1, opacity: 1 }
                    : { scale: 0, opacity: 0 }
                  : undefined
              }
              transition={getSpring(spring.ultraBouncy)}
            />
          )}
          {children}
        </span>
      </AnimatedLink>
    );
  }
);

NavLink.displayName = "NavLink";

// ============================================
// FOOTER LINK VARIANT
// Pre-styled for footer sections
// ============================================

export interface FooterLinkProps extends Omit<AnimatedLinkProps, "underlineStyle"> {
  /** Subtle styling */
  subtle?: boolean;
}

export const FooterLink = forwardRef<HTMLAnchorElement, FooterLinkProps>(
  ({ subtle = true, className, ...props }, ref) => {
    return (
      <AnimatedLink
        ref={ref}
        underlineStyle={subtle ? "expand" : "slide"}
        underlineColor={subtle ? "#D4A017" : "#A41034"}
        className={cn(
          "text-sm",
          subtle ? "text-text-muted hover:text-text-primary" : "",
          className
        )}
        {...props}
      />
    );
  }
);

FooterLink.displayName = "FooterLink";

// ============================================
// BREADCRUMB LINK
// Pre-styled for breadcrumb navigation
// ============================================

export interface BreadcrumbLinkProps extends Omit<AnimatedLinkProps, "underlineStyle"> {
  /** Is this the current page? */
  isCurrent?: boolean;
}

export const BreadcrumbLink = forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ isCurrent, className, children, ...props }, ref) => {
    if (isCurrent) {
      return (
        <span className={cn("text-sm text-text-primary font-medium", className)}>
          {children}
        </span>
      );
    }

    return (
      <AnimatedLink
        ref={ref}
        underlineStyle="none"
        className={cn(
          "text-sm text-text-muted hover:text-primary",
          className
        )}
        {...props}
      >
        {children}
      </AnimatedLink>
    );
  }
);

BreadcrumbLink.displayName = "BreadcrumbLink";

export default AnimatedLink;
