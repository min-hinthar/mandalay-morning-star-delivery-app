"use client";

/**
 * SearchTrigger - Search icon button with Cmd/Ctrl+K hint on hover
 *
 * Features:
 * - Shows keyboard shortcut hint on hover
 * - Platform-aware: Cmd K on Mac, Ctrl K on Windows/Linux
 * - Animated entrance for hint with gradient shadow
 */

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

export interface SearchTriggerProps {
  onClick: () => void;
  className?: string;
}

/**
 * Detect if user is on Mac platform (hydration-safe)
 * Returns { isMac, mounted } to handle SSR properly
 */
function useIsMac() {
  const [state, setState] = useState({ isMac: false, mounted: false });

  useEffect(() => {
    // Check navigator.platform or userAgentData
    const platform = navigator.platform?.toLowerCase() || "";
    const userAgent = navigator.userAgent?.toLowerCase() || "";
    setState({
      isMac: platform.includes("mac") || userAgent.includes("mac"),
      mounted: true,
    });
  }, []);

  return state;
}

/**
 * Hint animation variants
 */
const hintVariants = {
  initial: { opacity: 0, y: 4, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: spring.snappy,
  },
  exit: {
    opacity: 0,
    y: 4,
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};

export function SearchTrigger({ onClick, className }: SearchTriggerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { isMac, mounted } = useIsMac();
  const { shouldAnimate, getSpring } = useAnimationPreference();

  // Use generic text until mounted to avoid hydration mismatch
  const shortcutText = mounted ? (isMac ? "Cmd K" : "Ctrl K") : "K";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
      transition={getSpring(spring.snappy)}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full",
        "bg-zinc-100/80 dark:bg-zinc-800/80",
        "text-zinc-700 dark:text-zinc-300",
        "transition-colors duration-150",
        "hover:bg-amber-500 hover:text-text-inverse",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2",
        className
      )}
      aria-label={`Search menu (${shortcutText})`}
    >
      <Search className="h-5 w-5" />

      {/* Keyboard hint badge on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.span
            variants={shouldAnimate ? hintVariants : undefined}
            initial={shouldAnimate ? "initial" : false}
            animate={shouldAnimate ? "animate" : { opacity: 1 }}
            exit={shouldAnimate ? "exit" : { opacity: 0 }}
            className={cn(
              "absolute -bottom-8 left-1/2 -translate-x-1/2",
              "px-2 py-0.5 rounded-md",
              "bg-zinc-800 dark:bg-zinc-100",
              "text-zinc-100 dark:text-zinc-800",
              "text-xs font-medium whitespace-nowrap",
              "pointer-events-none",
              // Gradient shadow effect (brand-tinted with depth)
              "shadow-hint-sm"
            )}
          >
            {shortcutText}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default SearchTrigger;
