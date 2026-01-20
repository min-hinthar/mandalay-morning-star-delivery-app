"use client";

/**
 * V7 Tracking Map - Motion-First Design
 *
 * Sprint 7: Tracking & Driver
 * Features: Live driver marker with pulse, animated route polyline, smooth marker transitions
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, useSpring } from "framer-motion";
import {
  Navigation,
  Maximize2,
  Minimize2,
  Home,
  ChefHat,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { v7Spring } from "@/lib/motion-tokens-v7";
import { useAnimationPreferenceV7 } from "@/lib/hooks/useAnimationPreferenceV7";

// ============================================
// TYPES
// ============================================

export interface TrackingMapV7Props {
  /** Customer delivery location */
  customerLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  /** Driver current location */
  driverLocation: {
    lat: number;
    lng: number;
    heading: number | null;
  } | null;
  /** Kitchen/restaurant location */
  kitchenLocation?: {
    lat: number;
    lng: number;
  };
  /** Encoded polyline for route */
  routePolyline?: string | null;
  /** Is tracking live? */
  isLive?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================
// ANIMATED MARKER COMPONENT
// ============================================

interface AnimatedMarkerV7Props {
  x: number;
  y: number;
  type: "driver" | "customer" | "kitchen";
  heading?: number | null;
  isLive?: boolean;
}

function AnimatedMarkerV7({ x, y, type, heading, isLive }: AnimatedMarkerV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();

  const springX = useSpring(x, { stiffness: 100, damping: 20 });
  const springY = useSpring(y, { stiffness: 100, damping: 20 });

  useEffect(() => {
    springX.set(x);
    springY.set(y);
  }, [x, y, springX, springY]);

  const markerConfig = {
    driver: {
      color: "#EBCD00", // Golden Yellow
      icon: Navigation,
      size: 44,
      showPulse: isLive,
    },
    customer: {
      color: "#52A52E", // Green
      icon: Home,
      size: 40,
      showPulse: false,
    },
    kitchen: {
      color: "#A41034", // Deep Red
      icon: ChefHat,
      size: 36,
      showPulse: false,
    },
  };

  const config = markerConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        x: shouldAnimate ? springX : x,
        y: shouldAnimate ? springY : y,
        translateX: "-50%",
        translateY: "-50%",
      }}
    >
      {/* Pulse rings for live driver */}
      {config.showPulse && shouldAnimate && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              backgroundColor: config.color,
              width: config.size,
              height: config.size,
              marginLeft: -config.size / 2,
              marginTop: -config.size / 2,
              left: "50%",
              top: "50%",
            }}
            animate={{
              scale: [1, 2.5, 3],
              opacity: [0.4, 0.1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              backgroundColor: config.color,
              width: config.size,
              height: config.size,
              marginLeft: -config.size / 2,
              marginTop: -config.size / 2,
              left: "50%",
              top: "50%",
            }}
            animate={{
              scale: [1, 2, 2.5],
              opacity: [0.3, 0.1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0.5,
              ease: "easeOut",
            }}
          />
        </>
      )}

      {/* Marker body */}
      <motion.div
        initial={shouldAnimate ? { scale: 0 } : undefined}
        animate={shouldAnimate ? { scale: 1 } : undefined}
        transition={getSpring(v7Spring.ultraBouncy)}
        className="relative flex items-center justify-center rounded-full shadow-lg"
        style={{
          width: config.size,
          height: config.size,
          backgroundColor: config.color,
          transform: type === "driver" && heading ? `rotate(${heading}deg)` : undefined,
        }}
      >
        <Icon
          className="text-white"
          style={{
            width: config.size * 0.5,
            height: config.size * 0.5,
            transform: type === "driver" && heading ? `rotate(${-heading}deg)` : undefined,
          }}
        />
      </motion.div>
    </motion.div>
  );
}

// ============================================
// ANIMATED ROUTE LINE
// ============================================

interface AnimatedRouteV7Props {
  points: { x: number; y: number }[];
  animated?: boolean;
}

