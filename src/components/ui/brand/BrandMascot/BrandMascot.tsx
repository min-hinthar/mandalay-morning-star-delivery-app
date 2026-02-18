"use client";

import { useState, useEffect, useCallback, forwardRef, useRef } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { MascotExpression, BrandMascotProps } from "./types";
import { sizeConfig, expressionVariants } from "./types";
import { Eyes } from "./Eyes";
import { Mouth } from "./Mouth";
import { Accessories } from "./Accessories";

export const BrandMascot = forwardRef<HTMLDivElement, BrandMascotProps>(function BrandMascot(
  {
    expression = "happy",
    size = "md",
    autoCycle = false,
    cycleInterval = 3000,
    idleAnimations = true,
    onClick,
    celebrate = false,
    className,
    "aria-label": ariaLabel = "Brand mascot",
  },
  ref
) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [currentExpression, setCurrentExpression] = useState<MascotExpression>(expression);
  const [isBlinking, setIsBlinking] = useState(false);
  const clickTimeoutRefs = useRef<NodeJS.Timeout[]>([]);

  const { container, face, eyes, mouth } = sizeConfig[size];

  // Cleanup click timeouts on unmount
  useEffect(() => {
    return () => {
      clickTimeoutRefs.current.forEach(clearTimeout);
      clickTimeoutRefs.current = [];
    };
  }, []);

  // Sync expression prop
  useEffect(() => {
    setCurrentExpression(expression);
  }, [expression]);

  // Celebrate override
  useEffect(() => {
    if (celebrate) {
      setCurrentExpression("celebrating");
      const timer = setTimeout(() => setCurrentExpression(expression), 2000);
      return () => clearTimeout(timer);
    }
  }, [celebrate, expression]);

  // Auto-cycle expressions
  useEffect(() => {
    if (!autoCycle || !shouldAnimate) return;

    const expressions: MascotExpression[] = ["happy", "excited", "waving", "happy", "thinking"];
    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % expressions.length;
      setCurrentExpression(expressions[index]);
    }, cycleInterval);

    return () => clearInterval(interval);
  }, [autoCycle, cycleInterval, shouldAnimate]);

  // Idle blink animation
  useEffect(() => {
    if (!idleAnimations || !shouldAnimate || currentExpression === "sleeping") return;

    let isMounted = true;
    let blinkTimer: NodeJS.Timeout | null = null;
    let blinkEndTimer: NodeJS.Timeout | null = null;

    const blink = () => {
      if (!isMounted) return;
      setIsBlinking(true);
      blinkEndTimer = setTimeout(() => {
        if (isMounted) setIsBlinking(false);
      }, 150);
    };

    const scheduleBlink = () => {
      if (!isMounted) return;
      const delay = 2000 + Math.random() * 3000;
      blinkTimer = setTimeout(() => {
        if (isMounted) {
          blink();
          scheduleBlink();
        }
      }, delay);
    };

    scheduleBlink();

    return () => {
      isMounted = false;
      if (blinkTimer) clearTimeout(blinkTimer);
      if (blinkEndTimer) clearTimeout(blinkEndTimer);
    };
  }, [idleAnimations, shouldAnimate, currentExpression]);

  // Click handler with reaction
  const handleClick = useCallback(() => {
    if (!shouldAnimate) {
      onClick?.();
      return;
    }

    clickTimeoutRefs.current.forEach(clearTimeout);
    clickTimeoutRefs.current = [];

    setCurrentExpression("surprised");
    clickTimeoutRefs.current.push(setTimeout(() => setCurrentExpression("excited"), 300));
    clickTimeoutRefs.current.push(setTimeout(() => setCurrentExpression(expression), 1500));

    onClick?.();
  }, [expression, onClick, shouldAnimate]);

  const variants = expressionVariants[currentExpression];

  // Non-animated version
  if (!shouldAnimate) {
    return (
      <div
        ref={ref}
        className={cn("relative inline-flex items-center justify-center cursor-pointer", className)}
        style={{ width: container, height: container }}
        onClick={onClick}
        role="img"
        aria-label={ariaLabel}
      >
        <div
          className="rounded-full bg-secondary/20 border-4 border-secondary flex flex-col items-center justify-center gap-2"
          style={{ width: face, height: face }}
        >
          <div className="flex gap-2">
            <div className="bg-primary rounded-full" style={{ width: eyes, height: eyes }} />
            <div className="bg-primary rounded-full" style={{ width: eyes, height: eyes }} />
          </div>
          <div className="bg-primary rounded-full" style={{ width: mouth, height: mouth * 0.3 }} />
        </div>
      </div>
    );
  }

  return (
    <m.div
      ref={ref}
      className={cn(
        "relative inline-flex items-center justify-center cursor-pointer",
        onClick && "hover:scale-110 transition-transform",
        className
      )}
      style={{ width: container, height: container }}
      onClick={handleClick}
      variants={variants}
      initial="initial"
      animate="animate"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={getSpring(spring.rubbery)}
      role="img"
      aria-label={ariaLabel}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-secondary/30 blur-xl opacity-40" />

      {/* Face */}
      <m.div
        className="relative rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 border-4 border-secondary flex flex-col items-center justify-center shadow-lg"
        style={{ width: face, height: face, gap: face * 0.08 }}
      >
        {/* Blush */}
        {(currentExpression === "excited" || currentExpression === "celebrating") && (
          <>
            <m.div
              className="absolute rounded-full bg-primary/20"
              style={{
                width: face * 0.15,
                height: face * 0.08,
                left: face * 0.1,
                top: face * 0.45,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
            />
            <m.div
              className="absolute rounded-full bg-primary/20"
              style={{
                width: face * 0.15,
                height: face * 0.08,
                right: face * 0.1,
                top: face * 0.45,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
            />
          </>
        )}

        <Eyes expression={currentExpression} size={eyes} isBlinking={isBlinking} />
        <Mouth expression={currentExpression} size={mouth} />
      </m.div>

      <Accessories expression={currentExpression} size={face} />
    </m.div>
  );
});

export default BrandMascot;
