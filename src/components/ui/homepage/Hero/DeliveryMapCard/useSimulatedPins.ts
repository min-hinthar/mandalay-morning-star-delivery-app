"use client";

import { useState, useEffect, useRef } from "react";
import { KITCHEN_LOCATION } from "@/types/address";
import type { SimulatedPin } from "./types";

const AREA_NAMES = [
  "Pasadena",
  "Arcadia",
  "Glendora",
  "West Covina",
  "Diamond Bar",
  "Azusa",
  "Pomona",
  "Monrovia",
  "El Monte",
  "Whittier",
  "Rowland Heights",
  "Walnut",
  "San Dimas",
  "Rancho Cucamonga",
  "Fullerton",
];

const MAX_PINS = 15;
const INITIAL_PINS = 10;
const CYCLE_INTERVAL_MS = 7000;

/** Generate a random point within a circle (uniform distribution via sqrt). */
function generateRandomPoint(
  centerLat: number,
  centerLng: number,
  radiusMiles: number
): { lat: number; lng: number } {
  const radiusDeg = radiusMiles / 69; // Rough miles-to-degrees
  const r = radiusDeg * Math.sqrt(Math.random());
  const theta = Math.random() * 2 * Math.PI;
  return {
    lat: centerLat + r * Math.cos(theta),
    lng: centerLng + (r * Math.sin(theta)) / Math.cos((centerLat * Math.PI) / 180),
  };
}

function createPin(index: number): SimulatedPin {
  const { lat, lng } = generateRandomPoint(
    KITCHEN_LOCATION.lat,
    KITCHEN_LOCATION.lng,
    40 // Keep pins within a visually reasonable radius
  );
  return {
    id: `pin-${Date.now()}-${index}`,
    lat,
    lng,
    areaName: AREA_NAMES[Math.floor(Math.random() * AREA_NAMES.length)],
    deliveryDate: "Recent delivery",
    delay: index * 200,
  };
}

export function useSimulatedPins() {
  const [pins, setPins] = useState<SimulatedPin[]>(() =>
    Array.from({ length: INITIAL_PINS }, (_, i) => createPin(i))
  );
  const counterRef = useRef(INITIAL_PINS);

  useEffect(() => {
    const interval = setInterval(() => {
      setPins((prev) => {
        const newPin = createPin(counterRef.current++);
        newPin.delay = 0; // No stagger for cycled pins
        if (prev.length >= MAX_PINS) {
          return [...prev.slice(1), newPin];
        }
        return [...prev, newPin];
      });
    }, CYCLE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return pins;
}
