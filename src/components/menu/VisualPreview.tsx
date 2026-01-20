"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { v7Spring } from "@/lib/motion-tokens-v7";
import { useAnimationPreferenceV7 } from "@/lib/hooks/useAnimationPreferenceV7";
import type { MenuItem, ModifierOption } from "@/types/menu";

// ============================================
// TYPES
// ============================================

export interface VisualPreviewProps {
  /** Menu item being previewed */
  item: MenuItem;
  /** Currently selected modifier options */
  selectedModifiers: ModifierOption[];
  /** Additional className */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Enable Ken Burns effect */
  kenBurns?: boolean;
}

// ============================================
// INGREDIENT LAYER COMPONENT
// ============================================

interface IngredientLayerProps {
  modifier: ModifierOption;
  index: number;
  total: number;
}

function IngredientLayer({ modifier, index, total }: IngredientLayerProps) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();

  // Calculate position offset for layering effect
  const offset = (index - (total - 1) / 2) * 4;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={shouldAnimate ? { opacity: 0, scale: 0.5, y: 20 } : undefined}
      animate={
        shouldAnimate
          ? {
              opacity: 1,
              scale: 1,
              y: offset,
              x: offset * 0.5,
            }
          : undefined
      }
      exit={shouldAnimate ? { opacity: 0, scale: 0.5, y: -20 } : undefined}
      transition={{
        ...getSpring(v7Spring.rubbery),
        delay: index * 0.1,
      }}
    >
      {/* Modifier visual representation */}
      <motion.div
        className={cn(
          "px-3 py-1.5 rounded-full",
          "bg-v6-secondary/80 backdrop-blur-sm",
          "text-xs font-medium text-v6-text-primary",
          "shadow-lg shadow-v6-secondary/20"
        )}
        whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
      >
        +{modifier.name}
      </motion.div>
    </motion.div>
  );
}

// ============================================
// MODIFIER BADGE
// ============================================

interface ModifierBadgeProps {
  modifier: ModifierOption;
  index: number;
}

function ModifierBadge({ modifier, index }: ModifierBadgeProps) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();

  return (
    <motion.span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full",
        "bg-white/90 backdrop-blur-sm",
        "text-xs font-medium text-v6-text-primary",
        "shadow-md"
      )}
      initial={shouldAnimate ? { opacity: 0, scale: 0.8, x: -10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, scale: 1, x: 0 } : undefined}
      exit={shouldAnimate ? { opacity: 0, scale: 0.8, x: 10 } : undefined}
      transition={{
        ...getSpring(v7Spring.snappy),
        delay: index * 0.05,
      }}
    >
      {modifier.name}
    </motion.span>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function VisualPreview({
  item,
  selectedModifiers,
  className,
  size = "md",
  kenBurns = true,
}: VisualPreviewProps) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();

  // Size configurations
  const sizeConfig = useMemo(
    () => ({
      sm: { container: "h-32 w-32", image: "w-24 h-24" },
      md: { container: "h-48 w-48", image: "w-40 h-40" },
      lg: { container: "h-64 w-64", image: "w-56 h-56" },
    }),
    []
  );

  const config = sizeConfig[size];

  // Ken Burns animation variants
  const kenBurnsVariants = {
    initial: { scale: 1, x: 0, y: 0 },
    animate: {
      scale: [1, 1.05, 1.02, 1.05, 1],
      x: [0, 5, -3, 2, 0],
      y: [0, -3, 5, -2, 0],
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: "linear" as const,
      },
    },
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center",
        className
      )}
    >
      {/* Main preview container */}
      <motion.div
        className={cn(
          "relative rounded-full overflow-hidden",
          "bg-gradient-to-br from-v6-surface-secondary to-v6-surface-primary",
          "shadow-xl",
          config.container
        )}
        initial={shouldAnimate ? { scale: 0.9, opacity: 0 } : undefined}
        animate={shouldAnimate ? { scale: 1, opacity: 1 } : undefined}
        transition={getSpring(v7Spring.rubbery)}
      >
        {/* Base item image with Ken Burns */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          variants={kenBurns && shouldAnimate ? kenBurnsVariants : undefined}
          initial="initial"
          animate={kenBurns && shouldAnimate ? "animate" : "initial"}
        >
          {item.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element -- Menu item preview with Ken Burns */
            <img
              src={item.imageUrl}
              alt={item.nameEn}
              className={cn("object-cover rounded-full", config.image)}
              loading="lazy"
            />
          ) : (
            <div
              className={cn(
                "flex items-center justify-center text-6xl",
                config.image
              )}
            >
              🍜
            </div>
          )}
        </motion.div>

        {/* Ingredient layers */}
        <AnimatePresence>
          {selectedModifiers.slice(0, 5).map((modifier, index) => (
            <IngredientLayer
              key={modifier.id}
              modifier={modifier}
              index={index}
              total={Math.min(selectedModifiers.length, 5)}
            />
          ))}
        </AnimatePresence>

        {/* Glow effect when modifiers selected */}
        <AnimatePresence>
          {selectedModifiers.length > 0 && shouldAnimate && (
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                boxShadow: `
                  0 0 30px rgba(235, 205, 0, 0.3),
                  0 0 60px rgba(164, 16, 52, 0.2)
                `,
              }}
            />
          )}
        </AnimatePresence>

        {/* Pulse ring on change */}
        <AnimatePresence>
          {selectedModifiers.length > 0 && shouldAnimate && (
            <motion.div
              key={selectedModifiers.length}
              className="absolute inset-0 rounded-full border-2 border-v6-secondary"
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 1.3, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Modifier badges below preview */}
      <AnimatePresence mode="popLayout">
        {selectedModifiers.length > 0 && (
          <motion.div
            className="mt-4 flex flex-wrap gap-2 justify-center max-w-[200px]"
            initial={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
            exit={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
            transition={getSpring(v7Spring.snappy)}
          >
            {selectedModifiers.map((modifier, index) => (
              <ModifierBadge key={modifier.id} modifier={modifier} index={index} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item name */}
      <motion.p
        className="mt-3 text-center font-v6-display font-semibold text-v6-text-primary"
        initial={shouldAnimate ? { opacity: 0 } : undefined}
        animate={shouldAnimate ? { opacity: 1 } : undefined}
        transition={{ delay: 0.2 }}
      >
        {item.nameEn}
        {selectedModifiers.length > 0 && (
          <motion.span
            className="text-v6-text-muted font-normal text-sm block"
            initial={shouldAnimate ? { opacity: 0 } : undefined}
            animate={shouldAnimate ? { opacity: 1 } : undefined}
          >
            with {selectedModifiers.length} customization
            {selectedModifiers.length !== 1 ? "s" : ""}
          </motion.span>
        )}
      </motion.p>
    </div>
  );
}

export default VisualPreview;
