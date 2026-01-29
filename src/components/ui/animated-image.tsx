"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

// ============================================
// TYPES
// ============================================

export type ImageRevealVariant = "blur" | "fade" | "scale" | "blur-scale";

export interface AnimatedImageProps extends Omit<ImageProps, "onLoad"> {
  /** Reveal animation variant */
  variant?: ImageRevealVariant;
  /** Delay before animation starts (seconds) */
  delay?: number;
  /** Custom blur amount for blur variants (default: 20) */
  blurAmount?: number;
  /** Whether to animate on viewport enter (default: true) */
  animateOnView?: boolean;
}

// ============================================
// ANIMATED IMAGE
// ============================================

/**
 * Image with blur-to-sharp + scale reveal animation
 *
 * Features:
 * - Multiple variants: blur, fade, scale, blur-scale (default)
 * - Configurable blur amount
 * - Optional animate-on-viewport-enter
 * - Works with next/image for optimization
 * - Respects animation preference
 *
 * @example
 * <AnimatedImage
 *   src="/hero.jpg"
 *   alt="Hero image"
 *   width={800}
 *   height={600}
 *   variant="blur-scale"
 * />
 */
export function AnimatedImage({
  variant = "blur-scale",
  delay = 0,
  blurAmount = 20,
  animateOnView = true,
  className,
  alt,
  ...imageProps
}: AnimatedImageProps) {
  const { shouldAnimate } = useAnimationPreference();
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  // No animation - render plain image
  if (!shouldAnimate) {
    return (
      <Image
        className={className}
        alt={alt}
        onLoad={handleLoad}
        {...imageProps}
      />
    );
  }

  // Build variants based on type
  const includesBlur = variant.includes("blur");
  const includesScale = variant.includes("scale");

  // Framer Motion requires numeric blur values for interpolation between states
  /* eslint-disable no-restricted-syntax -- FM animation needs numeric blur for interpolation */
  const customVariants = {
    hidden: {
      ...(includesBlur && { filter: `blur(${blurAmount}px)` }),
      ...(includesScale && { scale: 1.1 }),
      opacity: 0,
    },
    visible: {
      filter: "blur(0px)",
      scale: 1,
      opacity: 1,
    },
  };
  /* eslint-enable no-restricted-syntax */

  return (
    <motion.div
      className={cn("overflow-hidden", className)}
      initial="hidden"
      animate={isLoaded ? "visible" : "hidden"}
      whileInView={animateOnView ? "visible" : undefined}
      viewport={animateOnView ? { once: true, margin: "-50px" } : undefined}
      variants={customVariants}
      transition={{
        ...spring.gentle,
        delay,
        filter: { duration: 0.4, ease: "easeOut" },
      }}
    >
      <Image
        className="w-full h-full object-cover"
        alt={alt}
        onLoad={handleLoad}
        {...imageProps}
      />
    </motion.div>
  );
}

// ============================================
// LAZY ANIMATED IMAGE
// ============================================

export interface LazyAnimatedImageProps extends AnimatedImageProps {
  /** Base64 blur data URL for placeholder */
  blurDataURL?: string;
  /** Placeholder type for next/image */
  placeholder?: "blur" | "empty";
}

/**
 * Lazy-loaded image with placeholder blur
 * Uses next/image built-in blur placeholder + animated reveal
 *
 * @example
 * <LazyAnimatedImage
 *   src="/product.jpg"
 *   alt="Product"
 *   width={400}
 *   height={300}
 *   placeholder="blur"
 *   blurDataURL="data:image/jpeg;base64,..."
 * />
 */
export function LazyAnimatedImage({
  className,
  blurDataURL,
  placeholder = "blur",
  alt,
  ...props
}: LazyAnimatedImageProps) {
  const { shouldAnimate } = useAnimationPreference();
  const [isLoaded, setIsLoaded] = useState(false);

  if (!shouldAnimate) {
    return (
      <Image
        className={className}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
    );
  }

  return (
    <motion.div
      className={cn("relative overflow-hidden", className)}
      initial={{ opacity: 0, scale: 1.05 }}
      animate={isLoaded ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.05 }}
      transition={spring.gentle}
    >
      <Image
        className="w-full h-full object-cover"
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
    </motion.div>
  );
}

export default AnimatedImage;
