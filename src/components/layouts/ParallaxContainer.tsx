"use client";

import React, { useRef, useMemo, type ReactNode, type CSSProperties } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
  type MotionStyle,
} from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { parallaxPresets } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

// ============================================
// TYPES
// ============================================

export type ParallaxSpeed = "background" | "far" | "mid" | "near" | "foreground" | "content" | number;

export interface ParallaxContainerProps {
  children: ReactNode;
  /** Container height (use viewport-relative units) */
  height?: string | number;
  /** Enable overflow visible for elements that extend beyond container */
  overflowVisible?: boolean;
  /** Additional class names */
  className?: string;
  /** Custom style */
  style?: CSSProperties;
}

export interface ParallaxLayerProps {
  children: ReactNode;
  /** Parallax speed (preset name or custom 0-1 value) */
  speed?: ParallaxSpeed;
  /** Custom Y offset range [start, end] in pixels */
  yRange?: [number, number];
  /** Custom X offset range [start, end] in pixels */
  xRange?: [number, number];
  /** Scale range [start, end] */
  scaleRange?: [number, number];
  /** Opacity range [start, end] */
  opacityRange?: [number, number];
  /** Rotation range [start, end] in degrees */
  rotateRange?: [number, number];
  /** Z-index for stacking */
  zIndex?: number;
  /** Additional class names */
  className?: string;
  /** Disable on mobile for performance */
  disableOnMobile?: boolean;
  /** Spring smoothing (0 = no smoothing, 1 = max smoothing) */
  smoothing?: number;
}

export interface ParallaxImageProps extends Omit<ParallaxLayerProps, "children"> {
  src: string;
  alt: string;
  /** Object fit */
  objectFit?: "cover" | "contain" | "fill";
  /** Object position */
  objectPosition?: string;
  /** Add Ken Burns effect (slow zoom) */
  kenBurns?: boolean;
  /** Overlay color (use rgba) */
  overlay?: string;
}

export interface ParallaxTextProps extends Omit<ParallaxLayerProps, "children"> {
  children: ReactNode;
  /** Text alignment */
  align?: "left" | "center" | "right";
  /** Add text shadow for readability */
  shadow?: boolean;
}

// ============================================
// CONTEXT
// ============================================

interface ParallaxContextValue {
  scrollYProgress: MotionValue<number>;
  isEnabled: boolean;
}

const ParallaxContext = React.createContext<ParallaxContextValue | null>(null);

function useParallaxContext() {
  const context = React.useContext(ParallaxContext);
  if (!context) {
    throw new Error("ParallaxLayer must be used within a ParallaxContainer");
  }
  return context;
}

// ============================================
// HELPER: Get speed factor from preset or number
// ============================================

function getSpeedFactor(speed: ParallaxSpeed): number {
  if (typeof speed === "number") {
    return Math.max(0, Math.min(1, speed));
  }
  return parallaxPresets[speed]?.speedFactor ?? 0.5;
}

// ============================================
// PARALLAX CONTAINER
// ============================================

export function ParallaxContainer({
  children,
  height = "100vh",
  overflowVisible = false,
  className,
  style,
}: ParallaxContainerProps) {
  const { shouldAnimate } = useAnimationPreference();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Reduce or disable parallax on mobile for performance
  const isEnabled = shouldAnimate && !isMobile;

  // Memoize context value to prevent re-renders
  const contextValue = useMemo(() => ({
    scrollYProgress,
    isEnabled,
  }), [scrollYProgress, isEnabled]);

  return (
    <ParallaxContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={cn(
          "relative",
          overflowVisible ? "overflow-visible" : "overflow-hidden",
          className
        )}
        style={{
          height: typeof height === "number" ? `${height}px` : height,
          ...style,
        }}
      >
        {children}
      </div>
    </ParallaxContext.Provider>
  );
}

// ============================================
// PARALLAX LAYER
// ============================================

