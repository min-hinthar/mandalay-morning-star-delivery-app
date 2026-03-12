"use client";

import { useEffect, useRef } from "react";
import { MAP_ID } from "@/components/ui/coverage/CoverageRouteMap/map-styles";
import type { SimulatedPin } from "./types";

interface SimulatedPinsProps {
  map: google.maps.Map;
  pins: SimulatedPin[];
  shouldAnimate: boolean;
}

const BRAND_COLOR = "#A41034";

/** Direction → pin border color (matches CoverageResult DIRECTION_COLORS) */
const DIRECTION_PIN_COLORS: Record<string, string> = {
  east: "#3b82f6", // blue-500
  west: "#a855f7", // purple-500
  south: "#f59e0b", // amber-500
};

/** Truck SVG for even-indexed pins */
const TRUCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${BRAND_COLOR}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`;

/** Package SVG for odd-indexed pins */
const PACKAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>`;

function createPinContent(index: number, animate: boolean, direction: string): HTMLDivElement {
  const isEven = index % 2 === 0;
  const dirColor = DIRECTION_PIN_COLORS[direction] ?? BRAND_COLOR;
  const el = document.createElement("div");

  // Outer wrapper for hover scale
  el.style.width = "28px";
  el.style.height = "28px";
  el.style.borderRadius = "50%";
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.cursor = "pointer";
  el.style.position = "relative";
  el.style.transition = "transform 150ms ease";
  el.style.boxShadow = `0 2px 8px rgba(164,16,52,0.4)`;

  if (isEven) {
    el.style.background = "white";
    el.style.border = `2px solid ${dirColor}`;
    el.innerHTML = TRUCK_SVG;
  } else {
    el.style.background = BRAND_COLOR;
    el.style.border = `2px solid ${dirColor}`;
    el.innerHTML = PACKAGE_SVG;
  }

  if (animate) {
    el.style.animation = "pin-drop 400ms cubic-bezier(0.34,1.56,0.64,1) both";

    // Pulse ring
    const pulse = document.createElement("div");
    pulse.style.position = "absolute";
    pulse.style.inset = "0";
    pulse.style.borderRadius = "50%";
    pulse.style.background = `rgba(164,16,52,0.2)`;
    pulse.style.animation = "pulse-ring 2s ease-out infinite";
    pulse.style.pointerEvents = "none";
    el.appendChild(pulse);
  }

  // Hover scale
  el.addEventListener("mouseenter", () => {
    el.style.transform = "scale(1.15)";
  });
  el.addEventListener("mouseleave", () => {
    el.style.transform = "scale(1)";
  });

  return el;
}

/** Direction → eligible short day names (duplicated from useSimulatedPins for tooltip display) */
const DIRECTION_DAYS: Record<string, readonly string[]> = {
  east: ["Mon", "Sat"],
  west: ["Wed", "Sat"],
  south: ["Thu", "Sat"],
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function createTooltip(pin: SimulatedPin): HTMLDivElement {
  const eligibleDays = (DIRECTION_DAYS[pin.direction] ?? ["Sat"]).join("/");
  const tooltip = document.createElement("div");
  tooltip.style.position = "absolute";
  tooltip.style.bottom = "36px";
  tooltip.style.left = "50%";
  tooltip.style.transform = "translateX(-50%)";
  tooltip.style.background = "rgba(255,255,255,0.95)";
  tooltip.style.backdropFilter = "blur(8px)";
  tooltip.style.color = "#1a1a1a";
  tooltip.style.padding = "6px 12px";
  tooltip.style.borderRadius = "12px";
  tooltip.style.fontSize = "12px";
  tooltip.style.whiteSpace = "nowrap";
  tooltip.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
  tooltip.style.border = "1px solid rgba(0,0,0,0.08)";
  tooltip.style.pointerEvents = "none";
  tooltip.style.opacity = "0";
  tooltip.style.transition = "opacity 0.15s";
  tooltip.style.fontFamily = "system-ui, sans-serif";
  tooltip.innerHTML = `<span style="font-weight:700">${pin.areaName}</span> <span style="color:#666;margin-left:4px">\u00b7 ${capitalize(pin.direction)} \u00b7 ${eligibleDays}</span>`;
  return tooltip;
}

export function SimulatedPinsManager({ map, pins, shouldAnimate }: SimulatedPinsProps) {
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    if (!MAP_ID || !google.maps.marker?.AdvancedMarkerElement) return;

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
        if (!google.maps.marker?.AdvancedMarkerElement) return;

        const content = createPinContent(pins.indexOf(pin), shouldAnimate, pin.direction);

        const tooltip = createTooltip(pin);
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

        // Raise hovered pin above others so tooltip isn't clipped
        content.addEventListener("mouseenter", () => {
          marker.zIndex = 1000;
        });
        content.addEventListener("mouseleave", () => {
          marker.zIndex = undefined as unknown as number;
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
