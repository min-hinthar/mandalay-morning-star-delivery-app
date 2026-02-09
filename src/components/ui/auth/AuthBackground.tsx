"use client";

import type { CSSProperties, ReactNode } from "react";

/* Burmese dish emojis — the food you're about to get delivered */
const FOOD_EMOJIS = [
  "\u{1F35C}", // 🍜 Mohinga
  "\u{1F35B}", // 🍛 Curry
  "\u{1F336}\uFE0F", // 🌶️ Chili
  "\u{1F35A}", // 🍚 Rice
  "\u{1F958}", // 🥘 Stew
  "\u{1F372}", // 🍲 Pot
  "\u{1FAD5}", // 🫕 Fondue
  "\u{1F95F}", // 🥟 Dumpling
  "\u{1F371}", // 🍱 Bento
  "\u{1F9C4}", // 🧄 Garlic
  "\u{1F96A}", // 🥪 Samosa-ish
  "\u{1F952}", // 🥒 Cucumber
] as const;

interface EmojiConfig {
  emoji: string;
  top: string;
  left: string;
  fontSize: string;
  opacity: number;
  driftClass: string;
  delay: string;
}

/*
 * Staggered across the viewport with auth-specific gentle drift.
 * Each emoji gets its own delay to avoid synchronised movement.
 */
const EMOJI_POSITIONS: EmojiConfig[] = [
  { emoji: FOOD_EMOJIS[0], top: "6%", left: "10%", fontSize: "1.5rem", opacity: 0.18, driftClass: "animate-auth-drift-1", delay: "0s" },
  { emoji: FOOD_EMOJIS[1], top: "12%", left: "80%", fontSize: "2.2rem", opacity: 0.15, driftClass: "animate-auth-drift-2", delay: "-4s" },
  { emoji: FOOD_EMOJIS[2], top: "24%", left: "50%", fontSize: "1.3rem", opacity: 0.14, driftClass: "animate-auth-drift-3", delay: "-8s" },
  { emoji: FOOD_EMOJIS[3], top: "30%", left: "6%", fontSize: "2.4rem", opacity: 0.2, driftClass: "animate-auth-drift-2", delay: "-2s" },
  { emoji: FOOD_EMOJIS[4], top: "38%", left: "90%", fontSize: "1.4rem", opacity: 0.16, driftClass: "animate-auth-drift-1", delay: "-10s" },
  { emoji: FOOD_EMOJIS[5], top: "50%", left: "18%", fontSize: "2rem", opacity: 0.13, driftClass: "animate-auth-drift-3", delay: "-6s" },
  { emoji: FOOD_EMOJIS[6], top: "56%", left: "72%", fontSize: "2.1rem", opacity: 0.17, driftClass: "animate-auth-drift-1", delay: "-12s" },
  { emoji: FOOD_EMOJIS[7], top: "66%", left: "36%", fontSize: "1.2rem", opacity: 0.2, driftClass: "animate-auth-drift-2", delay: "-3s" },
  { emoji: FOOD_EMOJIS[8], top: "74%", left: "4%", fontSize: "1.8rem", opacity: 0.15, driftClass: "animate-auth-drift-3", delay: "-7s" },
  { emoji: FOOD_EMOJIS[9], top: "78%", left: "86%", fontSize: "2.3rem", opacity: 0.12, driftClass: "animate-auth-drift-2", delay: "-9s" },
  { emoji: FOOD_EMOJIS[10], top: "88%", left: "55%", fontSize: "1.4rem", opacity: 0.18, driftClass: "animate-auth-drift-1", delay: "-5s" },
  { emoji: FOOD_EMOJIS[11], top: "92%", left: "24%", fontSize: "1.9rem", opacity: 0.11, driftClass: "animate-auth-drift-3", delay: "-11s" },
];

interface AuthBackgroundProps {
  children: ReactNode;
}

export function AuthBackground({ children }: AuthBackgroundProps) {
  return (
    <div className="min-h-screen w-full relative overflow-hidden auth-gradient">
      {/* Warm radial glow behind card area */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[600px] h-[600px] rounded-full opacity-30 pointer-events-none blur-3xl"
        style={{ background: "radial-gradient(circle, hsla(35, 90%, 70%, 0.4), transparent 70%)" }}
        aria-hidden="true"
      />

      {/* Floating food emojis with auth-specific gentle drift */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        {EMOJI_POSITIONS.map((config, index) => {
          const style: CSSProperties = {
            top: config.top,
            left: config.left,
            fontSize: config.fontSize,
            opacity: config.opacity,
            animationDelay: config.delay,
          };

          return (
            <span
              key={index}
              className={`absolute ${config.driftClass}`}
              style={style}
            >
              {config.emoji}
            </span>
          );
        })}
      </div>

      {/* Card container — bottom-anchored on mobile (sheet), centered on desktop */}
      <div className="relative z-10 flex min-h-screen w-full items-end sm:items-center justify-center px-0 py-6 sm:p-4">
        {children}
      </div>
    </div>
  );
}
