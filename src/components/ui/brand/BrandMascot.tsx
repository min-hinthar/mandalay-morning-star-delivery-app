"use client";

import { useState, useEffect, useCallback, forwardRef } from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export type MascotExpression =
  | "happy"
  | "excited"
  | "thinking"
  | "celebrating"
  | "waving"
  | "sleeping"
  | "surprised"
  | "eating";

export type MascotSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface BrandMascotProps {
  /** Current expression */
  expression?: MascotExpression;
  /** Size variant */
  size?: MascotSize;
  /** Auto-cycle through expressions */
  autoCycle?: boolean;
  /** Cycle interval in ms */
  cycleInterval?: number;
  /** Enable idle animations (blink, bounce) */
  idleAnimations?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Trigger celebration animation */
  celebrate?: boolean;
  /** Additional className */
  className?: string;
  /** Accessible label */
  "aria-label"?: string;
}

// ============================================
// SIZE CONFIG
// ============================================

const sizeConfig: Record<MascotSize, { container: number; face: number; eyes: number; mouth: number }> = {
  xs: { container: 40, face: 32, eyes: 4, mouth: 8 },
  sm: { container: 60, face: 48, eyes: 6, mouth: 12 },
  md: { container: 100, face: 80, eyes: 10, mouth: 20 },
  lg: { container: 150, face: 120, eyes: 15, mouth: 30 },
  xl: { container: 200, face: 160, eyes: 20, mouth: 40 },
};

// ============================================
// EXPRESSION VARIANTS
// ============================================

const expressionVariants: Record<MascotExpression, Variants> = {
  happy: {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.02, 1],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
  },
  excited: {
    initial: { scale: 1, y: 0 },
    animate: {
      y: [0, -8, 0],
      scale: [1, 1.1, 1],
      transition: { duration: 0.5, repeat: Infinity, ease: "easeOut" },
    },
  },
  thinking: {
    initial: { rotate: 0 },
    animate: {
      rotate: [-5, 5, -5],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
  },
  celebrating: {
    initial: { scale: 1, rotate: 0 },
    animate: {
      scale: [1, 1.2, 0.9, 1.1, 1],
      rotate: [-10, 10, -10, 10, 0],
      transition: { duration: 1, repeat: Infinity },
    },
  },
  waving: {
    initial: { rotate: 0 },
    animate: {
      rotate: [0, 15, -5, 15, 0],
      transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
    },
  },
  sleeping: {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.03, 1],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
    },
  },
  surprised: {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.15, 1.1],
      transition: { duration: 0.3, ease: "easeOut" },
    },
  },
  eating: {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.05, 0.95, 1.05, 1],
      transition: { duration: 0.8, repeat: Infinity },
    },
  },
};

// ============================================
// FACE COMPONENTS
// ============================================

interface EyesProps {
  expression: MascotExpression;
  size: number;
  isBlinking: boolean;
}

function Eyes({ expression, size, isBlinking }: EyesProps) {
  const eyeSize = size;
  const eyeSpacing = size * 2.5;

  // Eye shape based on expression
  const getEyeStyle = () => {
    if (isBlinking || expression === "sleeping") {
      return { scaleY: 0.1, borderRadius: "50%" };
    }

    switch (expression) {
      case "excited":
      case "celebrating":
        return { scaleY: 1.2, scaleX: 1.2 };
      case "surprised":
        return { scaleY: 1.4, scaleX: 1.4 };
      case "thinking":
        return { scaleY: 0.8, x: size * 0.3 };
      case "eating":
        return { scaleY: 0.6 };
      default:
        return { scaleY: 1, scaleX: 1 };
    }
  };

  const eyeStyle = getEyeStyle();

  return (
    <div className="flex gap-1" style={{ gap: eyeSpacing }}>
      <motion.div
        className="bg-primary rounded-full"
        style={{ width: eyeSize, height: eyeSize }}
        animate={eyeStyle}
        transition={spring.snappy}
      />
      <motion.div
        className="bg-primary rounded-full"
        style={{ width: eyeSize, height: eyeSize }}
        animate={eyeStyle}
        transition={spring.snappy}
      />
    </div>
  );
}

