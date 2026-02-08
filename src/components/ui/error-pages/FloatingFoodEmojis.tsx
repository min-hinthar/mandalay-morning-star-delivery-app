import type { CSSProperties } from "react";

const FOOD_EMOJIS = [
  "\u{1F35C}", // noodles
  "\u{1F35B}", // curry
  "\u{1F336}\uFE0F", // hot pepper
  "\u{1F35A}", // rice
  "\u{1F958}", // shallow pan
  "\u{1F372}", // pot of food
  "\u{1FAD5}", // fondue
  "\u{1F95F}", // dumpling
  "\u{1F371}", // bento
  "\u{1F9C4}", // garlic
] as const;

interface EmojiConfig {
  emoji: string;
  top: string;
  left: string;
  fontSize: string;
  opacity: number;
  driftClass: string;
  staggerClass: string;
}

const EMOJI_POSITIONS: EmojiConfig[] = [
  { emoji: FOOD_EMOJIS[0], top: "5%", left: "8%", fontSize: "1.75rem", opacity: 0.2, driftClass: "animate-error-drift-1", staggerClass: "stagger-1" },
  { emoji: FOOD_EMOJIS[1], top: "15%", left: "85%", fontSize: "2rem", opacity: 0.18, driftClass: "animate-error-drift-2", staggerClass: "stagger-2" },
  { emoji: FOOD_EMOJIS[2], top: "30%", left: "3%", fontSize: "1.5rem", opacity: 0.25, driftClass: "animate-error-drift-3", staggerClass: "stagger-3" },
  { emoji: FOOD_EMOJIS[3], top: "45%", left: "92%", fontSize: "1.875rem", opacity: 0.15, driftClass: "animate-error-drift-1", staggerClass: "stagger-4" },
  { emoji: FOOD_EMOJIS[4], top: "60%", left: "10%", fontSize: "1.625rem", opacity: 0.22, driftClass: "animate-error-drift-2", staggerClass: "stagger-5" },
  { emoji: FOOD_EMOJIS[5], top: "70%", left: "80%", fontSize: "2.125rem", opacity: 0.17, driftClass: "animate-error-drift-3", staggerClass: "stagger-6" },
  { emoji: FOOD_EMOJIS[6], top: "80%", left: "20%", fontSize: "1.375rem", opacity: 0.3, driftClass: "animate-error-drift-1", staggerClass: "stagger-7" },
  { emoji: FOOD_EMOJIS[7], top: "25%", left: "50%", fontSize: "1.75rem", opacity: 0.2, driftClass: "animate-error-drift-2", staggerClass: "stagger-8" },
  { emoji: FOOD_EMOJIS[8], top: "55%", left: "65%", fontSize: "1.625rem", opacity: 0.18, driftClass: "animate-error-drift-3", staggerClass: "stagger-1" },
  { emoji: FOOD_EMOJIS[9], top: "85%", left: "45%", fontSize: "1.875rem", opacity: 0.22, driftClass: "animate-error-drift-1", staggerClass: "stagger-3" },
];

export function FloatingFoodEmojis() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {EMOJI_POSITIONS.map((config, i) => {
        const style: CSSProperties = {
          top: config.top,
          left: config.left,
          fontSize: config.fontSize,
          opacity: config.opacity,
        };

        return (
          <span
            key={i}
            className={`absolute ${config.driftClass} ${config.staggerClass}`}
            style={style}
          >
            {config.emoji}
          </span>
        );
      })}
    </div>
  );
}
