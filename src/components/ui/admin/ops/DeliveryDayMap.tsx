"use client";

/**
 * DeliveryDayMap — live fleet view for the Delivery Day hub.
 * Plots the kitchen origin plus the latest known position of every driver on
 * the road for the selected date. Fresh fixes are saffron; stale fixes (>5 min)
 * are muted. Reuses the app's shared Maps loader config.
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { KITCHEN_COORDS } from "@/lib/constants/kitchen";
import {
  mapStyles,
  containerStyle,
  LIBRARIES,
  MAP_ID,
  SAFFRON,
} from "@/components/ui/admin/routes/RouteMap/constants";
import type { DriverLocation } from "@/app/api/admin/ops/driver-locations/route";

const FRESH_COLOR = "#22C55E";
const STALE_COLOR = "#9CA3AF";

interface DeliveryDayMapProps {
  locations: DriverLocation[];
  className?: string;
}

function minutesAgo(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

export function DeliveryDayMap({ locations, className }: DeliveryDayMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  const origin = useMemo(() => ({ lat: KITCHEN_COORDS.lat, lng: KITCHEN_COORDS.lng }), []);

  const validLocations = useMemo(
    () => locations.filter((l) => Number.isFinite(l.lat) && Number.isFinite(l.lng)),
    [locations]
  );

  const onLoad = useCallback((m: google.maps.Map) => setMap(m), []);
  const onUnmount = useCallback(() => setMap(null), []);

  // Fit bounds to kitchen + all drivers whenever the set of points changes.
  useEffect(() => {
    if (!map || !isLoaded) return;
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(origin);
    validLocations.forEach((l) => bounds.extend({ lat: l.lat, lng: l.lng }));
    if (validLocations.length === 0) {
      map.setCenter(origin);
      map.setZoom(11);
    } else {
      map.fitBounds(bounds, { top: 56, bottom: 56, left: 56, right: 56 });
    }
  }, [map, isLoaded, origin, validLocations]);

  if (!isLoaded) {
    return (
      <div
        className={cn(
          "flex h-full items-center justify-center rounded-card-sm bg-surface-secondary",
          className
        )}
      >
        <div className="flex flex-col items-center gap-2 text-text-muted">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm">Loading map…</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className={cn(
          "flex h-full items-center justify-center rounded-card-sm bg-status-error-bg",
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

  return (
    <div className={cn("relative h-full w-full", className)}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={origin}
        zoom={11}
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
        {/* Kitchen origin */}
        <Marker
          position={origin}
          title="Kitchen"
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

        {/* Driver markers */}
        {validLocations.map((loc) => {
          const color = loc.isStale ? STALE_COLOR : FRESH_COLOR;
          const initial = (loc.driverName?.trim()?.[0] ?? "?").toUpperCase();
          const staleSuffix = loc.isStale ? ` (last seen ${minutesAgo(loc.recordedAt)}m ago)` : "";
          return (
            <Marker
              key={loc.driverId}
              position={{ lat: loc.lat, lng: loc.lng }}
              title={`${loc.driverName ?? "Driver"}${staleSuffix}`}
              label={{ text: initial, color: "white", fontWeight: "bold" }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 13,
                fillColor: color,
                fillOpacity: loc.isStale ? 0.65 : 1,
                strokeColor: "white",
                strokeWeight: 2,
              }}
            />
          );
        })}
      </GoogleMap>

      {/* Legend / empty hint */}
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10">
        <div className="flex flex-wrap items-center gap-4 rounded-lg bg-surface-primary/90 px-3 py-2 text-xs shadow-sm backdrop-blur-sm">
          {validLocations.length === 0 ? (
            <span className="flex items-center gap-1.5 text-text-secondary">
              <Navigation className="h-3.5 w-3.5" />
              No drivers reporting location yet
            </span>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: FRESH_COLOR }} />
                <span className="text-text-secondary">Live</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: STALE_COLOR }} />
                <span className="text-text-secondary">Stale (&gt;5m)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: SAFFRON }} />
                <span className="text-text-secondary">Kitchen</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeliveryDayMap;
