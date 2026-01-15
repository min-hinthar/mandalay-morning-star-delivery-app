/**
 * V2 Sprint 3: Delivery Map Component
 *
 * Shows live driver location and customer destination on a map.
 * Updates smoothly as driver position changes.
 */

"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Polyline,
} from "@react-google-maps/api";
import { motion } from "framer-motion";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils/cn";

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

export function DeliveryMap({
  customerLocation,
  driverLocation,
  routePolyline,
  isLive = false,
  className,
}: DeliveryMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const prevDriverLocation = useRef(driverLocation);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
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
          "flex items-center justify-center bg-charcoal-100 rounded-xl",
          className
        )}
        style={{ minHeight: 300 }}
      >
        <div className="flex flex-col items-center gap-2 text-charcoal-500">
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
          "flex items-center justify-center bg-red-50 rounded-xl",
          className
        )}
        style={{ minHeight: 300 }}
      >
        <div className="flex flex-col items-center gap-2 text-red-600">
          <MapPin className="h-8 w-8" />
          <span className="text-sm">Unable to load map</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("relative rounded-xl overflow-hidden shadow-warm-md", className)}
      style={{ minHeight: 300 }}
    >
      {/* Live indicator */}
      {isLive && driverLocation && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-jade-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-jade-500" />
          </span>
          <span className="text-xs font-medium text-charcoal-600">
            Live tracking
          </span>
        </div>
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
          gestureHandling: "cooperative",
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

        {/* Customer destination marker */}
        <Marker
          position={{ lat: customerLocation.lat, lng: customerLocation.lng }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: "#2E8B57", // Jade
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          }}
          title={customerLocation.address}
        />

        {/* Driver location marker */}
        {driverLocation && (
          <Marker
            position={{ lat: driverLocation.lat, lng: driverLocation.lng }}
            icon={{
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 7,
              fillColor: "#D4A017", // Saffron
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
              rotation: driverLocation.heading || 0,
            }}
            title="Your driver"
          />
        )}
      </GoogleMap>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <div className="flex items-center justify-between rounded-lg bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-jade-500" />
              <span className="text-charcoal-600">Your location</span>
            </div>
            {driverLocation && (
              <div className="flex items-center gap-1.5">
                <Navigation className="h-3 w-3 text-saffron-500" />
                <span className="text-charcoal-600">Driver</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Skeleton placeholder for DeliveryMap
 */
export function DeliveryMapSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-charcoal-100 animate-pulse",
        className
      )}
      style={{ minHeight: 300 }}
    >
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-charcoal-400">
          <MapPin className="h-8 w-8" />
          <span className="text-sm">Loading map...</span>
        </div>
      </div>
    </div>
  );
}
