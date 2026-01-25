"use client";

import { useEffect, useState, useMemo, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export interface PriceTickerProps {
  /** Price value in cents or decimal */
  value: number;
  /** Currency symbol */
  currency?: string;
  /** Currency position */
  currencyPosition?: "prefix" | "suffix";
  /** Whether value is in cents (divide by 100) */
  inCents?: boolean;
  /** Number of decimal places */
  decimals?: number;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /** Color when price increases */
  increaseColor?: string;
  /** Color when price decreases */
  decreaseColor?: string;
  /** Show direction indicator */
  showDirection?: boolean;
  /** Additional class names */
  className?: string;
  /** Play sound on change */
  playSound?: boolean;
  /** Animation direction */
  animationDirection?: "up" | "down" | "auto";
}

// ============================================
// SIZE CONFIG
// ============================================

const sizeConfig = {
  sm: {
    container: "text-sm",
    digit: "h-5",
    currency: "text-xs",
  },
  md: {
    container: "text-base",
    digit: "h-6",
    currency: "text-sm",
  },
  lg: {
    container: "text-xl",
    digit: "h-7",
    currency: "text-base",
  },
  xl: {
    container: "text-3xl",
    digit: "h-9",
    currency: "text-xl",
  },
};

// ============================================
// SINGLE DIGIT COMPONENT
// ============================================

interface DigitProps {
  digit: string;
  prevDigit: string | null;
  direction: "up" | "down";
  shouldAnimate: boolean;
}

function AnimatedDigit({ digit, prevDigit, direction, shouldAnimate }: DigitProps) {
  const { getSpring } = useAnimationPreference();
  const springConfig = getSpring(spring.snappy);

  // Don't animate if it's the same digit or first render
  if (!shouldAnimate || prevDigit === null || prevDigit === digit) {
    return <span className="inline-block">{digit}</span>;
  }

  const yOffset = direction === "up" ? 20 : -20;

  return (
    <span className="relative inline-block overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={digit}
          className="inline-block"
          initial={{ y: yOffset, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -yOffset, opacity: 0 }}
          transition={springConfig}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export const PriceTicker = forwardRef<HTMLSpanElement, PriceTickerProps>(
  (
    {
      value,
      currency = "$",
      currencyPosition = "prefix",
      inCents = false,
      decimals = 2,
      size = "md",
      increaseColor = "#52A52E",
      decreaseColor = "#A41034",
      showDirection = false,
      className,
      playSound = false,
      animationDirection = "auto",
    },
    ref
  ) => {
    const { shouldAnimate, isFullMotion } = useAnimationPreference();
    const [prevValue, setPrevValue] = useState<number | null>(null);
    const [prevDigits, setPrevDigits] = useState<string[] | null>(null);

    const sizes = sizeConfig[size];

    // Format the price
    const actualValue = inCents ? value / 100 : value;
    const formattedPrice = actualValue.toFixed(decimals);
    // Memoize digits to prevent infinite re-render loop
    const digits = useMemo(() => formattedPrice.split(""), [formattedPrice]);

    // Determine direction
    const direction = useMemo(() => {
      if (animationDirection !== "auto") return animationDirection;
      if (prevValue === null) return "up";
      return actualValue >= prevValue ? "up" : "down";
    }, [animationDirection, prevValue, actualValue]);

    // Determine color based on change
    const changeColor = useMemo(() => {
      if (prevValue === null) return undefined;
      if (actualValue > prevValue) return increaseColor;
      if (actualValue < prevValue) return decreaseColor;
      return undefined;
    }, [prevValue, actualValue, increaseColor, decreaseColor]);

    // Update previous value
    useEffect(() => {
      // Play sound on change
      if (
        playSound &&
        isFullMotion &&
        prevValue !== null &&
        prevValue !== actualValue
      ) {
        // Could integrate with audio-manager here
      }

      setPrevValue(actualValue);
      setPrevDigits(digits);
    }, [actualValue, digits, playSound, isFullMotion, prevValue]);

    // Direction indicator
    const DirectionIndicator = () => {
      if (!showDirection || prevValue === null || prevValue === actualValue) {
        return null;
      }

      const isUp = actualValue > prevValue;

      return (
        <motion.span
          className="ml-1 inline-flex items-center"
          initial={{ opacity: 0, scale: 0.5, y: isUp ? 5 : -5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={spring.ultraBouncy}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ color: changeColor }}
            className={isUp ? "" : "rotate-180"}
          >
            <path d="M12 4l-8 8h5v8h6v-8h5z" />
          </svg>
        </motion.span>
      );
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-baseline font-mono font-semibold tabular-nums",
          sizes.container,
          className
        )}
        style={{ color: changeColor }}
      >
        {/* Currency prefix */}
        {currencyPosition === "prefix" && (
          <span className={cn("mr-0.5", sizes.currency)}>{currency}</span>
        )}

        {/* Animated digits */}
        <span className="inline-flex items-baseline">
          {digits.map((digit, index) => (
            <AnimatedDigit
              key={`${index}-${digit}`}
              digit={digit}
              prevDigit={prevDigits?.[index] ?? null}
              direction={direction}
              shouldAnimate={shouldAnimate}
            />
          ))}
        </span>

        {/* Currency suffix */}
        {currencyPosition === "suffix" && (
          <span className={cn("ml-0.5", sizes.currency)}>{currency}</span>
        )}

        {/* Direction indicator */}
        <AnimatePresence>
          {shouldAnimate && <DirectionIndicator />}
        </AnimatePresence>
      </span>
    );
  }
);

PriceTicker.displayName = "PriceTicker";

// ============================================
// PRICE CHANGE BADGE
// Shows price with change percentage
// ============================================

export interface PriceChangeBadgeProps {
  currentPrice: number;
  originalPrice?: number;
  currency?: string;
  inCents?: boolean;
  className?: string;
}

export function PriceChangeBadge({
  currentPrice,
  originalPrice,
  currency = "$",
  inCents = false,
  className,
}: PriceChangeBadgeProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const current = inCents ? currentPrice / 100 : currentPrice;
  const original = originalPrice
    ? inCents
      ? originalPrice / 100
      : originalPrice
    : null;

  const discount = original
    ? Math.round(((original - current) / original) * 100)
    : null;

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <PriceTicker
        value={currentPrice}
        currency={currency}
        inCents={inCents}
        size="lg"
        className="text-text-primary"
      />

      {original && original > current && (
        <span className="contents">
          <span className="text-text-muted line-through text-sm">
            {currency}
            {original.toFixed(2)}
          </span>

          <motion.span
            className="px-1.5 py-0.5 rounded-md bg-green/10 text-green text-xs font-semibold"
            initial={shouldAnimate ? { scale: 0, opacity: 0 } : undefined}
            animate={shouldAnimate ? { scale: 1, opacity: 1 } : undefined}
            transition={getSpring(spring.ultraBouncy)}
          >
            -{discount}%
          </motion.span>
        </span>
      )}
    </span>
  );
}

