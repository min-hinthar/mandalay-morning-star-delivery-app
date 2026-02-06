"use client";

import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Polyline,
  Circle,
  Marker,
} from "@react-google-maps/api";
import { m } from "framer-motion";
import { Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { KITCHEN_LOCATION, COVERAGE_LIMITS } from "@/types/address";
import { mapStyles, LIBRARIES, MAP_ID } from "./map-styles";
import { MapOverlays } from "./MapOverlays";

const COVERAGE_RADIUS_METERS = COVERAGE_LIMITS.maxDistanceMiles * 1609.34;
const LOCAL_VIEW_RADIUS_METERS = 24000;

interface CoverageRouteMapProps {
  destinationLat?: number;
  destinationLng?: number;
  encodedPolyline?: string;
  durationMinutes?: number;
  distanceMiles?: number;
  isValid?: boolean;
  className?: string;
}

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

  const kitchenMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const destinationMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      ([entry]) => { setIsVisible(entry.isIntersecting); },
      { threshold: 0.1 }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setCircleOpacity((prev) => (prev === 0.15 ? 0.25 : 0.15));
    }, 1500);
    return () => clearInterval(interval);
  }, [isVisible]);

  const hasDestination = destinationLat !== undefined && destinationLng !== undefined;

  const { zoom, shouldFitBounds } = useMemo(() => {
    if (!hasDestination) return { zoom: 9, shouldFitBounds: false };
    return { zoom: 9, shouldFitBounds: true };
  }, [hasDestination]);

  useEffect(() => {
    if (map && hasDestination && shouldFitBounds && destinationLat && destinationLng) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: KITCHEN_LOCATION.lat, lng: KITCHEN_LOCATION.lng });
      bounds.extend({ lat: destinationLat, lng: destinationLng });
      map.fitBounds(bounds, { top: 60, bottom: 70, left: 40, right: 40 });
    }
  }, [map, hasDestination, shouldFitBounds, destinationLat, destinationLng]);

  useEffect(() => {
    if (!map || !isLoaded || !MAP_ID) return;
    const kitchenContent = document.createElement("div");
    kitchenContent.innerHTML = `
      <div style="width: 48px; height: 48px; border-radius: 50%; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; border: 2px solid #A41034;">
        <img src="/logo.png" alt="Kitchen" style="width: 36px; height: auto; border-radius: 6px;" />
      </div>
    `;

    if (kitchenMarkerRef.current) kitchenMarkerRef.current.map = null;
    kitchenMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: { lat: KITCHEN_LOCATION.lat, lng: KITCHEN_LOCATION.lng },
      content: kitchenContent,
      title: "Mandalay Morning Star Kitchen",
    });

    return () => { if (kitchenMarkerRef.current) kitchenMarkerRef.current.map = null; };
  }, [map, isLoaded]);

  useEffect(() => {
    if (!map || !isLoaded || !MAP_ID) return;
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.map = null;
      destinationMarkerRef.current = null;
    }
    if (!hasDestination || !destinationLat || !destinationLng) return;

    const color = isValid ? "#52A52E" : "#DC2626";
    const destContent = document.createElement("div");
    destContent.innerHTML = `<div style="width: 28px; height: 28px; border-radius: 50%; background: ${color}; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 3px solid white;"></div>`;

    destinationMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: { lat: destinationLat, lng: destinationLng },
      content: destContent,
      title: "Your Delivery Address",
    });

    return () => { if (destinationMarkerRef.current) destinationMarkerRef.current.map = null; };
  }, [map, isLoaded, hasDestination, destinationLat, destinationLng, isValid]);

  const routePath = useMemo(() => {
    if (!encodedPolyline || !isLoaded) return [];
    try {
      const decoded = google.maps.geometry?.encoding?.decodePath(encodedPolyline);
      return decoded?.map((p) => ({ lat: p.lat(), lng: p.lng() })) || [];
    } catch { return []; }
  }, [encodedPolyline, isLoaded]);

  const onLoad = useCallback((mapInstance: google.maps.Map) => { setMap(mapInstance); }, []);
  const onUnmount = useCallback(() => { setMap(null); }, []);

  if (!isLoaded) {
    return (
      <div className={cn("flex items-center justify-center bg-surface-secondary rounded-xl", className)} style={{ minHeight: 200 }}>
        <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={cn("flex items-center justify-center bg-status-error/10 rounded-xl", className)} style={{ minHeight: 200 }}>
        <MapPin className="h-8 w-8 text-status-error" />
      </div>
    );
  }

  const center = { lat: KITCHEN_LOCATION.lat, lng: KITCHEN_LOCATION.lng };

  return (
    <m.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn("relative rounded-2xl overflow-hidden", "ring-1 ring-border/50 shadow-lg", className)}
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
        {!MAP_ID && (
          <>
            <Marker
              position={{ lat: KITCHEN_LOCATION.lat, lng: KITCHEN_LOCATION.lng }}
              title="Mandalay Morning Star Kitchen"
              icon={{
                url: "/logo.png",
                scaledSize: new google.maps.Size(40, 40),
                anchor: new google.maps.Point(20, 20),
              }}
            />
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
      </GoogleMap>

      <MapOverlays
        hasDestination={hasDestination}
        isValid={isValid}
        distanceMiles={distanceMiles}
        durationMinutes={durationMinutes}
      />
    </m.div>
  );
}