function AnimatedRouteV7({ points, animated }: AnimatedRouteV7Props) {
  const { shouldAnimate } = useAnimationPreferenceV7();
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  // Create SVG path from points
  const pathD = useMemo(() => {
    if (points.length < 2) return "";
    const [first, ...rest] = points;
    return `M ${first.x} ${first.y} ${rest.map((p) => `L ${p.x} ${p.y}`).join(" ")}`;
  }, [points]);

  // Get path length for animation
  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [pathD]);

  if (points.length < 2) return null;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      {/* Background path */}
      <path
        d={pathD}
        fill="none"
        stroke="#A41034"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.2}
      />

      {/* Animated foreground path */}
      <motion.path
        ref={pathRef}
        d={pathD}
        fill="none"
        stroke="url(#routeGradient)"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={shouldAnimate && animated ? { strokeDashoffset: pathLength } : undefined}
        animate={shouldAnimate && animated ? { strokeDashoffset: 0 } : undefined}
        transition={{ duration: 2, ease: "easeInOut" }}
        strokeDasharray={pathLength}
      />

      {/* Gradient definition */}
      <defs>
        <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#A41034" />
          <stop offset="50%" stopColor="#EBCD00" />
          <stop offset="100%" stopColor="#52A52E" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ============================================
// MOCK MAP VISUALIZATION
// ============================================

interface MockMapV7Props {
  customerLocation: { lat: number; lng: number };
  driverLocation: { lat: number; lng: number; heading: number | null } | null;
  kitchenLocation?: { lat: number; lng: number };
  isLive?: boolean;
  width: number;
  height: number;
}

