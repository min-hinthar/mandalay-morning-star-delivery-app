"use client";

import { memo, useState, useEffect, useCallback } from "react";
import { motion, MotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { getCategoryEmoji } from "../EmojiPlaceholder";
import { zClass } from "@/lib/design-system/tokens/z-index";

// Max retries for rate-limited images (e.g., Google Drive)
const MAX_RETRIES = 3;
// Base delay in ms (doubles each retry: 1s, 2s, 4s)
const BASE_RETRY_DELAY = 1000;

// ============================================
// TYPES
// ============================================

export interface CardImageProps {
  /** Image URL */
  imageUrl: string | null;
  /** Alt text for image */
  alt: string;
  /** Mouse X position (0-1 normalized) for parallax */
  mouseX: MotionValue<number>;
  /** Mouse Y position (0-1 normalized) for parallax */
  mouseY: MotionValue<number>;
  /** Whether card is hovered */
  isHovered: boolean;
  /** Category slug for emoji fallback */
  categorySlug?: string;
  /** Priority loading for above-fold images */
  priority?: boolean;
  /** Aspect ratio class */
  aspectClass?: string;
  /** Border radius for top corners */
  roundedTop?: string;
  /** Additional className */
  className?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * CardImage - Image with parallax effect and shine overlay
 *
 * Receives normalized mouse position for subtle image parallax.
 * Contains shine overlay that follows mouse position during hover.
 */
export const CardImage = memo(function CardImage({
  imageUrl,
  alt,
  mouseX,
  mouseY,
  isHovered,
  categorySlug,
  priority = false,
  aspectClass = "aspect-[4/3]",
  roundedTop = "rounded-t-3xl",
  className,
}: CardImageProps) {
  const { shouldAnimate } = useAnimationPreference();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retryKey, setRetryKey] = useState(0);

  // Retry failed images with exponential backoff (handles Google Drive rate limiting)
  const handleError = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      const delay = BASE_RETRY_DELAY * Math.pow(2, retryCount);
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        setRetryKey((prev) => prev + 1);
      }, delay);
    } else {
      setHasError(true);
    }
  }, [retryCount]);

  // Reset state when imageUrl changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setRetryCount(0);
    setRetryKey(0);
  }, [imageUrl]);

  // Parallax transforms (+-10px)
  const imageX = useTransform(mouseX, [0, 1], [-10, 10]);
  const imageY = useTransform(mouseY, [0, 1], [-10, 10]);

  // Shine position follows mouse
  const shineX = useTransform(mouseX, [0, 1], ["-100%", "200%"]);
  const shineY = useTransform(mouseY, [0, 1], ["-100%", "200%"]);

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        aspectClass,
        roundedTop,
        "bg-surface-secondary",
        className
      )}
    >
      {/* Shimmer placeholder - shows until image loads or during retry */}
      {imageUrl && !isLoaded && !hasError && (
        <div className="absolute inset-0 bg-surface-tertiary animate-pulse">
          {retryCount > 0 && (
            <div className="absolute bottom-2 right-2 text-xs text-text-muted opacity-50">
              Retry {retryCount}/{MAX_RETRIES}
            </div>
          )}
        </div>
      )}

      {/* Image with parallax */}
      <motion.div
        className="absolute inset-0"
        style={{
          x: shouldAnimate && isHovered ? imageX : 0,
          y: shouldAnimate && isHovered ? imageY : 0,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        {imageUrl && !hasError ? (
          /* Plain img tag like cart drawer - reliable across all devices and URL types */
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={retryKey}
            src={imageUrl}
            alt={alt}
            className={cn(
              "w-full h-full object-cover",
              "transition-opacity duration-150",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
            loading={priority ? "eager" : "lazy"}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onLoad={() => setIsLoaded(true)}
            onError={handleError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-surface">
            <span className="text-5xl" role="img" aria-label={alt}>
              {getCategoryEmoji(categorySlug)}
            </span>
          </div>
        )}
      </motion.div>

      {/* Shine overlay - follows mouse during hover (desktop) */}
      {shouldAnimate && isHovered && (
        <motion.div
          className={cn(
            "absolute pointer-events-none bg-gradient-card-shine",
            "w-[150%] h-[150%]",
            zClass.cardShine
          )}
          style={{
            x: shineX,
            y: shineY,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Touch device shine removed - was obscuring photos on mobile */}

      {/* Gradient overlay for better text contrast if needed */}
      <div className="absolute inset-0 bg-gradient-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
});

export default CardImage;