interface MouthProps {
  expression: MascotExpression;
  size: number;
}

function Mouth({ expression, size }: MouthProps) {
  const mouthWidth = size;
  const mouthHeight = size * 0.6;

  // Mouth shape based on expression
  const getMouthPath = () => {
    switch (expression) {
      case "happy":
      case "waving":
        return (
          <motion.path
            d={`M0,${mouthHeight * 0.3} Q${mouthWidth / 2},${mouthHeight} ${mouthWidth},${mouthHeight * 0.3}`}
            stroke="currentColor"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
        );
      case "excited":
      case "celebrating":
        return (
          <motion.ellipse
            cx={mouthWidth / 2}
            cy={mouthHeight / 2}
            rx={mouthWidth * 0.4}
            ry={mouthHeight * 0.5}
            fill="currentColor"
            animate={{ ry: [mouthHeight * 0.5, mouthHeight * 0.6, mouthHeight * 0.5] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        );
      case "surprised":
        return (
          <motion.ellipse
            cx={mouthWidth / 2}
            cy={mouthHeight / 2}
            rx={mouthWidth * 0.25}
            ry={mouthHeight * 0.5}
            fill="currentColor"
            initial={{ ry: 0 }}
            animate={{ ry: mouthHeight * 0.5 }}
            transition={spring.rubbery}
          />
        );
      case "thinking":
        return (
          <motion.path
            d={`M${mouthWidth * 0.2},${mouthHeight * 0.5} Q${mouthWidth * 0.5},${mouthHeight * 0.3} ${mouthWidth * 0.8},${mouthHeight * 0.5}`}
            stroke="currentColor"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            animate={{ d: [
              `M${mouthWidth * 0.2},${mouthHeight * 0.5} Q${mouthWidth * 0.5},${mouthHeight * 0.3} ${mouthWidth * 0.8},${mouthHeight * 0.5}`,
              `M${mouthWidth * 0.2},${mouthHeight * 0.5} Q${mouthWidth * 0.5},${mouthHeight * 0.5} ${mouthWidth * 0.8},${mouthHeight * 0.5}`,
            ]}}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        );
      case "sleeping":
        return (
          <motion.path
            d={`M${mouthWidth * 0.2},${mouthHeight * 0.5} L${mouthWidth * 0.8},${mouthHeight * 0.5}`}
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          />
        );
      case "eating":
        return (
          <motion.ellipse
            cx={mouthWidth / 2}
            cy={mouthHeight / 2}
            rx={mouthWidth * 0.3}
            ry={mouthHeight * 0.4}
            fill="currentColor"
            animate={{
              ry: [mouthHeight * 0.4, mouthHeight * 0.2, mouthHeight * 0.4],
              rx: [mouthWidth * 0.3, mouthWidth * 0.35, mouthWidth * 0.3],
            }}
            transition={{ duration: 0.4, repeat: Infinity }}
          />
        );
      default:
        return (
          <motion.path
            d={`M0,${mouthHeight * 0.3} Q${mouthWidth / 2},${mouthHeight} ${mouthWidth},${mouthHeight * 0.3}`}
            stroke="currentColor"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
        );
    }
  };

  return (
    <svg
      width={mouthWidth}
      height={mouthHeight}
      viewBox={`0 0 ${mouthWidth} ${mouthHeight}`}
      className="text-primary"
    >
      {getMouthPath()}
    </svg>
  );
}

// ============================================
// ACCESSORIES (optional decorations)
// ============================================

interface AccessoriesProps {
  expression: MascotExpression;
  size: number;
}

function Accessories({ expression, size }: AccessoriesProps) {
  // Thinking bubbles
  if (expression === "thinking") {
    return (
      <div className="absolute -top-2 -right-2">
        <motion.div
          className="flex flex-col items-end gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-secondary/60"
            animate={{ y: [0, -3, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
          />
          <motion.div
            className="w-3 h-3 rounded-full bg-secondary/60"
            animate={{ y: [0, -2, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
          />
          <motion.div
            className="w-4 h-4 rounded-full bg-secondary/60"
            animate={{ y: [0, -2, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </div>
    );
  }

  // Sleeping Zs
  if (expression === "sleeping") {
    return (
      <div className="absolute -top-4 -right-4">
        <motion.div
          className="text-primary/60 font-bold"
          style={{ fontSize: size * 0.4 }}
          animate={{
            y: [0, -10, 0],
            opacity: [0, 1, 0],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          z
        </motion.div>
      </div>
    );
  }

  // Celebration sparkles
  if (expression === "celebrating") {
    return (
      <>
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-secondary"
            style={{
              top: `${-10 + Math.random() * 20}%`,
              left: `${80 + Math.random() * 30}%`,
              fontSize: size * 0.3,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          >
            ✨
          </motion.div>
        ))}
      </>
    );
  }

  // Waving hand
  if (expression === "waving") {
    return (
      <motion.div
        className="absolute -right-4 top-1/2 -translate-y-1/2"
        style={{ fontSize: size * 0.5 }}
        animate={{ rotate: [0, 20, -10, 20, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        👋
      </motion.div>
    );
  }

  return null;
}

// ============================================
// MAIN MASCOT COMPONENT
// ============================================

export const BrandMascot = forwardRef<HTMLDivElement, BrandMascotProps>(
  function BrandMascot(
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

    const { container, face, eyes, mouth } = sizeConfig[size];

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

      const blink = () => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
      };

      // Random blink interval (2-5 seconds)
      const scheduleBlink = () => {
        const delay = 2000 + Math.random() * 3000;
        return setTimeout(() => {
          blink();
          scheduleBlink();
        }, delay);
      };

      const timer = scheduleBlink();
      return () => clearTimeout(timer);
    }, [idleAnimations, shouldAnimate, currentExpression]);

    // Click handler with reaction
    const handleClick = useCallback(() => {
      if (!shouldAnimate) {
        onClick?.();
        return;
      }

      setCurrentExpression("surprised");
      setTimeout(() => setCurrentExpression("excited"), 300);
      setTimeout(() => setCurrentExpression(expression), 1500);

      onClick?.();
    }, [expression, onClick, shouldAnimate]);

    const variants = expressionVariants[currentExpression];

    // Non-animated version
    if (!shouldAnimate) {
      return (
        <div
          ref={ref}
          className={cn(
            "relative inline-flex items-center justify-center cursor-pointer",
            className
          )}
          style={{ width: container, height: container }}
          onClick={onClick}
          role="img"
          aria-label={ariaLabel}
        >
          {/* Face */}
          <div
            className="rounded-full bg-secondary/20 border-4 border-secondary flex flex-col items-center justify-center gap-2"
            style={{ width: face, height: face }}
          >
            {/* Eyes */}
            <div className="flex gap-2">
              <div
                className="bg-primary rounded-full"
                style={{ width: eyes, height: eyes }}
              />
              <div
                className="bg-primary rounded-full"
                style={{ width: eyes, height: eyes }}
              />
            </div>
            {/* Simple mouth */}
            <div
              className="bg-primary rounded-full"
              style={{ width: mouth, height: mouth * 0.3 }}
            />
          </div>
        </div>
      );
    }

    return (
      <motion.div
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
        <motion.div
          className="absolute inset-0 rounded-full bg-secondary/30 blur-xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Face */}
        <motion.div
          className="relative rounded-full bg-gradient-to-br from-secondary/30 to-secondary/10 border-4 border-secondary flex flex-col items-center justify-center shadow-lg"
          style={{ width: face, height: face, gap: face * 0.08 }}
        >
          {/* Blush */}
          {(currentExpression === "excited" || currentExpression === "celebrating") && (
            <>
              <motion.div
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
              <motion.div
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

          {/* Eyes */}
          <Eyes expression={currentExpression} size={eyes} isBlinking={isBlinking} />

          {/* Mouth */}
          <Mouth expression={currentExpression} size={mouth} />
        </motion.div>

        {/* Accessories */}
        <Accessories expression={currentExpression} size={face} />
      </motion.div>
    );
  }
);

export default BrandMascot;
