/**
 * V3 Sprint 6: Skip Link Component
 *
 * Accessibility skip links for keyboard navigation.
 * Allows users to bypass repetitive navigation.
 */

"use client";

import { useCallback, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils/cn";

// ============================================
// TYPES
// ============================================

export interface SkipLinkProps {
  /** Target element ID to skip to */
  targetId: string;
  /** Link text (screen reader visible) */
  label?: string;
  /** Additional class names */
  className?: string;
}

export interface SkipLinksProps {
  /** Array of skip link configurations */
  links?: Array<{
    targetId: string;
    label: string;
  }>;
  /** Additional class names */
  className?: string;
}

// ============================================
// SKIP LINK COMPONENT
// ============================================

/**
 * Single skip link - hidden until focused
 */
export function SkipLink({
  targetId,
  label = "Skip to main content",
  className,
}: SkipLinkProps) {
  const handleClick = useCallback(() => {
    const target = document.getElementById(targetId);
    if (target) {
      target.setAttribute("tabindex", "-1");
      target.focus();
      target.scrollIntoView({ behavior: "smooth" });
    }
  }, [targetId]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLAnchorElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  return (
    <a
      href={`#${targetId}`}
      onClick={(e) => {
        e.preventDefault();
        handleClick();
      }}
      onKeyDown={handleKeyDown}
      className={cn(
        // Visually hidden by default
        "fixed left-4 top-4 z-[100]",
        "px-4 py-3 rounded-[var(--radius-md)]",
        "bg-[var(--color-cta)] text-[var(--color-charcoal)]",
        "font-semibold text-sm",
        "shadow-lg",
        // Hidden until focused
        "transform -translate-y-full opacity-0",
        "focus:translate-y-0 focus:opacity-100",
        "focus:outline-none focus:ring-2 focus:ring-[var(--color-cta)] focus:ring-offset-2",
        // Transition
        "transition-all duration-200",
        className
      )}
    >
      {label}
    </a>
  );
}

// ============================================
// MULTIPLE SKIP LINKS
// ============================================

/**
 * Multiple skip links for complex layouts
 */
export function SkipLinks({
  links = [
    { targetId: "main-content", label: "Skip to main content" },
    { targetId: "main-navigation", label: "Skip to navigation" },
  ],
  className,
}: SkipLinksProps) {
  return (
    <div className={cn("sr-only focus-within:not-sr-only", className)}>
      {links.map((link, index) => (
        <SkipLink
          key={link.targetId}
          targetId={link.targetId}
          label={link.label}
          className={cn(
            index > 0 && "left-[calc(4px+var(--skip-link-offset,0px))]"
          )}
        />
      ))}
    </div>
  );
}

// ============================================
// MAIN CONTENT WRAPPER
// ============================================

export interface MainContentProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
}

/**
 * Main content wrapper with proper ID and role
 */
export function MainContent({
  children,
  id = "main-content",
  className,
}: MainContentProps) {
  return (
    <main
      id={id}
      role="main"
      tabIndex={-1}
      className={cn("focus:outline-none", className)}
    >
      {children}
    </main>
  );
}

// ============================================
// ACCESSIBILITY UTILITIES
// ============================================

/**
 * Hook for managing focus on page navigation
 */
export function useFocusOnNavigation() {
  const focusMain = useCallback(() => {
    const main = document.getElementById("main-content");
    if (main) {
      main.setAttribute("tabindex", "-1");
      main.focus();
    }
  }, []);

  return { focusMain };
}

/**
 * Visually hidden text for screen readers
 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
      style={{ clip: "rect(0, 0, 0, 0)" }}
    >
      {children}
    </span>
  );
}

/**
 * Live region for announcing dynamic content
 */
export interface LiveRegionProps {
  children: React.ReactNode;
  /** Announcement urgency */
  politeness?: "polite" | "assertive";
  /** Whether the region is atomic */
  atomic?: boolean;
}

export function LiveRegion({
  children,
  politeness = "polite",
  atomic = true,
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  );
}