export function ParallaxLayer({
  children,
  speed = "mid",
  yRange,
  xRange,
  scaleRange,
  opacityRange,
  rotateRange,
  zIndex = 0,
  className,
  disableOnMobile = true,
  smoothing = 0.5,
}: ParallaxLayerProps) {
  const { scrollYProgress, isEnabled } = useParallaxContext();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const speedFactor = getSpeedFactor(speed);

  // Calculate default Y range based on speed
  const defaultYRange: [number, number] = [
    -100 * speedFactor,
    100 * speedFactor,
  ];

  // Apply spring smoothing config
  const springConfig = {
    stiffness: 100 * (1 - smoothing) + 50,
    damping: 30,
    mass: 0.5 + smoothing * 0.5,
  };

  // Default identity ranges (no movement when range not specified)
  const defaultIdentityRange: [number, number] = [0, 0];
  const defaultScaleRange: [number, number] = [1, 1];
  const defaultOpacityRange: [number, number] = [1, 1];

  // Create transforms - always call hooks unconditionally
  const rawY = useTransform(scrollYProgress, [0, 1], yRange ?? defaultYRange);
  const rawX = useTransform(scrollYProgress, [0, 1], xRange ?? defaultIdentityRange);
  const rawScale = useTransform(scrollYProgress, [0, 1], scaleRange ?? defaultScaleRange);
  const rawOpacity = useTransform(scrollYProgress, [0, 1], opacityRange ?? defaultOpacityRange);
  const rawRotate = useTransform(scrollYProgress, [0, 1], rotateRange ?? defaultIdentityRange);

  // Apply spring smoothing - always call hooks unconditionally
  const y = useSpring(rawY, springConfig);
  const x = useSpring(rawX, springConfig);
  const scale = useSpring(rawScale, springConfig);
  const opacity = useSpring(rawOpacity, springConfig);
  const rotate = useSpring(rawRotate, springConfig);

  // Disable parallax on mobile if requested
  const shouldDisable = disableOnMobile && isMobile;
  const effectivelyEnabled = isEnabled && !shouldDisable;

  const motionStyle: MotionStyle = effectivelyEnabled
    ? {
        y,
        x,
        scale,
        opacity,
        rotate,
        willChange: "transform",
      }
    : {};

  return (
    <motion.div
      className={cn("absolute inset-0", className)}
      style={{
        zIndex,
        ...motionStyle,
      }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// PARALLAX IMAGE
// ============================================

export function ParallaxImage({
  src,
  alt,
  objectFit = "cover",
  objectPosition = "center",
  kenBurns = false,
  overlay,
  speed = "background",
  className,
  ...layerProps
}: ParallaxImageProps) {
  const { shouldAnimate } = useAnimationPreference();

  return (
    <ParallaxLayer speed={speed} className={className} {...layerProps}>
      <motion.div
        className="absolute inset-0"
        initial={kenBurns && shouldAnimate ? { scale: 1 } : undefined}
        animate={kenBurns && shouldAnimate ? { scale: 1.1 } : undefined}
        transition={
          kenBurns
            ? { duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }
            : undefined
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Parallax image with Ken Burns effect */}
        <img
          src={src}
          alt={alt}
          className="w-full h-full"
          style={{
            objectFit,
            objectPosition,
          }}
          loading="lazy"
        />

        {/* Overlay */}
        {overlay && (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: overlay }}
          />
        )}
      </motion.div>
    </ParallaxLayer>
  );
}

// ============================================
// PARALLAX TEXT
// ============================================

export function ParallaxText({
  children,
  align = "center",
  shadow = true,
  speed = "content",
  className,
  ...layerProps
}: ParallaxTextProps) {
  return (
    <ParallaxLayer speed={speed} className={className} {...layerProps}>
      <div
        className={cn(
          "flex items-center justify-center h-full w-full",
          align === "left" && "justify-start text-left",
          align === "right" && "justify-end text-right",
          shadow && "drop-shadow-lg"
        )}
      >
        {children}
      </div>
    </ParallaxLayer>
  );
}

// ============================================
// PARALLAX GRADIENT
// Creates a gradient layer with parallax
// ============================================

export interface ParallaxGradientProps extends Omit<ParallaxLayerProps, "children"> {
  /** Gradient colors */
  colors: string[];
  /** Gradient direction in degrees */
  direction?: number;
  /** Gradient type */
  type?: "linear" | "radial";
}

export function ParallaxGradient({
  colors,
  direction = 180,
  type = "linear",
  speed = "background",
  className,
  ...layerProps
}: ParallaxGradientProps) {
  const gradient =
    type === "linear"
      ? `linear-gradient(${direction}deg, ${colors.join(", ")})`
      : `radial-gradient(circle, ${colors.join(", ")})`;

  return (
    <ParallaxLayer speed={speed} className={className} {...layerProps}>
      <div
        className="absolute inset-0"
        style={{ background: gradient }}
      />
    </ParallaxLayer>
  );
}

// ============================================
// SIMPLE PARALLAX WRAPPER
// For single-element parallax without container
// ============================================

export interface SimpleParallaxProps {
  children: ReactNode;
  /** Parallax intensity (0-1) */
  intensity?: number;
  /** Direction */
  direction?: "up" | "down" | "left" | "right";
  /** Additional class names */
  className?: string;
  /** Disable on mobile */
  disableOnMobile?: boolean;
}

export function SimpleParallax({
  children,
  intensity = 0.3,
  direction = "up",
  className,
  disableOnMobile = true,
}: SimpleParallaxProps) {
  const { shouldAnimate } = useAnimationPreference();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const distance = 100 * intensity;

  const transforms = {
    up: useTransform(scrollYProgress, [0, 1], [distance, -distance]),
    down: useTransform(scrollYProgress, [0, 1], [-distance, distance]),
    left: useTransform(scrollYProgress, [0, 1], [distance, -distance]),
    right: useTransform(scrollYProgress, [0, 1], [-distance, distance]),
  };

  const isEnabled = shouldAnimate && !(disableOnMobile && isMobile);
  const isVertical = direction === "up" || direction === "down";
  const transform = transforms[direction];
  const smoothTransform = useSpring(transform, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={
        isEnabled
          ? {
              [isVertical ? "y" : "x"]: smoothTransform,
              willChange: "transform",
            }
          : {}
      }
    >
      {children}
    </motion.div>
  );
}

// ============================================
// SCROLL OPACITY
// Fades content based on scroll position
// ============================================

export interface ScrollOpacityProps {
  children: ReactNode;
  /** Start fading at this scroll progress (0-1) */
  fadeStart?: number;
  /** Fully faded at this scroll progress (0-1) */
  fadeEnd?: number;
  /** Invert (start invisible, become visible) */
  invert?: boolean;
  /** Additional class names */
  className?: string;
}

export function ScrollOpacity({
  children,
  fadeStart = 0,
  fadeEnd = 1,
  invert = false,
  className,
}: ScrollOpacityProps) {
  const { shouldAnimate } = useAnimationPreference();
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(
    scrollYProgress,
    [fadeStart, fadeEnd],
    invert ? [0, 1] : [1, 0]
  );

  const smoothOpacity = useSpring(opacity, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={shouldAnimate ? { opacity: smoothOpacity } : {}}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// SCROLL SCALE
// Scales content based on scroll position
// ============================================

export interface ScrollScaleProps {
  children: ReactNode;
  /** Scale range [start, end] */
  scaleRange?: [number, number];
  /** Scroll progress range [start, end] */
  progressRange?: [number, number];
  /** Additional class names */
  className?: string;
}

export function ScrollScale({
  children,
  scaleRange = [0.8, 1],
  progressRange = [0, 0.5],
  className,
}: ScrollScaleProps) {
  const { shouldAnimate } = useAnimationPreference();
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, progressRange, scaleRange);
  const smoothScale = useSpring(scale, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={shouldAnimate ? { scale: smoothScale, willChange: "transform" } : {}}
    >
      {children}
    </motion.div>
  );
}

export default ParallaxContainer;
