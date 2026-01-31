"use client";

import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Polyline,
  Circle,
  Marker,
} from "@react-google-maps/api";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MapPin, Clock, Navigation2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { KITCHEN_LOCATION, COVERAGE_LIMITS } from "@/types/address";

// Coverage radius in meters (40 miles)
const COVERAGE_RADIUS_METERS = COVERAGE_LIMITS.maxDistanceMiles * 1609.34;

// Local view radius (~15 miles) for inner circle
const LOCAL_VIEW_RADIUS_METERS = 24000;

// Warm, inviting map style that matches brand
const mapStyles: google.maps.MapTypeStyle[] = [
  {
    featureType: "all",
    elementType: "geometry",
    stylers: [{ saturation: -20 }, { lightness: 5 }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9dde8" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#f5f0e8" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ lightness: 40 }, { saturation: -50 }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: "#fde8d0" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e8d4b8" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#d4e8d4" }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b5b4d" }],
  },
];

interface CoverageRouteMapProps {
  destinationLat?: number;
  destinationLng?: number;
  encodedPolyline?: string;
  durationMinutes?: number;
  distanceMiles?: number;
  isValid?: boolean;
  className?: string;
}

const LIBRARIES: ("places" | "geometry" | "marker")[] = ["places", "geometry", "marker"];

// Check if Map ID is available for AdvancedMarkerElement
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

