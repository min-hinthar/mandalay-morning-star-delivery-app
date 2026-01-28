"use client";

import { motion, MotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { getCategoryEmoji } from "@/components/ui/menu";
import { AnimatedImage } from "@/components/ui/animated-image";
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
export function CardImage({
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
      <motion.div
        className="absolute inset-0"
        style={{
          x: shouldAnimate && isHovered ? imageX : 0,
          y: shouldAnimate && isHovered ? imageY : 0,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        {imageUrl ? (
          <AnimatedImage
            src={imageUrl}
            alt={alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            variant="blur-scale"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-surface">
            <span className="text-5xl" role="img" aria-label={alt}>
              {getCategoryEmoji(categorySlug)}
            </span>
          </div>
        )}
      </motion.div>

      {/* Shine overlay - follows mouse during hover */}
      {shouldAnimate && isHovered && (
        <motion.div
          className={cn("absolute inset-0 pointer-events-none bg-gradient-card-shine", zClass.cardShine)}
          style={{
            left: shineX,
            top: shineY,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Gradient overlay for better text contrast if needed */}
      <div className="absolute inset-0 bg-gradient-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}

export default CardImage;
