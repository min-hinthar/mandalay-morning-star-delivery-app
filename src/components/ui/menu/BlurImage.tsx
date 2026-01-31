"use client";

import React, { useState, useCallback } from "react";
import Image, { type ImageProps } from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { getPlaceholderBlur, getImageProps } from "@/lib/utils/image-optimization";
import { spring, duration } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export interface BlurImageProps extends Omit<ImageProps, "placeholder" | "blurDataURL"> {
  /** Placeholder color for blur effect */
  placeholderColor?: string;
  /** Whether to show loading shimmer */
  showShimmer?: boolean;
  /** Aspect ratio for container (e.g., "16/9", "1/1") */
  aspectRatio?: string;
  /** Additional className for container */
  containerClassName?: string;
}

// ============================================
// ANIMATION VARIANTS
// ============================================

// Bound shimmer to 10 cycles - images should load quickly
const shimmerVariants = {
  shimmer: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: {
      duration: 1.5,
      repeat: 10,
      ease: "linear" as const,
    },
  },
};

// ============================================
// MAIN COMPONENT
// ============================================

export function BlurImage({
  src,
  alt,
  className,
  containerClassName,
  placeholderColor = "#f5f5f0",
  showShimmer = true,
  aspectRatio,
  onLoad,
  ...props
}: BlurImageProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const springConfig = getSpring(spring.gentle);
  const blurDataURL = getPlaceholderBlur(placeholderColor);

  const handleLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      setIsLoaded(true);
      onLoad?.(event);
    },
    [onLoad]
  );

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
  }, []);

  // Don't render if there's an error (let parent handle fallback)
  if (hasError) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        aspectRatio && `aspect-[${aspectRatio}]`,
        containerClassName
      )}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Shimmer loading effect */}
      <AnimatePresence>
        {showShimmer && !isLoaded && shouldAnimate && (
          <motion.div
            className={cn(
              "absolute inset-0 z-10",
              "bg-gradient-to-r from-transparent via-white/20 to-transparent",
              "bg-[length:200%_100%]"
            )}
            style={{ backgroundColor: placeholderColor }}
            variants={shimmerVariants}
            animate="shimmer"
            exit={{ opacity: 0 }}
            transition={{ duration: duration.fast }}
          />
        )}
      </AnimatePresence>

      {/* Static placeholder for non-shimmer */}
      {!showShimmer && !isLoaded && (
        <div
          className="absolute inset-0 z-10"
          style={{ backgroundColor: placeholderColor }}
        />
      )}

      {/* Actual image */}
      <motion.div
        className="relative w-full h-full"
        initial={shouldAnimate ? { opacity: 0, scale: 1.05 } : undefined}
        animate={
          isLoaded && shouldAnimate
            ? { opacity: 1, scale: 1 }
            : shouldAnimate
              ? { opacity: 0 }
              : undefined
        }
        transition={springConfig}
      >
        <Image
          src={src}
          alt={alt}
          className={cn("object-cover", className)}
          placeholder="blur"
          blurDataURL={blurDataURL}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      </motion.div>
    </div>
  );
}

// ============================================
// PRESET VARIANTS
// ============================================

/**
 * BlurImage preset for menu cards (16:9)
 */
export function BlurImageMenuCard(
  props: Omit<BlurImageProps, "width" | "height" | "sizes">
) {
  const imageProps = getImageProps("menuCard");

  return (
    <BlurImage
      {...imageProps}
      aspectRatio="16/9"
      {...props}
    />
  );
}

/**
 * BlurImage preset for cart items (1:1)
 */
export function BlurImageCartItem(
  props: Omit<BlurImageProps, "width" | "height" | "sizes">
) {
  const imageProps = getImageProps("cartItem");

  return (
    <BlurImage
      {...imageProps}
      aspectRatio="1/1"
      {...props}
    />
  );
}

export default BlurImage;