// ============================================
// COUNTER TICKER
// General purpose number counter with same animation
// ============================================

export interface CounterTickerProps {
  value: number;
  /** Prefix text */
  prefix?: string;
  /** Suffix text */
  suffix?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /** Pad with leading zeros */
  padZeros?: number;
  /** Class names */
  className?: string;
}

export const CounterTicker = forwardRef<HTMLSpanElement, CounterTickerProps>(
  (
    { value, prefix, suffix, size = "md", padZeros = 0, className },
    ref
  ) => {
    const { shouldAnimate } = useAnimationPreference();
    const [prevValue, setPrevValue] = useState<number | null>(null);

    const sizes = sizeConfig[size];
    const formattedValue = padZeros > 0
      ? value.toString().padStart(padZeros, "0")
      : value.toString();
    const digits = formattedValue.split("");
    const prevDigits = prevValue !== null
      ? (padZeros > 0
          ? prevValue.toString().padStart(padZeros, "0")
          : prevValue.toString()
        ).split("")
      : null;

    const direction = prevValue !== null && value >= prevValue ? "up" : "down";

    useEffect(() => {
      setPrevValue(value);
    }, [value]);

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-baseline font-mono font-semibold tabular-nums",
          sizes.container,
          className
        )}
      >
        {prefix && <span className="mr-0.5">{prefix}</span>}

        <span className="inline-flex items-baseline">
          {digits.map((digit, index) => (
            <AnimatedDigit
              key={`${index}-${digit}`}
              digit={digit}
              prevDigit={prevDigits?.[index] ?? null}
              direction={direction}
              shouldAnimate={shouldAnimate}
            />
          ))}
        </span>

        {suffix && <span className="ml-0.5">{suffix}</span>}
      </span>
    );
  }
);

CounterTicker.displayName = "CounterTicker";

export default PriceTicker;
