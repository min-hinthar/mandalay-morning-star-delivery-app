"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useThemeTransition } from "@/lib/hooks/useThemeTransition";
import { playLightChime, playDarkTone } from "@/lib/theme-sounds";

/**
 * SVG paths for sun and moon icons
 * Using simple iconography that works with AnimatePresence
 */
const SunIcon = () => (
  <>
    {/* Sun rays */}
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    {/* Sun circle */}
    <circle cx="12" cy="12" r="5" />
  </>
);

const MoonIcon = () => (
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
);

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const { toggleWithTransition } = useThemeTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = useCallback(
    (event: React.MouseEvent) => {
      const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

      toggleWithTransition(event, () => {
        setTheme(nextTheme);

        // Play appropriate sound
        if (nextTheme === "light") {
          playLightChime();
        } else {
          playDarkTone();
        }
      });
    },
    [resolvedTheme, setTheme, toggleWithTransition]
  );

  // Skeleton during hydration
  if (!mounted) {
    return (
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          "bg-secondary/50",
          className
        )}
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <motion.button
      onClick={handleToggle}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full",
        "bg-secondary/50 dark:bg-overlay-light",
        "border border-border dark:border-transparent",
        "dark:shadow-[0_0_12px_rgba(229,62,62,0.3)]", // Primary glow in dark mode
        "transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={spring.snappyButton}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <AnimatePresence mode="wait">
        <motion.svg
          key={isDark ? "moon" : "sun"}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("h-5 w-5", isDark ? "text-accent" : "text-primary")}
          initial={{ scale: 0, rotate: -90, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0, rotate: 90, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 25,
            mass: 0.8,
          }}
        >
          {isDark ? <MoonIcon /> : <SunIcon />}
        </motion.svg>
      </AnimatePresence>
    </motion.button>
  );
}
