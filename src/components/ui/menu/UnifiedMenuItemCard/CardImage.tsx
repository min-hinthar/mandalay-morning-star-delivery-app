"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { m, MotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { getCategoryEmoji } from "../EmojiPlaceholder";
import { zClass } from "@/lib/design-system/tokens/z-index";

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
  const [hasError, setHasError] = useState(false);

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
      {/* Image with parallax */}
      <m.div
        className="absolute inset-0"
        style={{
          x: shouldAnimate && isHovered ? imageX : 0,
          y: shouldAnimate && isHovered ? imageY : 0,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        {imageUrl && !hasError ? (
          <Image
            src={imageUrl}
            alt={alt}
            fill
            className="object-cover"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-surface">
            <span className="text-5xl" role="img" aria-label={alt}>
              {getCategoryEmoji(categorySlug)}
            </span>
          </div>
        )}
      </m.div>

      {/* Shine overlay - follows mouse during hover (desktop) */}
      {shouldAnimate && isHovered && (
        <m.div
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
