/**
 * V3 Sprint 4: Delivery Map Component
 *
 * Shows live driver location and customer destination on a map.
 * Updates smoothly as driver position changes.
 * Supports fullscreen expansion on tap.
 * Uses AdvancedMarkerElement for modern marker support.
 */

"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Polyline,
  Marker,
} from "@react-google-maps/api";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MapPin, Navigation, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";

// Custom map styles for warm aesthetic (consistent with CoverageMap)
const mapStyles: google.maps.MapTypeStyle[] = [
  {
    featureType: "all",
    elementType: "geometry",
    stylers: [{ saturation: -30 }, { lightness: 10 }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#d4e4ed" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ lightness: 50 }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#f5e6c8" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#c8e6c9" }],
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
];

interface DeliveryMapProps {
  customerLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  driverLocation: {
    lat: number;
    lng: number;
    heading: number | null;
  } | null;
  routePolyline?: string | null;
  isLive?: boolean;
  className?: string;
}

const containerStyle = {
  width: "100%",
  height: "100%",
};

// Libraries must match other map components
const LIBRARIES: ("places" | "geometry" | "marker")[] = ["places", "geometry", "marker"];

// Check if Map ID is available for AdvancedMarkerElement
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

export function DeliveryMap({
  customerLocation,
  driverLocation,
  routePolyline,
  isLive = false,
  className,
}: DeliveryMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const prevDriverLocation = useRef(driverLocation);

  // Body scroll lock for fullscreen mode (deferred restore for animation safety)
  const { restoreScrollPosition } = useBodyScrollLock(isFullscreen, { deferRestore: true });

  // Refs for AdvancedMarkerElements
  const customerMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const driverMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  // Calculate center and bounds
  const { center, bounds } = useMemo(() => {
    if (!driverLocation) {
      return {
        center: { lat: customerLocation.lat, lng: customerLocation.lng },
        bounds: null,
      };
    }

    const centerLat = (customerLocation.lat + driverLocation.lat) / 2;
    const centerLng = (customerLocation.lng + driverLocation.lng) / 2;

    const bounds = {
      north: Math.max(customerLocation.lat, driverLocation.lat) + 0.01,
      south: Math.min(customerLocation.lat, driverLocation.lat) - 0.01,
      east: Math.max(customerLocation.lng, driverLocation.lng) + 0.01,
      west: Math.min(customerLocation.lng, driverLocation.lng) - 0.01,
    };

    return { center: { lat: centerLat, lng: centerLng }, bounds };
  }, [customerLocation, driverLocation]);

  // Fit bounds when map or locations change
  useEffect(() => {
    if (map && bounds) {
      const googleBounds = new google.maps.LatLngBounds(
        { lat: bounds.south, lng: bounds.west },
        { lat: bounds.north, lng: bounds.east }
      );
      map.fitBounds(googleBounds, { top: 50, bottom: 50, left: 50, right: 50 });
    }
  }, [map, bounds]);

  // Animate driver marker when position changes
  useEffect(() => {
    if (
      driverLocation &&
      prevDriverLocation.current &&
      map &&
      (driverLocation.lat !== prevDriverLocation.current.lat ||
        driverLocation.lng !== prevDriverLocation.current.lng)
    ) {
      // Update previous location
      prevDriverLocation.current = driverLocation;
    }
  }, [driverLocation, map]);

  // Create customer marker using AdvancedMarkerElement (if Map ID available)
  useEffect(() => {
    if (!map || !isLoaded || !MAP_ID) return;

    // Create customer marker content
    const customerContent = document.createElement("div");
    customerContent.innerHTML = `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #2E8B57;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 3px solid white;
      "></div>
    `;

    // Create or update customer marker
    if (customerMarkerRef.current) {
      customerMarkerRef.current.map = null;
    }

    customerMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: { lat: customerLocation.lat, lng: customerLocation.lng },
      content: customerContent,
      title: customerLocation.address,
    });

    return () => {
      if (customerMarkerRef.current) {
        customerMarkerRef.current.map = null;
      }
    };
  }, [map, isLoaded, customerLocation]);

  // Create driver marker using AdvancedMarkerElement (if Map ID available)
  useEffect(() => {
    if (!map || !isLoaded || !MAP_ID) return;

    // Remove existing driver marker
    if (driverMarkerRef.current) {
      driverMarkerRef.current.map = null;
      driverMarkerRef.current = null;
    }

    if (!driverLocation) return;

    // Create driver marker content with rotation
    const rotation = driverLocation.heading || 0;
    const driverContent = document.createElement("div");
    driverContent.innerHTML = `
      <div style="
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(${rotation}deg);
      ">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#D4A017" stroke="white" stroke-width="2">
          <path d="M12 2L22 12L12 22L2 12L12 2Z"/>
        </svg>
      </div>
    `;

    driverMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: { lat: driverLocation.lat, lng: driverLocation.lng },
      content: driverContent,
      title: "Your driver",
    });

    return () => {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.map = null;
      }
    };
  }, [map, isLoaded, driverLocation]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Decode polyline to path
  const routePath = useMemo(() => {
    if (!routePolyline || !isLoaded) return [];

    try {
      const decoded = google.maps.geometry?.encoding?.decodePath(routePolyline);
      return decoded?.map((p) => ({ lat: p.lat(), lng: p.lng() })) || [];
    } catch {
      return [];
    }
  }, [routePolyline, isLoaded]);

  // Loading state
  if (!isLoaded) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-[var(--color-surface-muted)] rounded-xl",
          className
        )}
        style={{ minHeight: 300 }}
      >
        <div className="flex flex-col items-center gap-2 text-[var(--color-text-muted)]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm">Loading map...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-[var(--color-error-light)] rounded-xl",
          className
        )}
        style={{ minHeight: 300 }}
      >
        <div className="flex flex-col items-center gap-2 text-[var(--color-error)]">
          <MapPin className="h-8 w-8" />
          <span className="text-sm">Unable to load map</span>
        </div>
      </div>
    );
  }

  const mapContent = (inFullscreen: boolean) => (
    <>
      {/* Live indicator */}
      {isLive && driverLocation && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-full bg-[var(--color-surface)]/90 px-3 py-1.5 shadow-sm backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-jade)] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-jade)]" />
          </span>
          <span className="text-xs font-medium text-[var(--color-text-primary)]">
            Live tracking
          </span>
        </div>
      )}

      {/* Expand button (only in inline mode) */}
      {!inFullscreen && (
        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)]/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-[var(--color-surface)]"
          aria-label="Expand map"
        >
          <Maximize2 className="h-5 w-5 text-[var(--color-text-primary)]" />
        </button>
      )}

      {/* Close button (only in fullscreen mode) */}
      {inFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface)] shadow-lg transition-colors hover:bg-[var(--color-surface-muted)]"
          aria-label="Close fullscreen"
        >
          <X className="h-6 w-6 text-[var(--color-text-primary)]" />
        </button>
      )}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: inFullscreen ? "greedy" : "cooperative",
          ...(MAP_ID && { mapId: MAP_ID }),
        }}
      >
        {/* Route polyline */}
        {routePath.length > 0 && (
          <Polyline
            path={routePath}
            options={{
              strokeColor: "#D4A017", // Saffron
              strokeOpacity: 0.8,
              strokeWeight: 4,
            }}
          />
        )}

        {/* Legacy Marker fallback when Map ID is not available */}
        {!MAP_ID && (
          <>
            {/* Customer location marker */}
            <Marker
              position={{ lat: customerLocation.lat, lng: customerLocation.lng }}
              title={customerLocation.address}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: "#2E8B57",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 3,
              }}
            />
            {/* Driver marker */}
            {driverLocation && (
              <Marker
                position={{ lat: driverLocation.lat, lng: driverLocation.lng }}
                title="Your driver"
                icon={{
                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 6,
                  fillColor: "#D4A017",
                  fillOpacity: 1,
                  strokeColor: "white",
                  strokeWeight: 2,
                  rotation: driverLocation.heading || 0,
                }}
              />
            )}
          </>
        )}
        {/* AdvancedMarkerElements are created in useEffect hooks when Map ID is available */}
      </GoogleMap>

      {/* Legend */}
      <div className={cn("absolute left-3 right-3 z-10", inFullscreen ? "bottom-6" : "bottom-3")}>
        <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface)]/90 px-3 py-2 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-[var(--color-jade)]" />
              <span className="text-[var(--color-text-primary)]">Your location</span>
            </div>
            {driverLocation && (
              <div className="flex items-center gap-1.5">
                <Navigation className="h-3 w-3 text-[var(--color-saffron)]" />
                <span className="text-[var(--color-text-primary)]">Driver</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Inline map */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("relative rounded-xl overflow-hidden shadow-md", className)}
        style={{ minHeight: 300 }}
      >
        {mapContent(false)}
      </motion.div>

      {/* Fullscreen overlay */}
      <AnimatePresence onExitComplete={restoreScrollPosition}>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-[var(--color-background)]"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative h-full w-full"
            >
              {mapContent(true)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Skeleton placeholder for DeliveryMap
 */
export function DeliveryMapSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-[var(--color-surface-muted)] animate-pulse",
        className
      )}
      style={{ minHeight: 300 }}
    >
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-[var(--color-text-muted)]">
          <MapPin className="h-8 w-8" />
          <span className="text-sm">Loading map...</span>
        </div>
      </div>
    </div>
  );
}
