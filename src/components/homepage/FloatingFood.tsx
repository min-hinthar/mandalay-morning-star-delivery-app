"use client";

import { useRef, useEffect, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

// ============================================
// TYPES
// ============================================

// Local stacking context - intentionally using small numbers (1-4)
// for relative layering within this component. Do NOT migrate to
// global z-index tokens as these are not global layers.

export interface FoodItem {
  /** Unique identifier */
  id: string;
  /** Image source or emoji */
  src?: string;
  /** Emoji fallback if no image */
  emoji?: string;
  /** Alt text for accessibility */
  alt: string;
  /** Size in pixels */
  size?: number;
  /** Initial position (percentage 0-100) */
  position: { x: number; y: number };
  /** Z-index for layering (local stacking context, 1-4 range) */
  zIndex?: number;
  /** Float amplitude (how much it moves) */
  amplitude?: number;
  /** Float speed multiplier */
  speed?: number;
  /** Rotation range in degrees */
  rotationRange?: number;
}

export interface FloatingFoodProps {
  /** Array of food items to display */
  items: FoodItem[];
  /** Container className */
  className?: string;
  /** Enable mouse parallax effect */
  mouseParallax?: boolean;
  /** Mouse parallax intensity (0-1) */
  parallaxIntensity?: number;
  /** Disable on mobile for performance */
  disableOnMobile?: boolean;
}

// ============================================
// DEFAULT FOOD ITEMS (Burmese dishes)
// ============================================

/* eslint-disable no-restricted-syntax -- Local stacking context uses small zIndex values (1-4) for relative layering within this component */
export const defaultFoodItems: FoodItem[] = [
  {
    id: "mohinga",
    emoji: "🍜",
    alt: "Mohinga - Burmese fish noodle soup",
    size: 80,
    position: { x: 10, y: 20 },
    zIndex: 2,
    amplitude: 20,
    speed: 1,
    rotationRange: 15,
  },
  {
    id: "tea-leaf",
    emoji: "🥗",
    alt: "Lahpet Thoke - Tea leaf salad",
    size: 60,
    position: { x: 85, y: 15 },
    zIndex: 3,
    amplitude: 25,
    speed: 0.8,
    rotationRange: 10,
  },
  {
    id: "samosa",
    emoji: "🥟",
    alt: "Samosa - Burmese style",
    size: 50,
    position: { x: 75, y: 60 },
    zIndex: 1,
    amplitude: 15,
    speed: 1.2,
    rotationRange: 20,
  },
  {
    id: "noodles",
    emoji: "🍝",
    alt: "Shan noodles",
    size: 70,
    position: { x: 15, y: 70 },
    zIndex: 2,
    amplitude: 18,
    speed: 0.9,
    rotationRange: 12,
  },
  {
    id: "rice",
    emoji: "🍚",
    alt: "Steamed rice",
    size: 45,
    position: { x: 90, y: 40 },
    zIndex: 1,
    amplitude: 12,
    speed: 1.1,
    rotationRange: 8,
  },
  {
    id: "curry",
    emoji: "🍛",
    alt: "Burmese curry",
    size: 65,
    position: { x: 5, y: 45 },
    zIndex: 2,
    amplitude: 22,
    speed: 0.7,
    rotationRange: 18,
  },
];
/* eslint-enable no-restricted-syntax */

// ============================================
// FLOATING FOOD ITEM COMPONENT
// ============================================

interface FloatingFoodItemProps {
  item: FoodItem;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  mouseY: ReturnType<typeof useMotionValue<number>>;
  mouseParallax: boolean;
  parallaxIntensity: number;
  shouldAnimate: boolean;
}

// Simple deterministic hash function to get consistent values between server and client
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function FloatingFoodItem({
  item,
  mouseX,
  mouseY,
  mouseParallax,
  parallaxIntensity,
  shouldAnimate,
}: FloatingFoodItemProps) {
  const {
    id,
    src,
    emoji,
    alt,
    size = 60,
    position,
    zIndex = 1,
    amplitude = 20,
    speed = 1,
    rotationRange = 15,
  } = item;

  // Deterministic phase offset based on item ID to ensure consistent values between server and client
  // This prevents hydration mismatch caused by Math.random()
  const phaseOffset = useMemo(() => (hashString(id) % 1000) / 1000 * Math.PI * 2, [id]);
  const phaseOffsetY = useMemo(() => (hashString(id + "-y") % 1000) / 1000 * Math.PI * 2, [id]);

  // Use motion values instead of useState to avoid re-renders on every frame
  const floatY = useMotionValue(0);
  const floatX = useMotionValue(0);
  const rotation = useMotionValue(0);

  // Mouse parallax transforms
  const parallaxX = useTransform(
    mouseX,
    [0, 1],
    [-parallaxIntensity * 30 * (zIndex / 3), parallaxIntensity * 30 * (zIndex / 3)]
  );
  const parallaxY = useTransform(
    mouseY,
    [0, 1],
    [-parallaxIntensity * 20 * (zIndex / 3), parallaxIntensity * 20 * (zIndex / 3)]
  );

  const springX = useSpring(parallaxX, { stiffness: 50, damping: 20 });
  const springY = useSpring(parallaxY, { stiffness: 50, damping: 20 });

  // Physics-based floating animation using motion values (no re-renders)
  useEffect(() => {
    if (!shouldAnimate) return;

    let animationId: number;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const baseSpeed = 0.5 * speed;

      // Smooth sine wave floating - update motion values directly (no setState)
      floatY.set(Math.sin(elapsed * baseSpeed + phaseOffset) * amplitude);
      floatX.set(Math.cos(elapsed * baseSpeed * 0.7 + phaseOffsetY) * (amplitude * 0.3));
      rotation.set(Math.sin(elapsed * baseSpeed * 0.5 + phaseOffset) * rotationRange);

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [shouldAnimate, amplitude, speed, rotationRange, phaseOffset, phaseOffsetY, floatY, floatX, rotation]);

  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        zIndex,
        x: mouseParallax ? springX : 0,
        y: mouseParallax ? springY : 0,
        translateY: floatY,
        translateX: floatX,
        rotate: rotation,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        opacity: { duration: 0.6, delay: (hashString(id) % 500) / 1000 },
        scale: { ...spring.rubbery, delay: (hashString(id) % 500) / 1000 },
      }}
    >
      {src ? (
        /* eslint-disable-next-line @next/next/no-img-element -- Food image used in parallax animation */
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="drop-shadow-lg"
          style={{ width: size, height: size, objectFit: "contain" }}
          loading="lazy"
        />
      ) : (
        <span
          className="drop-shadow-lg"
          style={{ fontSize: size * 0.8 }}
          role="img"
          aria-label={alt}
        >
          {emoji}
        </span>
      )}
    </motion.div>
  );
}