function MockMapV7({
  customerLocation,
  driverLocation,
  kitchenLocation,
  isLive,
  width,
  height,
}: MockMapV7Props) {
  const { shouldAnimate } = useAnimationPreferenceV7();
  const [showRoute, setShowRoute] = useState(false);

  // Animate route appearance
  useEffect(() => {
    if (driverLocation) {
      const timer = setTimeout(() => setShowRoute(true), 500);
      return () => clearTimeout(timer);
    }
  }, [driverLocation]);

  // Calculate positions (simple mercator-like projection)
  const getPosition = useCallback(
    (lat: number, lng: number) => {
      const allPoints = [
        customerLocation,
        driverLocation,
        kitchenLocation,
      ].filter(Boolean) as { lat: number; lng: number }[];

      const lats = allPoints.map((p) => p.lat);
      const lngs = allPoints.map((p) => p.lng);

      const minLat = Math.min(...lats) - 0.01;
      const maxLat = Math.max(...lats) + 0.01;
      const minLng = Math.min(...lngs) - 0.01;
      const maxLng = Math.max(...lngs) + 0.01;

      const padding = 60;
      const x = padding + ((lng - minLng) / (maxLng - minLng)) * (width - padding * 2);
      const y = padding + ((maxLat - lat) / (maxLat - minLat)) * (height - padding * 2);

      return { x, y };
    },
    [customerLocation, driverLocation, kitchenLocation, width, height]
  );

  const customerPos = getPosition(customerLocation.lat, customerLocation.lng);
  const driverPos = driverLocation
    ? getPosition(driverLocation.lat, driverLocation.lng)
    : null;
  const kitchenPos = kitchenLocation
    ? getPosition(kitchenLocation.lat, kitchenLocation.lng)
    : null;

  // Create route points
  const routePoints = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    if (kitchenPos) points.push(kitchenPos);
    if (driverPos) points.push(driverPos);
    points.push(customerPos);
    return points;
  }, [kitchenPos, driverPos, customerPos]);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-v6-surface-tertiary to-v6-surface-secondary overflow-hidden">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--color-v6-border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--color-v6-border) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Animated streets (decorative) */}
      <svg className="absolute inset-0 w-full h-full">
        {/* Horizontal roads */}
        {[0.3, 0.5, 0.7].map((ratio, i) => (
          <motion.line
            key={`h-${i}`}
            x1="0"
            y1={`${ratio * 100}%`}
            x2="100%"
            y2={`${ratio * 100}%`}
            stroke="var(--color-v6-border)"
            strokeWidth="8"
            strokeLinecap="round"
            initial={shouldAnimate ? { pathLength: 0 } : undefined}
            animate={shouldAnimate ? { pathLength: 1 } : undefined}
            transition={{ duration: 1, delay: i * 0.2 }}
          />
        ))}
        {/* Vertical roads */}
        {[0.25, 0.5, 0.75].map((ratio, i) => (
          <motion.line
            key={`v-${i}`}
            x1={`${ratio * 100}%`}
            y1="0"
            x2={`${ratio * 100}%`}
            y2="100%"
            stroke="var(--color-v6-border)"
            strokeWidth="8"
            strokeLinecap="round"
            initial={shouldAnimate ? { pathLength: 0 } : undefined}
            animate={shouldAnimate ? { pathLength: 1 } : undefined}
            transition={{ duration: 1, delay: 0.3 + i * 0.2 }}
          />
        ))}
      </svg>

      {/* Route line */}
      {showRoute && <AnimatedRouteV7 points={routePoints} animated />}

      {/* Markers */}
      {kitchenPos && (
        <AnimatedMarkerV7 x={kitchenPos.x} y={kitchenPos.y} type="kitchen" />
      )}
      <AnimatedMarkerV7 x={customerPos.x} y={customerPos.y} type="customer" />
      {driverPos && (
        <AnimatedMarkerV7
          x={driverPos.x}
          y={driverPos.y}
          type="driver"
          heading={driverLocation?.heading}
          isLive={isLive}
        />
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function TrackingMapV7({
  customerLocation,
  driverLocation,
  kitchenLocation,
  routePolyline: _routePolyline,
  isLive = false,
  className,
}: TrackingMapV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });

  // Track container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [isFullscreen]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
    // Haptic feedback
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, []);

  const mapContent = (
    <>
      {/* Live indicator */}
      {isLive && driverLocation && (
        <motion.div
          initial={shouldAnimate ? { opacity: 0, x: -10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
          className={cn(
            "absolute top-3 left-3 z-10",
            "flex items-center gap-2 rounded-full",
            "bg-v6-surface-primary/95 backdrop-blur-sm",
            "px-3 py-1.5 shadow-lg border border-v6-border"
          )}
        >
          <motion.span
            animate={shouldAnimate ? { scale: [1, 1.2, 1] } : undefined}
            transition={{ duration: 1, repeat: Infinity }}
            className="relative flex h-2.5 w-2.5"
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-v6-green opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-v6-green" />
          </motion.span>
          <span className="text-xs font-semibold text-v6-text-primary">
            Live tracking
          </span>
        </motion.div>
      )}

      {/* Fullscreen toggle */}
      <motion.button
        type="button"
        onClick={toggleFullscreen}
        whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
        whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
        className={cn(
          "absolute top-3 right-3 z-10",
          "w-10 h-10 rounded-full",
          "bg-v6-surface-primary/95 backdrop-blur-sm",
          "flex items-center justify-center",
          "shadow-lg border border-v6-border",
          "text-v6-text-primary hover:text-v6-primary",
          "transition-colors"
        )}
      >
        {isFullscreen ? (
          <Minimize2 className="w-5 h-5" />
        ) : (
          <Maximize2 className="w-5 h-5" />
        )}
      </motion.button>

      {/* Map visualization */}
      <MockMapV7
        customerLocation={customerLocation}
        driverLocation={driverLocation}
        kitchenLocation={kitchenLocation}
        isLive={isLive}
        width={dimensions.width}
        height={dimensions.height}
      />

      {/* Legend */}
      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        transition={{ delay: 0.5 }}
        className="absolute bottom-3 left-3 right-3 z-10"
      >
        <div
          className={cn(
            "flex items-center justify-between",
            "rounded-xl bg-v6-surface-primary/95 backdrop-blur-sm",
            "px-4 py-2.5 shadow-lg border border-v6-border"
          )}
        >
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-v6-primary" />
              <span className="text-v6-text-secondary">Kitchen</span>
            </div>
            {driverLocation && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-v6-secondary" />
                <span className="text-v6-text-secondary">Driver</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-v6-green" />
              <span className="text-v6-text-secondary">You</span>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );

  return (
    <>
      {/* Inline map */}
      <motion.div
        ref={containerRef}
        initial={shouldAnimate ? { opacity: 0, scale: 0.98 } : undefined}
        animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
        transition={getSpring(v7Spring.default)}
        className={cn(
          "relative rounded-2xl overflow-hidden",
          "shadow-v6-card border border-v6-border",
          className
        )}
        style={{ minHeight: 300 }}
      >
        {mapContent}
      </motion.div>

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-v6-background"
          >
            <motion.div
              ref={containerRef}
              initial={shouldAnimate ? { scale: 0.95 } : undefined}
              animate={shouldAnimate ? { scale: 1 } : undefined}
              exit={shouldAnimate ? { scale: 0.95 } : undefined}
              transition={getSpring(v7Spring.snappy)}
              className="relative h-full w-full"
            >
              {mapContent}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default TrackingMapV7;
