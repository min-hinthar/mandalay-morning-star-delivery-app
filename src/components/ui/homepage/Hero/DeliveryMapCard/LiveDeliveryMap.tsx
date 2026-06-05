"use client";

/**
 * LiveDeliveryMap — the interactive Google map (tiles + coverage circle +
 * simulated delivery pins). Isolated into its own component so that
 * `useJsApiLoader` (which injects the heavy Maps JS SDK) and the WebGL map only
 * ever mount on capable devices. Low/mid mobile renders StaticCoverageMap
 * instead — see DeliveryMapCard — so the SDK never loads there (OOM safety).
 */

import { useCallback, useState, useEffect, useRef } from "react";
import { GoogleMap, useJsApiLoader, Circle } from "@react-google-maps/api";
import { Loader2, MapPin } from "lucide-react";
import { KITCHEN_LOCATION, COVERAGE_LIMITS } from "@/types/address";
import { mapStyles, LIBRARIES, MAP_ID } from "@/components/ui/coverage/CoverageRouteMap/map-styles";
import { useSimulatedPins } from "./useSimulatedPins";
import { SimulatedPinsManager } from "./SimulatedPins";

const COVERAGE_RADIUS_METERS = COVERAGE_LIMITS.maxDistanceMiles * 1609.34;
const CENTER = { lat: KITCHEN_LOCATION.lat, lng: KITCHEN_LOCATION.lng };

export function LiveDeliveryMap({ shouldAnimate }: { shouldAnimate: boolean }) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [fillOpacity, setFillOpacity] = useState(0.06);
  const containerRef = useRef<HTMLDivElement>(null);
  const kitchenMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const pins = useSimulatedPins();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  // Pause the map when scrolled out of view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoaded]);

  // Pulsing coverage circle
  useEffect(() => {
    const interval = setInterval(() => {
      setFillOpacity((prev) => (prev <= 0.06 ? 0.1 : 0.04));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Kitchen marker (AdvancedMarkerElement)
  useEffect(() => {
    if (!map || !isLoaded || !MAP_ID) return;
    if (!google.maps.marker?.AdvancedMarkerElement) return;

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

  // Inject keyframes (pulse-ring + pin-drop)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "delivery-map-pulse-style";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @keyframes pulse-ring {
        0% { transform: scale(1); opacity: 0.2; }
        100% { transform: scale(2.5); opacity: 0; }
      }
      @keyframes pin-drop {
        0% { transform: scale(0); }
        70% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center gap-2 bg-hero-stat-bg/40 px-4 text-center text-sm text-hero-ink-muted">
        <MapPin className="h-4 w-4 shrink-0 text-hero-clay" />
        <span>
          Delivering across Greater Los Angeles — {COVERAGE_LIMITS.maxDistanceMiles}-mile coverage
          from Covina
        </span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full">
      {!isLoaded ? (
        <div className="flex h-full items-center justify-center bg-hero-stat-bg/40">
          <Loader2 className="h-8 w-8 animate-spin text-hero-text/40" />
        </div>
      ) : isVisible ? (
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
              fillOpacity,
              strokeColor: "#A41034",
              strokeOpacity: 0.3,
              strokeWeight: 2,
            }}
          />
          {map && <SimulatedPinsManager map={map} pins={pins} shouldAnimate={shouldAnimate} />}
        </GoogleMap>
      ) : null}
    </div>
  );
}

export default LiveDeliveryMap;
