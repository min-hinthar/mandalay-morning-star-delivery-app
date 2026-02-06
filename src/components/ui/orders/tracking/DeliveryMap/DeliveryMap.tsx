"use client";

/**
 * DeliveryMap Component
 *
 * Shows live driver location and customer destination on a map.
 * Updates smoothly as driver position changes.
 * Supports fullscreen expansion on tap.
 * Uses AdvancedMarkerElement for modern marker support.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Polyline,
  Marker,
} from "@react-google-maps/api";
import { m, AnimatePresence } from "framer-motion";
import { Loader2, MapPin, Navigation, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import { mapStyles, containerStyle, LIBRARIES, MAP_ID } from "./constants";

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

  const { restoreScrollPosition } = useBodyScrollLock(isFullscreen, { deferRestore: true });

  const customerMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const driverMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  const { center, bounds } = useMemo(() => {
    if (!driverLocation) {
      return {
        center: { lat: customerLocation.lat, lng: customerLocation.lng },
        bounds: null,
      };
    }
    const centerLat = (customerLocation.lat + driverLocation.lat) / 2;
    const centerLng = (customerLocation.lng + driverLocation.lng) / 2;
    const b = {
      north: Math.max(customerLocation.lat, driverLocation.lat) + 0.01,
      south: Math.min(customerLocation.lat, driverLocation.lat) - 0.01,
      east: Math.max(customerLocation.lng, driverLocation.lng) + 0.01,
      west: Math.min(customerLocation.lng, driverLocation.lng) - 0.01,
    };
    return { center: { lat: centerLat, lng: centerLng }, bounds: b };
  }, [customerLocation, driverLocation]);

  useEffect(() => {
    if (map && bounds) {
      const googleBounds = new google.maps.LatLngBounds(
        { lat: bounds.south, lng: bounds.west },
        { lat: bounds.north, lng: bounds.east }
      );
      map.fitBounds(googleBounds, { top: 50, bottom: 50, left: 50, right: 50 });
    }
  }, [map, bounds]);

  useEffect(() => {
    if (driverLocation && prevDriverLocation.current && map &&
      (driverLocation.lat !== prevDriverLocation.current.lat ||
        driverLocation.lng !== prevDriverLocation.current.lng)) {
      prevDriverLocation.current = driverLocation;
    }
  }, [driverLocation, map]);

  // Create customer marker using AdvancedMarkerElement
  useEffect(() => {
    if (!map || !isLoaded || !MAP_ID) return;
    const customerContent = document.createElement("div");
    customerContent.innerHTML = `
      <div style="width:28px;height:28px;border-radius:50%;background:#2E8B57;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:3px solid white;"></div>
    `;
    if (customerMarkerRef.current) customerMarkerRef.current.map = null;
    customerMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
      map, position: { lat: customerLocation.lat, lng: customerLocation.lng },
      content: customerContent, title: customerLocation.address,
    });
    return () => { if (customerMarkerRef.current) customerMarkerRef.current.map = null; };
  }, [map, isLoaded, customerLocation]);

  // Create driver marker using AdvancedMarkerElement
  useEffect(() => {
    if (!map || !isLoaded || !MAP_ID) return;
    if (driverMarkerRef.current) { driverMarkerRef.current.map = null; driverMarkerRef.current = null; }
    if (!driverLocation) return;
    const rotation = driverLocation.heading || 0;
    const driverContent = document.createElement("div");
    driverContent.innerHTML = `
      <div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;transform:rotate(${rotation}deg);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#D4A017" stroke="white" stroke-width="2">
          <path d="M12 2L22 12L12 22L2 12L12 2Z"/>
        </svg>
      </div>
    `;
    driverMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
      map, position: { lat: driverLocation.lat, lng: driverLocation.lng },
      content: driverContent, title: "Your driver",
    });
    return () => { if (driverMarkerRef.current) driverMarkerRef.current.map = null; };
  }, [map, isLoaded, driverLocation]);

  const onLoad = useCallback((m: google.maps.Map) => { setMap(m); }, []);
  const onUnmount = useCallback(() => { setMap(null); }, []);

  const routePath = useMemo(() => {
    if (!routePolyline || !isLoaded) return [];
    try {
      const decoded = google.maps.geometry?.encoding?.decodePath(routePolyline);
      return decoded?.map((p) => ({ lat: p.lat(), lng: p.lng() })) || [];
    } catch { return []; }
  }, [routePolyline, isLoaded]);

  if (!isLoaded) {
    return (
      <div className={cn("flex items-center justify-center bg-[var(--color-surface-muted)] rounded-xl", className)} style={{ minHeight: 300 }}>
        <div className="flex flex-col items-center gap-2 text-[var(--color-text-muted)]">
          <Loader2 className="h-8 w-8 animate-spin" /><span className="text-sm">Loading map...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={cn("flex items-center justify-center bg-[var(--color-error-light)] rounded-xl", className)} style={{ minHeight: 300 }}>
        <div className="flex flex-col items-center gap-2 text-[var(--color-error)]">
          <MapPin className="h-8 w-8" /><span className="text-sm">Unable to load map</span>
        </div>
      </div>
    );
  }

  const mapContent = (inFullscreen: boolean) => (
    <>
      {isLive && driverLocation && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-full bg-[var(--color-surface)] sm:bg-[var(--color-surface)]/90 px-3 py-1.5 shadow-sm sm:backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-jade)] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-jade)]" />
          </span>
          <span className="text-xs font-medium text-[var(--color-text-primary)]">Live tracking</span>
        </div>
      )}

      {!inFullscreen && (
        <button onClick={() => setIsFullscreen(true)} className="absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)] sm:bg-[var(--color-surface)]/90 shadow-sm sm:backdrop-blur-sm transition-colors hover:bg-[var(--color-surface)]" aria-label="Expand map">
          <Maximize2 className="h-5 w-5 text-[var(--color-text-primary)]" />
        </button>
      )}

      {inFullscreen && (
        <button onClick={() => setIsFullscreen(false)} className="absolute top-4 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface)] shadow-lg transition-colors hover:bg-[var(--color-surface-muted)]" aria-label="Close fullscreen">
          <X className="h-6 w-6 text-[var(--color-text-primary)]" />
        </button>
      )}

      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={14} onLoad={onLoad} onUnmount={onUnmount}
        options={{ styles: mapStyles, disableDefaultUI: true, zoomControl: true, clickableIcons: false,
          gestureHandling: inFullscreen ? "greedy" : "cooperative", ...(MAP_ID && { mapId: MAP_ID }) }}>
        {routePath.length > 0 && (
          <Polyline path={routePath} options={{ strokeColor: "#D4A017", strokeOpacity: 0.8, strokeWeight: 4 }} />
        )}
        {!MAP_ID && (
          <>
            <Marker position={{ lat: customerLocation.lat, lng: customerLocation.lng }} title={customerLocation.address}
              icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 12, fillColor: "#2E8B57", fillOpacity: 1, strokeColor: "white", strokeWeight: 3 }} />
            {driverLocation && (
              <Marker position={{ lat: driverLocation.lat, lng: driverLocation.lng }} title="Your driver"
                icon={{ path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 6, fillColor: "#D4A017", fillOpacity: 1, strokeColor: "white", strokeWeight: 2, rotation: driverLocation.heading || 0 }} />
            )}
          </>
        )}
      </GoogleMap>

      <div className={cn("absolute left-3 right-3 z-10", inFullscreen ? "bottom-6" : "bottom-3")}>
        <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface)] sm:bg-[var(--color-surface)]/90 px-3 py-2 shadow-sm sm:backdrop-blur-sm">
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
      <m.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        className={cn("relative rounded-xl overflow-hidden shadow-md", className)} style={{ minHeight: 300 }}>
        {mapContent(false)}
      </m.div>

      <AnimatePresence onExitComplete={restoreScrollPosition}>
        {isFullscreen && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-[var(--color-background)]">
            <m.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} transition={{ duration: 0.2 }}
              className="relative h-full w-full">
              {mapContent(true)}
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
