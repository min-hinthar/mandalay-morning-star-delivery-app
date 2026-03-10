"use client";

import { useEffect, useRef } from "react";
import { MAP_ID } from "@/components/ui/coverage/CoverageRouteMap/map-styles";
import type { SimulatedPin } from "./types";

interface SimulatedPinsProps {
  map: google.maps.Map;
  pins: SimulatedPin[];
  shouldAnimate: boolean;
}

function applyPinStyles(el: HTMLDivElement) {
  el.style.width = "12px";
  el.style.height = "12px";
  el.style.borderRadius = "50%";
  el.style.background = "#A41034";
  el.style.border = "2px solid white";
  el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.3)";
  el.style.cursor = "pointer";
  el.style.position = "relative";
}

function applyPulseStyles(el: HTMLDivElement) {
  el.style.position = "absolute";
  el.style.inset = "-4px";
  el.style.borderRadius = "50%";
  el.style.background = "rgba(164,16,52,0.3)";
  el.style.animation = "pulse-ring 2s ease-out infinite";
}

function applyTooltipStyles(el: HTMLDivElement) {
  el.style.position = "absolute";
  el.style.bottom = "20px";
  el.style.left = "50%";
  el.style.transform = "translateX(-50%)";
  el.style.background = "white";
  el.style.color = "#1a1a1a";
  el.style.padding = "6px 10px";
  el.style.borderRadius = "8px";
  el.style.fontSize = "12px";
  el.style.whiteSpace = "nowrap";
  el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
  el.style.pointerEvents = "none";
  el.style.opacity = "0";
  el.style.transition = "opacity 0.15s";
  el.style.fontFamily = "system-ui, sans-serif";
}

function createPinContent(animate: boolean): HTMLDivElement {
  const el = document.createElement("div");
  applyPinStyles(el);
  if (animate) {
    const pulse = document.createElement("div");
    applyPulseStyles(pulse);
    el.appendChild(pulse);
  }
  return el;
}

export function SimulatedPinsManager({ map, pins, shouldAnimate }: SimulatedPinsProps) {
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    if (!MAP_ID) return;

    const existing = markersRef.current;
    const currentIds = new Set(pins.map((p) => p.id));

    // Remove stale markers
    for (const [id, marker] of existing) {
      if (!currentIds.has(id)) {
        marker.map = null;
        existing.delete(id);
      }
    }

    // Add new markers with staggered delays
    for (const pin of pins) {
      if (existing.has(pin.id)) continue;

      const delay = shouldAnimate ? pin.delay : 0;
      const timeout = setTimeout(() => {
        timeoutsRef.current.delete(timeout);
        const content = createPinContent(shouldAnimate);

        // Tooltip on hover
        const tooltip = document.createElement("div");
        applyTooltipStyles(tooltip);
        tooltip.textContent = `${pin.areaName} · ${pin.deliveryDate}`;
        content.appendChild(tooltip);

        content.addEventListener("mouseenter", () => {
          tooltip.style.opacity = "1";
        });
        content.addEventListener("mouseleave", () => {
          tooltip.style.opacity = "0";
        });

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: pin.lat, lng: pin.lng },
          content,
          title: pin.areaName,
        });
        existing.set(pin.id, marker);
      }, delay);

      timeoutsRef.current.add(timeout);
    }
  }, [map, pins, shouldAnimate]);

  // Cleanup on unmount
  useEffect(() => {
    const timeouts = timeoutsRef.current;
    const markers = markersRef.current;
    return () => {
      for (const t of timeouts) clearTimeout(t);
      for (const [, marker] of markers) marker.map = null;
      markers.clear();
    };
  }, []);

  return null;
}
