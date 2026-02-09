"use client";

import type { CSSProperties, ReactNode } from "react";

const FOOD_EMOJIS = [
  "\u{1F35C}",
  "\u{1F35B}",
  "\u{1F336}\uFE0F",
  "\u{1F35A}",
  "\u{1F958}",
  "\u{1F372}",
  "\u{1FAD5}",
  "\u{1F95F}",
  "\u{1F371}",
  "\u{1F9C4}",
  "\u{1F354}",
  "\u{1F356}",
] as const;

interface EmojiConfig {
  emoji: string;
  top: string;
  left: string;
  fontSize: string;
  opacity: number;
  driftClass: string;
}

const EMOJI_POSITIONS: EmojiConfig[] = [
  { emoji: FOOD_EMOJIS[0], top: "8%", left: "12%", fontSize: "1.4rem", opacity: 0.2, driftClass: "animate-error-drift-1" },
  { emoji: FOOD_EMOJIS[1], top: "14%", left: "78%", fontSize: "2.1rem", opacity: 0.18, driftClass: "animate-error-drift-2" },
  { emoji: FOOD_EMOJIS[2], top: "22%", left: "46%", fontSize: "1.6rem", opacity: 0.16, driftClass: "animate-error-drift-3" },
  { emoji: FOOD_EMOJIS[3], top: "32%", left: "8%", fontSize: "2.4rem", opacity: 0.22, driftClass: "animate-error-drift-2" },
  { emoji: FOOD_EMOJIS[4], top: "36%", left: "88%", fontSize: "1.5rem", opacity: 0.2, driftClass: "animate-error-drift-1" },
  { emoji: FOOD_EMOJIS[5], top: "48%", left: "22%", fontSize: "1.9rem", opacity: 0.17, driftClass: "animate-error-drift-3" },
  { emoji: FOOD_EMOJIS[6], top: "54%", left: "70%", fontSize: "2.2rem", opacity: 0.2, driftClass: "animate-error-drift-1" },
  { emoji: FOOD_EMOJIS[7], top: "64%", left: "38%", fontSize: "1.25rem", opacity: 0.24, driftClass: "animate-error-drift-2" },
  { emoji: FOOD_EMOJIS[8], top: "72%", left: "6%", fontSize: "1.8rem", opacity: 0.18, driftClass: "animate-error-drift-3" },
  { emoji: FOOD_EMOJIS[9], top: "76%", left: "84%", fontSize: "2.3rem", opacity: 0.15, driftClass: "animate-error-drift-2" },
  { emoji: FOOD_EMOJIS[10], top: "86%", left: "52%", fontSize: "1.5rem", opacity: 0.2, driftClass: "animate-error-drift-1" },
  { emoji: FOOD_EMOJIS[11], top: "90%", left: "20%", fontSize: "2rem", opacity: 0.14, driftClass: "animate-error-drift-3" },
];

interface AuthBackgroundProps {
  children: ReactNode;
}

export function AuthBackground({ children }: AuthBackgroundProps) {
  return (
    <div className="min-h-screen w-full relative overflow-hidden auth-gradient">
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
      <div className="relative z-10 flex min-h-screen w-full items-end sm:items-center justify-center px-0 py-6 sm:p-4">
        {children}
      </div>
    </div>
  );
}
