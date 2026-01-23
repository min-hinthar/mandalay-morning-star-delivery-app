"use client";

/**
 *  Route Optimization - Motion-First Map Visualization
 *
 * Sprint 8: Admin Dashboard
 * Features: Animated route map, stop sequence, drag reorder,
 * optimization suggestions, driver assignment
 */

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  MapPin,
  Navigation,
  User,
  Truck,
  Route,
  GripVertical,
  CheckCircle2,
  AlertTriangle,
  Zap,
  RefreshCw,
  Package,
  Timer,
  Play,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  spring,
  routeDraw,
} from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import type { RouteStatus, RouteStopStatus } from "@/types/driver";

// ============================================
// TYPES
// ============================================

export interface RouteStop {
  id: string;
  orderId: string;
  orderNumber: string;
  sequence: number;
  address: string;
  customerName: string | null;
  status: RouteStopStatus;
  estimatedArrival?: string;
  actualArrival?: string;
  lat: number;
  lng: number;
}

export interface Route {
  id: string;
  deliveryDate: string;
  status: RouteStatus;
  driver: {
    id: string;
    name: string | null;
    avatar?: string;
  } | null;
  stops: RouteStop[];
  totalDistance?: number;
  estimatedDuration?: number;
}

export interface RouteOptimizationProps {
  /** Route data */
  route: Route;
  /** Available drivers for assignment */
  availableDrivers?: Array<{ id: string; name: string; avatar?: string }>;
  /** Callback when stops are reordered */
  onReorderStops?: (stopIds: string[]) => Promise<void>;
  /** Callback when driver is assigned */
  onAssignDriver?: (driverId: string) => Promise<void>;
  /** Callback to start route */
  onStartRoute?: () => Promise<void>;
  /** Callback to optimize route */
  onOptimize?: () => Promise<void>;
  /** Loading state */
  loading?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================
// STOP STATUS CONFIG
// ============================================

const STOP_STATUS_CONFIG: Record<
  RouteStopStatus,
  { label: string; color: string; bgColor: string }
> = {
  pending: {
    label: "Pending",
    color: "text-text-muted",
    bgColor: "bg-surface-tertiary",
  },
  enroute: {
    label: "En Route",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  arrived: {
    label: "Arrived",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  delivered: {
    label: "Delivered",
    color: "text-green",
    bgColor: "bg-green/10",
  },
  skipped: {
    label: "Skipped",
    color: "text-status-error",
    bgColor: "bg-status-error/10",
  },
};

// ============================================
// MOCK MAP VISUALIZATION
// ============================================

interface RouteMapProps {
  stops: RouteStop[];
  isOptimizing?: boolean;
}

function RouteMap({ stops, isOptimizing }: RouteMapProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  // Calculate bounds for the mock map
  const bounds = useMemo(() => {
    if (stops.length === 0) return { minX: 0, maxX: 100, minY: 0, maxY: 100 };

    const lats = stops.map((s) => s.lat);
    const lngs = stops.map((s) => s.lng);

    return {
      minX: Math.min(...lngs),
      maxX: Math.max(...lngs),
      minY: Math.min(...lats),
      maxY: Math.max(...lats),
    };
  }, [stops]);

  // Map coordinates to SVG space
  const mapToSVG = useCallback(
    (lat: number, lng: number) => {
      const padding = 40;
      const width = 400;
      const height = 300;

      const x =
        padding +
        ((lng - bounds.minX) / (bounds.maxX - bounds.minX || 1)) *
          (width - padding * 2);
      const y =
        padding +
        ((bounds.maxY - lat) / (bounds.maxY - bounds.minY || 1)) *
          (height - padding * 2);

      return { x: x || width / 2, y: y || height / 2 };
    },
    [bounds]
  );

  // Generate route path
  const routePath = useMemo(() => {
    if (stops.length < 2) return "";

    const sortedStops = [...stops].sort((a, b) => a.sequence - b.sequence);
    const points = sortedStops.map((stop) => mapToSVG(stop.lat, stop.lng));

    return points.reduce((path, point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      return `${path} L ${point.x} ${point.y}`;
    }, "");
  }, [stops, mapToSVG]);

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0 } : undefined}
      animate={shouldAnimate ? { opacity: 1 } : undefined}
      className="relative w-full h-[300px] rounded-xl bg-gradient-to-br from-surface-secondary to-surface-tertiary overflow-hidden"
    >
      {/* Grid background */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%">
          <defs>
            <pattern
              id="grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-border"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Route visualization */}
      <svg
        viewBox="0 0 400 300"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Route path */}
        {routePath && (
          <motion.path
            d={routePath}
            fill="none"
            stroke="#A41034"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={isOptimizing ? "10 5" : "none"}
            variants={routeDraw.path}
            initial="initial"
            animate="animate"
          />
        )}

