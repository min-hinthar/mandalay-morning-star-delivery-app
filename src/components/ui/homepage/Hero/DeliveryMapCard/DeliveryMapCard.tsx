"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { m } from "framer-motion";
import { GoogleMap, useJsApiLoader, Circle } from "@react-google-maps/api";
import { Loader2, MapPin, Clock } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { KITCHEN_LOCATION, COVERAGE_LIMITS } from "@/types/address";
import { mapStyles, LIBRARIES, MAP_ID } from "@/components/ui/coverage/CoverageRouteMap/map-styles";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useSimulatedPins } from "./useSimulatedPins";
import { SimulatedPinsManager } from "./SimulatedPins";
import { StatusBar } from "./StatusBar";
import { HeroCardLayers } from "../HeroCardLayers";
import { HeroSunburst } from "../HeroSunburst";
import type { DeliveryMapCardProps } from "./types";

const COVERAGE_RADIUS_METERS = COVERAGE_LIMITS.maxDistanceMiles * 1609.34;
const CENTER = { lat: KITCHEN_LOCATION.lat, lng: KITCHEN_LOCATION.lng };

export function DeliveryMapCard({ nextDeliveryDate, deliverySchedule }: DeliveryMapCardProps) {
  const { shouldAnimate } = useAnimationPreference();
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

  // IntersectionObserver — pause map when scrolled out of view
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
      <div className="flex items-center justify-center gap-2 py-8 text-hero-text/60 text-sm">
        <MapPin className="w-4 h-4" />
        <span>
          Delivering across Greater Los Angeles — {COVERAGE_LIMITS.maxDistanceMiles}-mile coverage
          from Covina
        </span>
      </div>
    );
  }

  return (
    <m.div
      ref={containerRef}
      initial={shouldAnimate ? { opacity: 0, scale: 0.95 } : undefined}
      whileInView={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
      viewport={{ once: true }}
      transition={{ ...spring.gentle, delay: 0.1 }}
      className="relative"
    >
      {/* Ambient glow — radial-gradient falloff (no blur backing store; stays
          within the mobile GPU budget) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-3 rounded-[2rem]"
        style={{
          background:
            "radial-gradient(58% 60% at 50% 38%, rgba(217,119,87,0.20), rgba(106,155,204,0.12) 46%, transparent 76%)",
        }}
      />

      {/* Warm-paper "map print" mat — vellum frame with corner ticks + edge glow */}
      <div className="relative rounded-[1.75rem] hero-surface-vellum p-2.5 md:p-3">
        <HeroCardLayers accent="blue" radius="rounded-[1.75rem]" dots={false} grain={false} />

        {/* Editorial caption */}
        <div className="relative mb-2 flex items-center justify-between gap-2 px-1.5 pt-0.5">
          <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-[0.18em] text-hero-accent md:text-xs">
            <HeroSunburst className="h-3.5 w-3.5 text-hero-clay" rays={8} />
            Delivery coverage
            <span className="font-burmese tracking-normal text-hero-ink-muted">
              · ပို့ဆောင်ဧရိယာ
            </span>
          </p>
          <p className="text-2xs font-medium text-hero-ink-muted md:text-xs">
            <span className="font-semibold text-hero-ink">Greater Los Angeles</span>
          </p>
        </div>

        <div
          className={cn(
            "relative rounded-2xl overflow-hidden ring-1 ring-hero-line",
            "shadow-[0_8px_40px_rgba(20,20,19,0.18),0_16px_64px_rgba(20,20,19,0.12)]"
          )}
        >
          {/* Map */}
          <div className="h-72 md:h-[26rem]">
            {!isLoaded ? (
              <div className="h-full flex items-center justify-center bg-hero-stat-bg/40">
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
                {map && (
                  <SimulatedPinsManager map={map} pins={pins} shouldAnimate={shouldAnimate} />
                )}
              </GoogleMap>
            ) : null}
          </div>

          {/* Gradient depth overlay */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 via-transparent to-transparent" />

          {/* Top-left badge: pulsing dot + delivery count */}
          <m.div
            initial={shouldAnimate ? { opacity: 0, x: -10 } : undefined}
            animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
            transition={{ delay: 0.2 }}
            className="absolute top-3 left-3"
          >
            <div
              className={cn(
                "px-3 py-2 rounded-xl hero-surface-paper",
                "flex items-center gap-2 text-xs font-medium",
                "shadow-md"
              )}
            >
              <m.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: 5 }}
                className="w-2.5 h-2.5 rounded-full bg-hero-sage"
              />
              <span className="font-semibold text-hero-ink">Now delivering</span>
              <span className="text-hero-ink-muted/50">&bull;</span>
              <Clock className="w-3.5 h-3.5 text-hero-clay" />
              <span className="text-hero-ink-muted">{COVERAGE_LIMITS.maxDurationMinutes} min</span>
            </div>
          </m.div>

          {/* Top-right badge: kitchen logo */}
          <m.div
            initial={shouldAnimate ? { opacity: 0, x: 10 } : undefined}
            animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
            transition={{ delay: 0.3 }}
            className="absolute top-3 right-3"
          >
            <div
              className={cn(
                "px-2 py-1.5 rounded-xl hero-surface-paper",
                "flex items-center gap-2",
                "shadow-md"
              )}
            >
              <Image
                src="/logo.png"
                alt="Mandalay Morning Star"
                width={28}
                height={19}
                className="rounded-lg"
              />
              <div className="pr-1">
                <p className="text-xs font-bold text-hero-ink leading-tight">Kitchen</p>
                <p className="text-2xs text-hero-ink-muted leading-tight">Covina, CA</p>
              </div>
            </div>
          </m.div>

          {/* Bottom status bar */}
          <StatusBar nextDeliveryDate={nextDeliveryDate} deliverySchedule={deliverySchedule} />
        </div>
      </div>
    </m.div>
  );
}
