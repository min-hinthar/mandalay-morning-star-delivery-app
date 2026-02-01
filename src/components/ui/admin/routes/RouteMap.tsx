/**
 * RouteMap Component
 *
 * Google Maps visualization for delivery routes.
 * Shows polyline path and numbered stop markers colored by status.
 * Clicking a marker scrolls to the corresponding stop card.
 */

"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Polyline,
  Marker,
} from "@react-google-maps/api";
import { Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { RouteStopStatus } from "@/types/driver";

// Custom map styles for warm aesthetic (consistent with DeliveryMap)
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

// Status color mapping
const STATUS_COLORS: Record<RouteStopStatus, string> = {
  pending: "#3B82F6", // blue
  enroute: "#F59E0B", // amber
  arrived: "#F59E0B", // amber
  delivered: "#22C55E", // green
  skipped: "#6B7280", // gray
};

const EXCEPTION_COLOR = "#EF4444"; // red

interface MapStop {
  id: string;
  stopIndex: number;
  status: RouteStopStatus;
  lat: number;
  lng: number;
  hasException: boolean;
}

interface RouteMapProps {
  stops: MapStop[];
  polyline: string | null;
  onStopClick?: (stopId: string) => void;
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

export function RouteMap({
  stops,
  polyline,
  onStopClick,
  className,
}: RouteMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Refs for AdvancedMarkerElements
  const markerRefs = useRef<(google.maps.marker.AdvancedMarkerElement | null)[]>([]);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  // Calculate center based on stops
  const center = useMemo(() => {
    if (stops.length === 0) {
      // Default to downtown Sacramento if no stops
      return { lat: 38.5816, lng: -121.4944 };
    }

    const avgLat = stops.reduce((sum, s) => sum + s.lat, 0) / stops.length;
    const avgLng = stops.reduce((sum, s) => sum + s.lng, 0) / stops.length;
    return { lat: avgLat, lng: avgLng };
  }, [stops]);

  // Fit bounds when map loads or stops change
  useEffect(() => {
    if (!map || stops.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    stops.forEach((stop) => {
      bounds.extend({ lat: stop.lat, lng: stop.lng });
    });

    map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
  }, [map, stops]);

  // Create AdvancedMarkerElements when Map ID is available
  useEffect(() => {
    if (!map || !isLoaded || !MAP_ID) return;

    // Clear existing markers
    markerRefs.current.forEach((marker) => {
      if (marker) marker.map = null;
    });
    markerRefs.current = [];

    // Create new markers
    stops.forEach((stop) => {
      const color = stop.hasException ? EXCEPTION_COLOR : STATUS_COLORS[stop.status];

      const markerContent = document.createElement("div");
      markerContent.innerHTML = `
        <div style="
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: ${color};
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 2px solid white;
          cursor: pointer;
        ">${stop.stopIndex + 1}</div>
      `;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: stop.lat, lng: stop.lng },
        content: markerContent,
        title: `Stop ${stop.stopIndex + 1}`,
      });

      // Add click listener
      marker.addListener("click", () => {
        onStopClick?.(stop.id);
      });

      markerRefs.current.push(marker);
    });

    return () => {
      markerRefs.current.forEach((marker) => {
        if (marker) marker.map = null;
      });
    };
  }, [map, isLoaded, stops, onStopClick]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Decode polyline to path
  const routePath = useMemo(() => {
    if (!polyline || !isLoaded) return [];

    try {
      const decoded = google.maps.geometry?.encoding?.decodePath(polyline);
      return decoded?.map((p) => ({ lat: p.lat(), lng: p.lng() })) || [];
    } catch {
      return [];
    }
  }, [polyline, isLoaded]);

  // Loading state
  if (!isLoaded) {
    return (
      <div
        className={cn(
          "flex h-full items-center justify-center bg-[var(--color-surface-muted)] rounded-card-sm",
          className
        )}
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
          "flex h-full items-center justify-center bg-status-error-bg rounded-card-sm",
          className
        )}
      >
        <div className="flex flex-col items-center gap-2 text-status-error">
          <MapPin className="h-8 w-8" />
          <span className="text-sm">Unable to load map</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (stops.length === 0) {
    return (
      <div
        className={cn(
          "flex h-full items-center justify-center bg-surface-secondary rounded-card-sm",
          className
        )}
      >
        <div className="flex flex-col items-center gap-2 text-text-muted">
          <MapPin className="h-8 w-8" />
          <span className="text-sm">No stops to display</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative h-full w-full", className)}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: "cooperative",
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
        {!MAP_ID &&
          stops.map((stop) => {
            const color = stop.hasException ? EXCEPTION_COLOR : STATUS_COLORS[stop.status];
            return (
              <Marker
                key={stop.id}
                position={{ lat: stop.lat, lng: stop.lng }}
                title={`Stop ${stop.stopIndex + 1}`}
                label={{
                  text: String(stop.stopIndex + 1),
                  color: "white",
                  fontWeight: "bold",
                  className: "text-xs",
                }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 14,
                  fillColor: color,
                  fillOpacity: 1,
                  strokeColor: "white",
                  strokeWeight: 2,
                }}
                onClick={() => onStopClick?.(stop.id)}
              />
            );
          })}
        {/* AdvancedMarkerElements are created in useEffect hooks when Map ID is available */}
      </GoogleMap>

      {/* Legend - MOBILE CRASH PREVENTION: No backdrop-blur on mobile */}
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <div className="flex items-center gap-4 rounded-lg bg-[var(--color-surface)] sm:bg-[var(--color-surface)]/90 px-3 py-2 shadow-sm sm:backdrop-blur-sm text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.pending }} />
            <span className="text-text-secondary">Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.enroute }} />
            <span className="text-text-secondary">En Route</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.delivered }} />
            <span className="text-text-secondary">Delivered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: EXCEPTION_COLOR }} />
            <span className="text-text-secondary">Exception</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder for RouteMap
 */
export function RouteMapSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-full rounded-card-sm bg-surface-muted animate-pulse",
        className
      )}
    >
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-text-muted">
          <MapPin className="h-8 w-8" />
          <span className="text-sm">Loading map...</span>
        </div>
      </div>
    </div>
  );
}