        {/* Stops */}
        {stops
          .sort((a, b) => a.sequence - b.sequence)
          .map((stop, index) => {
            const point = mapToSVG(stop.lat, stop.lng);
            const isDelivered = stop.status === "delivered";
            const isSkipped = stop.status === "skipped";

            return (
              <motion.g
                key={stop.id}
                initial={shouldAnimate ? { opacity: 0, scale: 0 } : undefined}
                animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
                transition={{
                  ...getSpring(spring.ultraBouncy),
                  delay: index * 0.1,
                }}
              >
                {/* Pulse ring for pending stops */}
                {!isDelivered && !isSkipped && (
                  <motion.circle
                    cx={point.x}
                    cy={point.y}
                    r={20}
                    fill="none"
                    stroke="#A41034"
                    strokeWidth="2"
                    opacity="0.3"
                    animate={shouldAnimate ? {
                      r: [16, 24, 16],
                      opacity: [0.3, 0, 0.3],
                    } : undefined}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.2,
                    }}
                  />
                )}

                {/* Stop marker */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={14}
                  fill={
                    isDelivered
                      ? "#52A52E"
                      : isSkipped
                      ? "#DC2626"
                      : "#A41034"
                  }
                  stroke="white"
                  strokeWidth="3"
                />

                {/* Stop number */}
                <text
                  x={point.x}
                  y={point.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {stop.sequence}
                </text>
              </motion.g>
            );
          })}
      </svg>

      {/* Optimizing overlay */}
      <AnimatePresence>
        {isOptimizing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="p-3 rounded-full bg-primary text-white"
            >
              <Zap className="w-6 h-6" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex gap-2">
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/80 text-xs">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/80 text-xs">
          <div className="w-2 h-2 rounded-full bg-green" />
          <span>Delivered</span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// STOP CARD
// ============================================

interface StopCardProps {
  stop: RouteStop;
  index: number;
  isDragging?: boolean;
}

function StopCard({ stop, index, isDragging }: StopCardProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const config = STOP_STATUS_CONFIG[stop.status];

  return (
    <motion.div
      layout
      initial={shouldAnimate ? { opacity: 0, x: -20 } : undefined}
      animate={shouldAnimate ? {
        opacity: 1,
        x: 0,
        scale: isDragging ? 1.02 : 1,
        boxShadow: isDragging
          ? "0 10px 30px rgba(0,0,0,0.15)"
          : "0 2px 8px rgba(0,0,0,0.05)",
      } : undefined}
      exit={shouldAnimate ? { opacity: 0, x: 20 } : undefined}
      transition={{ ...getSpring(spring.snappy), delay: index * 0.05 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl",
        "bg-white border border-border",
        "cursor-grab active:cursor-grabbing",
        isDragging && "ring-2 ring-primary/30"
      )}
    >
      {/* Drag handle */}
      <div className="text-text-muted">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Sequence number */}
      <motion.div
        whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          "text-sm font-bold",
          stop.status === "delivered"
            ? "bg-green text-white"
            : stop.status === "skipped"
            ? "bg-status-error text-white"
            : "bg-primary text-white"
        )}
      >
        {stop.status === "delivered" ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : stop.status === "skipped" ? (
          <AlertTriangle className="w-4 h-4" />
        ) : (
          stop.sequence
        )}
      </motion.div>

      {/* Stop info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-text-primary">
            #{stop.orderNumber}
          </span>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              config.bgColor,
              config.color
            )}
          >
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <User className="w-3 h-3 text-text-muted flex-shrink-0" />
          <span className="text-sm text-text-secondary truncate">
            {stop.customerName || "Customer"}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <MapPin className="w-3 h-3 text-text-muted flex-shrink-0" />
          <span className="text-xs text-text-muted truncate">
            {stop.address}
          </span>
        </div>
      </div>

      {/* ETA */}
      {stop.estimatedArrival && stop.status === "pending" && (
        <div className="text-right">
          <p className="text-xs text-text-muted">ETA</p>
          <p className="text-sm font-semibold text-text-primary">
            {format(parseISO(stop.estimatedArrival), "h:mm a")}
          </p>
        </div>
      )}

