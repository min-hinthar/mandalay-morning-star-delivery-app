"use client";

import { useCallback, useState } from "react";
import { useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";

// ============================================
// TILT CONFIGURATION
// ============================================

const TILT_MAX_ANGLE = 18;
const SPRING_CONFIG = { stiffness: 150, damping: 15 };

// ============================================
// TYPES
// ============================================

export interface UseTiltEffectOptions {
  /** Whether tilt effect is enabled */
  enabled: boolean;
  /** Ref to the card element for getBoundingClientRect */
  cardRef: React.RefObject<HTMLElement | null>;
}

export interface UseTiltEffectReturn {
  /** Normalized mouse X position (0-1) */
  mouseX: MotionValue<number>;
  /** Normalized mouse Y position (0-1) */
  mouseY: MotionValue<number>;
  /** Style object to apply to the tilting element */
  tiltStyle: Record<string, unknown>;
  /** Whether the card is currently hovered */
  isHovered: boolean;
  /** Whether mobile tilt is active */
  isMobileTiltActive: boolean;
  /** Mouse move handler */
  handleMouseMove: (e: React.MouseEvent) => void;
  /** Mouse enter handler */
  handleMouseEnter: () => void;
  /** Mouse leave handler */
  handleMouseLeave: () => void;
  /** Touch move handler for tilt on hybrid devices */
  handleTiltTouchMove: (e: React.TouchEvent) => void;
  /** Reset tilt state (for touch end) */
  resetTilt: () => void;
  /** Focus handler — disables tilt during keyboard focus */
  handleFocus: () => void;
  /** Blur handler — re-enables tilt after keyboard focus */
  handleBlur: () => void;
}

// ============================================
// HOOK
// ============================================

/**
 * Manages 3D tilt effect with mouse/touch tracking and spring-smoothed rotation.
 * Extracted from UnifiedMenuItemCard for file size reduction.
 */
export function useTiltEffect({ enabled, cardRef }: UseTiltEffectOptions): UseTiltEffectReturn {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileTiltActive, setIsMobileTiltActive] = useState(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);

  // Mouse position for 3D tilt (0-1 normalized)
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  // Spring-smoothed rotation transforms
  const rotateX = useSpring(
    useTransform(mouseY, [0, 1], [TILT_MAX_ANGLE, -TILT_MAX_ANGLE]),
    SPRING_CONFIG
  );
  const rotateY = useSpring(
    useTransform(mouseX, [0, 1], [-TILT_MAX_ANGLE, TILT_MAX_ANGLE]),
    SPRING_CONFIG
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return;

      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      mouseX.set(x);
      mouseY.set(y);
    },
    [enabled, cardRef, mouseX, mouseY]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setIsMobileTiltActive(false);
    // Springs on rotateX/rotateY handle smooth animation
    mouseX.set(0.5);
    mouseY.set(0.5);
  }, [mouseX, mouseY]);

  const handleTiltTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobileTiltActive) return;

      const touch = e.touches[0];
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect || !touch) return;

      const x = (touch.clientX - rect.left) / rect.width;
      const y = (touch.clientY - rect.top) / rect.height;

      mouseX.set(Math.max(0, Math.min(1, x)));
      mouseY.set(Math.max(0, Math.min(1, y)));
    },
    [isMobileTiltActive, cardRef, mouseX, mouseY]
  );

  const resetTilt = useCallback(() => {
    if (enabled) {
      requestAnimationFrame(() => {
        setIsMobileTiltActive(false);
        mouseX.set(0.5);
        mouseY.set(0.5);
      });
    }
  }, [enabled, mouseX, mouseY]);

  const handleFocus = useCallback(() => {
    setIsKeyboardFocused(true);
    mouseX.set(0.5);
    mouseY.set(0.5);
  }, [mouseX, mouseY]);

  const handleBlur = useCallback(() => {
    setIsKeyboardFocused(false);
  }, []);

  // Only apply willChange when hovered to reduce compositor layer count
  // willChange creates GPU layers - having it on all cards causes memory pressure
  // Disable tilt when keyboard-focused so focus ring renders cleanly
  const tiltStyle = enabled && !isKeyboardFocused
    ? {
        rotateX,
        rotateY,
        transformStyle: "preserve-3d" as const,
        transformPerspective: 1000,
        // Conditionally apply willChange only when interacting (hover/active)
        willChange: isHovered ? ("transform" as const) : ("auto" as const),
        backfaceVisibility: "hidden" as const,
        // Prevent scroll conflicts during tilt interaction on mobile
        touchAction: isMobileTiltActive ? ("none" as const) : ("auto" as const),
      }
    : {};

  return {
    mouseX,
    mouseY,
    tiltStyle,
    isHovered,
    isMobileTiltActive,
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
    handleTiltTouchMove,
    resetTilt,
    handleFocus,
    handleBlur,
  };
}
