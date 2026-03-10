"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { GoogleMap, useJsApiLoader, Circle } from "@react-google-maps/api";
import { Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { KITCHEN_LOCATION, COVERAGE_LIMITS } from "@/types/address";
import { mapStyles, LIBRARIES, MAP_ID } from "@/components/ui/coverage/CoverageRouteMap/map-styles";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useSimulatedPins } from "./useSimulatedPins";
import { SimulatedPinsManager } from "./SimulatedPins";
import type { DeliveryMapCardProps } from "./types";

const COVERAGE_RADIUS_METERS = COVERAGE_LIMITS.maxDistanceMiles * 1609.34;
const CENTER = { lat: KITCHEN_LOCATION.lat, lng: KITCHEN_LOCATION.lng };

export function DeliveryMapCard({ deliveriesThisMonth, nextDeliveryDate }: DeliveryMapCardProps) {
  const { shouldAnimate } = useAnimationPreference();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const kitchenMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const pins = useSimulatedPins();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  // IntersectionObserver gating
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Kitchen marker (AdvancedMarkerElement)
  useEffect(() => {
    if (!map || !isLoaded || !MAP_ID) return;
    const content = document.createElement("div");
    content.innerHTML = `
      <div style="width: 40px; height: 40px; border-radius: 50%; background: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center;
        justify-content: center; border: 2px solid #A41034;">
        <img src="/logo.png" alt="Kitchen" style="width: 28px; height: auto; border-radius: 4px;" />
      </div>
    `;

    if (kitchenMarkerRef.current) kitchenMarkerRef.current.map = null;
    kitchenMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: CENTER,
      content,
      title: "Mandalay Morning Star Kitchen",
    });

    return () => {
      if (kitchenMarkerRef.current) kitchenMarkerRef.current.map = null;
    };
  }, [map, isLoaded]);

  const onLoad = useCallback((m: google.maps.Map) => setMap(m), []);
  const onUnmount = useCallback(() => setMap(null), []);

  // Inject pulse keyframes
  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "delivery-map-pulse-style";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @keyframes pulse-ring {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(2.5); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  if (loadError) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-hero-text/60 text-sm">
        <MapPin className="w-4 h-4" />
        <span>Delivering across Greater Los Angeles — 50-mile coverage from Covina</span>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "rounded-2xl overflow-hidden bg-hero-stat-bg/40",
          "h-60 md:h-80 flex items-center justify-center"
        )}
      >
        <Loader2 className="h-8 w-8 animate-spin text-hero-text/40" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden ring-1 ring-border/30 shadow-xl"
    >
      {/* Map */}
      <div className="h-60 md:h-80">
        {isVisible && (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={CENTER}
            zoom={9}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
              styles: mapStyles,
              disableDefaultUI: true,
              zoomControl: false,
              clickableIcons: false,
              gestureHandling: "cooperative",
              ...(MAP_ID && { mapId: MAP_ID }),
            }}
          >
            <Circle
              center={CENTER}
              radius={COVERAGE_RADIUS_METERS}
              options={{
                fillColor: "#A41034",
                fillOpacity: 0.06,
                strokeColor: "#A41034",
                strokeOpacity: 0.3,
                strokeWeight: 2,
              }}
            />
            {map && <SimulatedPinsManager map={map} pins={pins} shouldAnimate={shouldAnimate} />}
          </GoogleMap>
        )}
      </div>

      {/* Live counter badge — top-left */}
      <div
        className={cn(
          "absolute top-3 left-3 flex items-center gap-2 px-3 py-2 rounded-xl",
          "bg-surface-primary/90 backdrop-blur-sm shadow-md",
          "text-xs font-semibold text-gray-800"
        )}
      >
        {/* Pulsing green dot */}
        <span className="relative flex h-2.5 w-2.5">
          {shouldAnimate && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          )}
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
        </span>
        <span>
          {deliveriesThisMonth > 0
            ? `${deliveriesThisMonth} deliveries this month`
            : "Now delivering"}
        </span>
      </div>

      {/* Next delivery badge — top-right */}
      {nextDeliveryDate && (
        <div
          className={cn(
            "absolute top-3 right-3 px-3 py-2 rounded-xl",
            "bg-surface-primary/90 backdrop-blur-sm shadow-md",
            "text-xs font-semibold text-gray-800"
          )}
        >
          Next: {nextDeliveryDate}
        </div>
      )}
    </div>
  );
}