      {/* Actual arrival */}
      {stop.actualArrival && stop.status === "delivered" && (
        <div className="text-right">
          <p className="text-xs text-green">Delivered</p>
          <p className="text-sm font-semibold text-green">
            {format(parseISO(stop.actualArrival), "h:mm a")}
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// ROUTE STATS
// ============================================

interface RouteStatsProps {
  route: Route;
}

function RouteStats({ route }: RouteStatsProps) {
  const { shouldAnimate } = useAnimationPreference();

  const deliveredCount = route.stops.filter((s) => s.status === "delivered").length;
  const progress = route.stops.length > 0
    ? (deliveredCount / route.stops.length) * 100
    : 0;

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-surface-secondary"
    >
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 text-text-muted mb-1">
          <Package className="w-4 h-4" />
          <span className="text-xs">Stops</span>
        </div>
        <p className="text-xl font-bold text-text-primary">
          {deliveredCount}/{route.stops.length}
        </p>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center gap-1 text-text-muted mb-1">
          <Navigation className="w-4 h-4" />
          <span className="text-xs">Distance</span>
        </div>
        <p className="text-xl font-bold text-text-primary">
          {route.totalDistance ? `${route.totalDistance} mi` : "—"}
        </p>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center gap-1 text-text-muted mb-1">
          <Timer className="w-4 h-4" />
          <span className="text-xs">Duration</span>
        </div>
        <p className="text-xl font-bold text-text-primary">
          {route.estimatedDuration ? `${route.estimatedDuration} min` : "—"}
        </p>
      </div>

      {/* Progress bar */}
      <div className="col-span-3">
        <div className="flex justify-between text-xs text-text-muted mb-1">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
          <motion.div
            initial={shouldAnimate ? { width: 0 } : undefined}
            animate={shouldAnimate ? { width: `${progress}%` } : undefined}
            transition={spring.gentle}
            className="h-full rounded-full bg-green"
          />
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function RouteOptimization({
  route,
  availableDrivers = [],
  onReorderStops,
  onAssignDriver,
  onStartRoute,
  onOptimize,
  loading = false,
  className,
}: RouteOptimizationProps) {
  const { shouldAnimate } = useAnimationPreference();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [stops, setStops] = useState(route.stops);

  // Handle optimization
  const handleOptimize = async () => {
    if (!onOptimize) return;

    setIsOptimizing(true);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([50, 30, 50]);
    }

    try {
      await onOptimize();
    } finally {
      setIsOptimizing(false);
    }
  };

  // Handle reorder
  const handleReorder = async (newStops: RouteStop[]) => {
    setStops(newStops);
    if (onReorderStops) {
      await onReorderStops(newStops.map((s) => s.id));
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="h-[300px] rounded-xl bg-surface-tertiary animate-pulse" />
        <div className="h-24 rounded-xl bg-surface-tertiary animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-surface-tertiary animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: -10 } : undefined}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={shouldAnimate ? { rotate: [0, 360] } : undefined}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Route className="w-6 h-6 text-primary" />
          </motion.div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">
              Route for {format(parseISO(route.deliveryDate), "EEEE, MMM d")}
            </h2>
            <p className="text-sm text-text-muted">
              {route.stops.length} stops •{" "}
              {route.driver?.name || "Unassigned"}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onOptimize && route.status === "planned" && (
            <motion.button
              whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
              onClick={handleOptimize}
              disabled={isOptimizing}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl",
                "bg-secondary/10 text-secondary",
                "font-medium text-sm",
                "hover:bg-secondary/20",
                "disabled:opacity-50"
              )}
            >
              {isOptimizing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.div>
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Optimize Route
            </motion.button>
          )}

          {onStartRoute && route.status === "planned" && route.driver && (
            <motion.button
              whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
              onClick={onStartRoute}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl",
                "bg-primary text-white",
                "font-medium text-sm",
                "hover:bg-primary-hover"
              )}
            >
              <Play className="w-4 h-4" />
              Start Route
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Map */}
      <RouteMap stops={stops} isOptimizing={isOptimizing} />

      {/* Stats */}
      <RouteStats route={route} />

      {/* Driver assignment */}
      {!route.driver && availableDrivers.length > 0 && onAssignDriver && (
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 10 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          className="p-4 rounded-xl bg-secondary/5 border border-secondary/20"
        >
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-5 h-5 text-secondary" />
            <span className="font-semibold text-text-primary">
              Assign a Driver
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableDrivers.map((driver) => (
              <motion.button
                key={driver.id}
                whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
                whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
                onClick={() => onAssignDriver(driver.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg",
                  "bg-white border border-border",
                  "hover:border-primary/30",
                  "transition-colors"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                  {driver.name?.charAt(0) || "D"}
                </div>
                <span className="text-sm font-medium text-text-primary">
                  {driver.name || "Driver"}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stop list */}
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-3">
          Delivery Stops
        </h3>

        <Reorder.Group
          axis="y"
          values={stops}
          onReorder={handleReorder}
          className="space-y-2"
        >
          {stops
            .sort((a, b) => a.sequence - b.sequence)
            .map((stop, index) => (
              <Reorder.Item key={stop.id} value={stop}>
                <StopCard stop={stop} index={index} />
              </Reorder.Item>
            ))}
        </Reorder.Group>
      </div>
    </div>
  );
}

export default RouteOptimization;
