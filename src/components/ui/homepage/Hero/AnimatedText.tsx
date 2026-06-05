"use client";

/**
 * AnimatedText — supporting copy that comes alive.
 * Reveals word-by-word as it scrolls into view; each word lifts/pops on
 * hover + tap; chosen accent words get a cream highlighter with clay ink.
 * Falls back to a plain styled paragraph under reduced motion.
 */

import { Fragment } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

const CONTAINER = { hidden: {}, show: { transition: { staggerChildren: 0.035 } } };
const WORD = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

const ACCENT_CHIP = "rounded bg-hero-card px-1 font-semibold text-hero-accent";

interface AnimatedTextProps {
  text: string;
  className?: string;
  /** Words to highlight with the cream/clay accent chip */
  accentWords?: string[];
}

export function AnimatedText({ text, className, accentWords = [] }: AnimatedTextProps) {
  const { shouldAnimate } = useAnimationPreference();
  const accents = new Set(accentWords.map((w) => w.toLowerCase()));
  const words = text.split(" ");
  const isAccent = (w: string) => accents.has(w.replace(/[.,·!?]/g, "").toLowerCase());

  if (!shouldAnimate) {
    return (
      <p className={className}>
        {words.map((w, i) => (
          <Fragment key={i}>
            {isAccent(w) ? <span className={ACCENT_CHIP}>{w}</span> : w}
            {i < words.length - 1 ? " " : ""}
          </Fragment>
        ))}
      </p>
    );
  }

  return (
    <m.p
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-12%" }}
      variants={CONTAINER}
    >
      {words.map((w, i) => (
        <Fragment key={i}>
          <m.span
            variants={WORD}
            whileHover={{ y: -3, scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className={cn("inline-block cursor-default", isAccent(w) && ACCENT_CHIP)}
          >
            {w}
          </m.span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </m.p>
  );
}
