/** RouteMap - Google Maps visualization for delivery routes with driving polylines */
"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { GoogleMap, useJsApiLoader, Polyline, Marker } from "@react-google-maps/api";
import { Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { KITCHEN_COORDS } from "@/lib/constants/kitchen";
import type { RouteStopStatus } from "@/types/driver";
import {
  mapStyles,
  STATUS_COLORS,
  EXCEPTION_COLOR,
  SAFFRON,
  containerStyle,
  LIBRARIES,
  MAP_ID,
} from "./constants";
import { useDirectionsPath } from "./useDirectionsPath";

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

export function RouteMap({ stops, polyline, onStopClick, className }: RouteMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markerRefs = useRef<(google.maps.marker.AdvancedMarkerElement | null)[]>([]);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  const originPosition = useMemo(() => ({ lat: KITCHEN_COORDS.lat, lng: KITCHEN_COORDS.lng }), []);

  // Sorted stops for directions hook — stable reference keyed by stop coords
  const sortedStopCoords = useMemo(
    () =>
      [...stops].sort((a, b) => a.stopIndex - b.stopIndex).map((s) => ({ lat: s.lat, lng: s.lng })),
    [stops]
  );

  // Decode encoded polyline segments
  const decodedPolylinePath = useMemo(() => {
    if (!isLoaded || !polyline) return null;
    try {
      const segments = polyline.split(";");
      const allPoints: { lat: number; lng: number }[] = [];
      for (const segment of segments) {
        const decoded = google.maps.geometry?.encoding?.decodePath(segment);
        if (decoded) {
          for (const p of decoded) {
            allPoints.push({ lat: p.lat(), lng: p.lng() });
          }
        }
      }
      return allPoints.length > 0 ? allPoints : null;
    } catch {
      return null;
    }
  }, [polyline, isLoaded]);

  // Fetch driving directions when no encoded polyline available
  const { path: directionsPath, isEstimated } = useDirectionsPath({
    isLoaded,
    hasEncodedPolyline: !!decodedPolylinePath,
    origin: originPosition,
    stops: sortedStopCoords,
  });

  // Priority: 1) encoded polyline, 2) directions API, 3) straight lines
  const routePath = useMemo(() => {
    if (decodedPolylinePath) return decodedPolylinePath;
    if (directionsPath.length > 0) return directionsPath;
    if (stops.length > 0) {
      const sorted = [...stops].sort((a, b) => a.stopIndex - b.stopIndex);
      return [originPosition, ...sorted.map((s) => ({ lat: s.lat, lng: s.lng }))];
    }
    return [];
  }, [decodedPolylinePath, directionsPath, stops, originPosition]);

  // Is route using optimized (encoded) polyline?
  const isOptimized = !!decodedPolylinePath;

  const center = useMemo(() => {
    if (stops.length === 0) return { lat: 38.5816, lng: -121.4944 };
    const avgLat = stops.reduce((sum, s) => sum + s.lat, 0) / stops.length;
    const avgLng = stops.reduce((sum, s) => sum + s.lng, 0) / stops.length;
    return { lat: avgLat, lng: avgLng };
  }, [stops]);

  // Fit bounds
  useEffect(() => {
    if (!map || stops.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(originPosition);
    stops.forEach((stop) => bounds.extend({ lat: stop.lat, lng: stop.lng }));
    map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
  }, [map, stops, originPosition]);

  // AdvancedMarkerElements
  useEffect(() => {
    if (!map || !isLoaded || !MAP_ID) return;

    markerRefs.current.forEach((marker) => {
      if (marker) marker.map = null;
    });
    markerRefs.current = [];

    // Kitchen origin
    const originContent = document.createElement("div");
    originContent.innerHTML = `
      <div style="
        width: 32px; height: 32px; border-radius: 50%;
        background: #D4A017; color: white;
        display: flex; align-items: center; justify-content: center;
        font-weight: bold; font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 2px solid white;
      ">K</div>
    `;
    const originMarker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: originPosition,
      content: originContent,
      title: "Kitchen Origin",
    });
    markerRefs.current.push(originMarker);

    // Stop markers
    stops.forEach((stop) => {
      const color = stop.hasException ? EXCEPTION_COLOR : STATUS_COLORS[stop.status];
      const markerContent = document.createElement("div");
      markerContent.innerHTML = `
        <div style="
          width: 28px; height: 28px; border-radius: 50%;
          background: ${color}; color: white;
          display: flex; align-items: center; justify-content: center;
          font-weight: bold; font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 2px solid white;
          cursor: pointer;
        ">${stop.stopIndex + 1}</div>
      `;
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: stop.lat, lng: stop.lng },
        content: markerContent,
        title: `Stop ${stop.stopIndex + 1}`,
      });
      marker.addListener("click", () => onStopClick?.(stop.id));
      markerRefs.current.push(marker);
    });

    return () => {
      markerRefs.current.forEach((marker) => {
        if (marker) marker.map = null;
      });
    };
  }, [map, isLoaded, stops, onStopClick, originPosition]);

  const onLoad = useCallback((m: google.maps.Map) => setMap(m), []);
  const onUnmount = useCallback(() => setMap(null), []);

  // Polyline style: solid for optimized, dashed for estimated
  // Guard: google.maps.SymbolPath not available until isLoaded
  const polylineOptions = useMemo(() => {
    if (!isLoaded) return null;

    const base = {
      strokeColor: SAFFRON,
      strokeWeight: 4,
    };

    const arrowIcon = {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 3,
      fillColor: SAFFRON,
      fillOpacity: isOptimized ? 1 : 0.7,
      strokeColor: "#fff",
      strokeWeight: 1,
    };

    if (isOptimized) {
      return {
        ...base,
        strokeOpacity: 0.8,
        icons: [{ icon: arrowIcon, offset: "50px", repeat: "100px" }],
      };
    }

    // Estimated or straight-line: dashed stroke with arrows
    return {
      ...base,
      strokeOpacity: 0,
      icons: [
        {
          icon: { path: "M 0,-1 0,1", strokeOpacity: 0.7, scale: 4, strokeColor: SAFFRON },
          offset: "0",
          repeat: "12px",
        },
        { icon: arrowIcon, offset: "50px", repeat: "100px" },
      ],
    };
  }, [isOptimized, isLoaded]);

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
        {routePath.length > 0 && polylineOptions && (
          <Polyline path={routePath} options={polylineOptions} />
        )}

        <Marker
          position={originPosition}
          title="Kitchen Origin"
          icon={{
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: SAFFRON,
            fillOpacity: 1,
            strokeColor: "white",
            strokeWeight: 2,
          }}
          label={{ text: "K", color: "white", fontWeight: "bold" }}
        />

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
      </GoogleMap>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <div className="flex flex-wrap items-center gap-4 rounded-lg bg-[var(--color-surface)] sm:bg-[var(--color-surface)]/90 px-3 py-2 shadow-sm sm:backdrop-blur-sm text-xs">
          <div className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: STATUS_COLORS.pending }}
            />
            <span className="text-text-secondary">Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: STATUS_COLORS.enroute }}
            />
            <span className="text-text-secondary">En Route</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: STATUS_COLORS.delivered }}
            />
            <span className="text-text-secondary">Delivered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: EXCEPTION_COLOR }} />
            <span className="text-text-secondary">Exception</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: SAFFRON }} />
            <span className="text-text-secondary">Kitchen</span>
          </div>
          {isEstimated && (
            <div className="flex items-center gap-1.5 border-l border-[var(--color-border)] pl-3">
              <div
                className="h-0.5 w-4 border-t-2 border-dashed"
                style={{ borderColor: SAFFRON }}
              />
              <span className="text-text-secondary">Estimated route</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
