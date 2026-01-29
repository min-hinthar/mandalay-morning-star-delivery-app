"use client";

import { useMemo, useCallback, useState, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Polyline,
  Circle,
} from "@react-google-maps/api";
import { motion } from "framer-motion";
import { Loader2, MapPin, Clock } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { KITCHEN_LOCATION, COVERAGE_LIMITS } from "@/types/address";

// 40 miles in meters for coverage radius
const COVERAGE_RADIUS_METERS = COVERAGE_LIMITS.maxDistanceMiles * 1609.34;

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

interface CoverageRouteMapProps {
  destinationLat?: number;
  destinationLng?: number;
  encodedPolyline?: string;
  durationMinutes?: number;
  distanceMiles?: number;
  isValid?: boolean;
  className?: string;
}

const LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

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

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  // Animate coverage circle opacity for pulsing effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCircleOpacity((prev) => (prev === 0.15 ? 0.25 : 0.15));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Check if we have a destination
  const hasDestination =
    destinationLat !== undefined && destinationLng !== undefined;

  // Calculate bounds to fit both points (or just kitchen if no destination)
  const bounds = useMemo(() => {
    if (!hasDestination) {
      // Default view: show coverage area around kitchen
      const radiusDegrees = 0.6; // Roughly 40 miles in degrees
      return {
        north: KITCHEN_LOCATION.lat + radiusDegrees,
        south: KITCHEN_LOCATION.lat - radiusDegrees,
        east: KITCHEN_LOCATION.lng + radiusDegrees,
        west: KITCHEN_LOCATION.lng - radiusDegrees,
      };
    }
    return {
      north: Math.max(KITCHEN_LOCATION.lat, destinationLat) + 0.02,
      south: Math.min(KITCHEN_LOCATION.lat, destinationLat) - 0.02,
      east: Math.max(KITCHEN_LOCATION.lng, destinationLng) + 0.02,
      west: Math.min(KITCHEN_LOCATION.lng, destinationLng) - 0.02,
    };
  }, [hasDestination, destinationLat, destinationLng]);

  // Fit bounds when map loads
  useEffect(() => {
    if (map && bounds) {
      const googleBounds = new google.maps.LatLngBounds(
        { lat: bounds.south, lng: bounds.west },
        { lat: bounds.north, lng: bounds.east }
      );
      map.fitBounds(googleBounds, { top: 50, bottom: 80, left: 50, right: 50 });
    }
  }, [map, bounds]);

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

  const center = hasDestination
    ? {
        lat: (KITCHEN_LOCATION.lat + destinationLat) / 2,
        lng: (KITCHEN_LOCATION.lng + destinationLng) / 2,
      }
    : { lat: KITCHEN_LOCATION.lat, lng: KITCHEN_LOCATION.lng };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("relative rounded-xl overflow-hidden shadow-md", className)}
      style={{ minHeight: 200 }}
    >
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center}
        zoom={10}
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
        {/* Animated coverage circle */}
        <Circle
          center={{ lat: KITCHEN_LOCATION.lat, lng: KITCHEN_LOCATION.lng }}
          radius={COVERAGE_RADIUS_METERS}
          options={{
            fillColor: "#A41034",
            fillOpacity: circleOpacity,
            strokeColor: "#A41034",
            strokeOpacity: 0.4,
            strokeWeight: 2,
          }}
        />

        {/* Route polyline */}
        {routePath.length > 0 && (
          <Polyline
            path={routePath}
            options={{
              strokeColor: isValid ? "#52A52E" : "#A41034",
              strokeOpacity: 0.8,
              strokeWeight: 4,
            }}
          />
        )}

        {/* Kitchen marker with logo */}
        <Marker
          position={{ lat: KITCHEN_LOCATION.lat, lng: KITCHEN_LOCATION.lng }}
          icon={{
            url: "/logo.png",
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20),
          }}
          title="Mandalay Morning Star Kitchen"
        />

        {/* Destination marker - only show when destination is set */}
        {hasDestination && (
          <Marker
            position={{ lat: destinationLat, lng: destinationLng }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: isValid ? "#52A52E" : "#DC2626",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            }}
            title="Delivery Address"
          />
        )}
      </GoogleMap>

      {/* Coverage limit badge - top left */}
      <div className="absolute top-3 left-3">
        <div
          className={cn(
            "px-3 py-1.5 rounded-full bg-surface-primary/90 backdrop-blur-sm",
            "flex items-center gap-2 text-xs font-medium shadow-sm"
          )}
        >
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-text-secondary">
            Max {COVERAGE_LIMITS.maxDistanceMiles} mi
          </span>
          <span className="text-text-muted">|</span>
          <Clock className="w-3 h-3 text-text-muted" />
          <span className="text-text-secondary">
            {COVERAGE_LIMITS.maxDurationMinutes} min
          </span>
        </div>
      </div>

      {/* Kitchen logo badge - top right */}
      <div className="absolute top-3 right-3">
        <div
          className={cn(
            "p-1.5 rounded-lg bg-surface-primary/90 backdrop-blur-sm shadow-sm",
            "flex items-center gap-2"
          )}
        >
          <Image
            src="/logo.png"
            alt="Mandalay Morning Star"
            width={24}
            height={24}
            className="rounded-sm"
          />
          <span className="text-xs font-medium text-text-primary pr-1">
            Kitchen
          </span>
        </div>
      </div>

      {/* Route info overlay - bottom */}
      <div className="absolute bottom-3 left-3 right-3">
        <div
          className={cn(
            "p-3 rounded-lg bg-surface-primary/90 backdrop-blur-sm",
            "flex items-center justify-between text-sm"
          )}
        >
          {hasDestination ? (
            <>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    isValid ? "bg-green/20" : "bg-status-error/20"
                  )}
                >
                  <MapPin
                    className={cn(
                      "w-4 h-4",
                      isValid ? "text-green" : "text-status-error"
                    )}
                  />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">
                    {distanceMiles?.toFixed(1) ?? "0"} miles
                  </p>
                  <p className="text-xs text-text-muted">
                    ~{durationMinutes ?? 0} min drive
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isValid ? (
                  <span className="px-2 py-1 rounded-full bg-green/20 text-green text-xs font-medium">
                    In Range
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full bg-status-error/20 text-status-error text-xs font-medium">
                    Out of Range
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 w-full justify-center">
              <MapPin className="w-4 h-4 text-text-muted" />
              <p className="text-text-secondary">
                Enter an address to check delivery coverage
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