export function CoverageRouteMap({
  destinationLat,
  destinationLng,
  encodedPolyline,
  durationMinutes,
  distanceMiles,
  isValid,
  className,
}: CoverageRouteMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [circleOpacity, setCircleOpacity] = useState(0.15);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs for AdvancedMarkerElements
  const kitchenMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const destinationMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  // Track visibility with IntersectionObserver to avoid unnecessary animations
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Animate coverage circle opacity for pulsing effect - ONLY when visible
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCircleOpacity((prev) => (prev === 0.15 ? 0.25 : 0.15));
    }, 1500);
    return () => clearInterval(interval);
  }, [isVisible]);

  // Check if we have a destination
  const hasDestination =
    destinationLat !== undefined && destinationLng !== undefined;

  // Calculate appropriate zoom - show full coverage range by default
  const { zoom, shouldFitBounds } = useMemo(() => {
    if (!hasDestination) {
      // Default: zoom out to show full 40-mile coverage area (zoom 9)
      return { zoom: 9, shouldFitBounds: false };
    }
    // When destination is set, fit bounds to show both points
    return { zoom: 9, shouldFitBounds: true };
  }, [hasDestination]);

  // Fit bounds when destination is set
  useEffect(() => {
    if (map && hasDestination && shouldFitBounds && destinationLat && destinationLng) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: KITCHEN_LOCATION.lat, lng: KITCHEN_LOCATION.lng });
      bounds.extend({ lat: destinationLat, lng: destinationLng });
      // Fit with padding for overlays
      map.fitBounds(bounds, { top: 60, bottom: 70, left: 40, right: 40 });
    }
  }, [map, hasDestination, shouldFitBounds, destinationLat, destinationLng]);

  // Create kitchen marker using AdvancedMarkerElement (if Map ID available) or legacy Marker
  useEffect(() => {
    if (!map || !isLoaded || !MAP_ID) return;

    // Create kitchen marker content for AdvancedMarkerElement
    const kitchenContent = document.createElement("div");
    kitchenContent.innerHTML = `
      <div style="
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #A41034;
      ">
        <img src="/logo.png" alt="Kitchen" style="width: 36px; height: auto; border-radius: 6px;" />
      </div>
    `;

    // Create or update kitchen marker
    if (kitchenMarkerRef.current) {
      kitchenMarkerRef.current.map = null;
    }

    kitchenMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: { lat: KITCHEN_LOCATION.lat, lng: KITCHEN_LOCATION.lng },
      content: kitchenContent,
      title: "Mandalay Morning Star Kitchen",
    });

    return () => {
      if (kitchenMarkerRef.current) {
        kitchenMarkerRef.current.map = null;
      }
    };
  }, [map, isLoaded]);

  // Create destination marker using AdvancedMarkerElement (if Map ID available)
  useEffect(() => {
    if (!map || !isLoaded || !MAP_ID) return;

    // Remove existing destination marker
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.map = null;
      destinationMarkerRef.current = null;
    }

    if (!hasDestination || !destinationLat || !destinationLng) return;

    // Create destination marker content
    const color = isValid ? "#52A52E" : "#DC2626";
    const destContent = document.createElement("div");
    destContent.innerHTML = `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: ${color};
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 3px solid white;
      "></div>
    `;

    destinationMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: { lat: destinationLat, lng: destinationLng },
      content: destContent,
      title: "Your Delivery Address",
    });

    return () => {
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.map = null;
      }
    };
  }, [map, isLoaded, hasDestination, destinationLat, destinationLng, isValid]);

  // Decode polyline to path
  const routePath = useMemo(() => {
    if (!encodedPolyline || !isLoaded) return [];
    try {
      const decoded =
        google.maps.geometry?.encoding?.decodePath(encodedPolyline);
      return decoded?.map((p) => ({ lat: p.lat(), lng: p.lng() })) || [];
    } catch {
      return [];
    }
  }, [encodedPolyline, isLoaded]);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Loading state
  if (!isLoaded) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-surface-secondary rounded-xl",
          className
        )}
        style={{ minHeight: 200 }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-status-error/10 rounded-xl",
          className
        )}
        style={{ minHeight: 200 }}
      >
        <MapPin className="h-8 w-8 text-status-error" />
      </div>
    );
  }

  // Center on kitchen for default view
  const center = { lat: KITCHEN_LOCATION.lat, lng: KITCHEN_LOCATION.lng };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "relative rounded-2xl overflow-hidden",
        "ring-1 ring-border/50 shadow-lg",
        className
      )}
      style={{ minHeight: 200 }}
    >
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: false,
          clickableIcons: false,
          gestureHandling: "greedy",
          ...(MAP_ID && { mapId: MAP_ID }),
        }}
      >
        {/* Animated local coverage circle - smaller, more visible */}
        <Circle
          center={{ lat: KITCHEN_LOCATION.lat, lng: KITCHEN_LOCATION.lng }}
          radius={LOCAL_VIEW_RADIUS_METERS}
          options={{
            fillColor: "#A41034",
            fillOpacity: circleOpacity * 0.6,
            strokeColor: "#A41034",
            strokeOpacity: 0.5,
            strokeWeight: 2,
          }}
        />

        {/* Full coverage boundary - visible outer ring */}
        <Circle
          center={{ lat: KITCHEN_LOCATION.lat, lng: KITCHEN_LOCATION.lng }}
          radius={COVERAGE_RADIUS_METERS}
          options={{
            fillColor: "#A41034",
            fillOpacity: circleOpacity * 0.15,
            strokeColor: "#A41034",
            strokeOpacity: 0.4,
            strokeWeight: 2,
            strokePosition: google.maps.StrokePosition.OUTSIDE,
          }}
        />

        {/* Route polyline with gradient effect */}
        {routePath.length > 0 && (
          <Polyline
            path={routePath}
            options={{
              strokeColor: isValid ? "#52A52E" : "#DC2626",
              strokeOpacity: 0.9,
              strokeWeight: 5,
            }}
          />
        )}

        {/* Legacy Marker fallback when Map ID is not available */}
        {!MAP_ID && (
          <>
            {/* Kitchen marker */}
            <Marker
              position={{ lat: KITCHEN_LOCATION.lat, lng: KITCHEN_LOCATION.lng }}
              title="Mandalay Morning Star Kitchen"
              icon={{
                url: "/logo.png",
                scaledSize: new google.maps.Size(40, 40),
                anchor: new google.maps.Point(20, 20),
              }}
            />
            {/* Destination marker */}
            {hasDestination && destinationLat && destinationLng && (
              <Marker
                position={{ lat: destinationLat, lng: destinationLng }}
                title="Your Delivery Address"
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 12,
                  fillColor: isValid ? "#52A52E" : "#DC2626",
                  fillOpacity: 1,
                  strokeColor: "white",
                  strokeWeight: 3,
                }}
              />
            )}
          </>
        )}
        {/* AdvancedMarkerElements are created in useEffect hooks when Map ID is available */}
      </GoogleMap>

      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 via-transparent to-transparent" />

      {/* Coverage limit badge - top left with animation */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-3 left-3"
      >
        <div
          className={cn(
            "px-3 py-2 rounded-xl bg-surface-primary/95 backdrop-blur-md",
            "flex items-center gap-2 text-xs font-medium",
            "shadow-md ring-1 ring-border/30"
          )}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: 5 }}
            className="w-2.5 h-2.5 rounded-full bg-primary"
          />
          <span className="text-text-primary font-semibold">
            {COVERAGE_LIMITS.maxDistanceMiles} mi
          </span>
          <span className="text-text-muted/60">•</span>
          <Clock className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-text-secondary">
            {COVERAGE_LIMITS.maxDurationMinutes} min
          </span>
        </div>
      </motion.div>

      {/* Kitchen badge - top right */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute top-3 right-3"
      >
        <div
          className={cn(
            "px-2 py-1.5 rounded-xl bg-surface-primary/95 backdrop-blur-md",
            "flex items-center gap-2",
            "shadow-md ring-1 ring-border/30"
          )}
        >
          <Image
            src="/logo.png"
            alt="Mandalay Morning Star"
            width={28}
            height={28}
            style={{ height: "auto" }}
            className="rounded-lg"
          />
          <div className="pr-1">
            <p className="text-xs font-bold text-text-primary leading-tight">Kitchen</p>
            <p className="text-2xs text-text-muted leading-tight">Covina, CA</p>
          </div>
        </div>
      </motion.div>

      {/* Bottom info bar */}
      <AnimatePresence mode="wait">
        <motion.div
          key={hasDestination ? "route" : "default"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-3 left-3 right-3"
        >
          <div
            className={cn(
              "px-4 py-3 rounded-xl backdrop-blur-md",
              "shadow-lg ring-1",
              hasDestination
                ? isValid
                  ? "bg-green/10 ring-green/30"
                  : "bg-status-error/10 ring-status-error/30"
                : "bg-surface-primary/95 ring-border/30"
            )}
          >
            {hasDestination ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      isValid ? "bg-green/20" : "bg-status-error/20"
                    )}
                  >
                    <Navigation2
                      className={cn(
                        "w-5 h-5",
                        isValid ? "text-green" : "text-status-error"
                      )}
                    />
                  </motion.div>
                  <div>
                    <p className={cn(
                      "font-display font-bold text-lg leading-tight",
                      isValid ? "text-green" : "text-status-error"
                    )}>
                      {distanceMiles?.toFixed(1) ?? "0"} miles
                    </p>
                    <p className="text-xs text-text-muted">
                      ~{durationMinutes ?? 0} min drive time
                    </p>
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {isValid ? (
                    <span className="px-3 py-1.5 rounded-full bg-green/20 text-green text-sm font-bold">
                      ✓ In Range
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-full bg-status-error/20 text-status-error text-sm font-bold">
                      ✗ Too Far
                    </span>
                  )}
                </motion.div>
              </div>
            ) : (
              <div className="flex items-center gap-3 justify-center py-1">
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 1.5, repeat: 5 }}
                >
                  <MapPin className="w-5 h-5 text-primary" />
                </motion.div>
                <p className="text-sm text-text-secondary font-medium">
                  Enter your address to check if we deliver to you
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
