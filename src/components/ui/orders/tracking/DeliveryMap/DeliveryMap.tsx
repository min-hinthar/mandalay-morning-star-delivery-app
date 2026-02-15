"use client";

/**
 * DeliveryMap Component
 *
 * Enhanced delivery map with:
 * - Custom branded markers (restaurant, vehicle, destination)
 * - Route line with completed/remaining color split
 * - Smooth driver marker animation (1s interpolation)
 * - Re-center button after user pan/zoom
 * - Stale location detection with faded marker + timestamp
 * - Pre-delivery state showing restaurant pin
 * - Map loading skeleton and error retry
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { m, AnimatePresence } from "framer-motion";
import { Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import { useSafeTimeout } from "@/lib/hooks/useSafeEffects";
import { zIndex } from "@/lib/design-system/tokens/z-index";
import {
  LIBRARIES,
  MAP_ID,
  MARKER_ANIMATION_DURATION_MS,
  STALE_LOCATION_THRESHOLD_MS,
  AUTO_FIT_THRESHOLD,
} from "./constants";
import {
  createRestaurantMarkerContent,
  createVehicleMarkerContent,
  createDestinationMarkerContent,
  createStaleBadgeContent,
} from "./CustomMarkers";
import { MapContent } from "./MapContent";
import type { OrderStatus } from "@/types/database";

interface LatLng {
  lat: number;
  lng: number;
}

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
  restaurantLocation?: LatLng | null;
  orderStatus?: OrderStatus;
  lastLocationUpdate?: Date | null;
}

export function DeliveryMap({
  customerLocation,
  driverLocation,
  routePolyline,
  isLive = false,
  className,
  restaurantLocation,
  orderStatus,
  lastLocationUpdate,
}: DeliveryMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userHasPanned, setUserHasPanned] = useState(false);
  const prevDriverLocation = useRef(driverLocation);
  const animationRef = useRef<number | null>(null);
  const safeTimeout = useSafeTimeout();

  const { restoreScrollPosition } = useBodyScrollLock(isFullscreen, {
    deferRestore: true,
  });

  const customerMarkerRef =
    useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const driverMarkerRef =
    useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const restaurantMarkerRef =
    useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const staleBadgeRef =
    useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  // Determine if location is stale (>2 min since last update)
  const isStale = useMemo(() => {
    if (!lastLocationUpdate) return false;
    return Date.now() - lastLocationUpdate.getTime() > STALE_LOCATION_THRESHOLD_MS;
  }, [lastLocationUpdate]);

  const staleMinutesAgo = useMemo(() => {
    if (!lastLocationUpdate || !isStale) return 0;
    return Math.floor((Date.now() - lastLocationUpdate.getTime()) / 60000);
  }, [lastLocationUpdate, isStale]);

  // Determine which pin scenario
  const isPreDelivery =
    orderStatus && orderStatus !== "out_for_delivery" && orderStatus !== "delivered";
  const showDriverMarker = !isPreDelivery && !!driverLocation;
  const showRestaurantMarker =
    !!restaurantLocation && (isPreDelivery || showDriverMarker);

  // Compute bounds from relevant markers
  const { center, bounds } = useMemo(() => {
    const points: LatLng[] = [
      { lat: customerLocation.lat, lng: customerLocation.lng },
    ];
    if (showDriverMarker && driverLocation) {
      points.push({ lat: driverLocation.lat, lng: driverLocation.lng });
    }
    if (showRestaurantMarker && restaurantLocation) {
      points.push(restaurantLocation);
    }
    if (points.length === 1) return { center: points[0], bounds: null };

    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    return {
      center: {
        lat: (Math.max(...lats) + Math.min(...lats)) / 2,
        lng: (Math.max(...lngs) + Math.min(...lngs)) / 2,
      },
      bounds: {
        north: Math.max(...lats) + 0.01,
        south: Math.min(...lats) - 0.01,
        east: Math.max(...lngs) + 0.01,
        west: Math.min(...lngs) - 0.01,
      },
    };
  }, [customerLocation, driverLocation, restaurantLocation, showDriverMarker, showRestaurantMarker]);

  const fitMapBounds = useCallback(() => {
    if (!map || !bounds) return;
    const googleBounds = new google.maps.LatLngBounds(
      { lat: bounds.south, lng: bounds.west },
      { lat: bounds.north, lng: bounds.east }
    );
    map.fitBounds(googleBounds, { top: 50, bottom: 50, left: 50, right: 50 });
  }, [map, bounds]);

  // Initial fit
  useEffect(() => {
    if (!userHasPanned) fitMapBounds();
  }, [fitMapBounds, userHasPanned]);

  // Auto-fit on significant driver movement
  useEffect(() => {
    if (
      !userHasPanned && driverLocation && prevDriverLocation.current &&
      (Math.abs(driverLocation.lat - prevDriverLocation.current.lat) > AUTO_FIT_THRESHOLD ||
        Math.abs(driverLocation.lng - prevDriverLocation.current.lng) > AUTO_FIT_THRESHOLD)
    ) {
      fitMapBounds();
    }
  }, [driverLocation, fitMapBounds, userHasPanned]);

  // Detect user pan/zoom
  useEffect(() => {
    if (!map) return;
    const dragListener = map.addListener("dragend", () => setUserHasPanned(true));
    const zoomListener = map.addListener("zoom_changed", () => {
      safeTimeout.set(() => setUserHasPanned(true), 100);
    });
    return () => {
      google.maps.event.removeListener(dragListener);
      google.maps.event.removeListener(zoomListener);
    };
  }, [map, safeTimeout]);

  const handleRecenter = useCallback(() => {
    setUserHasPanned(false);
    fitMapBounds();
  }, [fitMapBounds]);

  // ---- Smooth driver marker animation ----
  const animateMarkerTo = useCallback(
    (
      marker: google.maps.marker.AdvancedMarkerElement,
      fromLat: number, fromLng: number,
      toLat: number, toLng: number
    ) => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      const startTime = performance.now();
      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / MARKER_ANIMATION_DURATION_MS, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        marker.position = {
          lat: fromLat + (toLat - fromLat) * eased,
          lng: fromLng + (toLng - fromLng) * eased,
        };
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(step);
        } else {
          animationRef.current = null;
        }
      };
      animationRef.current = requestAnimationFrame(step);
    },
    []
  );

  useEffect(() => {
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, []);

  // ---- Destination marker ----
  useEffect(() => {
    if (!map || !isLoaded || !MAP_ID) return;
    const content = createDestinationMarkerContent();
    if (customerMarkerRef.current) customerMarkerRef.current.map = null;
    customerMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
      map, position: { lat: customerLocation.lat, lng: customerLocation.lng },
      content, title: customerLocation.address,
    });
    return () => { if (customerMarkerRef.current) customerMarkerRef.current.map = null; };
  }, [map, isLoaded, customerLocation]);

  // ---- Restaurant marker ----
  useEffect(() => {
    if (!map || !isLoaded || !MAP_ID) return;
    if (restaurantMarkerRef.current) { restaurantMarkerRef.current.map = null; restaurantMarkerRef.current = null; }
    if (!showRestaurantMarker || !restaurantLocation) return;
    const content = createRestaurantMarkerContent();
    restaurantMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
      map, position: restaurantLocation, content, title: "Restaurant",
    });
    return () => { if (restaurantMarkerRef.current) restaurantMarkerRef.current.map = null; };
  }, [map, isLoaded, showRestaurantMarker, restaurantLocation]);

  // ---- Driver marker with smooth animation ----
  useEffect(() => {
    if (!map || !isLoaded || !MAP_ID) return;
    if (staleBadgeRef.current) { staleBadgeRef.current.map = null; staleBadgeRef.current = null; }
    if (!showDriverMarker || !driverLocation) {
      if (driverMarkerRef.current) { driverMarkerRef.current.map = null; driverMarkerRef.current = null; }
      return;
    }
    const prevLoc = prevDriverLocation.current;
    if (!driverMarkerRef.current) {
      const content = createVehicleMarkerContent(driverLocation.heading, isStale);
      driverMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map, position: { lat: driverLocation.lat, lng: driverLocation.lng },
        content, title: "Your driver",
      });
    } else {
      driverMarkerRef.current.content = createVehicleMarkerContent(driverLocation.heading, isStale);
      if (prevLoc && (prevLoc.lat !== driverLocation.lat || prevLoc.lng !== driverLocation.lng)) {
        animateMarkerTo(driverMarkerRef.current, prevLoc.lat, prevLoc.lng, driverLocation.lat, driverLocation.lng);
      } else {
        driverMarkerRef.current.position = { lat: driverLocation.lat, lng: driverLocation.lng };
      }
    }
    if (isStale && driverLocation) {
      staleBadgeRef.current = new google.maps.marker.AdvancedMarkerElement({
        map, position: { lat: driverLocation.lat, lng: driverLocation.lng },
        content: createStaleBadgeContent(staleMinutesAgo), zIndex: zIndex.max,
      });
    }
    prevDriverLocation.current = driverLocation;
    return () => { if (staleBadgeRef.current) { staleBadgeRef.current.map = null; staleBadgeRef.current = null; } };
  }, [map, isLoaded, showDriverMarker, driverLocation, isStale, staleMinutesAgo, animateMarkerTo]);

  const onLoad = useCallback((m: google.maps.Map) => setMap(m), []);
  const onUnmount = useCallback(() => setMap(null), []);

  const routePath = useMemo(() => {
    if (!routePolyline || !isLoaded) return [];
    try {
      const decoded = google.maps.geometry?.encoding?.decodePath(routePolyline);
      return decoded?.map((p) => ({ lat: p.lat(), lng: p.lng() })) || [];
    } catch { return []; }
  }, [routePolyline, isLoaded]);

  if (!isLoaded) {
    return (
      <div className={cn("flex items-center justify-center bg-[var(--color-surface-muted)] rounded-xl animate-pulse", className)} style={{ minHeight: 300 }}>
        <div className="flex flex-col items-center gap-2 text-[var(--color-text-muted)]">
          <Loader2 className="h-8 w-8 animate-spin" /><span className="text-sm">Loading map...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={cn("flex items-center justify-center bg-[var(--color-error-light)] rounded-xl", className)} style={{ minHeight: 300 }}>
        <div className="flex flex-col items-center gap-3 text-[var(--color-error)]">
          <MapPin className="h-8 w-8" /><span className="text-sm">Unable to load map</span>
          <button onClick={() => window.location.reload()} className="rounded-lg bg-[var(--color-error)] px-4 py-1.5 text-xs font-medium text-text-inverse transition-opacity hover:opacity-90">Retry</button>
        </div>
      </div>
    );
  }

  const contentProps = {
    isLive,
    showDriverMarker,
    showRestaurantMarker,
    userHasPanned,
    isStale,
    staleMinutesAgo,
    lastLocationUpdate,
    center,
    customerLocation,
    driverLocation,
    restaurantLocation: restaurantLocation ?? null,
    routePath,
    onLoad,
    onUnmount,
    onExpandFullscreen: () => setIsFullscreen(true),
    onCloseFullscreen: () => setIsFullscreen(false),
    onRecenter: handleRecenter,
  };

  return (
    <>
      <m.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        className={cn("relative rounded-xl overflow-hidden shadow-md", className)} style={{ minHeight: 300 }}>
        <MapContent {...contentProps} inFullscreen={false} />
      </m.div>
      <AnimatePresence onExitComplete={restoreScrollPosition}>
        {isFullscreen && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-[var(--color-background)]">
            <m.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} transition={{ duration: 0.2 }}
              className="relative h-full w-full">
              <MapContent {...contentProps} inFullscreen={true} />
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