// ============================================
// MAIN FLOATING FOOD COMPONENT
// ============================================

export function FloatingFood({
  items = defaultFoodItems,
  className,
  mouseParallax = true,
  parallaxIntensity = 0.5,
  disableOnMobile = true,
}: FloatingFoodProps) {
  const { shouldAnimate } = useAnimationPreference();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse position for parallax (normalized 0-1)
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  // Track mouse movement
  useEffect(() => {
    if (!mouseParallax || !shouldAnimate || (disableOnMobile && isMobile)) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      mouseX.set(Math.max(0, Math.min(1, x)));
      mouseY.set(Math.max(0, Math.min(1, y)));
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseParallax, shouldAnimate, disableOnMobile, isMobile, mouseX, mouseY]);

  // Disable on mobile if requested
  if (disableOnMobile && isMobile) {
    return null;
  }

  // Show static items if animations disabled
  if (!shouldAnimate) {
    return (
      <div ref={containerRef} className={cn("absolute inset-0 overflow-hidden", className)}>
        {items.map((item) => (
          <div
            key={item.id}
            className="absolute"
            style={{
              left: `${item.position.x}%`,
              top: `${item.position.y}%`,
              zIndex: item.zIndex ?? 1,
            }}
          >
            {item.src ? (
              /* eslint-disable-next-line @next/next/no-img-element -- Decorative floating food image */
              <img
                src={item.src}
                alt={item.alt}
                width={item.size ?? 60}
                height={item.size ?? 60}
                className="drop-shadow-lg opacity-50"
                style={{ width: item.size ?? 60, height: item.size ?? 60 }}
              />
            ) : (
              <span
                className="drop-shadow-lg opacity-50"
                style={{ fontSize: (item.size ?? 60) * 0.8 }}
                role="img"
                aria-label={item.alt}
              >
                {item.emoji}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}
    >
      {items.map((item) => (
        <FloatingFoodItem
          key={item.id}
          item={item}
          mouseX={mouseX}
          mouseY={mouseY}
          mouseParallax={mouseParallax && !isMobile}
          parallaxIntensity={parallaxIntensity}
          shouldAnimate={shouldAnimate}
        />
      ))}
    </div>
  );
}

export default FloatingFood;
